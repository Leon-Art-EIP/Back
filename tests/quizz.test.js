import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import { User } from '../src/models/userModel.mjs';
import { Quizz } from '../src/models/quizzModel.mjs';

let token;

describe('Quizz Routes', () => {
  beforeAll(async () => {
    // Set up database and user for testing
    await User.deleteMany({});
    const userResponse = await request(app).post('/api/auth/signup').send({
      username: 'testuser',
      email: 'testuser@test.com',
      password: 'StrongTestPassword123!',
    });
    token = userResponse.body.token;
  });

  beforeEach(async () => {
    // Clear the Quizz collection before each test
    await Quizz.deleteMany({});
  });

  it('POST /submit - Submit a new Quizz (Success)', async () => {
    const payload = {
      objective: 'sell',
      artInterestType: ['Painting', 'Sculpture'],
      artSellingType: ['Painting'],
      location: 'New York, USA',
      customCommands: 'Yes',
      budget: '0-100',
      discoveryMethod: 'Google Search',
    };

    const response = await request(app)
      .post('/api/quizz/submit')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('msg', 'Quizz submitted successfully');
  });

  it('POST /submit - Missing required fields', async () => {
    const payload = {};

    const response = await request(app)
      .post('/api/quizz/submit')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(422);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: 'Objective is required' }),
      ])
    );
  });

  it('POST /submit - Invalid objective', async () => {
    const payload = {
      objective: 'invalidObjective',
    };

    const response = await request(app)
      .post('/api/quizz/submit')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(422);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: 'Invalid objective' }),
      ])
    );
  });

  it('POST /submit - Invalid customCommands', async () => {
    const payload = {
      objective: 'sell',
      customCommands: 'Invalid',
    };

    const response = await request(app)
      .post('/api/quizz/submit')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(422);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: 'Custom commands can only be "Yes", "No", or "Maybe"' }),
      ])
    );
  });
});
