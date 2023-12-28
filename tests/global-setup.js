import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';
dotenv.config();

console.log("Dotenv configured in JEST");



export default async () => {
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  process.env.MONGO_URI_TEST = mongoUri;
  global.__MONGO_SERVER__ = mongoServer;
};
