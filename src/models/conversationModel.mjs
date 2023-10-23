import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
    Id: {
        type: Number,
        required: true
    },
  profileName: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,
    required: true
  },
  lastMessage: {
    type: String,
    required: true
  },
  unreadMessages: {
    type: Boolean,
    default: false
  }
});

export default mongoose.model('Conversation', ConversationSchema);
