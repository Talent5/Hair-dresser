import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.lg * 3) / 2;

interface StylistWithPortfolio {
  _id: string;
  user: {
    name: string;
    avatar?: string;
    location?: {
      address: string;
    };
  };
  rating: number;
  reviewCount: number;
  portfolio: Array<{
    _id: string;
    imageUrl: string;
    thumbnailUrl?: string;
    caption?: string;
    service?: string;
  }>;
  specialties: string[];
  completedBookings: number;
}

export default function DiscoverStylists() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [stylists, setStylists] = useState<StylistWithPortfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { label: 'All', value: 'all', icon: 'grid-outline' },
    { label: 'Braids', value: 'braids', icon: 'cut-outline' },
    { label: 'Weaves', value: 'weaves', icon: 'brush-outline' },
    { label: 'Natural', value: 'natural_hair', icon: 'leaf-outline' },
    { label: 'Color', value: 'color', icon: 'color-palette-outline' },
    { label: 'Locs', value: 'locs', icon: 'infinite-outline' },
  ];

  useEffect(() => {
    loadStylists();
  }, [selectedCategory]);

  const loadStylists = async () => {
    try {
      setIsLoading(true);
      
      // Get current location
      const location = user?.location?.coordinates || [31.0492, -17.8252]; // Default to Harare
      
      // Search for stylists with portfolio images
      const response = await api.searchStylists(
        { latitude: location[1], longitude: location[0] },
        {
          radius: 50, // Search within 50km
          serviceType: selectedCategory !== 'all' ? selectedCategory : undefined,
        }
      );

      if (response.success && response.data?.stylists) {
        // Filter stylists who have portfolio images
        const stylistsWithPortfolio = response.data.stylists.filter(
          (s: any) => s.portfolio && s.portfolio.length > 0
        );
        setStylists(stylistsWithPortfolio);
      }
    } catch (error) {
      console.error('Error loading stylists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadStylists();
    setIsRefreshing(false);
  };

  const renderStylistCard = ({ item }: { item: StylistWithPortfolio }) => {
    const mainImage = item.portfolio[0];
    const portfolioCount = item.portfolio.length;

    return (
      <TouchableOpacity
        style={styles.stylistCard}
        onPress={() => router.push(`/stylist-profile?stylistId=${item._id}`)}
        activeOpacity={0.8}
      >
        {/* Portfolio Preview */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: mainImage.thumbnailUrl || mainImage.imageUrl }}
            style={styles.cardImage}
            resizeMode="cover"
          />
          
          {/* Portfolio Count Badge */}
          <View style={styles.portfolioBadge}>
            <Ionicons name="images-outline" size={12} color={COLORS.WHITE} />
            <Text style={styles.portfolioCount}>{portfolioCount}</Text>
          </View>

          {/* Rating Badge */}
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#FFA500" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        </View>

        {/* Stylist Info */}
        <View style={styles.cardInfo}>
          <View style={styles.stylistHeader}>
            {item.user.avatar ? (
              <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {item.user.name.charAt(0)}
                </Text>
              </View>
            )}
            <View style={styles.stylistNameContainer}>
              <Text style={styles.stylistName} numberOfLines={1}>
                {item.user.name}
              </Text>
              <Text style={styles.bookingsText}>
                {item.completedBookings} bookings
              </Text>
            </View>
          </View>

          {/* Specialties */}
          {item.specialties && item.specialties.length > 0 && (
            <View style={styles.specialtiesContainer}>
              <Text style={styles.specialtyTag} numberOfLines={1}>
                {item.specialties.slice(0, 2).join(', ')}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.title}>Discover Stylists</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Category Filter */}
      <View style={styles.categoriesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.value}
              style={[
                styles.categoryChip,
                selectedCategory === category.value && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category.value)}
            >
              <Ionicons
                name={category.icon as any}
                size={18}
                color={
                  selectedCategory === category.value
                    ? COLORS.WHITE
                    : COLORS.TEXT_SECONDARY
                }
              />
              <Text
                style={[
                  styles.categoryLabel,
                  selectedCategory === category.value && styles.categoryLabelActive,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Stylists Grid */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Finding stylists...</Text>
        </View>
      ) : (
        <FlatList
          data={stylists}
          renderItem={renderStylistCard}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={64} color={COLORS.TEXT_SECONDARY} />
              <Text style={styles.emptyText}>No stylists found</Text>
              <Text style={styles.emptySubtext}>
                Try adjusting your filters or check back later
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  backButton: {
    padding: SPACING.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  categoriesSection: {
    backgroundColor: COLORS.WHITE,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  categoriesContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.BACKGROUND,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    gap: SPACING.xs,
  },
  categoryChipActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
  },
  categoryLabelActive: {
    color: COLORS.WHITE,
  },
  gridContent: {
    padding: SPACING.md,
  },
  gridRow: {
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  stylistCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 1.2,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  portfolioBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  portfolioCount: {
    color: COLORS.WHITE,
    fontSize: 11,
    fontWeight: '600',
  },
  ratingBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  ratingText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 11,
    fontWeight: '700',
  },
  cardInfo: {
    padding: SPACING.sm,
  },
  stylistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: SPACING.xs,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  avatarText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: 'bold',
  },
  stylistNameContainer: {
    flex: 1,
  },
  stylistName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  bookingsText: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
  },
  specialtiesContainer: {
    marginTop: SPACING.xs,
  },
  specialtyTag: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
    paddingHorizontal: SPACING.lg,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});
