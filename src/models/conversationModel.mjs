import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// Schéma de conversation actualisé pour inclure des références aux utilisateurs
const ConversationSchema = new Schema({
  lastMessage: {
    type: String,
    required: true
  },
  unreadMessages: {
    type: Boolean,
    default: false
  },
  UserOne: {
    id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    profileName: { type: String, required: true },
    profilePicture: { type: String, required: true }
  },
  UserTwo: {
    id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    profileName: { type: String, required: true },
    profilePicture: { type: String, required: true }
  }
});

// Créer le modèle de conversation avec le schéma actualisé
const Conversation = mongoose.model('Conversation', ConversationSchema);

export default Conversation;

