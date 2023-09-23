import request from 'supertest';
import app from '../src/app';
import { User } from '../src/models/UserModel.mjs';
import { ResetToken } from '../src/models/ResetPasswordTokenModel.mjs';
import bcrypt from 'bcrypt';

let token;
let userEmail;
let resetToken;

describe('Reset Password Routes', () => {
  beforeAll(async () => {
    await User.deleteMany({ username: 'testuser' });

    // Creating user for testing
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('StrongTestPassword123!', salt);
    await User.create({
      username: 'testuser',
      email: 'testuser@test.com',
      password,
    });
    userEmail = 'testuser@test.com';
  });

  describe('POST /request-reset', () => {
    it('should send reset token if email exists', async () => {
      const response = await request(app)
        .post('/api/auth/request-reset')
        .send({ email: userEmail });

      expect(response.status).toBe(200);
      expect(response.body.msg).toBe('Reset email sent');

      // Check if token is saved
      const resetEntry = await ResetToken.findOne({ email: userEmail });
      expect(resetEntry).not.toBeNull();
      resetToken = resetEntry.token;
    });

    it('should fail if email does not exist', async () => {
      const response = await request(app)
        .post('/api/auth/request-reset')
        .send({ email: 'notfound@test.com' });

      expect(response.status).toBe(404);
      expect(response.body.msg).toBe('Email not found');
    });
  });

  describe('POST /validate-reset-token', () => {
    it('should validate correct reset token', async () => {
      const response = await request(app)
        .post('/api/auth/validate-reset-token')
        .send({ token: resetToken });

      expect(response.status).toBe(200);
      expect(response.body.msg).toBe('Valid token');
    });

    it('should not validate incorrect reset token', async () => {
      const response = await request(app)
        .post('/api/auth/validate-reset-token')
        .send({ token: 'incorrectToken' });

      expect(response.status).toBe(404);
      expect(response.body.msg).toBe('Invalid or expired token');
    });
  });

  describe('POST /reset-password', () => {
    it('should reset password if token is correct', async () => {
      const newPassword = 'NewStrongTestPassword123!';
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: resetToken, newPassword });

      expect(response.status).toBe(200);
      expect(response.body.msg).toBe('Password reset successfully');

      // Validate new password
      const user = await User.findOne({ email: userEmail });
      const isMatch = await bcrypt.compare(newPassword, user.password);
      expect(isMatch).toBeTruthy();
    });

    it('should not reset password if token is incorrect', async () => {
      const newPassword = 'YetAnotherStrongTestPassword123!';
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'incorrectToken', newPassword });

      expect(response.status).toBe(404);
      expect(response.body.msg).toBe('Invalid or expired token');
    });

    it('should not reset password if new password is too weak', async () => {
        const weakPassword = '12345678'; // This should trigger a weak password based on zxcvbn
        const response = await request(app)
          .post('/api/auth/reset-password')
          .send({ token: resetToken, newPassword: weakPassword });
    
        expect(response.status).toBe(422);
        expect(response.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Password is too weak',
            }),
          ])
        );
    
        // Validate old password still works
        const user = await User.findOne({ email: userEmail });
        const isMatch = await bcrypt.compare('NewStrongTestPassword123!', user.password);
        expect(isMatch).toBeTruthy();
      });
  });
});
