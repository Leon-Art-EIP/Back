import request from "supertest";
import app from "../src/app";
import { User } from "../src/models/userModel.mjs";
import { ArtPublication } from "../src/models/artPublicationModel.mjs";
import path from "path";

let token;

describe("ArtPublication routes", () => {
  beforeAll(async () => {
    await User.deleteMany({});
    const userResponse = await request(app).post("/api/auth/signup").send({
      username: "testuser",
      email: "testuser@test.com",
      password: "StrongTestPassword123!",
    });
    token = userResponse.body.token;
  });

  beforeEach(async () => {
    // Clear the ArtPublication collection before each test
    await ArtPublication.deleteMany({});
  });

  it("POST /api/art-publication - Create a new ArtPublication (Success)", async () => {
    const response = await request(app)
      .post("/api/art-publication")
      .set("Authorization", `Bearer ${token}`)
      .field("artType", "Painting")
      .field("name", "My Artwork")
      .field("description", "This is my artwork")
      .field("dimension", "5x7")
      .field("isForSale", true)
      .field("price", 200)
      .field("location", "NYC")
      .attach("image", path.resolve("test-files/image.jpg"));

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      "msg",
      "Art publication created successfully!"
    );
    if (response.body && response.body.image) {
      global.__UPLOADED_TEST_FILES__.push(response.body.image);
    }
  });

  it("POST /api/art-publication - Missing required fields", async () => {
    const response = await request(app)
      .post("/api/art-publication")
      .set("Authorization", `Bearer ${token}`)
      .send();

    expect(response.status).toBe(422);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: "Image is required" })
      ])
    );
  });

  it("POST /api/art-publication - Invalid optional fields", async () => {
    const response = await request(app)
      .post("/api/art-publication")
      .set("Authorization", `Bearer ${token}`)
      .field("artType", "Painting")
      .field("name", "My Artwork")
      .field("isForSale", "InvalidBoolean")
      .field("price", "InvalidPrice")
      .field("location", 1234)
      .attach("image", path.resolve("test-files/image.jpg"));

    expect(response.status).toBe(422);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: "Invalid for-sale status" }),
        expect.objectContaining({ msg: "Invalid price" })
      ])
    );    
  });
});
