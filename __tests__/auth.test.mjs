import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app.mjs";
import {
  User,
  Artwork,
  Collection,
  CollectionArtwork,
  Chat,
  ChatMessage,
  Order,
  UserFollower,
  UserLike,
  UserCollection,
} from "../src/models/User.mjs";
import bcrypt from "bcrypt";

describe("Auth routes", () => {
  let mongoServer;

  beforeAll(async () => {
    await mongoose.disconnect();

    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  test("POST /signup - Successful signup", async () => {
    const response = await request(app).post("/api/auth/signup").send({
      username: "testuser",
      email: "testuser@test.com",
      password: "StrongTestPassword123!",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("token");
    const user = await User.findOne({ email: "testuser@test.com" });
    expect(user).not.toBeNull();
  });

  test("POST /signup - Missing fields", async () => {
    const response = await request(app).post("/api/auth/signup").send({
      username: "testuser",
      password: "StrongTestPassword123!",
    });

    expect(response.statusCode).toBe(422);
    expect(response.body.errors).toContainEqual({
      msg: "Must be a valid email address",
    });
  });

  test("POST /signup - Invalid email", async () => {
    const response = await request(app).post("/api/auth/signup").send({
      username: "testuser",
      email: "notavalidemail",
      password: "StrongTestPassword123!",
    });

    expect(response.statusCode).toBe(422);
    expect(response.body.errors).toContainEqual({
      msg: "Must be a valid email address",
    });
  });

  test("POST /signup - Weak password", async () => {
    const response = await request(app).post("/api/auth/signup").send({
      username: "testuser",
      email: "testuser@test.com",
      password: "weak",
    });

    expect(response.statusCode).toBe(422);
    expect(response.body.errors).toContainEqual({
      msg: "Password is too weak",
    });
    expect(response.body.errors).toContainEqual({
      msg: "Password must be at least 8 characters long",
    });
  });

  test("POST /signup - Duplicate email", async () => {
    await request(app).post("/api/auth/signup").send({
      username: "testuser1",
      email: "duplicate@test.com",
      password: "StrongTestPassword123!",
    });

    const response = await request(app).post("/api/auth/signup").send({
      username: "testuser2",
      email: "duplicate@test.com",
      password: "StrongTestPassword123!",
    });

    expect(response.statusCode).toBe(409);
    expect(response.body).toHaveProperty("msg", "Email already in use");
  });

  test("POST /login - Successful login", async () => {
    const user = new User({
      username: "testuser",
      email: "testuser@test.com",
      password: await bcrypt.hash("StrongTestPassword123!", 10),
    });
    await user.save();

    const response = await request(app).post("/api/auth/login").send({
      email: "testuser@test.com",
      password: "StrongTestPassword123!",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("token");
  });

  test("POST /login - Missing email or password", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "skatman@test.com",
      password: "StrongTestPassword123!",
    });

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("msg", "Email not registered");
  });

  test("POST /login - Non-existent user", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "nonexistent@test.com",
      password: "StrongTestPassword123!",
    });

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("msg", "Email not registered");
  });

  test("POST /login - Incorrect password", async () => {
    const user = new User({
      username: "testuser",
      email: "testuser@test.com",
      password: await bcrypt.hash("StrongTestPassword123!", 10),
    });
    await user.save();

    const response = await request(app).post("/api/auth/login").send({
      email: "testuser@test.com",
      password: "IncorrectPassword123!",
    });

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("msg", "Incorrect password");
  });

  test("POST /login - Empty email", async () => {
    const response = await request(app).post("/api/auth/login").send({
      password: "StrongTestPassword123!",
    });

    expect(response.statusCode).toBe(422);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: "Must be a valid email address",
        }),
      ])
    );
  });

  test("POST /login - Empty password", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "validemail@test.com",
    });

    expect(response.statusCode).toBe(422);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: "Password is required",
        }),
      ])
    );
  });

  describe("Like/Unlike Artwork routes", () => {
  
    let artwork;
    let user;
    
    beforeEach(async () => {
      // Création d'une œuvre d'art et d'un utilisateur pour les tests
      artwork = await Artwork.create({
        title: "Test Artwork",
        description: "Test Description",
        artist: new mongoose.Types.ObjectId(),
        price: 100,
      });
      
      user = new mongoose.Types.ObjectId();
    });
  
    afterEach(async () => {
      // Nettoyage des données après chaque test
      await UserLike.deleteMany({});
      await Artwork.deleteMany({});
    });
  
    test("POST /api/:artworkId/like - Successful like", async () => {
      const response = await request(app)
        .post(`/api/${artwork._id}/like`)
        .send({ userId: user.toString() })
        .expect(200);
  
      expect(response.body.likesCount).toBe(1);
    });
  
    test("POST /api/:artworkId/like - Successful unlike", async () => {
      // Création d'un like initial
      await UserLike.create({ user_id: user, artwork_id: artwork._id });
      
      // Mise à jour du compteur de likes sur l'œuvre d'art
      await Artwork.findByIdAndUpdate(artwork._id, { likesCount: 1 });
  
      const response = await request(app)
        .post(`/api/${artwork._id}/like`)
        .send({ userId: user.toString() })
        .expect(200);
  
      expect(response.body.likesCount).toBe(0);
    });
    
    test("POST /api/:artworkId/like - Artwork not found", async () => {
      const nonExistentArtworkId = new mongoose.Types.ObjectId();
  
      const response = await request(app)
        .post(`/api/${nonExistentArtworkId}/like`)
        .send({ userId: user.toString() })
        .expect(500);
  
      expect(response.text).toContain("error message");  // Replace "error message" with the actual error message you expect
    });
  });
  
  describe("Artwork Comment routes", () => {

    let artwork;
  
    beforeEach(async () => {
      // Création d'une œuvre d'art pour les tests
      artwork = await Artwork.create({
        title: "Test Artwork",
        description: "Test Description",
        artist: new mongoose.Types.ObjectId(),
        price: 100,
      });
    });
  
    afterEach(async () => {
      // Nettoyage des données après chaque test
      await artwork.delete();
    });
  
    test("POST /api/:artworkId/comment - Successful comment", async () => {
      const response = await request(app)
        .post(`/api/${artwork._id}/comment`)
        .send({
          author: new mongoose.Types.ObjectId(),
          text: 'Test Comment',
        })
        .expect(200);
  
      expect(response.body.comments[0].text).toBe('Test Comment');
    });
  
    test("DELETE /api/:artworkId/comment/:commentId - Successful delete comment", async () => {
      // Ajout d'un commentaire
      artwork.comments.push({ author: new mongoose.Types.ObjectId(), text: 'Test Comment' });
      await artwork.save();
  
      // Suppression du commentaire
      const response = await request(app)
        .delete(`/api/${artwork._id}/comment/${artwork.comments[0]._id}`)
        .expect(200);
  
      expect(response.body.comments).toHaveLength(0);
    });
  });

});
