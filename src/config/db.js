const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://cedric:admin@20.199.102.240:27017/', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: 'leonart'
        });
        console.log('MongoDB connected...');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
