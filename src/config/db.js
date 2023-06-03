const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://admin-user:Admin123*@20.199.102.240:27018/', {
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
