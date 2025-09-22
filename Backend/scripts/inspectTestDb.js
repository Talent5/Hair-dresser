const { MongoClient } = require('mongodb');
require('dotenv').config();

async function inspectTestDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Connect to test database specifically
    const db = client.db('test');
    console.log('Connected to database: test');
    
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
          const keys = Object.keys(doc).filter(k => k !== '_id');
          console.log(`  ${index + 1}. ID: ${doc._id}, Keys: ${keys.join(', ')}`);
          if (doc.name) console.log(`     Name: ${doc.name}`);
          if (doc.email) console.log(`     Email: ${doc.email}`);
          if (doc.role) console.log(`     Role: ${doc.role}`);
        });
      }
    }

  } catch (error) {
    console.error('Error inspecting database:', error);
  } finally {
    await client.close();
  }
}

inspectTestDatabase();