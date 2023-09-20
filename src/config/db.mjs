import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: "leonart",
    });
    console.log("MongoDB connected...");
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    process.exit(1);
  }
};

export default connectDB;
