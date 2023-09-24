import request from "supertest";
import app from "../src/app";
import { User } from "../src/models/UserModel.mjs";
import { Quizz } from "../src/models/QuizzModel.mjs";
import jwt from "jsonwebtoken";

let validToken;
let invalidToken = "someinvalidtoken";

const originalConsoleError = console.error;

describe("Quizz routes", () => {
  beforeAll(async () => {
    // Silence console.error for this test suite
    console.error = () => {};
    await User.deleteMany({});
    await Quizz.deleteMany({});
    const userResponse = await request(app).post("/api/auth/signup").send({
      username: "testuser",
      email: "testuser@test.com",
      password: "StrongTestPassword123!",
    });
    validToken = userResponse.body.token;
  });

  afterAll(() => {
    // Restore original console.error after tests
    console.error = originalConsoleError;
  });

  it("POST /api/quizz/submit - Successful Quizz Submission (Authenticated)", async () => {
    const payload = {
      objective: "sell",
      artInterestType: ["Painting", "Sculpture"],
      artSellingType: ["Painting"],
      location: "NYC",
      customCommands: "Yes",
      budget: "0-100",
      discoveryMethod: "Google",
    };

    const response = await request(app)
      .post("/api/quizz/submit")
      .set("Authorization", `Bearer ${validToken}`)
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("msg", "Quizz submitted successfully");
  });

  it("POST /api/quizz/submit - Authorization failed due to no token", async () => {
    const response = await request(app).post("/api/quizz/submit").send({});

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty(
      "msg",
      "No token, authorization denied"
    );
  });

  it("POST /api/quizz/submit - Authorization failed due to invalid token", async () => {
    const response = await request(app)
      .post("/api/quizz/submit")
      .set("Authorization", `Bearer ${invalidToken}`)
      .send({});

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("msg", "Token is not valid");
  });

  it("POST /api/quizz/submit - Authorization failed due to token tampering", async () => {
    const tamperedToken = validToken.slice(0, -1) + "a"; // Intentionally tampering the token
    const response = await request(app)
      .post("/api/quizz/submit")
      .set("Authorization", `Bearer ${tamperedToken}`)
      .send({});

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("msg", "Token is not valid");
  });
});
