import request from "supertest";
import app from "../src/app.mjs";
import mongoose from "mongoose";
import { User } from "../src/models/userModel.mjs";
import { ArtPublication } from "../src/models/artPublicationModel.mjs";
import { Order } from "../src/models/orderModel.mjs";
import { ObjectId } from "mongodb";

let buyerToken, sellerToken, buyerId, sellerId, artPublicationId, orderId;

beforeAll(async () => {
  await User.deleteMany({});
  await ArtPublication.deleteMany({});
  await Order.deleteMany({});

  const buyerResponse = await request(app).post("/api/auth/signup").send({
    username: "buyerUser",
    email: "buyer@test.com",
    password: "TestPassword123!",
  });
  buyerToken = buyerResponse.body.token;
  buyerId = buyerResponse.body.user.id;

  const sellerResponse = await request(app).post("/api/auth/signup").send({
    username: "sellerUser",
    email: "seller@test.com",
    password: "TestPassword123!",
  });
  sellerToken = sellerResponse.body.token;
  sellerId = sellerResponse.body.user.id;

  const artPublication = new ArtPublication({
    userId: new ObjectId(sellerResponse.body.user.id),
    image: "image.jpg",
    artType: "Painting",
    name: "Artwork For Sale",
    description: "This is an artwork description",
    dimension: "5x7",
    isForSale: true,
    price: 100,
    location: "Paris",
  });
  await artPublication.save();
  artPublicationId = artPublication._id.toString();
});

describe("Order System Tests", () => {
  it("POST /api/order/create - Create a new order", async () => {
    const response = await request(app)
      .post("/api/order/create")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ artPublicationId });

    expect(response.status).toBe(201);
    expect(response.body.msg).toBe("Order created and Stripe Checkout session initiated");
    orderId = response.body.order._id;
  });

  it("POST /api/order/confirm-shipping - Confirm shipping", async () => {
    const order = await Order.findById(orderId);
    order.paymentStatus = "paid"; // Simulating payment confirmation
    order.orderState = "paid";
    await order.save();

    const response = await request(app)
      .post("/api/order/confirm-shipping")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ orderId });

    expect(response.status).toBe(200);
    expect(response.body.msg).toContain("shipping");
  });

  it("GET /api/order/latest-buy-orders - Get latest buy orders", async () => {
    const response = await request(app)
      .get("/api/order/latest-buy-orders")
      .set("Authorization", `Bearer ${buyerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
  });

  it("GET /api/order/buy/:id - Get a specific buy order", async () => {
    const response = await request(app)
      .get(`/api/order/buy/${orderId}`)
      .set("Authorization", `Bearer ${buyerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.orderId).toBe(orderId);
  });

  it("POST /api/order/confirm-delivery-rate - Confirm delivery and rate", async () => {
    // First, recreate an order for this test
    const newOrder = await Order.create({
      artPublicationId,
      buyerId: buyerId,
      sellerId: sellerId,
      orderPrice: 100,
      paymentStatus: "paid",
      orderState: "shipping"
    });

    const response = await request(app)
      .post("/api/order/confirm-delivery-rate")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ orderId: newOrder._id, rating: 5 });

    expect(response.status).toBe(200);
    expect(response.body.order.orderRating).toBe(5);
  });

  // Test for trying to create an order for an art publication that doesn't exist
  it("POST /api/order/create - Fail to create order for non-existent art publication", async () => {
    const nonExistentArtPublicationId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .post("/api/order/create")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ artPublicationId: nonExistentArtPublicationId });

    expect(response.status).toBe(400);
    expect(response.body.msg).toContain("not available for sale");
  });

  // Test for trying to create an order for an art publication that's already sold
  it("POST /api/order/create - Fail to create order for sold art publication", async () => {
    // Mark the art publication as sold
    await ArtPublication.findByIdAndUpdate(artPublicationId, { isSold: true });

    const response = await request(app)
      .post("/api/order/create")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ artPublicationId });

    expect(response.status).toBe(400);
    expect(response.body.msg).toContain("Art publication not available for sale");

    // Reset the art publication to unsold for other tests
    await ArtPublication.findByIdAndUpdate(artPublicationId, { isSold: false });
  });

  // Test confirming shipping for an order that doesn't exist
  it("POST /api/order/confirm-shipping - Fail to confirm shipping for non-existent order", async () => {
    const nonExistentOrderId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .post("/api/order/confirm-shipping")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ orderId: nonExistentOrderId });

    expect(response.status).toBe(404);
    expect(response.body.msg).toContain("Order not found");
  });

  // Test confirming shipping for an order by a non-seller user
  it("POST /api/order/confirm-shipping - Fail to confirm shipping by non-seller", async () => {
    const response = await request(app)
      .post("/api/order/confirm-shipping")
      .set("Authorization", `Bearer ${buyerToken}`) // Using buyerToken instead of sellerToken
      .send({ orderId });

    expect(response.status).toBe(403);
    expect(response.body.msg).toContain("Unauthorized");
  });

  // Test retrieving a specific sell order that doesn't exist
  it("GET /api/order/sell/:id - Fail to get non-existent sell order", async () => {
    const nonExistentOrderId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .get(`/api/order/sell/${nonExistentOrderId}`)
      .set("Authorization", `Bearer ${sellerToken}`);

    expect(response.status).toBe(404);
    expect(response.body.msg).toContain("Order not found");
  });

  // Test confirming delivery and rating for an order that doesn't exist
  it("POST /api/order/confirm-delivery-rate - Fail to confirm delivery and rate non-existent order", async () => {
    const nonExistentOrderId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .post("/api/order/confirm-delivery-rate")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ orderId: nonExistentOrderId, rating: 4 });

    expect(response.status).toBe(404);
    expect(response.body.msg).toContain("Order not found");
  });

  // Test confirming delivery and rating by a non-buyer user
  it("POST /api/order/confirm-delivery-rate - Fail to confirm delivery and rate by non-buyer", async () => {
    const response = await request(app)
      .post("/api/order/confirm-delivery-rate")
      .set("Authorization", `Bearer ${sellerToken}`) // Using sellerToken instead of buyerToken
      .send({ orderId, rating: 4 });

    expect(response.status).toBe(403);
    expect(response.body.msg).toContain("Unauthorized");
  });

});
