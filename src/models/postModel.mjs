import mongoose from 'mongoose';

const { Schema } = mongoose;

const postSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  artPublicationId: { type: Schema.Types.ObjectId, ref: 'ArtPublication', required: false },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

export const Post = mongoose.model('Post', postSchema);
