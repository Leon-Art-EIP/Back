import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/userModel.mjs';
import { ArtPublication } from '../src/models/artPublicationModel.mjs';
import { Comment } from '../src/models/commentModel.mjs';
import Collection from '../src/models/collectionModel.mjs';

let token, userId, artPublicationId, commentId;

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

beforeEach(async () => {
  await ArtPublication.deleteMany({});
  await Comment.deleteMany({});
  await Collection.deleteMany({});

  const artPublication = new ArtPublication({
    userId: mongoose.Types.ObjectId(userId),
    image: 'image.jpg',
    artType: 'Painting',
    name: 'My Artwork',
    description: 'This is my artwork',
    dimension: '5x7',
    isForSale: true,
    price: 200,
    location: 'NYC',
  });
  await artPublication.save();
  artPublicationId = artPublication._id.toString();

  const comment = new Comment({
    userId: mongoose.Types.ObjectId(userId),
    artPublicationId: mongoose.Types.ObjectId(artPublicationId),
    text: 'Nice art!',
  });
  await comment.save();
  commentId = comment._id.toString();
});

describe('ArtPublication Functionalities', () => {
  beforeEach(async () => {
    // Create a sample artPublication
    const artPublication = new ArtPublication({
      userId: new ObjectId(userId),
      image: 'image.jpg',
      artType: 'Painting',
      name: 'My Artwork',
      description: 'This is my artwork',
      dimension: '5x7',
      isForSale: true,
      price: 200,
      location: 'NYC',
    });
    await artPublication.save();
    artPublicationId = artPublication._id.toString();

    // Create a sample comment
    const comment = new Comment({
      userId: new ObjectId(userId),
      artPublicationId: new ObjectId(artPublicationId),
      text: 'Nice art!',
    });
    await comment.save();
    commentId = comment._id.toString();
    
  });

  it('POST /like/:id - Like/Unlike an ArtPublication', async () => {
    const response = await request(app)
      .post(`/api/art-publication/like/${artPublicationId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.msg).toBe('Like status updated');
    expect(response.body.likeStatus.isLiked).toBe(true);
  });

  it('POST /like/:id - ArtPublication not found', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .post(`/api/art-publication/like/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.msg).toBe('Art publication not found');
  });

  it('POST /like/:id - Remove like', async () => {
    // Manually add a like to the artPublication
    const artPublication = await ArtPublication.findById(artPublicationId);
    artPublication.likes.push(new ObjectId(userId));
    await artPublication.save();

    const response = await request(app)
      .post(`/api/art-publication/like/${artPublicationId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.msg).toBe('Like status updated');
    expect(response.body.likeStatus.isLiked).toBe(false); // Updated expectation

  });

  it('GET /like-count/:id - Retrieve like count for an ArtPublication', async () => {
    const response = await request(app)
      .get(`/api/art-publication/like-count/${artPublicationId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.artPublicationId.toString()).toBe(artPublicationId);
    expect(response.body.totalLikes).toBe(0); // Initial count should be 0
  });

  it('GET /like-count/:id - ArtPublication not found', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .get(`/api/art-publication/like-count/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.msg).toBe('Art publication not found');
  });

  it('GET /users-who-liked/:id - Retrieve users who liked the ArtPublication', async () => {
    const response = await request(app)
      .get(`/api/art-publication/users-who-liked/${artPublicationId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.artPublicationId.toString()).toBe(artPublicationId);
    expect(response.body.users).toEqual([]); // Initially no users have liked it
  });

  it('GET /users-who-liked/:id - ArtPublication not found', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .get(`/api/art-publication/users-who-liked/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.msg).toBe('Art publication not found');
  });

  it('POST /collection - Add to Collection', async () => {
    const response = await request(app)
      .post('/api/collection')
      .set('Authorization', `Bearer ${token}`)
      .send({
        collectionName: 'Favorites',
        artPublicationId,
      });

    expect(response.status).toBe(200);
    expect(response.body.msg).toBe('Added to collection');
    expect(response.body.collection.name).toBe('Favorites');
    expect(response.body.collection.artPublications).toContain(artPublicationId);
  });

  it('POST /collection - ArtPublication not found', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .post(`/api/collection`)
      .set('Authorization', `Bearer ${token}`)
      .send({ collectionName: 'Favorites', artPublicationId: fakeId });

    expect(response.status).toBe(404);
    expect(response.body.msg).toBe('Art publication not found');
  });

  it('POST /collection - Add to existing collection', async () => {
    // First, create a collection with the name 'Favorites'
    const newCollection = new Collection({ name: 'Favorites', artPublications: [], user: userId });
    await newCollection.save();
    const user = await User.findById(userId);
    user.collections.push(newCollection.id);
    await user.save();
    

    const response = await request(app)
      .post('/api/collection')
      .set('Authorization', `Bearer ${token}`)
      .send({ collectionName: 'Favorites', artPublicationId });

    expect(response.status).toBe(200);
    expect(response.body.msg).toBe('Added to collection');
    expect(response.body.collection.artPublications).toContain(artPublicationId);
  });


  it('POST /comment/:id - Add Comment', async () => {
    const response = await request(app)
      .post(`/api/art-publication/comment/${artPublicationId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        text: 'Awesome art!',
      });

    expect(response.status).toBe(200);
    expect(response.body.msg).toBe('Comment added');
    expect(response.body.comment.text).toBe('Awesome art!');
  });

  it('DELETE /comment/:commentId - Delete Comment', async () => {
    const response = await request(app)
      .delete(`/api/art-publication/comment/${commentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.msg).toBe('Comment deleted');
    expect(response.body.commentId).toBe(commentId);
  });

  it('POST /comment/:id - ArtPublication not found', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .post(`/api/art-publication/comment/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'Awesome!' });

    expect(response.status).toBe(404);
    expect(response.body.msg).toBe('Art publication not found');
  });

  it('DELETE /comment/:commentId - Comment not found', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .delete(`/api/art-publication/comment/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.msg).toBe('Comment not found');
  });

  it('DELETE /comment/:commentId - Unauthorized', async () => {
    // Create a comment with a different userId
    const differentUserId = new mongoose.Types.ObjectId();
    const comment = new Comment({
      userId: differentUserId,
      artPublicationId: new ObjectId(artPublicationId),
      text: 'Great art!',
    });
    await comment.save();
    const response = await request(app)
      .delete(`/api/art-publication/comment/${comment._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.msg).toBe('Unauthorized');
  });

  it('GET /comment/:id - Retrieve Comments of ArtPublication', async () => {
    const response = await request(app)
      .get(`/api/art-publication/comment/${artPublicationId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body[0].text).toBe('Nice art!'); // Expecting the comment text to match what was added
  });

  it('GET /comment/:id - No comments for ArtPublication', async () => {
    // First, delete the comment created for the test
    await Comment.deleteMany({ artPublicationId: artPublicationId });

    const response = await request(app)
      .get(`/api/art-publication/comment/${artPublicationId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(0);  // Expecting an empty array
  });

  it('GET /comment/:id - ArtPublication not found', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .get(`/api/art-publication/comment/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.msg).toBe('Art publication not found');
  });

  // Testing for fetching an art publication by its ID
  it('GET /api/art-publication/:id - Successfully retrieve an ArtPublication by ID', async () => {
    const response = await request(app)
      .get(`/api/art-publication/${artPublicationId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body._id.toString()).toBe(artPublicationId);
  });

  it('GET /api/art-publication/:id - ArtPublication not found by ID', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .get(`/api/art-publication/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.msg).toBe('Art publication not found');
  });

  // Testing for fetching latest art publications with pagination
  it('GET /api/art-publication/feed/latest - Successfully retrieve latest ArtPublications', async () => {
    const response = await request(app)
      .get('/api/art-publication/feed/latest')
      .set('Authorization', `Bearer ${token}`)
      .query({ skip: 0 });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });

  // Testing for fetching art publications of followed users
  it('GET /api/art-publication/feed/followed - Retrieve ArtPublications of followed users', async () => {
    const response = await request(app)
      .get('/api/art-publication/feed/followed')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });

  it('GET /user/:userId - Retrieve art publications by user', async () => {
    const response = await request(app)
      .get(`/api/art-publication/user/${userId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1); // One artPublication was added in beforeEach
    expect(response.body[0]._id.toString()).toBe(artPublicationId);
    expect(response.body[0].userId.toString()).toBe(userId);
    expect(response.body[0].name).toBe('My Artwork');
  });

  it('GET /user/:userId - Retrieve art publications by user with invalid userId', async () => {
    const fakeId = '12345'; // Non-MongoDB ObjectId
    const response = await request(app)
      .get(`/api/art-publication/user/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(422); // Invalid request data
    expect(response.body.errors[0].msg).toBe('Invalid User ID');
  });

  it('GET /user/:userId - Retrieve art publications by non-existing user', async () => {
    const fakeId = new mongoose.Types.ObjectId(); // Valid ObjectId, but no user with this ID
    const response = await request(app)
      .get(`/api/art-publication/user/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(0); // No art publications for this user
  });

  it('GET /user/:userId - Retrieve art publications without authorization', async () => {
    const response = await request(app)
      .get(`/api/art-publication/user/${userId}`);

    expect(response.status).toBe(401); // Unauthorized
  });

  it('GET /api/collection/:collectionId/publications - Successfully retrieve ArtPublications from a collection', async () => {
    const collectionName = 'Favorites';
    const collection = await Collection.findOne({ user: userId, name: collectionName });
    const collectionId = collection._id;
    
    const response = await request(app)
      .get(`/api/collection/${collectionId}/publications`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });

  it('GET /api/collection/:collectionId/publications - Collection not found', async () => {
    const fakeCollectionId = new mongoose.Types.ObjectId();
    
    const response = await request(app)
      .get(`/api/collection/${fakeCollectionId}/publications`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.msg).toBe('Collection not found');
  });

  afterAll(async () => {
    await User.deleteMany({});
    await ArtPublication.deleteMany({});
    await Comment.deleteMany({});
    await Collection.deleteMany({});
    // If using a real database, disconnect here
    // mongoose.disconnect();
  });
  
});
