import request from 'supertest';
import app from '../src/app';
import { User } from '../src/models/userModel.mjs';

describe('User Availability Routes', () => {
  // Function to create a user for testing
  const createUser = async (username, email, password) => {
    await User.create({ username, email, password });
  };

  // Function to test username availability
  const checkUsername = async (username, expectedStatus, expectedMsg) => {
    const response = await request(app).get(`/api/user/check-username/${username}`);
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('msg', expectedMsg);
  };

  // Function to test email availability
  const checkEmail = async (email, expectedStatus, expectedMsg) => {
    const response = await request(app).get(`/api/user/check-email/${email}`);
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('msg', expectedMsg);
  };

  beforeEach(async () => {
    // Clear User collection before each test
    await User.deleteMany({});
  });

  describe('GET /api/user/check-username/:username', () => {
    it('should return 400 for invalid username', async () => {
      await checkUsername('12', 400, 'Invalid username format');
    });

    it('should return 409 for already taken username', async () => {
      await createUser('takenusername', 'taken@example.com', 'password123');
      await checkUsername('takenusername', 409, 'Username is already in use');
    });

    it('should return 200 for available username', async () => {
      await checkUsername('availableusername', 200, 'Username is available');
    });
  });

  describe('GET /api/user/check-email/:email', () => {
    it('should return 400 for invalid email', async () => {
      await checkEmail('invalid-email', 400, 'Invalid email format');
    });

    it('should return 409 for already taken email', async () => {
      await createUser('username', 'taken@example.com', 'password123');
      await checkEmail('taken@example.com', 409, 'Email is already in use');
    });

    it('should return 200 for available email', async () => {
      await checkEmail('available@example.com', 200, 'Email is available');
    });
  });
});
