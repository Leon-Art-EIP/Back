import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  is_artist: { type: Boolean, default: false },
  biography: String,
  availability: { type: String, default: "unavailable" },
  subscription: { type: String, default: "standard" },
  collections: [{ type: Schema.Types.ObjectId, ref: 'Collection' }],
  subscriptions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  subscribers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  subscribersCount: { type: Number, default: 0 },
  likedPublications: [{ type: Schema.Types.ObjectId, ref: 'ArtPublication' }],
  canPostArticles: { type: Boolean, default: true },
  fcmToken: String, // FCM token for push notifications
  profilePicture: String,
  bannerPicture: String,
});

export const User = mongoose.model("User", userSchema);
