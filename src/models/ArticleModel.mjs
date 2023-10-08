import mongoose from "mongoose";

const { Schema } = mongoose;

const articleSchema = new Schema({
  title: { type: String, required: true },
  mainImage: { type: String, required: true },
  content: { type: String, required: true }, // Stores the rich text content (HTML)
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Article = mongoose.model("Article", articleSchema);
