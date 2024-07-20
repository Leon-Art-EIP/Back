import request from 'supertest';
import app from '../src/app.mjs';
import { User } from '../src/models/userModel.mjs';
import { Notification } from '../src/models/notificationModel.mjs';
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

let token;
let userId;
let notificationId;

describe('Notification routes', () => {
  beforeAll(async () => {
    await User.deleteMany({});
    await Notification.deleteMany({});

    const userResponse = await request(app).post('/api/auth/signup').send({
      username: 'testusernotif',
      email: 'testusernotif@test.com',
      password: 'StrongTestPassword123!',
    });

    token = userResponse.body.token;
    userId = userResponse.body.user.id;
  });

  beforeEach(async () => {
    await Notification.deleteMany({});

    const notificationResponse = await new Notification({
      recipient: userId,
      content: 'You have a new follower!',
      type: 'Follower'
    }).save();

    notificationId = notificationResponse._id;
  });

  it('GET /api/notifications - Retrieve notifications (Success)', async () => {
    const response = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
    expect(response.body[0]).toHaveProperty('content', 'You have a new follower!');
  });

  it('PUT /api/notifications/:id/read - Mark notification as read (Success)', async () => {
    const response = await request(app)
      .put(`/api/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('msg', 'Notification marked as read');
  });

  it('PUT /api/notifications/:id/read - Non-existent notification', async () => {
    const invalidNotificationId = '61024d8b8daeb22f245162a6';  // an arbitrary non-existent ID

    const response = await request(app)
      .put(`/api/notifications/${invalidNotificationId}/read`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('msg', 'Notification not found');
  });

  it('PUT /api/notifications/update-fcm-token - Update FCM token (Success)', async () => {
    const fcmTokenSample = "sampleFcmToken12345";
  
    const response = await request(app)
      .put('/api/notifications/update-fcm-token')
      .set('Authorization', `Bearer ${token}`)
      .send({ fcmToken: fcmTokenSample });
  
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('msg', 'FCM token updated successfully');
  
    const user = await User.findById(userId);
    expect(user.fcmToken).toEqual(fcmTokenSample);
  });
  
  it('PUT /api/notifications/update-fcm-token - Missing FCM token', async () => {
    const response = await request(app)
      .put('/api/notifications/update-fcm-token')
      .set('Authorization', `Bearer ${token}`)
      .send({});
  
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('msg', 'FCM token is required');
  });

  it('PUT /api/notifications/update-fcm-token - User not found', async () => {
    const fcmTokenSample = "sampleFcmToken12345";
    
    // Generate a token with a non-existent user ID
    const fakeUserId = new mongoose.Types.ObjectId();
    const payload = {
      user: { id: fakeUserId.toString() },
    };
  
    const fakeToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 });
  
    const response = await request(app)
      .put('/api/notifications/update-fcm-token')
      .set('Authorization', `Bearer ${fakeToken}`)
      .send({ fcmToken: fcmTokenSample });
  
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('msg', 'User not found');
  });
});
