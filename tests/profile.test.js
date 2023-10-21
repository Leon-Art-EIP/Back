import request from 'supertest';
import app from '../src/app';
import mongoose from "mongoose";
import { User } from '../src/models/userModel.mjs';
import path from 'path';

let token;
let userId;
const createdFiles = [];


describe('User routes', () => {
  beforeAll(async () => {
    await User.deleteMany({});

    const userResponse = await request(app).post('/api/auth/signup').send({
      username: 'testuser',
      email: 'testuser@test.com',
      password: 'StrongTestPassword123!',
    });
    token = userResponse.body.token;
    userId = userResponse.body.user.id;
  });

  it('GET /api/user/profile/:userId - Get user profile', async () => {
    const response = await request(app)
      .get(`/api/user/profile/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', 'testuser');
  });

  it('GET /api/user/profile/:nonExistentUserId - User not found', async () => {
    const nonExistentUserId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .get(`/api/user/profile/${nonExistentUserId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();
  
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('msg', 'User not found');
  });
  

  it('POST /api/user/profile/bio - Update biography', async () => {
    const response = await request(app)
      .post(`/api/user/profile/bio`)
      .set('Authorization', `Bearer ${token}`)
      .send({ biography: 'This is my biography.' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('biography', 'This is my biography.');
  });

  it('POST /api/user/profile/availability - Update availability', async () => {
    const response = await request(app)
      .post(`/api/user/profile/availability`)
      .set('Authorization', `Bearer ${token}`)
      .send({ availability: 'Available on weekends' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('availability', 'Available on weekends');
  });

  it('POST /api/user/profile/profile-pic - Update profile picture', async () => {
    const response = await request(app)
      .post(`/api/user/profile/profile-pic`)
      .set('Authorization', `Bearer ${token}`)
      .attach('profilePicture', path.resolve('test-files/sample.jpg'));

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('profilePicture');
    expect(response.body.profilePicture).toMatch(/uploads/);
    if (response.body && response.body.profilePicture) {
        global.__UPLOADED_TEST_FILES__.push(response.body.profilePicture);
    }
  });

  it('POST /api/user/profile/banner-pic - Update banner picture', async () => {
    const response = await request(app)
      .post(`/api/user/profile/banner-pic`)
      .set('Authorization', `Bearer ${token}`)
      .attach('bannerPicture', path.resolve('test-files/sample-banner.jpg'));

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('bannerPicture');
    expect(response.body.bannerPicture).toMatch(/uploads/);
    if (response.body && response.body.bannerPicture) {
        global.__UPLOADED_TEST_FILES__.push(response.body.bannerPicture);
    }
  });
});
