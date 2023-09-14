const mongoose = require('mongoose');
const { Schema } = mongoose;

const quizzSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' }, // Referring to the User model to associate a quiz to a user
  objective: { type: String, enum: ['sell', 'discover', 'both'], required: true }, // sell, discover or both
  artType: [{ type: String }], // Array of art types 
  location: { type: String, default: '' }, // Can be an address or coordinates
  customCommands: String, // Yes, No, Maybe
  budget: String, // 0-100, 100-500 etc.
  discoveryMethod: String, // How they discovered the app
});

module.exports = {
  Quizz: mongoose.model('Quizz', quizzSchema),
};
