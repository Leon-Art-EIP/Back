import request from 'supertest';
import app from '../src/app';
import mongoose from "mongoose";
import { User } from '../src/models/userModel.mjs';

let token;
let userId;
let targetUserId;

describe('Follow routes', () => {
  beforeAll(async () => {
    await User.deleteMany({});
    
    // Create user and obtain its token
    const userResponse = await request(app).post('/api/auth/signup').send({
      username: 'testuser',
      email: 'testuser@test.com',
      password: 'StrongTestPassword123!',
    });
    token = userResponse.body.token;
    userId = userResponse.body.user.id;

    // Create target user
    const targetUserResponse = await request(app).post('/api/auth/signup').send({
      username: 'targetuser',
      email: 'targetuser@test.com',
      password: 'StrongTestPassword123!',
    });
    targetUserId = targetUserResponse.body.user.id;
  });

  it('POST /api/follow/:targetUserId - Follow a user successfully', async () => {
    const response = await request(app)
      .post(`/api/follow/${targetUserId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('msg', 'Successfully followed user.');
  });

  it('POST /api/follow/:targetUserId - Unfollow a user successfully', async () => {
    const response = await request(app)
      .post(`/api/follow/${targetUserId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('msg', 'Successfully unfollowed user.');
  });

  it('POST /api/follow/:targetUserId - Cannot follow oneself', async () => {
    const response = await request(app)
      .post(`/api/follow/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('msg', 'You cannot follow yourself.');
  });

  it('should return 400 for invalid user id', async () => {
    const invalidId = '12345';
    const response = await request(app)
      .post(`/api/follow/${invalidId}`)
      .set('Authorization', 'Bearer ' + token);

    expect(response.status).toBe(400);
    expect(response.body.msg).toBe('Invalid user id.');
  });

  it('should return 404 if user to follow is not found', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .post(`/api/follow/${nonExistentId}`)
      .set('Authorization', 'Bearer ' + token);

    expect(response.status).toBe(404);
    expect(response.body.msg).toBe('User to follow not found.');
  });

  it('GET /api/follow/following - Get list of users following', async () => {
    const response = await request(app)
      .get('/api/follow/following')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body.subscriptions).toEqual(expect.any(Array));
  });

  it('GET /api/follow/followers - Get list of followers of authenticated user', async () => {
    const response = await request(app)
      .get('/api/follow/followers')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body.subscribers).toEqual(expect.any(Array));
  });

  it('GET /api/follow/:targetUserId/followers - Get followers of a specific user', async () => {
    const response = await request(app)
      .get(`/api/follow/${targetUserId}/followers`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body.subscribers).toEqual(expect.any(Array));
  });

  it('should return 404 if user is not found', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .get(`/api/follow/${nonExistentId}/followers`)
      .set('Authorization', 'Bearer ' + token);

    expect(response.status).toBe(404);
    expect(response.body.msg).toBe('User not found.');
  });

  it('GET /api/follow/:targetUserId/following - Get users followed by a specific user', async () => {
    const response = await request(app)
      .get(`/api/follow/${targetUserId}/following`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body.subscriptions).toEqual(expect.any(Array));
  });

  it('should return 404 if user is not found', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .get(`/api/follow/${nonExistentId}/following`)
      .set('Authorization', 'Bearer ' + token);

    expect(response.status).toBe(404);
    expect(response.body.msg).toBe('User not found.');
  });
});
