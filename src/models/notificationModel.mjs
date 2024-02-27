import mongoose from "mongoose";
const { Schema } = mongoose;

const notificationSchema = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true }, // e.g., 'like', 'comment', 'order'
  content: { type: String, required: true }, // Custom message for the notification
  referenceId: { type: Schema.Types.ObjectId, required: false }, // ID of the related item (e.g., ArtPublication, Order)
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const Notification = mongoose.model("Notification", notificationSchema);