// tests/auth.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const bcrypt = require('bcrypt');

describe('Auth routes', () => {
    let mongoServer;

    beforeAll(async () => {
        // Disconnect from any active connections
        await mongoose.disconnect();

        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();

        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    });

    afterAll(async () => {
        // Disconnect from the test database
        await mongoose.disconnect();
        await mongoServer.stop();
    });


    afterEach(async () => {
        await User.deleteMany({});
    });

    test('POST /signup', async () => {
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

    test('POST /login', async () => {
        const user = new User({
            username: 'testuser',
            email: 'testuser@test.com',
            password: await bcrypt.hash('Testpassword1', 10),
        });
        await user.save();

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'testuser@test.com',
                password: 'Testpassword1',
            });

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('token');
    });
});
