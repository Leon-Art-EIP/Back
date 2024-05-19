import request from 'supertest';
import app from '../src/app';
import { User } from '../src/models/userModel.mjs';
import { Article } from '../src/models/articleModel.mjs';

let token;
let userId;

describe('Article routes', () => {
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

  beforeEach(async () => {
    // Clear the Article collection before each test
    await Article.deleteMany({});
  });
  it('POST /api/article - Create a new Article (Success)', async () => {
    const payload = {
      title: 'Artistic Innovations of 2023',
      content: '<p>This is the article content.</p>'
    };
  
    const response = await request(app)
      .post('/api/article')
      .set('Authorization', `Bearer ${token}`)
      .field('title', payload.title)
      .field('content', payload.content)
      .attach('mainImage', 'test-files/sample-banner.jpg');
  
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('title', payload.title);
  });
  

  it('POST /api/article - Missing required fields', async () => {
    const payload = {
      // title missing
      mainImage: 'mainImage.jpg',
      content: '<p>This is the article content.</p>'
    };

    const response = await request(app)
      .post('/api/article')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(422);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([{ msg: 'Title is required' }])
    );
  });

  it('GET /api/article/latest - Retrieve latest articles (Success)', async () => {
    // Create some dummy articles for testing using the userId
    await Article.insertMany([
      { title: 'Article 1', mainImage: 'image1.jpg', content: '<p>Content 1</p>', author: userId },
      { title: 'Article 2', mainImage: 'image2.jpg', content: '<p>Content 2</p>', author: userId }
    ]);

    const response = await request(app)
      .get('/api/article/latest?limit=1&page=1');

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('title', 'Article 2');  // Latest first
});

  it('GET /api/article/latest - No articles available', async () => {
    const response = await request(app)
      .get('/api/article/latest?limit=1&page=1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

});
