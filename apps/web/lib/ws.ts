// apps/web/lib/ws.ts
//
// Connects to the backend's real-time server (backend/src/websocket/
// ws.server.ts). That server does NOT take a `?token=` query param (it's
// deliberately kept out of the URL to avoid leaking JWTs into access logs);
// instead the client must send `{ type: "auth", token }` as its first
// message after the socket opens, then waits for a `CONNECTED` event.

import { getAccessToken } from "./auth";

export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000/ws";

export type WsMessage = { event: string; payload: Record<string, unknown> };

type Listener = (msg: WsMessage) => void;

// Opens an authenticated connection and returns a cleanup function. Retries
// the auth handshake are NOT attempted here — if the token is invalid the
// server closes the socket (code 1008) and `onStatus` is told "error".
export function connectNotifications(
  onMessage: Listener,
  onStatus: (status: "connecting" | "open" | "error" | "closed") => void
): () => void {
  const token = getAccessToken();
  if (!token) {
    onStatus("error");
    return () => {};
  }

  onStatus("connecting");
  const socket = new WebSocket(WS_URL);
  let closedByUs = false;

  socket.onopen = () => {
    socket.send(JSON.stringify({ type: "auth", token }));
  };

  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data) as WsMessage;
      if (msg.event === "CONNECTED") { onStatus("open"); return; }
      if (msg.event === "AUTH_REQUIRED" || msg.event === "ERROR") return;
      onMessage(msg);
    } catch {
      // ignore malformed frames
    }
  };

  socket.onerror = () => { if (!closedByUs) onStatus("error"); };
  socket.onclose = () => { if (!closedByUs) onStatus("closed"); };

  return () => {
    closedByUs = true;
    socket.close();
  };
}