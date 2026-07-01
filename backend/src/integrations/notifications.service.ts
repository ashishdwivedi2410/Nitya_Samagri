// ─────────────────────────────────────────────────────────────────────────────
// src/integrations/notifications.service.ts
// Unified notification service: WhatsApp Business API + SMS (Twilio) + Email
// All templates in one place — easy to update without touching business logic
// ─────────────────────────────────────────────────────────────────────────────

import twilio from "twilio";
import { logger } from "../utils/logger";

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotificationChannel = "sms" | "whatsapp" | "both";

export interface NotificationResult {
  channel:  string;
  success:  boolean;
  messageId?: string;
  error?:   string;
}

// WhatsApp approved template names (register these in Meta Business Manager)
export type WhatsAppTemplateName =
  | "order_confirmed"
  | "order_shipped"
  | "order_out_for_delivery"
  | "order_delivered"
  | "order_cancelled"
  | "payment_success"
  | "payment_failed"
  | "refund_initiated"
  | "booking_confirmed"
  | "booking_reminder"
  | "booking_completed"
  | "booking_cancelled"
  | "otp_verification"
  | "welcome_message"
  | "festival_offer"
  | "low_stock_alert"
  | "pandit_new_booking"
  | "pandit_payout";

export interface WhatsAppTemplateMessage {
  templateName: WhatsAppTemplateName;
  language:     "en" | "hi";
  components:   Array<{
    type:       "header" | "body" | "button";
    parameters: Array<{ type: "text" | "image" | "document"; text?: string; image?: { link: string } }>;
  }>;
}

// ── Template Definitions ──────────────────────────────────────────────────────
// Each template maps to:
//   smsText:       The SMS message string
//   waTemplateName: WhatsApp Business template name
//   waParams:      Array of parameter values for WhatsApp template variables {{1}}, {{2}}...

interface TemplateConfig {
  smsText:        (params: Record<string, string>) => string;
  waTemplateName: WhatsAppTemplateName;
  waParams:       (params: Record<string, string>) => string[];
  language:       "en" | "hi";
}

const TEMPLATES: Record<string, TemplateConfig> = {

  // ── Auth ────────────────────────────────────────────────────────────────────

  otp: {
    waTemplateName: "otp_verification",
    language: "en",
    smsText: ({ otp }) =>
      `${otp} is your KhatuMart OTP. Valid for 10 minutes. Do not share with anyone. - TheKhatuMart`,
    waParams: ({ otp }) => [otp, "10"],
  },

  welcome: {
    waTemplateName: "welcome_message",
    language: "hi",
    smsText: ({ name, points }) =>
      `Jai Shri Ram! Welcome to TheKhatuMart, ${name}! 🪔 ${points} reward points added to your account. Shop puja samagri & book pandits at thekhatumart.com`,
    waParams: ({ name, points }) => [name, points],
  },

  // ── Orders ──────────────────────────────────────────────────────────────────

  order_confirmed: {
    waTemplateName: "order_confirmed",
    language: "hi",
    smsText: ({ name, orderId, amount, eta }) =>
      `${name} ji, aapka order ${orderId} confirm ho gaya! 🪔 Amount: ₹${amount}. Estimated delivery: ${eta}. Track: thekhatumart.com/track/${orderId}`,
    waParams: ({ name, orderId, amount, eta }) => [name, orderId, amount, eta],
  },

  order_packed: {
    waTemplateName: "order_confirmed",
    language: "hi",
    smsText: ({ name, orderId }) =>
      `${name} ji, aapka order ${orderId} pack ho gaya aur courier ke liye ready hai! 📦 Jald hi aapke paas pahuchega. - TheKhatuMart`,
    waParams: ({ name, orderId }) => [name, orderId],
  },

  order_shipped: {
    waTemplateName: "order_shipped",
    language: "hi",
    smsText: ({ name, orderId, courier, awb, eta }) =>
      `${name} ji, aapka order ${orderId} ship ho gaya! 🚚 Courier: ${courier} | AWB: ${awb} | ETA: ${eta}. Track: thekhatumart.com/track/${awb}`,
    waParams: ({ name, orderId, courier, awb, eta }) => [name, orderId, courier, awb, eta],
  },

  order_out_for_delivery: {
    waTemplateName: "order_out_for_delivery",
    language: "hi",
    smsText: ({ name, orderId }) =>
      `${name} ji, aapka order ${orderId} delivery ke liye nikal gaya hai! 🏍️ Aaj hi aapke ghar pahuchega. Ghar par rahein. - TheKhatuMart`,
    waParams: ({ name, orderId }) => [name, orderId],
  },

  order_delivered: {
    waTemplateName: "order_delivered",
    language: "hi",
    smsText: ({ name, orderId }) =>
      `${name} ji, aapka order ${orderId} deliver ho gaya! ✅ 🙏 Dhanyawad TheKhatuMart par shopping karne ke liye. Review dijiye: thekhatumart.com/review`,
    waParams: ({ name, orderId }) => [name, orderId],
  },

  order_cancelled: {
    waTemplateName: "order_cancelled",
    language: "hi",
    smsText: ({ name, orderId, reason }) =>
      `${name} ji, aapka order ${orderId} cancel ho gaya. Karan: ${reason}. Refund 5-7 business days mein aapke account mein aayega. - TheKhatuMart`,
    waParams: ({ name, orderId, reason }) => [name, orderId, reason],
  },

  // ── Payments ─────────────────────────────────────────────────────────────────

  payment_success: {
    waTemplateName: "payment_success",
    language: "en",
    smsText: ({ name, orderId, amount, paymentId }) =>
      `Payment of ₹${amount} received for order ${orderId}. Payment ID: ${paymentId}. Your puja samagri is being prepared! 🪔 - TheKhatuMart`,
    waParams: ({ name, orderId, amount, paymentId }) => [name, amount, orderId, paymentId],
  },

  payment_failed: {
    waTemplateName: "payment_failed",
    language: "en",
    smsText: ({ name, orderId, amount }) =>
      `Payment of ₹${amount} failed for order ${orderId}. Please retry at thekhatumart.com/orders or contact support: 8595427053 - TheKhatuMart`,
    waParams: ({ name, orderId, amount }) => [name, orderId, amount],
  },

  refund_initiated: {
    waTemplateName: "refund_initiated",
    language: "en",
    smsText: ({ name, orderId, amount, days }) =>
      `Refund of ₹${amount} initiated for order ${orderId}. Amount will reflect in ${days} business days. Refund ID saved in your account. - TheKhatuMart`,
    waParams: ({ name, orderId, amount, days }) => [name, orderId, amount, days],
  },

  // ── Pandit Bookings ──────────────────────────────────────────────────────────

  booking_confirmed: {
    waTemplateName: "booking_confirmed",
    language: "hi",
    smsText: ({ name, bookingId, ceremony, panditName, date, time, address }) =>
      `${name} ji, aapki ${ceremony} booking confirm ho gayi! 🙏 Pandit: ${panditName} | Date: ${date} | Time: ${time} | Address: ${address} | Booking ID: ${bookingId}`,
    waParams: ({ name, bookingId, ceremony, panditName, date, time }) =>
      [name, ceremony, panditName, date, time, bookingId],
  },

  booking_reminder: {
    waTemplateName: "booking_reminder",
    language: "hi",
    smsText: ({ name, ceremony, panditName, time, address }) =>
      `Reminder: Aapki ${ceremony} kal ${time} baje hai. 🪔 Pandit ${panditName} aayenge. Address: ${address}. Koi sawaal? Call: 8595427053 - TheKhatuMart`,
    waParams: ({ name, ceremony, panditName, time, address }) =>
      [name, ceremony, time, panditName, address],
  },

  booking_completed: {
    waTemplateName: "booking_completed",
    language: "hi",
    smsText: ({ name, ceremony, panditName }) =>
      `${name} ji, aapki ${ceremony} safaltapoorvak sampann hui! 🙏 Pandit ${panditName} ko review dijiye: thekhatumart.com/review. Dhanyawad! - TheKhatuMart`,
    waParams: ({ name, ceremony, panditName }) => [name, ceremony, panditName],
  },

  booking_cancelled: {
    waTemplateName: "booking_cancelled",
    language: "hi",
    smsText: ({ name, bookingId, ceremony, reason }) =>
      `${name} ji, aapki ${ceremony} booking (${bookingId}) cancel ho gayi. Karan: ${reason}. Refund aapke account mein aayega. - TheKhatuMart`,
    waParams: ({ name, bookingId, ceremony, reason }) => [name, ceremony, bookingId, reason],
  },

  // ── Pandit Notifications ──────────────────────────────────────────────────────

  pandit_new_booking: {
    waTemplateName: "pandit_new_booking",
    language: "hi",
    smsText: ({ panditName, ceremony, customerName, date, time, address }) =>
      `Namaskar ${panditName} ji! Naya booking request: ${ceremony} | Customer: ${customerName} | Date: ${date} | Time: ${time} | Address: ${address}. Accept/Reject: thekhatumart.com/pandit`,
    waParams: ({ panditName, ceremony, customerName, date, time, address }) =>
      [panditName, ceremony, customerName, date, time, address],
  },

  pandit_payout: {
    waTemplateName: "pandit_payout",
    language: "hi",
    smsText: ({ panditName, amount, payoutId, bankName }) =>
      `Namaskar ${panditName} ji! ₹${amount} ka payout aapke ${bankName} account mein transfer ho gaya. Payout ID: ${payoutId}. - TheKhatuMart`,
    waParams: ({ panditName, amount, payoutId, bankName }) =>
      [panditName, amount, payoutId, bankName],
  },

  // ── Festival & Marketing ──────────────────────────────────────────────────────

  festival_offer: {
    waTemplateName: "festival_offer",
    language: "hi",
    smsText: ({ name, festival, discount, code, expiry }) =>
      `${name} ji, ${festival} ki shubhkamnayein! 🪔 ${discount}% ki special chhoot. Coupon: ${code}. Offer ${expiry} tak valid. Shop: thekhatumart.com - TheKhatuMart`,
    waParams: ({ name, festival, discount, code, expiry }) =>
      [name, festival, discount, code, expiry],
  },

  // ── Admin / Internal ──────────────────────────────────────────────────────────

  low_stock_alert: {
    waTemplateName: "low_stock_alert",
    language: "en",
    smsText: ({ productName, currentStock, sku }) =>
      `⚠️ LOW STOCK ALERT: ${productName} (SKU: ${sku}) has only ${currentStock} units left. Please restock immediately. - KhatuMart System`,
    waParams: ({ productName, sku, currentStock }) => [productName, sku, currentStock],
  },

};

