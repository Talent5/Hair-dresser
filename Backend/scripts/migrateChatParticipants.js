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

// Define the old and new chat schemas
const oldChatSchema = new mongoose.Schema({}, { strict: false });
const OldChat = mongoose.model('OldChat', oldChatSchema, 'chats');

const migrateChatParticipants = async () => {
  try {
    console.log('Starting chat participants migration...');
    
    // Find all chats
    const chats = await OldChat.find({});
    console.log(`Found ${chats.length} chats to check`);
    
    let migratedCount = 0;
    
    for (const chat of chats) {
      let needsUpdate = false;
      
      // Check if participants is an array of ObjectIds (old format)
      if (chat.participants && Array.isArray(chat.participants)) {
        const hasOldFormat = chat.participants.some(p => 
          typeof p === 'string' || (p && !p.userId && !p.role)
        );
        
        if (hasOldFormat) {
          console.log(`Migrating chat ${chat._id}...`);
          
          // Convert old format to new format
          const newParticipants = [];
          
          // Check if this chat has customer and stylist fields (old structure)
          if (chat.customer && chat.stylist) {
            newParticipants.push({
              userId: chat.customer,
              role: 'customer',
              joinedAt: chat.createdAt || new Date(),
              lastReadAt: chat.createdAt || new Date()
            });
            
            newParticipants.push({
              userId: chat.stylist,
              role: 'stylist',
              joinedAt: chat.createdAt || new Date(),
              lastReadAt: chat.createdAt || new Date()
            });
          } else {
            // Try to infer from participants array
            for (let i = 0; i < chat.participants.length; i++) {
              const participant = chat.participants[i];
              const userId = typeof participant === 'string' ? participant : participant._id || participant;
              
              newParticipants.push({
                userId: userId,
                role: i === 0 ? 'customer' : 'stylist', // Assume first is customer, second is stylist
                joinedAt: chat.createdAt || new Date(),
                lastReadAt: chat.createdAt || new Date()
              });
            }
          }
          
          // Update the chat
          await OldChat.updateOne(
            { _id: chat._id },
            { 
              $set: { 
                participants: newParticipants,
                // Remove old fields if they exist
                $unset: { customer: "", stylist: "" }
              }
            }
          );
          
          migratedCount++;
          needsUpdate = true;
        }
      }
      
      // Ensure bookingId is properly set (null if doesn't exist)
      if (!chat.hasOwnProperty('bookingId')) {
        await OldChat.updateOne(
          { _id: chat._id },
          { $set: { bookingId: null } }
        );
      }
    }
    
    console.log(`Migration completed. Updated ${migratedCount} chats.`);
    
  } catch (error) {
    console.error('Migration error:', error);
  }
};

const main = async () => {
  await connectDB();
  await migrateChatParticipants();
  await mongoose.disconnect();
  console.log('Migration script finished');
};

main();