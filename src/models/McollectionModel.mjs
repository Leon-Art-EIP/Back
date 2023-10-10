import mongoose from "mongoose";
const { Schema } = mongoose;

const collectionSchema = new Schema({
  name: String,
  artPublications: [{ type: Schema.Types.ObjectId, ref: 'ArtPublication' }],
  isPublic: { type: Boolean, default: true },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
});

const Collection = mongoose.model("Collection", collectionSchema);

export default Collection;
