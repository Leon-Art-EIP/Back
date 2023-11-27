import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  conversationId: {
    type: Number,
    ref: 'Conversation',
    required: true
  },
  sender_id: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  dateTime: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  }
});

export default mongoose.model('Message', MessageSchema);
