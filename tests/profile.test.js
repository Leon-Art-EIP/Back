import request from 'supertest';
import app from '../src/app';
import mongoose from 'mongoose';
import { User } from '../src/models/userModel.mjs';
import path from 'path';
import fs from 'fs';

describe('User routes', () => {
  let token;
  let userId;
  const uploadedTestFiles = [];

  const signUpUser = async () => {
    const userResponse = await request(app).post('/api/auth/signup').send({
      username: 'testuser',
      email: 'testuser@test.com',
      password: 'StrongTestPassword123!',
    });
    return { token: userResponse.body.token, userId: userResponse.body.user.id };
  };

  const getUserProfile = async (userId) => {
    return request(app)
      .get(`/api/user/profile/${userId}`)
      .set('Authorization', `Bearer ${token}`);
  };

  const updateUserProfile = async (endpoint, data, file = null) => {
    const req = request(app)
      .post(`/api/user/profile/${endpoint}`)
      .set('Authorization', `Bearer ${token}`);

    if (file) {
      req.attach(file.fieldName, path.resolve(file.filePath));
    } else {
      req.send(data);
    }

    return req;
  };

  beforeAll(async () => {
    await User.deleteMany({});
    const authData = await signUpUser();
    token = authData.token;
    userId = authData.userId;
  });
    // Remove test user data
    await User.deleteMany({ username: 'testuser' });

    // If using a real database, disconnect here
    // mongoose.disconnect();
  });

  it('GET /api/user/profile/:userId - Get user profile', async () => {
    const response = await getUserProfile(userId);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', 'testuser');
  });

  it('GET /api/user/profile/:nonExistentUserId - User not found', async () => {
    const nonExistentUserId = new mongoose.Types.ObjectId();
    const response = await getUserProfile(nonExistentUserId);
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('msg', 'User not found');
  });

  it('POST /api/user/profile/bio - Update biography', async () => {
    const response = await updateUserProfile('bio', { biography: 'This is my biography.' });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('biography', 'This is my biography.');
  });

  it('POST /api/user/profile/availability - Update availability', async () => {
    const response = await updateUserProfile('availability', { availability: 'Available on weekends' });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('availability', 'Available on weekends');
  });

  it('POST /api/user/profile/profile-pic - Update profile picture', async () => {
    const response = await updateUserProfile('profile-pic', null, { fieldName: 'profilePicture', filePath: 'test-files/sample.jpg' });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('profilePicture');
    expect(response.body.profilePicture).toMatch(/uploads/);
    uploadedTestFiles.push(response.body.profilePicture);
  });

  it('POST /api/user/profile/banner-pic - Update banner picture', async () => {
    const response = await updateUserProfile('banner-pic', null, { fieldName: 'bannerPicture', filePath: 'test-files/sample-banner.jpg' });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('bannerPicture');
    expect(response.body.bannerPicture).toMatch(/uploads/);
    uploadedTestFiles.push(response.body.bannerPicture);
  });
});
