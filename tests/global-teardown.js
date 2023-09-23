import mongoose from 'mongoose';

export default async () => {
  await mongoose.disconnect();
  await global.__MONGO_SERVER__.stop();
};
