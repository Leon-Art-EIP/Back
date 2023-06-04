const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const bcrypt = require('bcrypt');

describe('Auth routes', () => {
    let mongoServer;

    beforeAll(async () => {
        await mongoose.disconnect();

        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();

        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    afterEach(async () => {
        await User.deleteMany({});
    });

    test('POST /signup - Successful signup', async () => {
        const response = await request(app)
            .post('/api/auth/signup')
            .send({
                username: 'testuser',
                email: 'testuser@test.com',
                password: 'StrongTestPassword123!',
            });

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('token');
        const user = await User.findOne({ email: 'testuser@test.com' });
        expect(user).not.toBeNull();
    });

    test('POST /signup - Missing fields', async () => {
        const response = await request(app)
            .post('/api/auth/signup')
            .send({
                username: 'testuser',
                password: 'StrongTestPassword123!',
            });

        expect(response.statusCode).toBe(422);
        expect(response.body.errors).toContainEqual({
          msg: 'Must be a valid email address',
          location: 'body',
          path: 'email',
          type: 'field',
        });      
    });

    test('POST /signup - Invalid email', async () => {
        const response = await request(app)
            .post('/api/auth/signup')
            .send({
                username: 'testuser',
                email: 'notavalidemail',
                password: 'StrongTestPassword123!',
            });

        expect(response.statusCode).toBe(422);
        expect(response.body.errors).toContainEqual({
          msg: 'Must be a valid email address',
          location: 'body',
          path: 'email',
          type: 'field',
          value: 'notavalidemail',
        });
    });

    test('POST /signup - Weak password', async () => {
        const response = await request(app)
            .post('/api/auth/signup')
            .send({
                username: 'testuser',
                email: 'testuser@test.com',
                password: 'weak',
            });

        expect(response.statusCode).toBe(422);
        expect(response.body.errors).toContainEqual({
          msg: 'Password is too weak',
          location: 'body',
          path: 'password',
          type: 'field',
          value: 'weak',
        });
        expect(response.body.errors).toContainEqual({
          msg: 'Password must be at least 8 characters long',
          location: 'body',
          path: 'password',
          type: 'field',
          value: 'weak',
        });      
    });

    test('POST /signup - Duplicate email', async () => {
        await request(app)
            .post('/api/auth/signup')
            .send({
                username: 'testuser1',
                email: 'duplicate@test.com',
                password: 'StrongTestPassword123!',
            });

        const response = await request(app)
            .post('/api/auth/signup')
            .send({
                username: 'testuser2',
                email: 'duplicate@test.com',
                password: 'StrongTestPassword123!',
            });

        expect(response.statusCode).toBe(409);
        expect(response.body).toHaveProperty('msg', 'Email already in use');
    });

    test('POST /login - Successful login', async () => {
        const user = new User({
            username: 'testuser',
            email: 'testuser@test.com',
            password: await bcrypt.hash('StrongTestPassword123!', 10),
        });
        await user.save();

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'testuser@test.com',
                password: 'StrongTestPassword123!',
            });

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('token');
    });

    test('POST /login - Missing email or password', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                password: 'StrongTestPassword123!',
            });

        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty('msg', 'Email not registered');
    });

    test('POST /login - Non-existent user', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'nonexistent@test.com',
                password: 'StrongTestPassword123!',
            });

        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty('msg', 'Email not registered');
    });

    test('POST /login - Incorrect password', async () => {
        const user = new User({
            username: 'testuser',
            email: 'testuser@test.com',
            password: await bcrypt.hash('StrongTestPassword123!', 10),
        });
        await user.save();

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'testuser@test.com',
                password: 'IncorrectPassword123!',
            });

        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty('msg', 'Incorrect password');
    });
});
