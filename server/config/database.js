const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log('Database name:', conn.connection.name);
    console.log('Connection state:', conn.connection.readyState);
    
    // Test write operation
    const testComment = {
      postId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      text: 'Test connection'
    };
    
    await mongoose.connection.db.collection('comments').insertOne(testComment);
    console.log('Write test successful');
    await mongoose.connection.db.collection('comments').deleteOne({text: 'Test connection'});
    console.log('Delete test successful');
    
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
