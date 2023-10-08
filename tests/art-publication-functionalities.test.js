import request from 'supertest';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import app from '../src/app';
import { User } from '../src/models/UserModel.mjs';
import { ArtPublication } from '../src/models/ArtPublicationModel.mjs';
import { Comment } from '../src/models/CommentModel.mjs';

let token, userId, artPublicationId, commentId;

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

beforeEach(async () => {
  // Clear the ArtPublication and Comment collections before each test
  await ArtPublication.deleteMany({});
  await Comment.deleteMany({});
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
    expect(response.body.likeStatus.isLiked).toBe(false);
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
    const user = await User.findById(userId);
    user.collections.push({ name: 'Favorites', artPublications: [] });
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

  it('GET /api/collection/:collectionId/publications - Successfully retrieve ArtPublications from a collection', async () => {
    const collectionName = 'Favorites';
    const user = await User.findById(userId);
    const collection = user.collections.find(c => c.name === collectionName);
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

});
