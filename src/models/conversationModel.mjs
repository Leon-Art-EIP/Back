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
  UserOneId: {
    type: String,
    required: true
  },
  UserOneName: {
    type: String,
    required: true
  },
  UserOnePicture: {
    type: String,
    required: true
  },
  UserTwoId: {
    type: String,
    required: true
  },
  UserTwoName: {
    type: String,
    required: true
  },
  UserTwoPicture: {
    type: String,
    required: true
  },
});

// Créer le modèle de conversation avec le schéma actualisé
const Conversation = mongoose.model('Conversation', ConversationSchema);

export default Conversation;

