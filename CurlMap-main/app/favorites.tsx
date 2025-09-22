import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AuthContext from '../contexts/AuthContext';
import api from '../services/api';

interface FavoriteStylist {
  id: string;
  stylistId: string;
  name: string;
  businessName?: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  specialties: string[];
  location: {
    address: string;
    distance?: number;
  };
  pricing: {
    minPrice: number;
    maxPrice: number;
  };
  isAvailable: boolean;
  lastBookedAt?: string;
  notes?: string;
  category?: string;
  addedAt: string;
}

const FavoritesScreen = () => {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const [favorites, setFavorites] = useState<FavoriteStylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const categories = [
    { id: 'all', name: 'All', icon: 'apps-outline' },
    { id: 'braids', name: 'Braids', icon: 'leaf-outline' },
    { id: 'natural', name: 'Natural', icon: 'flower-outline' },
    { id: 'cuts', name: 'Cuts', icon: 'cut-outline' },
    { id: 'color', name: 'Color', icon: 'color-palette-outline' },
    { id: 'recent', name: 'Recent', icon: 'time-outline' },
  ];

  const fetchFavorites = async () => {
    try {
      const response = await api.getFavorites();
      setFavorites(response.data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      Alert.alert('Error', 'Failed to load favorites');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFavorites();
  };

  const handleRemoveFavorite = async (stylistId: string) => {
    Alert.alert(
      'Remove Favorite',
      'Are you sure you want to remove this stylist from your favorites?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.removeFavorite(stylistId);
              setFavorites(prev => prev.filter(fav => fav.stylistId !== stylistId));
            } catch (error) {
              Alert.alert('Error', 'Failed to remove favorite');
            }
          },
        },
      ]
    );
  };

  const handleAddNote = (stylistId: string) => {
    Alert.prompt(
      'Add Note',
      'Add a personal note about this stylist:',
      async (note) => {
        if (note) {
          try {
            await api.updateFavoriteNote(stylistId, note);
            setFavorites(prev =>
              prev.map(fav =>
                fav.stylistId === stylistId ? { ...fav, notes: note } : fav
              )
            );
          } catch (error) {
            Alert.alert('Error', 'Failed to add note');
          }
        }
      }
    );
  };

  const handleBookStylist = (stylistId: string) => {
    router.push({
      pathname: '/stylist-profile',
      params: { stylistId },
    });
  };

  const handleChatStylist = (stylistId: string) => {
    router.push({
      pathname: '/chat-room',
      params: { userId: stylistId },
    });
  };

  const filteredFavorites = favorites.filter(favorite => {
    const matchesSearch = favorite.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         favorite.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         favorite.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
                           (selectedCategory === 'recent' && favorite.lastBookedAt) ||
                           favorite.category === selectedCategory ||
                           favorite.specialties.some(s => s.toLowerCase().includes(selectedCategory));
    
    return matchesSearch && matchesCategory;
  });

  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    return distance < 1 ? `${Math.round(distance * 1000)}m away` : `${distance.toFixed(1)}km away`;
  };

  const formatLastBooked = (dateString?: string) => {
    if (!dateString) return 'Never booked';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const renderCategoryFilter = () => (
    <View style={styles.categoryContainer}>
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === item.id && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(item.id)}
          >
            <Ionicons
              name={item.icon as any}
              size={16}
              color={selectedCategory === item.id ? '#ffffff' : '#667eea'}
            />
            <Text style={[
              styles.categoryText,
              selectedCategory === item.id && styles.categoryTextActive
            ]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.categoryList}
      />
    </View>
  );

  const renderFavoriteItem = ({ item }: { item: FavoriteStylist }) => (
    <View style={styles.favoriteCard}>
      <View style={styles.favoriteHeader}>
        <View style={styles.stylistInfo}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.stylistDetails}>
            <Text style={styles.stylistName}>{item.name}</Text>
            {item.businessName && (
              <Text style={styles.businessName}>{item.businessName}</Text>
            )}
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#fbbf24" />
              <Text style={styles.rating}>
                {(() => {
                  const rating = item.rating;
                  if (typeof rating === 'object' && rating && 'average' in rating) {
                    return ((rating as any).average || 0).toFixed(1);
                  }
                  return (rating || 0).toFixed(1);
                })()} ({(() => {
                  const rating = item.rating;
                  if (typeof rating === 'object' && rating && 'count' in rating) {
                    return (rating as any).count || 0;
                  }
                  return item.reviewCount || 0;
                })()} reviews)
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.favoriteActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleRemoveFavorite(item.stylistId)}
          >
            <Ionicons name="heart" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.favoriteBody}>
        <View style={styles.specialtiesContainer}>
          {item.specialties.slice(0, 3).map((specialty, index) => (
            <View key={index} style={styles.specialtyChip}>
              <Text style={styles.specialtyText}>{specialty}</Text>
            </View>
          ))}
          {item.specialties.length > 3 && (
            <Text style={styles.moreSpecialties}>+{item.specialties.length - 3} more</Text>
          )}
        </View>

        <View style={styles.detailsRow}>
          <Text style={styles.price}>
            ${item.pricing.minPrice} - ${item.pricing.maxPrice}
          </Text>
          <Text style={styles.distance}>
            {formatDistance(item.location.distance)}
          </Text>
        </View>

        <Text style={styles.lastBooked}>
          Last booked: {formatLastBooked(item.lastBookedAt)}
        </Text>

        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Your note:</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}
      </View>

      <View style={styles.favoriteFooter}>
        <TouchableOpacity
          style={[styles.actionButtonLarge, styles.bookButton]}
          onPress={() => handleBookStylist(item.stylistId)}
        >
          <Ionicons name="calendar-outline" size={16} color="#ffffff" />
          <Text style={styles.actionButtonText}>Book Now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButtonLarge, styles.chatButton]}
          onPress={() => handleChatStylist(item.stylistId)}
        >
          <Ionicons name="chatbubble-outline" size={16} color="#667eea" />
          <Text style={[styles.actionButtonText, styles.chatButtonText]}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButtonLarge, styles.noteButton]}
          onPress={() => handleAddNote(item.stylistId)}
        >
          <Ionicons name="create-outline" size={16} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="heart-outline" size={64} color="#d1d5db" />
      <Text style={styles.emptyTitle}>No Favorites Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start adding stylists to your favorites to see them here
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => router.push('/(tabs)/search')}
      >
        <Text style={styles.exploreButtonText}>Explore Stylists</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading favorites...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)' as any);
            }
          }}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.title}>My Favorites</Text>
          <TouchableOpacity
            onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          >
            <Ionicons 
              name={viewMode === 'list' ? 'grid-outline' : 'list-outline'} 
              size={24} 
              color="#667eea" 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search favorites..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {renderCategoryFilter()}

      <FlatList
        data={filteredFavorites}
        renderItem={renderFavoriteItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#667eea']}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1f2937',
  },
  categoryContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoryList: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  categoryChipActive: {
    backgroundColor: '#667eea',
  },
  categoryText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    padding: 16,
  },
  favoriteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  favoriteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stylistInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stylistDetails: {
    flex: 1,
  },
  stylistName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  businessName: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
    color: '#6b7280',
  },
  favoriteActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
  },
  favoriteBody: {
    marginBottom: 16,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  specialtyChip: {
    backgroundColor: '#ede9fe',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  specialtyText: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '500',
  },
  moreSpecialties: {
    fontSize: 12,
    color: '#6b7280',
    alignSelf: 'center',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  distance: {
    fontSize: 14,
    color: '#6b7280',
  },
  lastBooked: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  notesContainer: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 18,
  },
  favoriteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  bookButton: {
    backgroundColor: '#667eea',
  },
  chatButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#667eea',
  },
  noteButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d1d5db',
    flex: 0,
    paddingHorizontal: 12,
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  chatButtonText: {
    color: '#667eea',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  exploreButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
});

export default FavoritesScreen;