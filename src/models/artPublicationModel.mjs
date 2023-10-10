import mongoose from 'mongoose';
const { Schema } = mongoose;

const artPublicationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  image: { type: String, required: true },
  artType: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  dimension: { type: String },
  isForSale: { type: Boolean, default: false },
  price: { type: Number },
  location: { type: String },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
});

export const ArtPublication = mongoose.model('ArtPublication', artPublicationSchema);
