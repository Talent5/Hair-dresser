import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING } from '../constants';
import RatingSummary from '../components/RatingSummary';
import RatingDisplay from '../components/RatingDisplay';
import { apiService } from '../services/api';

// Example: How to View Ratings
export default function ViewRatingsExample() {
  const router = useRouter();
  const [stylists, setStylists] = useState([]);
  const [selectedStylist, setSelectedStylist] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [ratingStats, setRatingStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadStylists();
  }, []);

  const loadStylists = async () => {
    try {
      const response = await apiService.searchStylists({
        location: { latitude: -17.8252, longitude: 31.0335 }, // Harare coordinates
        radius: 10
      });
      setStylists(response.data);
    } catch (error) {
      console.error('Error loading stylists:', error);
    }
  };

  const viewStylistRatings = async (stylist) => {
    try {
      setSelectedStylist(stylist);
      
      // Load ratings and statistics
      const [ratingsResponse, statsResponse] = await Promise.all([
        apiService.getStylistRatings(stylist._id),
        apiService.getStylistRatingStats(stylist._id)
      ]);
      
      setRatings(ratingsResponse);
      setRatingStats(statsResponse);
    } catch (error) {
      console.error('Error loading ratings:', error);
    }
  };

  const handleVoteHelpful = async (ratingId, helpful) => {
    try {
      await apiService.voteRatingHelpful(ratingId, helpful);
      // Refresh ratings
      if (selectedStylist) {
        const ratingsResponse = await apiService.getStylistRatings(selectedStylist._id);
        setRatings(ratingsResponse);
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const renderStylistCard = (stylist) => (
    <TouchableOpacity
      key={stylist._id}
      style={styles.stylistCard}
      onPress={() => viewStylistRatings(stylist)}
    >
      <View style={styles.stylistInfo}>
        <Text style={styles.stylistName}>{stylist.user?.name || 'Stylist'}</Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={16} color={COLORS.WARNING} />
          <Text style={styles.ratingText}>
            {typeof stylist.rating === 'object' ? 
              (stylist.rating?.average || 0).toFixed(1) : 
              (stylist.rating || 0).toFixed(1)
            }
          </Text>
          <Text style={styles.reviewCount}>
            ({typeof stylist.rating === 'object' ? 
              stylist.rating?.count || 0 : 
              stylist.reviewCount || 0} reviews)
          </Text>
        </View>
        <Text style={styles.specialties}>
          {stylist.specialties?.slice(0, 2).join(', ') || 'Hair Specialist'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.GRAY_400} />
    </TouchableOpacity>
  );

  const renderRatingsView = () => (
    <ScrollView style={styles.ratingsContainer}>
      {/* Header */}
      <View style={styles.ratingsHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedStylist(null)}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.PRIMARY} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {selectedStylist?.user?.name || 'Stylist'} Reviews
          </Text>
          <Text style={styles.headerSubtitle}>
            {ratings.length} review{ratings.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Rating Summary */}
      {ratingStats && (
        <View style={styles.summaryContainer}>
          <RatingSummary
            averageRating={ratingStats.averageRating}
            totalRatings={ratingStats.totalRatings}
            ratingBreakdown={ratingStats.ratingBreakdown}
            categoryAverages={ratingStats.categoryAverages}
            satisfactionRate={ratingStats.satisfactionRate}
            showDetailed={true}
          />
        </View>
      )}

      {/* Individual Ratings */}
      <View style={styles.ratingsListContainer}>
        <Text style={styles.sectionTitle}>Customer Reviews</Text>
        {ratings.length === 0 ? (
          <View style={styles.emptyRatings}>
            <Text style={styles.emptyText}>No reviews yet</Text>
            <Text style={styles.emptySubtext}>
              Be the first to leave a review!
            </Text>
          </View>
        ) : (
          ratings.map((rating, index) => (
            <View key={rating._id} style={styles.ratingItem}>
              <RatingDisplay
                rating={rating}
                onVoteHelpful={handleVoteHelpful}
                showStylistResponse={true}
              />
              {index < ratings.length - 1 && (
                <View style={styles.ratingDivider} />
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  const filteredStylists = stylists.filter(stylist =>
    stylist.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stylist.specialties?.some(specialty =>
      specialty.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (selectedStylist) {
    return renderRatingsView();
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stylist Ratings & Reviews</Text>
        <Text style={styles.subtitle}>
          Find the best stylists based on customer feedback
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={COLORS.GRAY_500} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stylists or specialties..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Stylists List */}
      <View style={styles.stylistsList}>
        <Text style={styles.sectionTitle}>
          Available Stylists ({filteredStylists.length})
        </Text>
        {filteredStylists.map(renderStylistCard)}
      </View>

      {/* Rating Guide */}
      <View style={styles.guideSection}>
        <Text style={styles.guideTitle}>🌟 How to Read Ratings</Text>
        <View style={styles.guideContent}>
          <View style={styles.guideItem}>
            <Text style={styles.guideLabel}>⭐⭐⭐⭐⭐ (4.5+)</Text>
            <Text style={styles.guideText}>Excellent - Highly recommended</Text>
          </View>
          <View style={styles.guideItem}>
            <Text style={styles.guideLabel}>⭐⭐⭐⭐ (4.0-4.4)</Text>
            <Text style={styles.guideText}>Very Good - Great choice</Text>
          </View>
          <View style={styles.guideItem}>
            <Text style={styles.guideLabel}>⭐⭐⭐ (3.0-3.9)</Text>
            <Text style={styles.guideText}>Good - Solid option</Text>
          </View>
          <View style={styles.guideItem}>
            <Text style={styles.guideLabel}>⭐⭐ (2.0-2.9)</Text>
            <Text style={styles.guideText}>Fair - Consider carefully</Text>
          </View>
          <View style={styles.guideItem}>
            <Text style={styles.guideLabel}>⭐ (Below 2.0)</Text>
            <Text style={styles.guideText}>Poor - Look for alternatives</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    backgroundColor: COLORS.WHITE,
    padding: SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.GRAY_600,
    textAlign: 'center',
    marginTop: SPACING.SM,
  },
  searchContainer: {
    padding: SPACING.MD,
    backgroundColor: COLORS.WHITE,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY_100,
    borderRadius: 25,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.SM,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  stylistsList: {
    padding: SPACING.MD,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  stylistCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: SPACING.MD,
    marginBottom: SPACING.SM,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stylistInfo: {
    flex: 1,
  },
  stylistName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.XS,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.XS,
  },
  reviewCount: {
    fontSize: 14,
    color: COLORS.GRAY_600,
    marginLeft: SPACING.XS,
  },
  specialties: {
    fontSize: 14,
    color: COLORS.GRAY_600,
    marginTop: SPACING.XS,
  },
  ratingsContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  ratingsHeader: {
    backgroundColor: COLORS.WHITE,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  backButton: {
    padding: SPACING.SM,
    marginRight: SPACING.SM,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.GRAY_600,
    marginTop: SPACING.XS,
  },
  summaryContainer: {
    backgroundColor: COLORS.WHITE,
    marginTop: SPACING.SM,
  },
  ratingsListContainer: {
    backgroundColor: COLORS.WHITE,
    marginTop: SPACING.SM,
    padding: SPACING.MD,
  },
  ratingItem: {
    marginBottom: SPACING.MD,
  },
  ratingDivider: {
    height: 1,
    backgroundColor: COLORS.GRAY_200,
    marginTop: SPACING.MD,
  },
  emptyRatings: {
    alignItems: 'center',
    paddingVertical: SPACING.XL,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.GRAY_600,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.GRAY_500,
    marginTop: SPACING.XS,
  },
  guideSection: {
    backgroundColor: COLORS.WHITE,
    margin: SPACING.MD,
    padding: SPACING.MD,
    borderRadius: 12,
  },
  guideTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  guideContent: {
    marginLeft: SPACING.SM,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  guideLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    width: 120,
  },
  guideText: {
    fontSize: 14,
    color: COLORS.GRAY_600,
    flex: 1,
  },
});