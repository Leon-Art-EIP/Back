import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  id : {
    type: Number,
    required: true
  },
  sender: {
    type: Number,
    enum: [0, 1],
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
