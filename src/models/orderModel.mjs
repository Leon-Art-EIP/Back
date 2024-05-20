import db from '../config/db.mjs'; // Ensure this is correctly pointing to your Firestore instance

class Order {
  constructor(data) {
    this.artPublicationId = data.artPublicationId; // Assume ID as a string
    this.buyerId = data.buyerId; // Assume ID as a string
    this.sellerId = data.sellerId; // Assume ID as a string
    this.orderState = data.orderState || 'pending';
    this.paymentStatus = data.paymentStatus || 'pending';
    this.orderRating = data.orderRating;
    this.stripePaymentIntentId = data.stripePaymentIntentId;
    this.orderPrice = data.orderPrice;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.stripeSessionId = data.stripeSessionId;
  }

  // Save an order to Firestore
  async save() {
    const orderId = db.collection('Orders').doc(); // Creates a new document ID
    await orderId.set(this.toJSON());
    this.id = orderId.id; // Store Firestore document ID within the object
    return this;
  }

  // Convert the instance to JSON, preparing it for Firestore
  toJSON() {
    return {
      artPublicationId: this.artPublicationId,
      buyerId: this.buyerId,
      sellerId: this.sellerId,
      orderState: this.orderState,
      paymentStatus: this.paymentStatus,
      orderRating: this.orderRating,
      stripePaymentIntentId: this.stripePaymentIntentId,
      orderPrice: this.orderPrice,
      createdAt: this.createdAt,
      updatedAt: new Date(), // Update 'updatedAt' on every save
      stripeSessionId: this.stripeSessionId
    };
  }

  // Fetch an order by ID from Firestore
  static async findById(orderId) {
    const doc = await db.collection('Orders').doc(orderId).get();
    if (!doc.exists) {
      throw new Error('Order not found');
    }
    return new Order(doc.data());
  }
}

export { Order };
