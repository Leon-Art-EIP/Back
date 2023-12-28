import mongoose from 'mongoose';
const { Schema } = mongoose;

const OrderSchema = new Schema({
  artPublicationId: {
    type: Schema.Types.ObjectId,
    ref: 'ArtPublication',
    required: true
  },
  buyerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderState: {
    type: String,
    enum: ["pending", "accepted", "rejected", "cancelled", "completed"],
    default: "pending",
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "refunded"],
    default: "pending"
  },
  orderRating: {
    type: Number,
    min: 1,
    max: 5
  },
  stripePaymentIntentId: String,
  orderPrice: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

OrderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export const Order = mongoose.model('Order', OrderSchema);
