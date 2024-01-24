import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import Conversation from '../src/models/conversationModel.mjs';
import Message from '../src/models/messageModel.mjs';
import { Order } from '../src/models/orderModel.mjs';
import { User } from '../src/models/userModel.mjs';

let token, userId, conversationId, messageId, orderId;

beforeAll(async () => {
  await User.deleteMany({});
 
  const userResponse = await request(app)
    .post('/api/auth/signup')
    .send({
      username: 'testuser',
      email: 'testuser@test.com',
      password: 'StrongTestPassword123!',
    });

  token = userResponse.body.token;
  userId = userResponse.body.user._id;
});

describe('Conversation Routes Tests', () => {
  it('GET /api/conversation - Retrieve all conversations', async () => {
    const response = await request(app)
      .get('/api/conversation')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('POST /api/conversation/messages - Retrieve messages of a conversation', async () => {
    const response = await request(app)
      .post('/api/conversation/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        convId: conversationId
      });

    expect(response.status).toBe(404);
  });

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
  });

  it('POST /api/conversation/order/infos - Retrieve order information', async () => {
    const response = await request(app)
      .post('/api/conversation/order/infos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        convId: conversationId
      });

    expect(response.status).toBe(404);
  });

  it('POST /api/conversation/order/rating - Update order rating', async () => {
    const response = await request(app)
      .post('/api/conversation/order/rating')
      .set('Authorization', `Bearer ${token}`)
      .send({
        convId: conversationId,
        rating: 5
      });

    expect(response.status).toBe(404);
  });
});
