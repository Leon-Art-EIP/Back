import mongoose from 'mongoose';
const { Schema } = mongoose;

const commentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  artPublicationId: { type: Schema.Types.ObjectId, ref: 'ArtPublication', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const Comment = mongoose.model('Comment', commentSchema);
