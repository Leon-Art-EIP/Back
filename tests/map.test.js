import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/userModel.mjs';
import { ArtPublication } from '../src/models/artPublicationModel.mjs';

let token, userId;

beforeAll(async () => {
  await User.deleteMany({});
  await ArtPublication.deleteMany({});

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

  // Update user location
  await request(app)
    .post('/api/location/update')
    .set('Authorization', `Bearer ${token}`)
    .send({
      latitude: 40.7128,
      longitude: -74.0060
    });

  // Create art publication
  const artPublication = new ArtPublication({
    userId,
    image: 'image.jpg',
    artType: 'Painting',
    name: 'My Artwork',
    description: 'This is my artwork',
    dimension: '5x7',
    isForSale: true,
    price: 200,
    location: 'NYC'
  });
  await artPublication.save();
});

describe('Map Controller', () => {
  it('should get users with art publications near a location', async () => {
    const response = await request(app)
      .get('/api/map/nearby-art')
      .set('Authorization', `Bearer ${token}`)
      .query({
        latitude: 40.7128,
        longitude: -74.0060,
        radius: 10
      });

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('_id');
    expect(response.body[0]).toHaveProperty('username');
    expect(response.body[0]).toHaveProperty('profilePicture');
  });

  it('should return 400 if latitude, longitude, or radius is missing', async () => {
    const response = await request(app)
      .get('/api/map/nearby-art')
      .set('Authorization', `Bearer ${token}`)
      .query({
        latitude: 40.7128,
        longitude: -74.0060
      });

    expect(response.status).toBe(400);
    expect(response.body.msg).toBe('Latitude, longitude, and radius are required');
  });

  it('should return 401 if user is not authenticated', async () => {
    const response = await request(app)
      .get('/api/map/nearby-art')
      .query({
        latitude: 40.7128,
        longitude: -74.0060,
        radius: 10
      });

    expect(response.status).toBe(401);
    expect(response.body.msg).toBe('No token, authorization denied');
  });
});
