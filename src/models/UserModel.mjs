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
});

const artworkSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  artist: { type: Schema.Types.ObjectId, ref: "User", required: true },
  price: { type: Number, required: true },
  status: { type: String, default: "available" },
});

const collectionSchema = new Schema({
  title: { type: String, required: true },
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

const collectionArtworkSchema = new Schema({
  collection_id: { type: Schema.Types.ObjectId, ref: "Collection" },
  artwork_id: { type: Schema.Types.ObjectId, ref: "Artwork", required: true },
});

const chatSchema = new Schema({});

const chatMessageSchema = new Schema({
  chat_id: { type: Schema.Types.ObjectId, ref: "Chat", required: true },
  sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
  recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, required: true },
});

const orderSchema = new Schema({
  buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
  artwork: { type: Schema.Types.ObjectId, ref: "Artwork", required: true },
  status: { type: String, default: "pending" },
});

const userFollowerSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  follower_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

const userLikeSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  artwork_id: { type: Schema.Types.ObjectId, ref: "Artwork", required: true },
});

const userCollectionSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User" },
  collection_id: { type: Schema.Types.ObjectId, ref: "Collection" },
});

export const User = mongoose.model("User", userSchema);
export const Artwork = mongoose.model("Artwork", artworkSchema);
export const Collection = mongoose.model("Collection", collectionSchema);
export const CollectionArtwork = mongoose.model(
  "CollectionArtwork",
  collectionArtworkSchema
);
export const Chat = mongoose.model("Chat", chatSchema);
export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
export const Order = mongoose.model("Order", orderSchema);
export const UserFollower = mongoose.model("UserFollower", userFollowerSchema);
export const UserLike = mongoose.model("UserLike", userLikeSchema);
export const UserCollection = mongoose.model(
  "UserCollection",
  userCollectionSchema
);
