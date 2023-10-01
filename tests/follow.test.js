import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import { User } from '../src/models/UserModel.mjs';

let token;
let followedUserId;

describe('Follow Routes', () => {
  beforeAll(async () => {
    // Set up database and user for testing
    await User.deleteMany({});
    const userResponse = await request(app).post('/api/auth/signup').send({
      username: 'testuser',
      email: 'testuser@test.com',
      password: 'StrongTestPassword123!',
    });
    token = userResponse.body.token;

    // Assume there's a user to be followed
    const followedUser = new User({
      username: 'followeduser',
      email: 'followeduser@test.com',
      password: 'StrongTestPassword123!',
    });
    await followedUser.save();
    followedUserId = followedUser._id;
  });

  beforeEach(async () => {
    // Clear follow data before each test, if there's any follow model/collection
  });

  it('POST /follow - Follow a user (Success)', async () => {
    const response = await request(app)
      .post(`/api/follow/${followedUserId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('msg', 'Successfully followed user.');
  });

  it('POST /follow - Unfollow a user if already followed (Success)', async () => {
    // First follow the user
    await request(app)
      .post(`/api/follow/${followedUserId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    // Now unfollow the user
    const response = await request(app)
      .post(`/api/follow/${followedUserId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('msg', 'Successfully followed user.');
  });

  it('POST /follow - Attempt to follow a non-existent user (Failure)', async () => {
    const response = await request(app)
      .post('/api/follow/nonexistentuserid')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('msg', 'Invalid user id.');
  });

  it('POST /follow - Attempt to follow without authorization (Failure)', async () => {
    const response = await request(app)
      .post(`/api/follow/${followedUserId}`)
      .send();

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('msg', 'No token, authorization denied');
  });

  it('POST /follow - Attempt to follow oneself (Failure)', async () => {
    const user = await User.findOne({ email: 'testuser@test.com' });
    const response = await request(app)
      .post(`/api/follow/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();
  
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('msg', 'You cannot follow yourself.');
  });

  it('POST /follow - Attempt to follow a valid ObjectId but non-existent user (Failure)', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .post(`/api/follow/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();
  
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('msg', 'User to follow not found.');
  });
  
  
});
