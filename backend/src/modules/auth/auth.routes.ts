// ─────────────────────────────────────────────────────────────────────────────
// AUTH MODULE  ·  auth.routes.ts
// Converted from Prisma/PostgreSQL to Mongoose/MongoDB, and OTP login moved
// from Twilio+Redis-stored-code to Firebase Auth (client sends OTP via
// Firebase, backend verifies the resulting ID token). Password login is
// unchanged apart from the ORM swap.
// ─────────────────────────────────────────────────────────────────────────────
import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../../database/models/User";
import { redis } from "../../config/redis";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../middlewares/async.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/rbac.middleware";
import { verifyOtpToken } from "../../config/firebase";

const router = Router();

// ── Zod Schemas ───────────────────────────────────────────────────────────────
const RegisterSchema = z.object({
  name: z.string().min(2).max(60),
  phone: z.string().regex(/^\+91[6-9]\d{9}$/, "Invalid Indian mobile number"),
  email: z.string().email().optional(),
  password: z.string().min(8).max(72),
});

const LoginSchema = z
  .object({
    phone: z.string().regex(/^\+91[6-9]\d{9}$/).optional(),
    email: z.string().email().optional(),
    password: z.string().min(1),
  })
  .refine((d) => !!d.phone !== !!d.email, {
    message: "Provide either phone or email, not both",
  })
  .refine((d) => !d.email || d.email.toLowerCase().endsWith("@adminns.in"), {
    message: "Email login is only available for @adminns.in staff accounts. Customers should log in with phone.",
    path: ["email"],
  });

// Client completes phone OTP entry via the Firebase client SDK and sends us
// the resulting ID token — we no longer generate/store/verify a 6-digit
// code ourselves (that was OtpRequestSchema/OtpVerifySchema's job before).
const OtpVerifySchema = z.object({
  idToken: z.string().min(1),
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_ATTEMPT_WINDOW_SECONDS = 15 * 60;
const LOGIN_LOCKOUT_SECONDS = 15 * 60;

// ── Helpers ───────────────────────────────────────────────────────────────────
function signTokens(userId: string, role: string) {
  const accessTokenExpiresIn = env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"];
  const refreshTokenExpiresIn = env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"];

  const accessToken = jwt.sign({ userId, role }, env.JWT_SECRET, { expiresIn: accessTokenExpiresIn });
  const refreshToken = jwt.sign({ userId, role, type: "refresh" }, env.JWT_REFRESH_SECRET, {
    expiresIn: refreshTokenExpiresIn,
  });
  return { accessToken, refreshToken };
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 * Register with phone + password. Since OTP verification now happens via
 * Firebase on the client, this no longer sends an OTP itself — the client
 * is expected to run the Firebase phone-verification flow separately (or
 * you can require /auth/otp/verify to be called right after this to mark
 * the account verified).
 */
router.post(
  "/register",
  validate(RegisterSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, phone, email, password } = req.body;

    const existing = await User.findOne({ phone });
    if (existing) throw new AppError("Phone number already registered", 409);

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      phone,
      email,
      password: hashedPassword,
      role: "customer",
      isVerified: false,
      loyaltyPoints: 100, // welcome bonus
    });

    res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your phone number.",
      data: { user: { id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role } },
    });
  })
);

/**
 * POST /api/v1/auth/login
 * Password-based login
 */
