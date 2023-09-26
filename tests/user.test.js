import request from 'supertest';
import app from '../src/app';
import { User } from '../src/models/UserModel.mjs';

describe('User Availability Routes', () => {
  beforeEach(async () => {
    // Clear User collection before each test
    await User.deleteMany({});
  });

  describe('GET /api/user/check-username/:username', () => {
    it('should return 400 for invalid username', async () => {
      const response = await request(app).get('/api/user/check-username/12');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('msg', 'Invalid username format');
    });

    it('should return 409 for already taken username', async () => {
      await User.create({
        username: 'takenusername',
        email: 'taken@example.com',
        password: 'password123',
      });
      
      const response = await request(app).get('/api/user/check-username/takenusername');
      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('msg', 'Username is already in use');
    });

    it('should return 200 for available username', async () => {
      const response = await request(app).get('/api/user/check-username/availableusername');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('msg', 'Username is available');
    });
  });

  describe('GET /api/user/check-email/:email', () => {
    it('should return 400 for invalid email', async () => {
      const response = await request(app).get('/api/user/check-email/invalid-email');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('msg', 'Invalid email format');
    });

    it('should return 409 for already taken email', async () => {
      await User.create({
        username: 'username',
        email: 'taken@example.com',
        password: 'password123',
      });
      
      const response = await request(app).get('/api/user/check-email/taken@example.com');
      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('msg', 'Email is already in use');
    });

    it('should return 200 for available email', async () => {
      const response = await request(app).get('/api/user/check-email/available@example.com');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('msg', 'Email is available');
    });
  });
});
