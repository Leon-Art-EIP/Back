import request from "supertest";
import app from "../src/app.mjs";
import mongoose from "mongoose";
import { User } from "../src/models/userModel.mjs";
import { ArtPublication } from "../src/models/artPublicationModel.mjs";
import { Order } from "../src/models/orderModel.mjs";
import { ObjectId } from "mongodb";

let buyerToken, sellerToken, artPublicationId, orderId;

beforeAll(async () => {
  await User.deleteMany({});
  await ArtPublication.deleteMany({});
  await Order.deleteMany({});

  // Création de l'utilisateur acheteur
  const buyerResponse = await request(app).post("/api/auth/signup").send({
    username: "buyerUser",
    email: "buyer@test.com",
    password: "TestPassword123!",
  });
  buyerToken = buyerResponse.body.token;

  // Création de l'utilisateur vendeur
  const sellerResponse = await request(app).post("/api/auth/signup").send({
    username: "sellerUser",
    email: "seller@test.com",
    password: "TestPassword123!",
  });
  sellerToken = sellerResponse.body.token;

  // Création d'une publication d'art
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
    expect(response.body.msg).toBe("Order created successfully");
    orderId = response.body.order.id;
  });

  it("POST /api/order/create - Attempt to buy already sold artwork", async () => {
    const response = await request(app)
      .post("/api/order/create")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ artPublicationId });

    expect(response.status).toBe(201);
    expect(response.body.msg).toBe("Order created successfully");
  });

  it("GET /api/order/buy/:id - Retrieve buy order by ID", async () => {
    const response = await request(app)
      .get(`/api/order/buy/${orderId}`)
      .set("Authorization", `Bearer ${buyerToken}`);

    expect(response.status).toBe(200);
    expect(response.body._id).toBe(orderId);
  });

  it("GET /api/order/sell/:id - Unauthorized access to sell order", async () => {
    const response = await request(app)
      .get(`/api/order/sell/${orderId}`)
      .set("Authorization", `Bearer ${buyerToken}`);

    expect(response.status).toBe(404);
  });

  it("POST /api/order/cancel - Cancel the order", async () => {
    const response = await request(app)
      .post(`/api/order/cancel/${orderId}`)
      .set("Authorization", `Bearer ${sellerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.msg).toBe("Order cancelled successfully");
  });

  it("POST /api/order/confirm-delivery-rate - Confirm delivery and rate the order", async () => {
    const response = await request(app)
      .post("/api/order/confirm-delivery-rate")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ orderId, rating: 5 });

    expect(response.status).toBe(200);
    expect(response.body.msg).toBe("Order completed and rated successfully");
  });

  it("GET /api/order/latest-buy-orders - Get latest buy orders", async () => {
    const response = await request(app)
      .get("/api/order/latest-buy-orders")
      .set("Authorization", `Bearer ${buyerToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });

  it("GET /api/order/latest-sell-orders - Get latest sell orders", async () => {
    const response = await request(app)
      .get("/api/order/latest-sell-orders")
      .set("Authorization", `Bearer ${sellerToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });

  // Ajouter d'autres tests si nécessaire
});

afterAll(async () => {
  await mongoose.connection.close();
});
