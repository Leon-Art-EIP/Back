import request from 'supertest';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import app from '../src/app';
import { User } from '../src/models/userModel.mjs';
import { Post } from '../src/models/postModel.mjs';
import { ArtPublication } from '../src/models/artPublicationModel.mjs';

let token, userId, postId, artPublicationId;

beforeAll(async () => {
  await User.deleteMany({});
  await Post.deleteMany({});
  await ArtPublication.deleteMany({});

  const userResponse = await request(app)
    .post('/api/auth/signup')
    .send({
      username: 'testuser',
      email: 'testuser@test.com',
      password: 'StrongTestPassword123!',
    });

  token = userResponse.body.token;
  userId = userResponse.body.user.id;

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
});

beforeEach(async () => {
  await Post.deleteMany({});
});

describe('Post Functionalities', () => {
  it('POST /api/posts - Create a new post', async () => {
    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        text: 'This is a new post',
        artPublicationId,
      });

    expect(response.status).toBe(200);
    expect(response.body.msg).toBe('Post created successfully!');
    expect(response.body.post.text).toBe('This is a new post');
    postId = response.body.post._id;
  });

  it('POST /api/posts - Create a new post within an hour (should fail)', async () => {
    // Creating the first post
    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        text: 'This is a new post',
        artPublicationId,
      });

    // Attempting to create a second post within an hour
    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        text: 'Another post too soon',
        artPublicationId,
      });

    expect(response.status).toBe(400);
    expect(response.body.msg).toBe('You can only post once per hour');
  });

  it('DELETE /api/posts/:id - Delete a post', async () => {
    const post = new Post({
      userId: new ObjectId(userId),
      text: 'Post to be deleted',
      artPublicationId: new ObjectId(artPublicationId),
    });
    await post.save();
    const postId = post._id.toString();

    const response = await request(app)
      .delete(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.msg).toBe('Post deleted successfully');
  });

  it('GET /api/posts - Get user posts', async () => {
    const newPost = new Post({
      userId: new ObjectId(userId),
      text: 'User post',
      artPublicationId: new ObjectId(artPublicationId),
    });
    await newPost.save();

    const response = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .query({ filter: 'user' });

    console.log('Response Body:', response.body); // Log response body to debug

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].userId._id.toString()).toBe(newPost.userId.toString());
  });

  it('POST /api/posts/like/:id - Like a post', async () => {
    const post = new Post({
      userId: new ObjectId(userId),
      text: 'Post to be liked',
      artPublicationId: new ObjectId(artPublicationId),
    });
    await post.save();
    const postId = post._id.toString();

    const response = await request(app)
      .post(`/api/posts/like/${postId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.msg).toBe('Like status updated');
    expect(response.body.likeStatus.isLiked).toBe(true);
  });

  it('POST /api/posts/like/:id - Unlike a post', async () => {
    const post = new Post({
      userId: new ObjectId(userId),
      text: 'Post to be unliked',
      artPublicationId: new ObjectId(artPublicationId),
    });
    post.likes.push(new ObjectId(userId));
    await post.save();
    const postId = post._id.toString();

    const response = await request(app)
      .post(`/api/posts/like/${postId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.msg).toBe('Like status updated');
    expect(response.body.likeStatus.isLiked).toBe(false);
  });

  it('GET /api/posts/like-count/:id - Get like count of a post', async () => {
    const post = new Post({
      userId: new ObjectId(userId),
      text: 'Post to get like count',
      artPublicationId: new ObjectId(artPublicationId),
    });
    await post.save();
    const postId = post._id.toString();

    const response = await request(app)
      .get(`/api/posts/like-count/${postId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.postId).toBe(postId);
    expect(response.body.totalLikes).toBe(0);
  });

  it('GET /api/posts/like-count/:id - Get like count of a non-existing post', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .get(`/api/posts/like-count/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.msg).toBe('Post not found');
  });
});
