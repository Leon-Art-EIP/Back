import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app";
import { User } from "../src/models/userModel.mjs";

let token, userId;

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
  // Clear the User collection before each test
  await User.deleteMany({});
});

describe("Latest Artists Functionalities", () => {
  beforeEach(async () => {
    // Create sample artists
    const artist1 = new User({
      username: "artist1",
      email: "artist1@test.com",
      password: "ArtistPassword123!",
      is_artist: true,
    });
    await artist1.save();

    const artist2 = new User({
      username: "artist2",
      email: "artist2@test.com",
      password: "ArtistPassword123!",
      is_artist: true,
    });
    await artist2.save();
  });

  it("GET /artists/latest - Successfully fetch latest artists", async () => {
    const response = await request(app)
      .get("/api/artists/latest")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.artists).toHaveLength(2);
  });

  it("GET /artists/latest - Fetch with pagination (limit)", async () => {
    const response = await request(app)
      .get("/api/artists/latest?limit=1")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.artists).toHaveLength(1);
  });

  it("GET /artists/latest - No artists found", async () => {
    // Remove all artists
    await User.deleteMany({ is_artist: true });

    const response = await request(app)
      .get("/api/artists/latest")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.artists).toHaveLength(0);
  });
});
