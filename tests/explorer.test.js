import request from 'supertest';
import app from '../src/app';
import mongoose from 'mongoose';
import { User } from '../src/models/userModel.mjs';
import { ArtPublication } from '../src/models/artPublicationModel.mjs';

let token;

describe('Explorer Routes', () => {
  beforeAll(async () => {
    // Clear existing data and set up a test user and art publications
    await User.deleteMany({});
    await ArtPublication.deleteMany({});

    const userResponse = await request(app).post('/api/auth/signup').send({
      username: 'explorerUser',
      email: 'explorer@test.com',
      password: 'TestPassword123!',
    });
    token = userResponse.body.token;

    // Create test art publications
    for (let i = 0; i < 10; i++) {
      await new ArtPublication({
        userId: userResponse.body.user.id,
        image: 'test-image.jpg',
        artType: `TestType${i % 2}`,
        name: `TestArt${i}`,
        description: 'Test Description',
        dimension: '5x7',
        isForSale: i % 2 === 0,
        price: 100 + i * 10,
        location: 'Test Location'
      }).save();
    }
  });

  it('GET /api/explorer/search - Search without query parameters', async () => {
    const response = await request(app)
      .get('/api/explorer/search')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('artPublications');
    expect(response.body).toHaveProperty('users');
  });

  it('GET /api/explorer/search - Search with specific art type', async () => {
    const response = await request(app)
      .get('/api/explorer/search?artType=TestType1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.artPublications.every(ap => ap.artType === 'TestType1')).toBe(true);
  });

  it('GET /api/explorer/search - Search with price range', async () => {
    const response = await request(app)
      .get('/api/explorer/search?priceRange=150-200')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.artPublications.every(ap => ap.price >= 150 && ap.price <= 200)).toBe(true);
  });

  it('GET /api/explorer/search - Search with isForSale status', async () => {
    const response = await request(app)
      .get('/api/explorer/search?isForSale=true')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.artPublications.every(ap => ap.isForSale)).toBe(true);
  });

  it('GET /api/explorer/search - Search with invalid query parameters', async () => {
    const response = await request(app)
      .get('/api/explorer/search?priceRange=-150-200')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(422);
  });

  it('GET /api/explorer/search - Unauthorized access', async () => {
    const response = await request(app).get('/api/explorer/search');

    expect(response.status).toBe(401);
  });
});
