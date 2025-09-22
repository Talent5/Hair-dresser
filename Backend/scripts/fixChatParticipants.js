const mongoose = require('mongoose');
const Chat = require('../models/Chat');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function fixChatParticipants() {
  try {
    console.log('Starting chat participants migration...');
    
    // Find all chats where participants are just ObjectIds (old format)
    const chatsToFix = await Chat.find({
      $or: [
        { 'participants.0.userId': { $exists: false } }, // Old format: participants are just ObjectIds
        { 'participants.userId': { $exists: false } }    // Mixed format check
      ]
    });

    console.log(`Found ${chatsToFix.length} chats to fix`);

    for (const chat of chatsToFix) {
      console.log(`Fixing chat ${chat._id}`);
      console.log('Current participants:', chat.participants);

      // Convert old format to new format
      const newParticipants = [];
      
      for (const participant of chat.participants) {
        // If it's already an object with userId, keep it
        if (participant.userId) {
          newParticipants.push(participant);
        } else {
          // Convert ObjectId to new format
          // We need to determine if this is a customer or stylist
          // For now, we'll need to look them up or make assumptions
          newParticipants.push({
            userId: participant,
            role: 'customer', // Default role - this might need manual adjustment
            joinedAt: chat.createdAt || new Date(),
            lastReadAt: chat.createdAt || new Date()
          });
        }
      }

      // Update the chat
      await Chat.findByIdAndUpdate(chat._id, {
        participants: newParticipants
      });

      console.log(`Fixed chat ${chat._id} - new participants:`, newParticipants);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the migration
fixChatParticipants();