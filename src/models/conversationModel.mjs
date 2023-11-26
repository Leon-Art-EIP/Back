import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
    id: {
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
  },
  sender_one_id: {
    type: Number,
    required: true
  },
  sender_two_id: {
    type: Number,
    required: true
  },
});

export default mongoose.model('Conversation', ConversationSchema);
