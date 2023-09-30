import mongoose from "mongoose";

const { Schema } = mongoose;

const collectionSchema = new Schema({
  name: String,
  artPublications: [{ type: Schema.Types.ObjectId, ref: 'ArtPublication' }]
});

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  is_artist: { type: Boolean, default: false },
  biography: String,
  availability: { type: String, default: "unavailable" },
  subscription: { type: String, default: "standard" },
  collections: [collectionSchema],
  subscriptions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  subscribersCount: { type: Number, default: 0 },
  likedPublications: [{ type: Schema.Types.ObjectId, ref: 'ArtPublication' }],
});

export const User = mongoose.model("User", userSchema);
