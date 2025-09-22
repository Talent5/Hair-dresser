import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { Chat, ChatMessage } from '@/types';
import apiService from '@/services/api';

export default function ChatScreen() {
  const router = useRouter();
  const { chatId, bookingId, stylistName, otherParticipantName } = useLocalSearchParams();
  const { user } = useAuth();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [otherParticipant, setOtherParticipant] = useState<string>(
    (otherParticipantName || stylistName) as string || ''
  );

  // Debug: Log when the component renders
  console.log('🔥 ChatScreen component is rendering!', {
    chatId,
    otherParticipantName,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    console.log('=== CHAT SCREEN MOUNT ===');
    console.log('Chat screen mounted with params:', { 
      chatId: typeof chatId, 
      chatIdValue: chatId,
      bookingId: typeof bookingId,
      bookingIdValue: bookingId,
      otherParticipantName: typeof otherParticipantName,
      otherParticipantNameValue: otherParticipantName,
      stylistName: typeof stylistName,
      stylistNameValue: stylistName
    });
    
    if (chatId) {
      console.log('Loading chat with ID:', chatId);
      loadChat(true); // Show loading for initial load
      // Setup polling for real-time updates (temporary until socket integration)
      const pollInterval = setInterval(() => loadChat(false), 3000); // Don't show loading for polls
      
      // Add a timeout to prevent infinite loading
      const loadingTimeout = setTimeout(() => {
        console.log('⚠️ Chat loading timed out, setting loading to false');
        setLoading(false);
      }, 10000); // 10 second timeout
      
      return () => {
        clearInterval(pollInterval);
        clearTimeout(loadingTimeout);
      };
    } else if (bookingId) {
      console.log('Loading chat by booking ID:', bookingId);
      // Try to find chat by booking ID
      loadChatByBookingId();
    } else {
      console.error('No chatId or bookingId provided');
      Alert.alert('Error', 'Invalid chat parameters');
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/chat' as any);
      }
    }
  }, [chatId, bookingId]);

  const loadChat = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      if (!chatId) {
        throw new Error('Chat ID is required');
      }

      const response = await apiService.getChat(chatId as string);
      
      if (response.success && response.data) {
        console.log('Chat loaded successfully:', {
          chatId: response.data._id,
          messageCount: response.data.messages?.length || 0,
          participants: response.data.participants
        });

        // Set the chat data directly from the API
        setChat(response.data);
        
        // Process and set messages
        const processedMessages = (response.data.messages || []).map((msg: any) => ({
          _id: msg._id,
          senderId: msg.senderId,
          messageType: msg.messageType || 'text',
          content: msg.content || {},
          timestamp: msg.timestamp,
          readBy: msg.readBy,
          isRead: msg.readBy?.some((r: any) => r.userId === user?.id) || false,
          senderName: msg.senderName || 'Unknown'
        }));
        
        console.log('Processed messages:', processedMessages);
        setMessages(processedMessages);
        
        // Set other participant name from the response
        if (!otherParticipantName && !stylistName && response.data.participants) {
          const otherParticipant = response.data.participants.find(
            (p: any) => p.userId._id !== user?.id
          );
          if (otherParticipant) {
            setOtherParticipant(otherParticipant.userId.name);
          }
        }
        
        // Mark chat as read
        await apiService.markChatAsRead(chatId as string);
      } else {
        throw new Error('Failed to load chat');
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      Alert.alert('Error', 'Failed to load chat. Please try again.');
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/chat' as any);
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const loadChatByBookingId = async () => {
    try {
      setLoading(true);
      // In a real implementation, you would find the chat by booking ID
      // For now, use the same placeholder approach
      await loadChat(false); // Don't double-set loading
    } catch (error) {
      console.error('Failed to load chat by booking ID:', error);
      Alert.alert('Error', 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sendingMessage || !chat) return;

    const messageText = newMessage.trim();
    const tempMessage: ChatMessage = {
      _id: `temp_${Date.now()}`,
      senderId: user?.id || '',
      messageType: 'text',
      content: { text: messageText },
      timestamp: new Date().toISOString(),
      isRead: false,
      senderName: user?.name || 'You'
    };
    
    // Add optimistic message immediately
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage(''); // Clear input immediately
    
    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    try {
      setSendingMessage(true);
      
      console.log('Sending message:', messageText);
      
      // Send message to backend
      const response = await apiService.sendMessage(chat._id, messageText, 'text');
      
      if (response.success) {
        console.log('Message sent successfully, reloading chat');
        // Remove temp message and reload to get real messages
        setMessages(prev => prev.filter(m => m._id !== tempMessage._id));
        await loadChat();
      } else {
        console.error('Failed to send message:', response);
        // Remove temp message and restore input on failure
        setMessages(prev => prev.filter(m => m._id !== tempMessage._id));
        setNewMessage(messageText); 
        Alert.alert('Error', 'Failed to send message. Please try again.');
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove temp message and restore input on error
      setMessages(prev => prev.filter(m => m._id !== tempMessage._id));
      setNewMessage(messageText);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwnMessage = item.senderId === user?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        {item.messageType === 'system' ? (
          <View style={styles.systemMessage}>
            <Text style={styles.systemMessageText}>{item.content.text}</Text>
          </View>
        ) : (
          <View style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
          ]}>
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText
            ]}>
              {item.content.text}
            </Text>
            <Text style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
            ]}>
              {new Date(item.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)/chat' as any);
          }
        }}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
      </TouchableOpacity>
      
      <View style={styles.headerInfo}>
        <Text style={styles.headerTitle}>{otherParticipant}</Text>
        <Text style={styles.headerSubtitle}>
          {chat?.bookingId ? 'Booking Chat' : 'Direct Message'}
        </Text>
      </View>

      <TouchableOpacity style={styles.headerAction}>
        <Ionicons name="information-circle-outline" size={24} color={COLORS.TEXT_SECONDARY} />
      </TouchableOpacity>
    </View>
  );

  const renderMessageInput = () => (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.textInput}
        value={newMessage}
        onChangeText={setNewMessage}
        placeholder="Type a message..."
        placeholderTextColor={COLORS.TEXT_SECONDARY}
        multiline
        maxLength={1000}
      />
      <TouchableOpacity
        style={[
          styles.sendButton,
          (!newMessage.trim() || sendingMessage) && styles.sendButtonDisabled
        ]}
        onPress={sendMessage}
        disabled={!newMessage.trim() || sendingMessage}
      >
        {sendingMessage ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="send" size={20} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    console.log('🔄 Chat screen showing loading state');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading chat...</Text>
        {/* Debug info */}
        <Text style={{ marginTop: 10, fontSize: 12, color: 'gray' }}>
          Chat ID: {chatId || 'None'}
        </Text>
        <Text style={{ fontSize: 12, color: 'gray' }}>
          Participant: {otherParticipantName || 'None'}
        </Text>
      </View>
    );
  }

  console.log('✅ Chat screen rendering main content');

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {renderHeader()}
      
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-outline" size={48} color={COLORS.TEXT_SECONDARY} />
            <Text style={styles.emptyStateText}>No messages yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start the conversation by sending a message
            </Text>
          </View>
        }
      />
      
      {renderMessageInput()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingText: {
    marginTop: SPACING.MD,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingTop: Platform.OS === 'ios' ? 60 : SPACING.MD,
  },
  backButton: {
    padding: SPACING.SM,
    marginRight: SPACING.SM,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  headerAction: {
    padding: SPACING.SM,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: SPACING.LG,
    flexGrow: 1,
  },
  messageContainer: {
    marginVertical: SPACING.XS,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: SPACING.MD,
    borderRadius: 16,
  },
  ownMessageBubble: {
    backgroundColor: COLORS.PRIMARY,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#f1f1f1',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: FONT_SIZES.MD,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: COLORS.TEXT_PRIMARY,
  },
  messageTime: {
    fontSize: FONT_SIZES.XS,
    marginTop: SPACING.XS,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherMessageTime: {
    color: COLORS.TEXT_SECONDARY,
  },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 12,
    marginVertical: SPACING.SM,
  },
  systemMessageText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    maxHeight: 100,
    marginRight: SPACING.SM,
  },
  sendButton: {
    backgroundColor: COLORS.PRIMARY,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.TEXT_SECONDARY,
    opacity: 0.5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.MD,
  },
  emptyStateSubtext: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: SPACING.SM,
  },
});