import request from 'supertest';
import app from '../src/app';
import { getDocs, collection, deleteDoc, doc, setDoc } from 'firebase/firestore';

describe('User Availability Routes', () => {
  const createUser = async (username, email, password) => {
    const userRef = doc(collection(global.db, 'users'), username);
    await setDoc(userRef, { email, password });
  };

  const checkUsername = async (username, expectedStatus, expectedMsg) => {
    const response = await request(app).get(`/api/user/check-username/${username}`);
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('msg', expectedMsg);
  };

  const checkEmail = async (email, expectedStatus, expectedMsg) => {
    const response = await request(app).get(`/api/user/check-email/${email}`);
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('msg', expectedMsg);
  };

  beforeEach(async () => {
    const usersCollection = collection(global.db, 'users');
    const querySnapshot = await getDocs(usersCollection);
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  });

  describe('GET /api/user/check-username/:username', () => {
    it('should return 400 for invalid username', async () => {
      await checkUsername('12', 400, 'Invalid username format');
    });

    it('should return 409 for already taken username', async () => {
      await createUser('takenusername', 'taken@example.com', 'password123');
      await checkUsername('takenusername', 409, 'Username is already in use');
    });

    it('should return 200 for available username', async () => {
      await checkUsername('availableusername', 200, 'Username is available');
    });
  });

  describe('GET /api/user/check-email/:email', () => {
    it('should return 400 for invalid email', async () => {
      await checkEmail('invalid-email', 400, 'Invalid email format');
    });

    it('should return 409 for already taken email', async () => {
      await createUser('username', 'taken@example.com', 'password123');
      await checkEmail('taken@example.com', 409, 'Email is already in use');
    });

    it('should return 200 for available email', async () => {
      await checkEmail('available@example.com', 200, 'Email is available');
    });
  });
});
