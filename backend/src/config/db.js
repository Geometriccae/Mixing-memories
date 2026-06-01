const dns = require("dns");
const mongoose = require("mongoose");
const env = require("./env");

/** Node on Windows may fail SRV lookups against the system DNS (querySrv ECONNREFUSED). */
if (env.dnsServers?.length) {
  dns.setServers(env.dnsServers);
}

async function connectDB() {
  if (!env.mongoUri) {
    throw new Error("MONGO_URI is missing in environment variables.");
  }

  await mongoose.connect(env.mongoUri, {
    /** Fewer parallel sockets can reduce TLS “bad record mac” bursts on flaky networks. */
    maxPoolSize: 10,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 12_000,
    socketTimeoutMS: 180_000,
    connectTimeoutMS: 30_000,
    retryReads: true,
  });
}

module.exports = connectDB;
