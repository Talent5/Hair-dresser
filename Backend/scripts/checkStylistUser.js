const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkStylistAndUser() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('test');
    
    // Check the specific stylist
    const { ObjectId } = require('mongodb');
    const stylistId = '68cfe2f192131870549c9af3';
    const stylist = await db.collection('stylists').findOne({ _id: new ObjectId(stylistId) });
    
    if (stylist) {
      console.log('\n🎯 Stylist found:');
      console.log(`- ID: ${stylist._id}`);
      console.log(`- Business Name: ${stylist.businessName}`);
      console.log(`- isActive: ${stylist.isActive}`);
      console.log(`- userId: ${stylist.userId}`);
      
      // Check the associated user
      if (stylist.userId) {
        const user = await db.collection('users').findOne({ _id: stylist.userId });
        if (user) {
          console.log('\n👤 Associated User found:');
          console.log(`- ID: ${user._id}`);
          console.log(`- Name: ${user.name}`);
          console.log(`- Email: ${user.email}`);
          console.log(`- Role: ${user.role}`);
          console.log(`- isActive: ${user.isActive}`);
          console.log(`- isVerified: ${user.isVerified}`);
        } else {
          console.log('\n❌ Associated User NOT found');
        }
      }
    } else {
      console.log('\n❌ Stylist NOT found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkStylistAndUser();