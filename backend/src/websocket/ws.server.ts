import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger";

// ── Types ─────────────────────────────────────────────────────────────────────
interface AuthenticatedSocket extends WebSocket {
  userId?:   string;
  userRole?: string;
  isAlive:   boolean;
}

export type WsEventType =
  | "ORDER_STATUS_UPDATE"
  | "ORDER_CONFIRMED"
  | "ORDER_SHIPPED"
  | "ORDER_DELIVERED"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "LOW_STOCK_ALERT"
  | "NEW_ORDER_ALERT";

export interface WsMessage {
  event:   WsEventType;
  payload: Record<string, unknown>;
}

// ── Connection registry ───────────────────────────────────────────────────────
// Map of userId → Set of WebSocket connections (a user may have multiple tabs)
const userConnections = new Map<string, Set<AuthenticatedSocket>>();
// Admin connections pool
const adminConnections = new Set<AuthenticatedSocket>();

let wss: WebSocketServer;

// ── Init ──────────────────────────────────────────────────────────────────────
export function initWebSocket(server: http.Server) {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (socket: AuthenticatedSocket, req) => {
    socket.isAlive = true;

    // Extract JWT from ?token= query param
    const url    = new URL(req.url!, `http://${req.headers.host}`);
    const token  = url.searchParams.get("token");

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          userId: string; role: string;
        };
        socket.userId   = decoded.userId;
        socket.userRole = decoded.role;

        // Register connection
        if (decoded.role === "admin" || decoded.role === "super_admin") {
          adminConnections.add(socket);
        } else {
          if (!userConnections.has(decoded.userId)) {
            userConnections.set(decoded.userId, new Set());
          }
          userConnections.get(decoded.userId)!.add(socket);
        }

        logger.info(`WS connected: userId=${decoded.userId} role=${decoded.role}`);
      } catch {
        socket.close(1008, "Invalid token");
        return;
      }
    } else {
      socket.close(1008, "Token required");
      return;
    }

    // Ping/pong heartbeat
    socket.on("pong", () => { socket.isAlive = true; });

    // Handle client messages
    socket.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        handleClientMessage(socket, msg);
      } catch {
        socket.send(JSON.stringify({ event: "ERROR", payload: { message: "Invalid message format" } }));
      }
    });

    // Cleanup on disconnect
    socket.on("close", () => {
      if (socket.userId) {
        const conns = userConnections.get(socket.userId);
        conns?.delete(socket);
        if (conns?.size === 0) userConnections.delete(socket.userId);
      }
      adminConnections.delete(socket);
      logger.info(`WS disconnected: userId=${socket.userId}`);
    });

    // Send welcome
    socket.send(JSON.stringify({
      event:   "CONNECTED",
      payload: { message: "Connected to KhatuMart real-time server", timestamp: Date.now() },
    }));
  });

  // Heartbeat interval — remove dead connections
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      const s = ws as AuthenticatedSocket;
      if (!s.isAlive) { s.terminate(); return; }
      s.isAlive = false;
      s.ping();
    });
  }, 30_000);

  wss.on("close", () => clearInterval(heartbeat));
  logger.info("WebSocket server initialised");
}

// ── Client message handler ────────────────────────────────────────────────────
function handleClientMessage(socket: AuthenticatedSocket, msg: unknown) {
  // Future: handle subscribe/unsubscribe to specific order rooms
  logger.debug(`WS message from ${socket.userId}: ${JSON.stringify(msg)}`);
}

// ── Emit helpers (called from service layer) ──────────────────────────────────

/** Send an event to a specific user (all their tabs) */
export function emitToUser(userId: string, message: WsMessage) {
  const conns = userConnections.get(userId);
  if (!conns) return;
  const payload = JSON.stringify(message);
  conns.forEach(socket => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  });
}

/** Broadcast an event to all connected admins */
export function emitToAdmins(message: WsMessage) {
  const payload = JSON.stringify(message);
  adminConnections.forEach(socket => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  });
}

/** Broadcast to everyone (e.g. flash sales, system alerts) */
export function broadcastAll(message: WsMessage) {
  const payload = JSON.stringify(message);
  wss?.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) ws.send(payload);
  });
}

/** Convenience: notify user + admins on order status change */
export function emitOrderUpdate(params: {
  userId:  string;
  orderId: string;
  status:  string;
  data?:   Record<string, unknown>;
}) {
  const message: WsMessage = {
    event:   "ORDER_STATUS_UPDATE",
    payload: { orderId: params.orderId, status: params.status, timestamp: Date.now(), ...params.data },
  };
  emitToUser(params.userId, message);
  emitToAdmins({ event: "NEW_ORDER_ALERT", payload: message.payload });
}