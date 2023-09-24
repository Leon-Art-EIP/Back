import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import { User } from '../src/models/UserModel.mjs';
import { ArtPublication } from '../src/models/ArtPublicationModel.mjs';

let token;

describe('ArtPublication routes', () => {
  beforeAll(async () => {
    await User.deleteMany({});
    const userResponse = await request(app).post('/api/auth/signup').send({
      username: 'testuser',
      email: 'testuser@test.com',
      password: 'StrongTestPassword123!',
    });
    token = userResponse.body.token;
  });

  beforeEach(async () => {
    // Clear the ArtPublication collection before each test
    await ArtPublication.deleteMany({});
  });

  it('POST /api/art-publication - Create a new ArtPublication (Success)', async () => {
    const payload = {
      image: 'image.jpg',
      artType: 'Painting',
      name: 'My Artwork',
      description: 'This is my artwork',
      dimension: '5x7',
      isForSale: true,
      price: 200,
      location: 'NYC',
    };

    const response = await request(app)
      .post('/api/art-publication')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('msg', 'Art publication created successfully!');
  });

  it('POST /api/art-publication - Missing required fields', async () => {
    const payload = {};
    const response = await request(app)
      .post('/api/art-publication')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(422);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: 'Image is required' }),
        expect.objectContaining({ msg: 'Art type is required' }),
        expect.objectContaining({ msg: 'Name is required' }),
      ])
    );
  });

  it('POST /api/art-publication - Invalid optional fields', async () => {
    const payload = {
      image: 'image.jpg',
      artType: 'Painting',
      name: 'My Artwork',
      isForSale: 'InvalidBoolean',
      price: 'InvalidPrice',
      location: 1234
    };

    const response = await request(app)
      .post('/api/art-publication')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(422);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: 'Invalid for-sale status' }),
        expect.objectContaining({ msg: 'Invalid price' }),
        expect.objectContaining({ msg: 'Invalid location' }),
      ])
    );
  });
});

