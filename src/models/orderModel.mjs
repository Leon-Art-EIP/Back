import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  userRole: {
    type: String,
    enum: ["buyer", "seller"],
    required: true
  },
  orderState: {
    type: String,
    enum: ["pending", "accepted", "rejected", "none"],
    required: true
  },
  orderRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  orderPicture: {
    type: String,
    required: false
  },
  orderDescription: {
    type: String,
    required: true
  },
  orderPrice: {
    type: Number,
    required: true
  }
});

export default mongoose.model('Order', OrderSchema);
