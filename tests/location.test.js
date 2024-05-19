import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/userModel.mjs';

let token, userId;

beforeAll(async () => {
  await User.deleteMany({});

  // Create a user
  const userResponse = await request(app)
    .post('/api/auth/signup')
    .send({
      username: 'testuser',
      email: 'testuser@test.com',
      password: 'StrongTestPassword123!',
    });

  token = userResponse.body.token;
  userId = userResponse.body.user.id;
});

describe('Location Controller', () => {
  it('should update user location successfully', async () => {
    const response = await request(app)
      .post('/api/location/update')
      .set('Authorization', `Bearer ${token}`)
      .send({
        latitude: 40.7128,
        longitude: -74.0060
      });

    expect(response.status).toBe(200);
    expect(response.body.msg).toBe('Location updated successfully');

    const updatedUser = await User.findById(userId);
    expect(updatedUser.location.coordinates).toEqual([-74.0060, 40.7128]);
  });

  it('should return 422 if latitude or longitude is missing', async () => {
    const response = await request(app)
      .post('/api/location/update')
      .set('Authorization', `Bearer ${token}`)
      .send({
        latitude: 40.7128
      });

    expect(response.status).toBe(422);
    expect(response.body.errors[0].msg).toBe('Longitude is required');
  });

  it('should return 401 if user is not authenticated', async () => {
    const response = await request(app)
      .post('/api/location/update')
      .send({
        latitude: 40.7128,
        longitude: -74.0060
      });

    expect(response.status).toBe(401);
    expect(response.body.msg).toBe('No token, authorization denied');
  });
});
