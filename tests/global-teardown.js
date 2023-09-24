import mongoose from 'mongoose';
import app from '../src/app.mjs';

export default async () => {
    console.log("Starting teardown...");
  
    if (mongoose.connection.readyState !== 0) {
      console.log("Disconnecting MongoDB...");
      await mongoose.disconnect();
      console.log("MongoDB disconnected.");
    } else {
      console.log("MongoDB is already disconnected.");
    }
  
    if (global.__MONGO_SERVER__) {
      console.log("Stopping MongoMemoryServer...");
      await global.__MONGO_SERVER__.stop();
      console.log("MongoMemoryServer stopped.");
    } else {
      console.log("MongoMemoryServer is already stopped.");
    }
  
    console.log("Teardown complete.");
  };
  