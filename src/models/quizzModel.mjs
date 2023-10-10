import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const quizzSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" }, // Referring to the User model to associate a quiz to a user
  objective: {
    type: String,
    enum: ["sell", "discover", "both"],
    required: true,
  }, // sell, discover or both
  artInterestType: [{ type: String }], // Array of art types the user is interested in
  artSellingType: [{ type: String }], // Array of art types the user is interested to sell
  location: { type: String, default: "" }, // Can be an address or coordinates
  customCommands: String, // Yes, No, Maybe
  budget: String, // 0-100, 100-500 etc.
  discoveryMethod: String, // How they discovered the app
});

export const Quizz = model("Quizz", quizzSchema);
