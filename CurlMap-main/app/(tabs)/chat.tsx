import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import apiService from '@/services/api';

interface ChatListItem {
  _id: string;
  participants: Array<{
    userId: {
      _id: string;
      name: string;
      avatar?: string;
    };
    role: 'customer' | 'stylist';
  }>;
  lastMessage?: {
    content: {
      text?: string;
    };
    timestamp: string;
    senderId: string;
  };
  lastActivity: string;
  unreadCounts: {
    customer: number;
    stylist: number;
  };
}

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const response = await apiService.getChats();
      
      if (response.success && response.data) {
        console.log('Chats loaded:', response.data);
        // Map the API response to our ChatListItem interface
        const mappedChats: ChatListItem[] = response.data.map((chat: any) => ({
          _id: chat._id,
          participants: chat.participants || [],
          lastMessage: chat.lastMessage || chat.messages?.[chat.messages?.length - 1],
          lastActivity: chat.lastActivity || chat.updatedAt || new Date().toISOString(),
          unreadCounts: chat.unreadCounts || { customer: 0, stylist: 0 }
        }));
        setChats(mappedChats);
      } else {
        console.error('Failed to load chats:', response);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      Alert.alert('Error', 'Failed to load chats. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  const getOtherParticipant = (chat: ChatListItem) => {
    return chat.participants.find(p => p.userId._id !== user?.id);
  };

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getUnreadCount = (chat: ChatListItem) => {
    const userRole = chat.participants.find(p => p.userId._id === user?.id)?.role;
    return userRole ? chat.unreadCounts[userRole] : 0;
  };

  const handleChatPress = async (chat: ChatListItem) => {
    // Prevent multiple navigation attempts
    if (navigating) {
      console.log('Navigation already in progress, ignoring');
      return;
    }

    const otherParticipant = getOtherParticipant(chat);
    
    console.log('=== CHAT PRESS DEBUG ===');
    console.log('Chat ID:', chat._id);
    console.log('Other participant name:', otherParticipant?.userId.name);
    
    try {
      setNavigating(true);
      
      // Prepare navigation data
      const navigationData = {
        chatId: chat._id,
        otherParticipantName: otherParticipant?.userId.name || 'Unknown'
      };
      
      console.log('Navigating to chat:', navigationData);
      
      // Use the new chat-room route to avoid conflicts
      console.log('Attempting navigation to /chat-room...');
      
      router.push({
        pathname: '/chat-room' as any,
        params: {
          chatId: String(chat._id),
          otherParticipantName: String(otherParticipant?.userId.name || 'Unknown')
        }
      });
      
      console.log('Navigation attempt completed');
      
      console.log('Navigation push completed');
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', `Failed to open chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Reset navigation state after a delay to prevent rapid multiple taps
      setTimeout(() => setNavigating(false), 1000);
    }
  };

  const renderChatItem = (chat: ChatListItem) => {
    const otherParticipant = getOtherParticipant(chat);
    const unreadCount = getUnreadCount(chat);
    const lastMessage = chat.lastMessage;

    return (
      <TouchableOpacity
        key={chat._id}
        style={[styles.chatItem, navigating && styles.chatItemDisabled]}
        onPress={() => handleChatPress(chat)}
        disabled={navigating}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {otherParticipant?.userId.name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>
              {otherParticipant?.userId.name || 'Unknown'}
            </Text>
            <Text style={styles.chatTime}>
              {formatLastMessageTime(lastMessage?.timestamp || chat.lastActivity)}
            </Text>
          </View>
          
          <Text style={styles.lastMessage} numberOfLines={2}>
            {lastMessage?.content.text || 'No messages yet'}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT_SECONDARY} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Messages" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Loading chats...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Messages" />
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {chats.length === 0 ? (
          <View style={styles.placeholder}>
            <Ionicons name="chatbubbles-outline" size={64} color={COLORS.TEXT_SECONDARY} />
            <Text style={styles.placeholderText}>No conversations yet</Text>
            <Text style={styles.placeholderSubtext}>
              Start a conversation by visiting a stylist's profile and tapping "Message"
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.title}>Your Conversations</Text>
            <View style={styles.chatsList}>
              {chats.map(renderChatItem)}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {
    flex: 1,
    padding: SPACING.LG,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },
  loadingText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.MD,
  },
  title: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.LG,
  },
  chatsList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.MD,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: SPACING.SM,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chatItemDisabled: {
    opacity: 0.6,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.MD,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: '#fff',
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  unreadText: {
    fontSize: FONT_SIZES.XS,
    fontWeight: 'bold',
    color: '#fff',
  },
  chatInfo: {
    flex: 1,
    marginRight: SPACING.SM,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  chatName: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  chatTime: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  lastMessage: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },
  placeholder: {
    alignItems: 'center',
    paddingVertical: SPACING.XXL * 2,
  },
  placeholderText: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.LG,
    marginBottom: SPACING.SM,
  },
  placeholderSubtext: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    paddingHorizontal: SPACING.LG,
    lineHeight: 22,
  },
});