// ── Notification Service ──────────────────────────────────────────────────────

export class NotificationService {
  private twilioClient: ReturnType<typeof twilio> | null = null;
  private waApiUrl:   string;
  private waToken:    string;
  private waPhoneId:  string;

  constructor() {
    // SMS — Twilio
    if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
      this.twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
    }
    // WhatsApp Business API
    this.waApiUrl  = process.env.WHATSAPP_API_URL  || "https://graph.facebook.com/v18.0";
    this.waToken   = process.env.WHATSAPP_TOKEN    || "";
    this.waPhoneId = process.env.WHATSAPP_PHONE_ID || "";
  }

  // ── Send SMS ────────────────────────────────────────────────────────────────

  async sendSMS(to: string, text: string): Promise<NotificationResult> {
    if (process.env.NODE_ENV === "development") {
      logger.info(`[SMS MOCK] To: ${to}\nMsg: ${text}`);
      return { channel: "sms", success: true, messageId: `mock_sms_${Date.now()}` };
    }

    if (!this.twilioClient) {
      logger.warn("Twilio not configured — SMS skipped");
      return { channel: "sms", success: false, error: "Twilio not configured" };
    }

    try {
      const msg = await this.twilioClient.messages.create({
        body: text,
        from: process.env.TWILIO_PHONE!,
        to:   to.startsWith("+") ? to : `+91${to}`,
      });
      logger.info(`SMS sent to ${to}: ${msg.sid}`);
      return { channel: "sms", success: true, messageId: msg.sid };
    } catch (err: unknown) {
      const e = err as Error;
      logger.error(`SMS failed to ${to}:`, e.message);
      return { channel: "sms", success: false, error: e.message };
    }
  }

  // ── Send WhatsApp Template Message ──────────────────────────────────────────

  async sendWhatsApp(
    to:           string,
    templateName: WhatsAppTemplateName,
    params:       string[],
    language:     "en" | "hi" = "hi"
  ): Promise<NotificationResult> {
    if (process.env.NODE_ENV === "development") {
      logger.info(`[WA MOCK] To: ${to} | Template: ${templateName} | Params: ${params.join(", ")}`);
      return { channel: "whatsapp", success: true, messageId: `mock_wa_${Date.now()}` };
    }

    if (!this.waToken || !this.waPhoneId) {
      logger.warn("WhatsApp Business API not configured");
      return { channel: "whatsapp", success: false, error: "WhatsApp not configured" };
    }

    const phone = to.replace(/\D/g, "");
    const e164  = phone.startsWith("91") ? phone : `91${phone}`;

    const body = {
      messaging_product: "whatsapp",
      recipient_type:    "individual",
      to:                e164,
      type:              "template",
      template: {
        name:     templateName,
        language: { code: language === "hi" ? "hi" : "en_IN" },
        components: params.length > 0 ? [{
          type:       "body",
          parameters: params.map(p => ({ type: "text", text: p })),
        }] : [],
      },
    };

    try {
      const res = await fetch(
        `${this.waApiUrl}/${this.waPhoneId}/messages`,
        {
          method:  "POST",
          headers: {
            "Content-Type":  "application/json",
            Authorization:   `Bearer ${this.waToken}`,
          },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json() as { messages?: Array<{ id: string }>; error?: { message: string } };

      if (!res.ok || data.error) {
        throw new Error(data.error?.message || `WA API error ${res.status}`);
      }

      const msgId = data.messages?.[0]?.id;
      logger.info(`WhatsApp sent to ${to}: ${msgId}`);
      return { channel: "whatsapp", success: true, messageId: msgId };
    } catch (err: unknown) {
      const e = err as Error;
      logger.error(`WhatsApp failed to ${to}:`, e.message);
      return { channel: "whatsapp", success: false, error: e.message };
    }
  }

  // ── Unified send — uses template config ─────────────────────────────────────

  async send(
    templateKey: keyof typeof TEMPLATES,
    to:          string,
    params:      Record<string, string>,
    channels:    NotificationChannel = "both"
  ): Promise<NotificationResult[]> {
    const template = TEMPLATES[templateKey];
    if (!template) {
      logger.warn(`Unknown notification template: ${templateKey}`);
      return [];
    }

    const results: NotificationResult[] = [];
    const promises: Promise<NotificationResult>[] = [];

    if (channels === "sms" || channels === "both") {
      promises.push(this.sendSMS(to, template.smsText(params)));
    }

    if (channels === "whatsapp" || channels === "both") {
      promises.push(
        this.sendWhatsApp(to, template.waTemplateName, template.waParams(params), template.language)
      );
    }

    const settled = await Promise.allSettled(promises);
    settled.forEach(r => {
      if (r.status === "fulfilled") results.push(r.value);
      else results.push({ channel: "unknown", success: false, error: r.reason?.message });
    });

    return results;
  }

  // ── Convenience methods (strongly typed) ─────────────────────────────────────

  async notifyOTP(phone: string, otp: string) {
    return this.send("otp", phone, { otp }, "sms"); // OTP only via SMS (not WA)
  }

  async notifyWelcome(phone: string, name: string, points = "100") {
    return this.send("welcome", phone, { name, points }, "both");
  }

  async notifyOrderConfirmed(phone: string, params: {
    name: string; orderId: string; amount: string; eta: string;
  }) {
    return this.send("order_confirmed", phone, params, "both");
  }

  async notifyOrderShipped(phone: string, params: {
    name: string; orderId: string; courier: string; awb: string; eta: string;
  }) {
    return this.send("order_shipped", phone, params, "both");
  }

  async notifyOrderOutForDelivery(phone: string, params: { name: string; orderId: string }) {
    return this.send("order_out_for_delivery", phone, params, "both");
  }

  async notifyOrderDelivered(phone: string, params: { name: string; orderId: string }) {
    return this.send("order_delivered", phone, params, "both");
  }

  async notifyOrderCancelled(phone: string, params: {
    name: string; orderId: string; reason: string;
  }) {
    return this.send("order_cancelled", phone, params, "both");
  }

  async notifyPaymentSuccess(phone: string, params: {
    name: string; orderId: string; amount: string; paymentId: string;
  }) {
    return this.send("payment_success", phone, params, "both");
  }

  async notifyPaymentFailed(phone: string, params: {
    name: string; orderId: string; amount: string;
  }) {
    return this.send("payment_failed", phone, params, "sms");
  }

  async notifyRefundInitiated(phone: string, params: {
    name: string; orderId: string; amount: string; days: string;
  }) {
    return this.send("refund_initiated", phone, params, "both");
  }

  async notifyBookingConfirmed(phone: string, params: {
    name: string; bookingId: string; ceremony: string;
    panditName: string; date: string; time: string; address: string;
  }) {
    return this.send("booking_confirmed", phone, params, "both");
  }

  async notifyBookingReminder(phone: string, params: {
    name: string; ceremony: string; panditName: string; time: string; address: string;
  }) {
    return this.send("booking_reminder", phone, params, "both");
  }

  async notifyBookingCompleted(phone: string, params: {
    name: string; ceremony: string; panditName: string;
  }) {
    return this.send("booking_completed", phone, params, "both");
  }

  async notifyBookingCancelled(phone: string, params: {
    name: string; bookingId: string; ceremony: string; reason: string;
  }) {
    return this.send("booking_cancelled", phone, params, "both");
  }

  async notifyPanditNewBooking(phone: string, params: {
    panditName: string; ceremony: string; customerName: string;
    date: string; time: string; address: string;
  }) {
    return this.send("pandit_new_booking", phone, params, "both");
  }

  async notifyPanditPayout(phone: string, params: {
    panditName: string; amount: string; payoutId: string; bankName: string;
  }) {
    return this.send("pandit_payout", phone, params, "both");
  }

  async notifyFestivalOffer(phone: string, params: {
    name: string; festival: string; discount: string; code: string; expiry: string;
  }) {
    return this.send("festival_offer", phone, params, "both");
  }

  async notifyLowStock(phone: string, params: {
    productName: string; currentStock: string; sku: string;
  }) {
    return this.send("low_stock_alert", phone, params, "sms");
  }

  // ── Bulk send (festival campaigns) ──────────────────────────────────────────

  async sendBulk(
    templateKey: keyof typeof TEMPLATES,
    recipients:  Array<{ phone: string; params: Record<string, string> }>,
    channels:    NotificationChannel = "both",
    batchSize  = 50,        // Twilio rate limit safe batch
    delayMs    = 1000       // delay between batches
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0, failed = 0;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(r => this.send(templateKey, r.phone, r.params, channels))
      );
      results.forEach(r => {
        if (r.status === "fulfilled") {
          const success = r.value.some(v => v.success);
          success ? sent++ : failed++;
        } else {
          failed++;
        }
      });

      // Delay between batches to respect rate limits
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    logger.info(`Bulk notification complete: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }

  // ── Schedule reminder (booking day-before reminder) ──────────────────────────

  async scheduleBookingReminder(params: {
    phone:       string;
    name:        string;
    ceremony:    string;
    panditName:  string;
    time:        string;
    address:     string;
    reminderAt:  Date;   // when to send (24hrs before ceremony)
  }): Promise<void> {
    const now     = new Date();
    const delayMs = params.reminderAt.getTime() - now.getTime();

    if (delayMs <= 0) {
      // Already past — send immediately
      await this.notifyBookingReminder(params.phone, params);
      return;
    }

    // Schedule with setTimeout (for production: use Bull Queue / BullMQ)
    setTimeout(async () => {
      await this.notifyBookingReminder(params.phone, {
        name:       params.name,
        ceremony:   params.ceremony,
        panditName: params.panditName,
        time:       params.time,
        address:    params.address,
      });
      logger.info(`Booking reminder sent to ${params.phone} for ${params.ceremony}`);
    }, Math.min(delayMs, 2147483647)); // JS max setTimeout

    logger.info(`Booking reminder scheduled for ${params.reminderAt.toISOString()}`);
  }
}

// ── Singleton export ──────────────────────────────────────────────────────────
export const notificationService = new NotificationService();

// ── Re-export convenience functions (backward compat) ────────────────────────
export const sendSMS = (to: string, text: string) =>
  notificationService.sendSMS(to, text);

export const sendWhatsApp = (to: string, template: WhatsAppTemplateName, params: string[]) =>
  notificationService.sendWhatsApp(to, template, params);