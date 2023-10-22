import mongoose from 'mongoose';
import fs from 'fs';

global.__UPLOADED_TEST_FILES__ = [];

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  // Delete uploaded test files
  global.__UPLOADED_TEST_FILES__.forEach(filePath => {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error(`Error deleting file ${filePath}:`, err);
    }
  });
});
