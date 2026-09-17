// docker/mongo/init.js
//
// Runs once, on first container start, via mongo's docker-entrypoint-initdb.d
// hook. Creates an application-level user scoped to the nityasamagri DB
// instead of using the root user for everyday API access.
// (Equivalent in purpose to a docker/postgres/init.sql from the old setup —
// there wasn't one of those in the original repo either, this is new.)

db = db.getSiblingDB("nityasamagri");

db.createUser({
  user: "nityasamagri_app",
  pwd: process.env.MONGO_APP_PASSWORD || "change_me_in_env",
  roles: [{ role: "readWrite", db: "nityasamagri" }],
});

// A couple of indexes worth having from day one
db.conversations.createIndex({ userId: 1, lastMessageAt: -1 });
db.messages.createIndex({ conversationId: 1, createdAt: 1 });