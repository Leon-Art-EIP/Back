import request from 'supertest';
import app from '../src/app';

describe('Conditions Route Tests', () => {
  it('GET /api/conditions - Successfully retrieve conditions', async () => {
    const response = await request(app)
      .get('/api/conditions');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('conditions');
    expect(typeof response.body.conditions).toBe('string');
  });
});
