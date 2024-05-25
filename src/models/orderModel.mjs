import db from '../config/db.mjs'; // Assurez-vous que c'est le chemin correct pour votre instance Firestore
import { v4 as uuidv4 } from 'uuid'; // Importez la fonction uuid pour générer des identifiants uniques
class Order {
  constructor(data) {
    this.id = data.id || uuidv4(); // Générer un UUID si l'ID n'est pas fourni  
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
    try {
      const orderRef = db.collection('Orders').doc(); // Creates a new document ID
      await orderRef.set(this.toJSON());
      this.id = orderRef.id; // Store Firestore document ID within the object
      return this;
    } catch (error) {
      console.error('Error saving order:', error);
      throw new Error('Error saving order');
    }
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
    return new Order({ ...doc.data(), id: doc.id });
  }

  static async findOne(query) {
    const querySnapshot = await db.collection('Orders')
      .where(Object.keys(query)[0], '==', Object.values(query)[0])
      .limit(1)
      .get();

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return new Order({ ...doc.data(), id: doc.id });
    } else {
      return null;
    }
  }

  static async findWithOrder(query = {}, orderByField, orderDirection = 'asc', limit, offset) {
    let queryRef = db.collection('Orders');

    if (Object.keys(query).length > 0) {
      queryRef = queryRef.where(Object.keys(query)[0], '==', Object.values(query)[0]);
    }

    queryRef = queryRef.orderBy(orderByField, orderDirection);

    if (offset) {
      queryRef = queryRef.offset(offset);
    }

    if (limit) {
      queryRef = queryRef.limit(limit);
    }

    const querySnapshot = await queryRef.get();

    if (!querySnapshot.empty) {
      return querySnapshot.docs.map(doc => new Order({ ...doc.data(), id: doc.id }));
    } else {
      return [];
    }
  }

  // Update an order by ID
  static async updateById(orderId, updateData) {
    try {
      const orderRef = db.collection('Orders').doc(orderId);
      await orderRef.update({
        ...updateData,
        updatedAt: new Date() // Update the 'updatedAt' field
      });
      console.log('Order updated successfully');
    } catch (error) {
      console.error('Error updating order:', error);
      throw new Error('Error updating order');
    }
  }

  // Delete an order by ID
  static async deleteById(orderId) {
    try {
      const orderRef = db.collection('Orders').doc(orderId);
      await orderRef.delete();
      console.log('Order deleted successfully');
    } catch (error) {
      console.error('Error deleting order:', error);
      throw new Error('Error deleting order');
    }
  }

  static async update(updateData) {
    try {
      const orderRef = db.collection('Orders').doc(this.id);
      await orderRef.update({
        ...updateData,
        updatedAt: new Date() // Optionally add/update a timestamp field
      });
      console.log('Order updated successfully');
    } catch (error) {
      console.error('Error updating order:', error);
      throw new Error('Error updating order');
    }
  }

  static async find(query) {
    try {
      let ordersRef = db.collection('Orders');
      if (query) {
        if (query.field && query.value) {
          ordersRef = ordersRef.where(query.field, '==', query.value);
        }
        if (query.limit) {
          ordersRef = ordersRef.limit(query.limit);
        }
      }
      const snapshot = await ordersRef.get();
      const orders = [];
      snapshot.forEach(doc => {
        orders.push(new Order({ ...doc.data(), id: doc.id }));
      });
      return orders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw new Error('Error fetching orders');
    }
  }
}

export { Order };
