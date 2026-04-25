const Razorpay = require("razorpay");
const env = require("../config/env");

let rzpInstance = null;

function getRazorpayClient() {
  if (rzpInstance) return rzpInstance;
  const key_id = env.razorpayKeyId;
  const key_secret = env.razorpayKeySecret;
  if (!key_id || !key_secret) {
    return null;
  }
  rzpInstance = new Razorpay({ key_id, key_secret });
  return rzpInstance;
}

module.exports = { getRazorpayClient };
