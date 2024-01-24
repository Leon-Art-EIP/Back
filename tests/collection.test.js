import request from "supertest";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import app from "../src/app";
import { User } from "../src/models/userModel.mjs";
import { ArtPublication } from "../src/models/artPublicationModel.mjs";
import Collection from "../src/models/collectionModel.mjs";

let token, userId, artPublicationId;

beforeAll(async () => {
  // Delete all existing users
  await User.deleteMany({});

  // Create a user
  const userResponse = await request(app).post("/api/auth/signup").send({
    username: "testuser",
    email: "testuser@test.com",
    password: "StrongTestPassword123!",
  });

  token = userResponse.body.token;
  userId = userResponse.body.user.id;
});

beforeEach(async () => {
  // Clear the ArtPublication collections before each test
  await ArtPublication.deleteMany({});
});

describe("Collection Functionalities", () => {
  beforeEach(async () => {
    // Create a sample artPublication
    const artPublication = new ArtPublication({
      userId: new ObjectId(userId),
      image: "image.jpg",
      artType: "Painting",
      name: "My Artwork",
      description: "This is my artwork",
      dimension: "5x7",
      isForSale: true,
      price: 200,
      location: "NYC",
    });
    await artPublication.save();
    artPublicationId = artPublication._id.toString();
  });

  it("POST /collection - Add to Collection", async () => {
    const response = await request(app)
      .post("/api/collection")
      .set("Authorization", `Bearer ${token}`)
      .send({
        collectionName: "Favorites",
        artPublicationId,
      });

    expect(response.status).toBe(200);
    expect(response.body.msg).toBe("Added to collection");
    expect(response.body.collection.name).toBe("Favorites");
    expect(response.body.collection.artPublications).toContain(
      artPublicationId
    );
  });

  it("POST /collection - ArtPublication not found", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .post(`/api/collection`)
      .set("Authorization", `Bearer ${token}`)
      .send({ collectionName: "Favorites", artPublicationId: fakeId });

    expect(response.status).toBe(404);
    expect(response.body.msg).toBe("Art publication not found");
  });

  it("POST /collection - Add to existing collection", async () => {
    // First, create a collection with the name 'Favorites'
    const newCollection = new Collection({
      name: "Favorites",
      artPublications: [],
      user: userId,
    });
    await newCollection.save();
    const user = await User.findById(userId);
    user.collections.push(newCollection._id);
    await user.save();

    const response = await request(app)
      .post("/api/collection")
      .set("Authorization", `Bearer ${token}`)
      .send({ collectionName: "Favorites", artPublicationId });

    expect(response.status).toBe(200);
    expect(response.body.msg).toBe("Added to collection");
    expect(response.body.collection.artPublications).toContain(
      artPublicationId
    );
  });

  it("GET /api/collection/:collectionId/publications - Successfully retrieve ArtPublications from a collection", async () => {
    const collectionName = "Favorites";
    const collection = await Collection.findOne({
      user: userId,
      name: collectionName,
    });
    const collectionId = collection._id;

    const response = await request(app)
      .get(`/api/collection/${collectionId}/publications`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });

  it("GET /api/collection/:collectionId/publications - Collection not found", async () => {
    const fakeCollectionId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .get(`/api/collection/${fakeCollectionId}/publications`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.msg).toBe("Collection not found");
  });

  it("GET /my-collections - Get User Collections", async () => {
    const response = await request(app)
      .get("/api/collection/my-collections")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });

  it("PATCH /:collectionId/remove - Successfully remove art publications from a collection", async () => {
    // Create a collection and add multiple art publications to it
    const collection = new Collection({
      name: "Favorites",
      artPublications: [artPublicationId],
      user: userId,
    });
    await collection.save();
    const collectionId = collection._id;

    // Another art publication for testing
    const artPublication2 = new ArtPublication({
      userId: new ObjectId(userId),
      image: "another-image.jpg",
      artType: "Photography",
      name: "Another Artwork",
      description: "This is another artwork",
      dimension: "10x12",
      isForSale: false,
    });
    await artPublication2.save();
    const artPublicationId2 = artPublication2._id.toString();

    // Add second art publication to the collection
    await Collection.findByIdAndUpdate(collectionId, {
      $push: { artPublications: artPublicationId2 },
    });

    // Remove art publications from the collection
    const response = await request(app)
      .patch(`/api/collection/${collectionId}/remove`)
      .set("Authorization", `Bearer ${token}`)
      .send({ artPublicationIds: [artPublicationId, artPublicationId2] });

    expect(response.status).toBe(200);
    expect(response.body.msg).toBe("Art publications removed from collection");

    // Validate the collection to ensure the art publications were removed
    const updatedCollection = await Collection.findById(collectionId);
    expect(updatedCollection.artPublications).not.toContain(artPublicationId);
    expect(updatedCollection.artPublications).not.toContain(artPublicationId2);
  });

  it("PATCH /:collectionId/remove - Collection not found", async () => {
    const fakeCollectionId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .patch(`/api/collection/${fakeCollectionId}/remove`)
      .set("Authorization", `Bearer ${token}`)
      .send({ artPublicationIds: [artPublicationId] });

    expect(response.status).toBe(404);
    expect(response.body.msg).toBe("Collection not found");
  });

  it("GET /user/:userId/collections - Get Public Collections of a User", async () => {
    const response = await request(app)
      .get(`/api/collection/user/${userId}/collections`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body[0].isPublic).toBeTruthy();
  });

  it("DELETE /:collectionId - Delete a Collection", async () => {
    const user = await User.findById(userId);
    const collectionId = user.collections[0]._id;

    const response = await request(app)
      .delete(`/api/collection/${collectionId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.msg).toBe("Collection deleted");

    // Further validate by checking if the collection is really deleted
    const updatedUser = await User.findById(userId);
    const updatedCollection = await Collection.findById(collectionId);
    expect(updatedCollection).toBeNull();
  });

  it("DELETE /:collectionId - Try to Delete a Non-Existent Collection", async () => {
    const fakeCollectionId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .delete(`/api/collection/${fakeCollectionId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.msg).toBe("Collection not found");
  });

  it("DELETE /:collectionId - User Not Found", async () => {
    // Get collectionId of the first collection for the current user
    const collection = await Collection.findOne({ user: userId });
    const collectionId = collection._id;

    // Delete the user
    await User.findByIdAndDelete(userId);

    // Try deleting the collection with the token of the deleted user
    const response = await request(app)
      .delete(`/api/collection/${collectionId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404); // or whichever status you set when user is not found
    expect(response.body.msg).toBe("User not found");
  });
});
