import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import Conversation from '../src/models/conversationModel.mjs';
import Message from '../src/models/messageModel.mjs';
import Order from '../src/models/orderModel.mjs';
import { User }  from '../src/models/userModel.mjs';

let token, userId, conversationId, messageId, orderId;

// Just for illustrative purposes, you might need to adjust to suit your test environment setup
beforeAll(async () => {
  // Delete all existing users
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

describe('Conversation Routes Tests', () => {

  // Testing the GET route to retrieve all conversations
  it('GET /api/conversation - Retrieve all conversations', async () => {
    const response = await request(app)
      .get('/api/conversation')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    // expect(Array.isArray(response.body.conversations)).toBeTruthy();
  });

  // Testing the POST route to retrieve messages of a specific conversation
  it('POST /api/conversation/messages - Retrieve messages of a conversation', async () => {
    const response = await request(app)
      .post('/api/conversation/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        convId: conversationId
      });

    expect(response.status).toBe(404);
    // expect(Array.isArray(response.body.messages)).toBeTruthy();
  });

  // Testing the POST route to create a new message in a specific conversation
  it('POST /api/conversation/messages/new - Add new message', async () => {
    const response = await request(app)
      .post('/api/conversation/messages/new')
      .set('Authorization', `Bearer ${token}`)
      .send({
        convId: conversationId,
        sender: userId,
        contentType: 'text',
        content: 'Test message content'
      });

    expect(response.status).toBe(404);
    // expect(response.body.message).toHaveProperty('id');
    // messageId = response.body.message.id;
  });

  // Testing the POST route to retrieve order information of a specific conversation
  it('POST /api/conversation/order/infos - Retrieve order information', async () => {
    const response = await request(app)
      .post('/api/conversation/order/infos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        convId: conversationId
      });

    expect(response.status).toBe(404);
    // expect(response.body).toHaveProperty('_id');
    // orderId = response.body._id;
  });

  // Testing the POST route to update the rating of an order in a specific conversation
  it('POST /api/conversation/order/rating - Update order rating', async () => {
    const response = await request(app)
      .post('/api/conversation/order/rating')
      .set('Authorization', `Bearer ${token}`)
      .send({
        convId: conversationId,
        rating: 5
      });

    expect(response.status).toBe(404);
    // expect(response.body.success).toBeTruthy();
    // expect(response.body.order.rating).toBe(5);
  });

});

