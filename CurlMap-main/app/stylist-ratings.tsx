import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../constants';
import RatingSummary from '../components/RatingSummary';
import RatingDisplay from '../components/RatingDisplay';
import { apiService } from '../services/api';
import type { Stylist, Rating } from '../types';

export default function StylistRatingsPage() {
  const router = useRouter();
  const { stylistId } = useLocalSearchParams<{ stylistId: string }>();
  
  const [stylist, setStylist] = useState<Stylist | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [ratingStats, setRatingStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');

  useEffect(() => {
    if (stylistId) {
      loadRatingData();
    }
  }, [stylistId]);

  const loadRatingData = async () => {
    try {
      setLoading(true);
      
      // Load stylist data, ratings, and statistics in parallel
      const [stylistData, ratingsData, statsData] = await Promise.all([
        apiService.getStylistProfileById(stylistId),
        apiService.getStylistRatings(stylistId),
        apiService.getStylistRatingStats(stylistId)
      ]);

      setStylist(stylistData);
      setRatings(ratingsData);
      setRatingStats(statsData);
    } catch (error) {
      console.error('Error loading rating data:', error);
      Alert.alert('Error', 'Failed to load rating information');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRatingData();
    setRefreshing(false);
  };

  const handleVoteHelpful = async (ratingId: string, helpful: boolean) => {
    try {
      await apiService.voteRatingHelpful(ratingId, helpful);
      
      // Update the rating in the local state
      setRatings(prev => prev.map(rating => 
        rating._id === ratingId 
          ? {
              ...rating,
              helpfulVotes: helpful 
                ? (rating.helpfulVotes || 0) + 1 
                : rating.helpfulVotes,
              notHelpfulVotes: !helpful 
                ? (rating.notHelpfulVotes || 0) + 1 
                : rating.notHelpfulVotes
            }
          : rating
      ));
    } catch (error) {
      console.error('Error voting on rating:', error);
      Alert.alert('Error', 'Failed to record your vote');
    }
  };

  const getFilteredRatings = () => {
    if (selectedFilter === 'all') return ratings;
    return ratings.filter(rating => rating.overallRating === parseInt(selectedFilter));
  };

  const FilterButton: React.FC<{ 
    filter: typeof selectedFilter; 
    label: string; 
    count?: number;
  }> = ({ filter, label, count }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filter && styles.filterButtonTextActive
      ]}>
        {label} {count !== undefined && `(${count})`}
      </Text>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>
          {stylist?.user?.name || 'Stylist'} Reviews
        </Text>
        <Text style={styles.headerSubtitle}>
          {ratings.length} review{ratings.length !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );

  const renderRatingSummary = () => {
    if (!ratingStats) return null;

    return (
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
    );
  };

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.filtersTitle}>Filter by Rating:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filtersRow}>
          <FilterButton 
            filter="all" 
            label="All" 
            count={ratings.length}
          />
          {[5, 4, 3, 2, 1].map(star => (
            <FilterButton
              key={star}
              filter={star.toString() as any}
              label={`${star} ★`}
              count={ratings.filter(r => r.overallRating === star).length}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderRatingsList = () => {
    const filteredRatings = getFilteredRatings();

    if (filteredRatings.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {selectedFilter === 'all' 
              ? 'No reviews yet' 
              : `No ${selectedFilter}-star reviews`
            }
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.ratingsContainer}>
        {filteredRatings.map((rating, index) => (
          <View key={rating._id} style={styles.ratingItem}>
            <RatingDisplay
              rating={rating}
              onVoteHelpful={handleVoteHelpful}
              showStylistResponse={true}
            />
            {index < filteredRatings.length - 1 && <View style={styles.ratingDivider} />}
          </View>
        ))}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading reviews...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {renderHeader()}
      {renderRatingSummary()}
      {renderFilters()}
      {renderRatingsList()}
    </ScrollView>
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
    fontSize: 16,
    color: COLORS.GRAY_600,
  },
  header: {
    backgroundColor: COLORS.WHITE,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.GRAY_100,
    borderRadius: 8,
    marginBottom: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.GRAY_600,
    marginTop: 4,
  },
  summaryContainer: {
    backgroundColor: COLORS.WHITE,
    marginTop: 10,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  filtersContainer: {
    backgroundColor: COLORS.WHITE,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 10,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.GRAY_100,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
  },
  filterButtonActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  filterButtonText: {
    fontSize: 14,
    color: COLORS.GRAY_700,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: COLORS.WHITE,
  },
  ratingsContainer: {
    backgroundColor: COLORS.WHITE,
    marginTop: 10,
  },
  ratingItem: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  ratingDivider: {
    height: 1,
    backgroundColor: COLORS.GRAY_200,
    marginHorizontal: 20,
  },
  emptyState: {
    backgroundColor: COLORS.WHITE,
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.GRAY_600,
    textAlign: 'center',
  },
});
