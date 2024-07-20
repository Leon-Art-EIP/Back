import request from 'supertest';
import app from '../src/app';
import { User } from '../src/models/userModel.mjs';
import { Quizz } from '../src/models/quizzModel.mjs';

describe('Quizz Routes', () => {
  let token;

  const signUpAndAuthenticateUser = async () => {
    const userResponse = await request(app).post('/api/auth/signup').send({
      username: 'testuser',
      email: 'testuser@test.com',
      password: 'StrongTestPassword123!',
    });
    return userResponse.body.token;
  };

  const submitQuizz = async (payload) => {
    return request(app)
      .post('/api/quizz/submit')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
  };

  beforeAll(async () => {
    await User.deleteMany({});
    token = await signUpAndAuthenticateUser();
  });

  beforeEach(async () => {
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

    const response = await submitQuizz(payload);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('msg', 'Quizz submitted successfully');
  });

  it('POST /submit - Missing required fields', async () => {
    const response = await submitQuizz({});
    expect(response.status).toBe(422);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: 'Objective is required' }),
      ])
    );
  });

  it('POST /submit - Invalid objective', async () => {
    const payload = { objective: 'invalidObjective' };
    const response = await submitQuizz(payload);
    expect(response.status).toBe(422);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: 'Invalid objective' }),
      ])
    );
  });

  it('POST /submit - Invalid customCommands', async () => {
    const payload = { objective: 'sell', customCommands: 'Invalid' };
    const response = await submitQuizz(payload);
    expect(response.status).toBe(422);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: 'Custom commands can only be "Yes", "No", or "Maybe"' }),
      ])
    );
  });
});
