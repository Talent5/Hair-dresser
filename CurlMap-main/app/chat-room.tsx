import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { Chat, ChatMessage, MessageDeliveryStatus } from '@/types';
import apiService from '@/services/api';

// Message Status Indicator Component
const MessageStatusIndicator = ({ status, isOwnMessage }: { status?: MessageDeliveryStatus, isOwnMessage: boolean }) => {
  if (!isOwnMessage || !status) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <ActivityIndicator size={12} color="rgba(255, 255, 255, 0.6)" />;
      case 'sent':
        return <Ionicons name="checkmark" size={14} color="rgba(255, 255, 255, 0.6)" />;
      case 'delivered':
        return (
          <View style={styles.doubleCheck}>
            <Ionicons name="checkmark" size={14} color="rgba(255, 255, 255, 0.6)" style={styles.checkmark1} />
            <Ionicons name="checkmark" size={14} color="rgba(255, 255, 255, 0.6)" style={styles.checkmark2} />
          </View>
        );
      case 'read':
        return (
          <View style={styles.doubleCheck}>
            <Ionicons name="checkmark" size={14} color="#4FC3F7" style={styles.checkmark1} />
            <Ionicons name="checkmark" size={14} color="#4FC3F7" style={styles.checkmark2} />
          </View>
        );
      case 'failed':
        return <Ionicons name="warning" size={14} color="#FF5252" />;
      default:
        return null;
    }
  };

  return <View style={styles.statusIndicator}>{getStatusIcon()}</View>;
};

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
    userId: user?.id,
    userName: user?.name,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    console.log('=== CHAT SCREEN MOUNT ===');
    console.log('Chat screen mounted with params:', { 
      chatId,
      bookingId,
      otherParticipantName,
      stylistName
    });
    
    if (chatId) {
      loadChat(true); // Initial load
      const pollInterval = setInterval(() => loadChat(false), 5000); // Increased poll interval
      
      const loadingTimeout = setTimeout(() => {
        if (loading) {
          console.log('⚠️ Chat loading timed out, setting loading to false');
          setLoading(false);
        }
      }, 10000);
      
      return () => {
        clearInterval(pollInterval);
        clearTimeout(loadingTimeout);
      };
    } else if (bookingId) {
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
  }, [chatId, bookingId, loadChat, loadChatByBookingId]);

  const loadChat = useCallback(async (showLoading = true) => {
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

        setChat(response.data);
        
        const processedMessages = (response.data.messages || []).map((msg: any) => {
          const isOwnMessage = String(msg.senderId) === String(user?.id);
          console.log('Processing message:', {
            msgId: msg._id,
            msgSenderId: msg.senderId,
            msgSenderIdType: typeof msg.senderId,
            currentUserId: user?.id,
            currentUserIdType: typeof user?.id,
            isOwnMessage: isOwnMessage
          });
          
          let messageStatus = msg.messageStatus;
          
          if (!messageStatus && isOwnMessage) {
            const hasBeenRead = msg.readBy?.some((r: any) => r.userId !== user?.id);
            if (hasBeenRead) {
              messageStatus = { status: 'read' };
            } else {
              messageStatus = { status: 'delivered' };
            }
          }
          
          return {
            _id: msg._id,
            senderId: msg.senderId,
            messageType: msg.messageType || 'text',
            content: msg.content || {},
            timestamp: msg.timestamp,
            readBy: msg.readBy,
            isRead: msg.readBy?.some((r: any) => r.userId === user?.id) || false,
            senderName: msg.senderName || 'Unknown',
            messageStatus: messageStatus
          };
        });
        
        console.log('Processed messages:', processedMessages);
        
        if (showLoading) {
          setMessages(processedMessages);
        } else {
          setMessages(prevMessages => {
            const keepTempMessages = prevMessages.filter(msg => 
              msg._id.startsWith('temp_') && 
              (!msg.messageStatus || ['sending', 'failed'].includes(msg.messageStatus.status))
            );
            
            const allMessages = [...keepTempMessages, ...processedMessages];
            const uniqueMessages = allMessages.filter((msg, index, arr) => 
              arr.findIndex(m => m._id === msg._id) === index
            );
            
            return uniqueMessages.sort((a, b) => 
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
          });
        }
        
        if (!otherParticipantName && !stylistName && response.data.participants) {
          const otherParticipant = response.data.participants.find(
            (p: any) => p.userId._id !== user?.id
          );
          if (otherParticipant) {
            setOtherParticipant(otherParticipant.userId.name);
          }
        }
        
        await apiService.markChatAsRead(chatId as string);
      } else {
        throw new Error('Failed to load chat');
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      // Only navigate on error during initial load. For polls, fail silently.
      if (showLoading) {
        Alert.alert('Error', 'Failed to load chat. Please try again.');
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)/chat' as any);
        }
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [chatId, user?.id, otherParticipantName, stylistName, router]);

  const loadChatByBookingId = useCallback(async () => {
    try {
      setLoading(true);
      // This logic is a placeholder. In a real app, you'd have an endpoint
      // to find/create a chat by bookingId and participant IDs.
      // For now, we assume it might eventually find a chat and call loadChat.
      // Since we can't proceed without a chatId, we'll show an error for now.
      console.error('loadChatByBookingId is not fully implemented');
      Alert.alert('Not Implemented', 'Finding chats by booking ID is not yet supported.');
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)/chat' as any);
      
    } catch (error) {
      console.error('Failed to load chat by booking ID:', error);
      Alert.alert('Error', 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || sendingMessage || !chat) return;

    const messageText = newMessage.trim();
    const tempMessage: ChatMessage = {
      _id: `temp_${Date.now()}`,
      senderId: user?.id || '',
      messageType: 'text',
      content: { text: messageText },
      timestamp: new Date().toISOString(),
      isRead: false,
      senderName: user?.name || 'You',
      messageStatus: { status: 'sending' }
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    
    try {
      setSendingMessage(true);
      
      const response = await apiService.sendMessage(chat._id, messageText, 'text');
      
      if (response.success) {
        setMessages(prev => prev.map(m => 
          m._id === tempMessage._id 
            ? { ...m, messageStatus: { status: 'sent' } }
            : m
        ));
        
        setTimeout(() => {
          setMessages(prev => prev.map(m => 
            m._id === tempMessage._id 
              ? { ...m, messageStatus: { status: 'delivered' } }
              : m
          ));
        }, 500);
        
        setTimeout(() => loadChat(false), 1500);
      } else {
        throw new Error(response.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.map(m => 
        m._id === tempMessage._id 
          ? { ...m, messageStatus: { status: 'failed', failureReason: 'Send failed' } }
          : m
      ));
      setNewMessage(messageText); 
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  }, [newMessage, sendingMessage, chat, user, loadChat]);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    // More robust comparison to handle different ID formats
    const isOwnMessage = String(item.senderId) === String(user?.id);
    
    // Debug logging
    console.log('Rendering message:', {
      messageId: item._id,
      senderId: item.senderId,
      senderIdType: typeof item.senderId,
      userId: user?.id,
      userIdType: typeof user?.id,
      isOwnMessage: isOwnMessage,
      messageStatus: item.messageStatus?.status,
      messageContent: item.content.text?.substring(0, 20)
    });
    
    if (item.messageType === 'system') {
      return (
        <View style={styles.systemMessageContainer}>
          <View style={styles.systemMessage}>
            <Text style={styles.systemMessageText}>{item.content.text}</Text>
          </View>
        </View>
      );
    }

    const formatTime = (timestamp: string) => {
      const date = new Date(timestamp);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      
      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    };

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
        ]}>
          {/* Message content */}
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.content.text}
          </Text>
          
          {/* Message footer with time and status */}
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
            ]}>
              {formatTime(item.timestamp)}
            </Text>
            
            {/* Status indicator for own messages */}
            <MessageStatusIndicator 
              status={item.messageStatus?.status} 
              isOwnMessage={isOwnMessage} 
            />
          </View>
        </View>
        
        {/* Message tail (small triangle pointing to sender) */}
        <View style={[
          styles.messageTail,
          isOwnMessage ? styles.ownMessageTail : styles.otherMessageTail
        ]} />
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
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
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
    borderBottomColor: '#E8EAED',
    paddingTop: Platform.OS === 'ios' ? 60 : SPACING.MD,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  headerAction: {
    padding: SPACING.SM,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: SPACING.MD,
    flexGrow: 1,
  },
  
  // Message container styles
  messageContainer: {
    marginVertical: 2,
    paddingHorizontal: 4,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  
  // System message styles
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: SPACING.MD,
  },
  systemMessage: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 16,
    maxWidth: '70%',
  },
  systemMessageText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Message bubble styles
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    position: 'relative',
  },
  ownMessageBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 6,
    marginRight: 8,
  },
  otherMessageBubble: {
    backgroundColor: '#E9ECEF',
    borderBottomLeftRadius: 6,
    marginLeft: 8,
  },
  
  // Message tail (speech bubble pointer)
  messageTail: {
    position: 'absolute',
    bottom: 0,
    width: 0,
    height: 0,
  },
  ownMessageTail: {
    right: 0,
    borderLeftWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderBottomColor: '#007AFF',
  },
  otherMessageTail: {
    left: 0,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderRightColor: 'transparent',
    borderBottomColor: '#E9ECEF',
  },
  
  // Message text styles
  messageText: {
    fontSize: FONT_SIZES.MD,
    lineHeight: 22,
    marginBottom: 4,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#1A1A1A',
  },
  
  // Message footer (time + status)
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    fontWeight: '400',
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherMessageTime: {
    color: 'rgba(26, 26, 26, 0.6)',
  },
  
  // Status indicator styles
  statusIndicator: {
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doubleCheck: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkmark1: {
    marginRight: -8,
  },
  checkmark2: {
    marginLeft: -8,
  },
  
  // Input container styles
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E8EAED',
    minHeight: 70,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    maxHeight: 120,
    marginRight: SPACING.SM,
    backgroundColor: '#F9FAFB',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
    elevation: 0,
    shadowOpacity: 0,
  },
  
  // Empty state styles
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
    paddingHorizontal: SPACING.XL,
  },
});