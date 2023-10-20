import request from 'supertest';
import app from '../src/app';
import { User } from '../src/models/userModel.mjs';
import { Notification } from '../src/models/notificationModel.mjs';

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
});
