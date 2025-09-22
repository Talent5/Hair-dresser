const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/curlmap', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'test' // Explicitly specify test database
    });
    console.log('MongoDB connected successfully');
    console.log('Connected to database:', mongoose.connection.name);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}require('mongoose');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/curlmap', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'curlmap' // Explicitly specify the database name
    });
    console.log('MongoDB connected successfully');
    console.log('Connected to database:', mongoose.connection.name);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

async function inspectDatabase() {
  try {
    console.log('Inspecting database...');
    
    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\nAvailable collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });

    // Check each collection for documents
    for (const collectionInfo of collections) {
      const collection = db.collection(collectionInfo.name);
      const count = await collection.countDocuments();
      console.log(`\n${collectionInfo.name}: ${count} documents`);
      
      if (count > 0 && count <= 10) {
        const docs = await collection.find({}).limit(5).toArray();
        console.log('Sample documents:');
        docs.forEach((doc, index) => {
          console.log(`  ${index + 1}. ID: ${doc._id}, Type: ${typeof doc}, Keys: ${Object.keys(doc).join(', ')}`);
        });
      }
    }

  } catch (error) {
    console.error('Error inspecting database:', error);
  } finally {
    mongoose.connection.close();
  }
}

async function run() {
  await connectDB();
  await inspectDatabase();
}

run();