import http from "http";
import app from "./app";
import { initWebSocket } from "./websocket/ws.server";
import { logger } from "./utils/logger";

// This is the process entrypoint. app.ts only builds the Express app;
// everything that has a side effect on the outside world — opening a socket,
// starting the WebSocket server, binding a port — happens here instead, so
// `app.ts` stays safe to import from tests.
const server = http.createServer(app);

// ── WebSocket ─────────────────────────────────────────────────────────────────
initWebSocket(server);

const PORT = Number(process.env.PORT) || 4000;
server.listen(PORT, () => {
  logger.info(`🪔 nityasamagri API running on port ${PORT}`);
  logger.info(`📡 WebSocket server ready`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

export default server;