router.post(
  "/login",
  validate(LoginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { phone, email, password } = req.body as z.infer<typeof LoginSchema>;
    const identifier = phone || email!.toLowerCase();
    const isAdminLogin = !!email;

    const lockKey = `login_lock:${identifier}`;
    const locked = await redis.get(lockKey);
    if (locked) {
      const ttl = await redis.ttl(lockKey);
      throw new AppError(
        `Too many failed login attempts. Please try again in ${Math.max(1, Math.ceil(ttl / 60))} minute(s).`,
        429
      );
    }

    const failKey = `login_fails:${identifier}`;

    async function registerFailure(message = "Invalid credentials"): Promise<never> {
      const fails = await redis.incr(failKey);
      if (fails === 1) await redis.expire(failKey, LOGIN_ATTEMPT_WINDOW_SECONDS);

      if (fails >= MAX_LOGIN_ATTEMPTS) {
        await redis.setex(lockKey, LOGIN_LOCKOUT_SECONDS, "1");
        await redis.del(failKey);
        throw new AppError(
          `Too many failed login attempts. Please try again in ${Math.ceil(LOGIN_LOCKOUT_SECONDS / 60)} minute(s).`,
          429
        );
      }
      throw new AppError(message, 401);
    }

    const user = isAdminLogin
      ? await User.findOne({ email: identifier }).select("+password")
      : await User.findOne({ phone: identifier }).select("+password");

    if (!user) return registerFailure();
    if (user.status === "blocked") throw new AppError("Account has been blocked. Contact support.", 403);

    // Email/@adminns.in login is for staff only — block customers who
    // happen to have an email on file from using it, and block anyone
    // without an elevated role even if they somehow got an @adminns.in address.
    if (isAdminLogin && !["admin", "super_admin", "order_manager", "warehouse", "support"].includes(user.role)) {
      return registerFailure("This account is not authorized for staff login.");
    }

    if (!user.password) {
      return registerFailure("This account uses OTP login. Please log in with an OTP instead of a password.");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return registerFailure();

    await redis.del(failKey);
    await redis.del(lockKey);

    const { accessToken, refreshToken } = signTokens(String(user._id), user.role);
    await redis.setex(`refresh:${user._id}`, 30 * 24 * 60 * 60, refreshToken);

    user.lastLoginAt = new Date();
    await user.save();

    res.json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role },
        accessToken,
        refreshToken,
      },
    });
  })
);

/**
 * POST /api/v1/auth/otp/verify
 * Verify a Firebase phone-auth ID token and return our own JWT pair.
 * Replaces the old { phone, otp } flow — the client now completes OTP
 * entry via the Firebase client SDK and sends us the resulting idToken.
 */
router.post(
  "/otp/verify",
  validate(OtpVerifySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { idToken } = req.body as z.infer<typeof OtpVerifySchema>;

    const { phone, firebaseUid } = await verifyOtpToken(idToken);

    let user = await User.findOne({ phone });
    const isNewUser = !user;

    if (!user) {
      user = await User.create({
        phone,
        firebaseUid,
        role: "customer",
        isVerified: true,
        loyaltyPoints: 100,
        name: "New User",
      });
    } else {
      user.isVerified = true;
      user.firebaseUid = firebaseUid;
      user.lastLoginAt = new Date();
      await user.save();
    }

    if (user.status === "blocked") throw new AppError("Account has been blocked. Contact support.", 403);

    const { accessToken, refreshToken } = signTokens(String(user._id), user.role);
    await redis.setex(`refresh:${user._id}`, 30 * 24 * 60 * 60, refreshToken);

    res.json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, phone: user.phone, role: user.role },
        accessToken,
        refreshToken,
        isNewUser,
      },
    });
  })
);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  "/refresh",
  validate(RefreshSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    let decoded: { userId: string; role: string };
    try {
      decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET, { algorithms: ["HS256"] }) as typeof decoded;
    } catch {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const stored = await redis.get(`refresh:${decoded.userId}`);
    if (!stored || stored !== refreshToken) throw new AppError("Refresh token revoked", 401);

    const { accessToken, refreshToken: newRefreshToken } = signTokens(decoded.userId, decoded.role);
    await redis.setex(`refresh:${decoded.userId}`, 30 * 24 * 60 * 60, newRefreshToken);

    res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
  })
);

/**
 * POST /api/v1/auth/logout
 */
router.post(
  "/logout",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await redis.del(`refresh:${req.user!.userId}`);
    res.json({ success: true, message: "Logged out successfully" });
  })
);

/**
 * GET /api/v1/auth/me
 */
router.get(
  "/me",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.user!.userId).select(
      "name phone email role isVerified loyaltyPoints loyaltyTier createdAt lastLoginAt"
    );
    if (!user) throw new AppError("User not found", 404);
    res.json({ success: true, data: { user } });
  })
);


/**
 * GET /api/v1/auth/admin/users
 * Admin: list customers (paginated, searchable)
 */
router.get(
  "/admin/users",
  authenticate,
  requireRole(["admin", "super_admin"]),
  asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const q = req.query.q as string | undefined;

    const filter: Record<string, unknown> = { role: "customer" };
    if (q) filter.$or = [{ name: { $regex: q, $options: "i" } }, { phone: { $regex: q } }, { email: { $regex: q, $options: "i" } }];

    const [users, total] = await Promise.all([
      User.find(filter).select("name phone email status loyaltyPoints loyaltyTier createdAt lastLoginAt")
        .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, data: { users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
  })
);

export default router;