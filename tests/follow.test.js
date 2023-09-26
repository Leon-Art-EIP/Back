import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app";
import { User } from "../src/models/UserModel.mjs";

describe("Follow User routes", () => {
    let user1, user2;
  
    beforeAll(async () => {
      // Assume user1 and user2 are already created and saved in your database.
      user1 = new User({
        username: "user1",
        email: "user1@test.com",
        password: await bcrypt.hash("StrongTestPassword123!", 10),
      });
      await user1.save();
  
      user2 = new User({
        username: "user2",
        email: "user2@test.com",
        password: await bcrypt.hash("StrongTestPassword123!", 10),
      });
      await user2.save();
    });
  
    beforeEach(async () => {
      // Before each test, clear the followers and following fields of the users
      user1.following = [];
      user1.followers = [];
      user2.following = [];
      user2.followers = [];
      await user1.save();
      await user2.save();
    });
  
    test("POST /users/{targetUserId}/follow - Successful follow", async () => {
      const response = await request(app)
        .post(`/api/users/${user2._id}/follow`)
        .set('Authorization', `Bearer ${token}`)
        .send();
  
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Successfully followed user");
  
      // Verify that the user1 is now following user2
      const updatedUser1 = await User.findById(user1._id);
      const updatedUser2 = await User.findById(user2._id);
      expect(updatedUser1.following).toContainEqual(user2._id);
      expect(updatedUser2.followers).toContainEqual(user1._id);
    });
  
    test("POST /users/{targetUserId}/follow - Unsuccessful follow (already following)", async () => {
      user1.following.push(user2._id);
      user2.followers.push(user1._id);
      await user1.save();
      await user2.save();
  
      const response = await request(app)
        .post(`/api/users/${user2._id}/follow`)
        .set('Authorization', `Bearer ${token}`)
        .send();
  
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Successfully unfollowed user");
  
      // Verify that the user1 is no longer following user2
      const updatedUser1 = await User.findById(user1._id);
      const updatedUser2 = await User.findById(user2._id);
      expect(updatedUser1.following).not.toContainEqual(user2._id);
      expect(updatedUser2.followers).not.toContainEqual(user1._id);
    });
  });
  