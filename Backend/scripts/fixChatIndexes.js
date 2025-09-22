const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const fixChatIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    const chatsCollection = db.collection('chats');
    
    console.log('Checking existing indexes...');
    const indexes = await chatsCollection.indexes();
    console.log('Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key, unique: idx.unique })));
    
    // Drop the problematic unique index on bookingId if it exists
    try {
      await chatsCollection.dropIndex('bookingId_1');
      console.log('Dropped unique bookingId index');
    } catch (error) {
      console.log('bookingId_1 index does not exist or could not be dropped:', error.message);
    }
    
    // Create a sparse index on bookingId (allows multiple nulls but unique for non-null values)
    try {
      await chatsCollection.createIndex({ bookingId: 1 }, { 
        unique: true, 
        sparse: true,
        name: 'bookingId_sparse_unique'
      });
      console.log('Created sparse unique index on bookingId');
    } catch (error) {
      console.log('Could not create sparse unique index:', error.message);
    }
    
    // Also create a compound index for general chats to prevent duplicates
    try {
      await chatsCollection.createIndex(
        { 
          'participants.userId': 1,
          bookingId: 1
        }, 
        { 
          unique: true,
          partialFilterExpression: { bookingId: { $exists: false } },
          name: 'participants_general_chat_unique'
        }
      );
      console.log('Created compound index for general chats');
    } catch (error) {
      console.log('Could not create compound index:', error.message);
    }
    
    console.log('Final indexes:');
    const finalIndexes = await chatsCollection.indexes();
    console.log(finalIndexes.map(idx => ({ name: idx.name, key: idx.key, unique: idx.unique, sparse: idx.sparse })));
    
  } catch (error) {
    console.error('Error fixing indexes:', error);
  }
};

const main = async () => {
  await connectDB();
  await fixChatIndexes();
  await mongoose.disconnect();
  console.log('Index fix script finished');
};

main();