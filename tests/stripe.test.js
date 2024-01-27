import request from 'supertest';
import app from '../src/app';
import { User } from '../src/models/userModel.mjs';
import mongoose from 'mongoose';

let token, userId, stripeAccountId;

describe('Stripe routes', () => {
  beforeAll(async () => {
    // Delete all existing users
    await User.deleteMany({});

    // Create a user
    const userResponse = await request(app).post('/api/auth/signup').send({
      username: 'stripeTestUser',
      email: 'stripe@test.com',
      password: 'TestPassword123!',
    });

    token = userResponse.body.token;
    userId = userResponse.body.user.id;
  });

  it('POST /api/stripe/setup-stripe - Setup Stripe Account (Success)', async () => {
    stripeAccountId = 'acct_1234StripeTest';
    const response = await request(app)
      .post('/api/stripe/setup-stripe')
      .set('Authorization', `Bearer ${token}`)
      .send({ stripeAccountId });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('stripeAccountId', stripeAccountId);
  });

  it('GET /api/stripe/get-stripe-account - Get Stripe Account (Success)', async () => {
    const response = await request(app)
      .get('/api/stripe/get-stripe-account')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('stripeAccountId', stripeAccountId);
  });

  // Add more tests for other edge cases and error scenarios...
});
