const mongoose = require("mongoose");
const { Schema } = mongoose;

const resetTokenSchema = new Schema({
  email: { type: String, required: true, unique: true },
  token: { type: String, required: true },
  expire_at: { type: Date, default: Date.now, index: { expires: "1h" } }, // The token expires after 1 hour.
});
