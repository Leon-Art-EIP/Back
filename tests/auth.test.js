import request from "supertest";
import app from "../src/app";
import { User } from "../src/models/userModel.mjs";
import bcrypt from "bcrypt";

describe("Signup routes", () => {
  beforeEach(async () => {
    // Before each test, clear the database
    await User.deleteMany({});
  });
  test("POST /signup - Successful signup", async () => {
    const response = await request(app).post("/api/auth/signup").send({
      username: "testuser88",
      email: "testuser88@test.com",
      password: "Strong88TestPassword123!",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");

    const user = await User.findOne({ email: "testuser88@test.com" });
    expect(user).not.toBeNull();
  });

  test("POST /signup - Missing fields", async () => {
    const response = await request(app).post("/api/auth/signup").send({
      username: "testuser",
      password: "StrongTestPassword123!",
    });

    expect(response.status).toBe(422);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: "Must be a valid email address",
        }),
      ])
    );
  });

  test("POST /signup - Invalid email", async () => {
    const response = await request(app).post("/api/auth/signup").send({
      username: "testuser",
      email: "notavalidemail",
      password: "StrongTestPassword123!",
    });

    expect(response.status).toBe(422);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: "Must be a valid email address",
        }),
      ])
    );
  });

  test("POST /signup - Weak password", async () => {
    const response = await request(app).post("/api/auth/signup").send({
      username: "testuser",
      email: "testuser@test.com",
      password: "weak",
    });

    expect(response.status).toBe(422);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: "Password is too weak" }),
        expect.objectContaining({
          msg: "Password must be at least 8 characters long",
        }),
      ])
    );
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

    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty("msg", "Email already in use");
  });

  test("POST /signup - Duplicate Username", async () => {
    await request(app).post("/api/auth/signup").send({
      username: "testuser1",
      email: "duplicate@test.com",
      password: "StrongTestPassword123!",
    });

    const response = await request(app).post("/api/auth/signup").send({
      username: "testuser1",
      email: "duplicate2@test.com",
      password: "StrongTestPassword123!",
    });

    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty("msg", "Username already in use");
  });
});

describe("login routes", () => {
  beforeEach(async () => {
    // Before each test, clear the database
    await User.deleteMany({});
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

    expect(response.status).toBe(200);
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

    expect(response.status).toBe(401);
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

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("msg", "Incorrect password");
  });

  test("POST /login - Empty email", async () => {
    const response = await request(app).post("/api/auth/login").send({
      password: "StrongTestPassword123!",
    });

    expect(response.status).toBe(422);
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

    expect(response.status).toBe(422);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: "Password is required",
        }),
      ])
    );
  });
});
