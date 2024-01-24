import request from "supertest";
import app from "../src/app";
import { User } from "../src/models/userModel.mjs";
import bcrypt from "bcrypt";

let validToken;
let userId;
const originalConsoleError = console.error;

describe("Change Password Route", () => {
  beforeAll(async () => {
    // Silence console.error for this test suite
    console.error = () => {};

    // Delete all existing users
    await User.deleteMany({});

    // Create and hash password for a test user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("OriginalPassword123!", salt);

    // Create a test user
    const user = new User({
      username: "testuser",
      email: "testuser@test.com",
      password: hashedPassword,
    });
    await user.save();

    userId = user.id;

    // Login to get a valid token
    const response = await request(app).post("/api/auth/login").send({
      email: "testuser@test.com",
      password: "OriginalPassword123!",
    });

    validToken = response.body.token;
  });

  afterAll(() => {
    // Restore original console.error after tests
    console.error = originalConsoleError;
  });

  it("POST /api/auth/change-password - Successful password change", async () => {
    const response = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${validToken}`)
      .send({
        currentPassword: "OriginalPassword123!",
        newPassword: "NewStrongPassword123!",
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("msg", "Password changed successfully");
  });

  it("POST /api/auth/change-password - Incorrect current password", async () => {
    const response = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${validToken}`)
      .send({
        currentPassword: "WrongPassword!",
        newPassword: "NewStrongPassword123!",
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("msg", "Incorrect current password");
  });

  it("POST /api/auth/change-password - Missing token", async () => {
    const response = await request(app)
      .post("/api/auth/change-password")
      .send({
        currentPassword: "OriginalPassword123!",
        newPassword: "NewStrongPassword123!",
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("msg", "No token, authorization denied");
  });

  it("POST /api/auth/change-password - Invalid token", async () => {
    const response = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer someinvalidtoken`)
      .send({
        currentPassword: "OriginalPassword123!",
        newPassword: "NewStrongPassword123!",
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("msg", "Token is not valid");
  });

  it("POST /api/auth/change-password - Validation error for weak new password", async () => {
    const response = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${validToken}`)
      .send({
        currentPassword: "OriginalPassword123!",
        newPassword: "weak",
      });

    expect(response.status).toBe(422);
    expect(response.body.errors[0]).toHaveProperty("msg", "New password must be at least 8 characters long");
  });
});
