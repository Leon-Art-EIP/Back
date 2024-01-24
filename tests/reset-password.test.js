import request from "supertest";
import app from "../src/app";
import { User } from "../src/models/userModel.mjs";
import { ResetToken } from "../src/models/resetPasswordTokenModel.mjs";
import bcrypt from "bcrypt";

describe("Reset Password Routes", () => {
  const testUserEmail = "testuser@test.com";
  const testUserPassword = "StrongTestPassword123!";
  let resetToken;

  const hashPassword = async (password) => bcrypt.hash(password, await bcrypt.genSalt(10));

  const createUser = async () => {
    await User.create({
      username: "testuser",
      email: testUserEmail,
      password: await hashPassword(testUserPassword),
    });
  };

  const postRequest = async (endpoint, payload) => request(app).post(`/api/auth/${endpoint}`).send(payload);

  beforeAll(async () => {
    await User.deleteMany({ username: "testuser" });
    await createUser();
  });

  describe("POST /request-reset", () => {
    it("should send reset token if email exists", async () => {
      const response = await postRequest("request-reset", { email: testUserEmail });
      expect(response.status).toBe(200);
      expect(response.body.msg).toBe("Reset email sent");

      const resetEntry = await ResetToken.findOne({ email: testUserEmail });
      expect(resetEntry).not.toBeNull();
      resetToken = resetEntry.token;
    });

    it("should fail if email does not exist", async () => {
      const response = await postRequest("request-reset", { email: "notfound@test.com" });
      expect(response.status).toBe(404);
      expect(response.body.msg).toBe("Email not found");
    });
  });

  describe("POST /validate-reset-token", () => {
    it("should validate correct reset token", async () => {
      const response = await postRequest("validate-reset-token", { token: resetToken });
      expect(response.status).toBe(200);
      expect(response.body.msg).toBe("Valid token");
    });

    it("should not validate incorrect reset token", async () => {
      const response = await postRequest("validate-reset-token", { token: "incorrectToken" });
      expect(response.status).toBe(404);
      expect(response.body.msg).toBe("Invalid or expired token");
    });
  });

  describe("POST /reset-password", () => {
    const newPassword = "NewStrongTestPassword123!";

    it("should reset password if token is correct", async () => {
      const response = await postRequest("reset-password", { token: resetToken, newPassword });
      expect(response.status).toBe(200);
      expect(response.body.msg).toBe("Password reset successfully");

      const user = await User.findOne({ email: testUserEmail });
      expect(await bcrypt.compare(newPassword, user.password)).toBeTruthy();
    });

    it("should not reset password if token is incorrect", async () => {
      const response = await postRequest("reset-password", { token: "incorrectToken", newPassword });
      expect(response.status).toBe(404);
      expect(response.body.msg).toBe("Invalid or expired token");
    });

    it("should not reset password if new password is too weak", async () => {
      const weakPassword = "12345678";
      const response = await postRequest("reset-password", { token: resetToken, newPassword: weakPassword });

      expect(response.status).toBe(422);
      expect(response.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({ msg: "Password is too weak" })]));

      const user = await User.findOne({ email: testUserEmail });
      expect(await bcrypt.compare(newPassword, user.password)).toBeTruthy();
    });
  });
});
