import { v4 as uuidv4 } from 'uuid';

class Order {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.artPublicationId = data.artPublicationId;
    this.buyerId = data.buyerId;
    this.sellerId = data.sellerId;
    this.orderState = data.orderState || 'pending';
    this.paymentStatus = data.paymentStatus || 'pending';
    this.orderRating = data.orderRating !== undefined ? data.orderRating : 0;
    this.stripePaymentIntentId = data.stripePaymentIntentId || null;
    this.orderPrice = data.orderPrice || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.stripeSessionId = data.stripeSessionId || null;
  }

  toJSON() {
    return {
      id: this.id,
      artPublicationId: this.artPublicationId,
      buyerId: this.buyerId,
      sellerId: this.sellerId,
      orderState: this.orderState,
      paymentStatus: this.paymentStatus,
      orderRating: this.orderRating,
      stripePaymentIntentId: this.stripePaymentIntentId,
      orderPrice: this.orderPrice,
      createdAt: this.createdAt,
      updatedAt: new Date().toISOString(),
      stripeSessionId: this.stripeSessionId,
    };
  }
}

export { Order };
