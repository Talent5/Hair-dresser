import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import RatingDisplay from '../components/RatingDisplay';
import { apiService } from '../services/api';
import type { Rating } from '../types';

interface RatingStats {
  totalRatings: number;
  averageRating: number;
  flaggedRatings: number;
  pendingModeration: number;
  ratingsByPeriod: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  topRatedStylists: Array<{
    stylistId: string;
    stylistName: string;
    averageRating: number;
    totalRatings: number;
  }>;
}

export default function AdminRatingsManagement() {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'flagged' | 'pending' | 'reported'>('all');
  const [selectedRating, setSelectedRating] = useState<Rating | null>(null);
  const [moderationModalVisible, setModerationModalVisible] = useState(false);
  const [moderationAction, setModerationAction] = useState<'approve' | 'reject' | 'flag'>('approve');
  const [moderationReason, setModerationReason] = useState('');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, these would be separate admin endpoints
      const [ratingsResponse, statsResponse] = await Promise.all([
        fetchRatingsByFilter(filter),
        fetchRatingStats()
      ]);

      setRatings(ratingsResponse);
      setStats(statsResponse);
    } catch (error) {
      console.error('Error loading ratings data:', error);
      Alert.alert('Error', 'Failed to load ratings data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRatingsByFilter = async (filterType: string) => {
    // Mock implementation - replace with actual admin API calls
    const allRatings = await apiService.getAllRatingsForAdmin();
    
    switch (filterType) {
      case 'flagged':
        return allRatings.filter((r: Rating) => r.isFlagged);
      case 'pending':
        return allRatings.filter((r: Rating) => r.moderationStatus === 'pending');
      case 'reported':
        return allRatings.filter((r: Rating) => r.reportCount && r.reportCount > 0);
      default:
        return allRatings;
    }
  };

  const fetchRatingStats = async (): Promise<RatingStats> => {
    // Mock implementation - replace with actual admin API
    return {
      totalRatings: 1247,
      averageRating: 4.3,
      flaggedRatings: 23,
      pendingModeration: 8,
      ratingsByPeriod: {
        today: 15,
        thisWeek: 89,
        thisMonth: 312
      },
      topRatedStylists: [
        { stylistId: '1', stylistName: 'Sarah Johnson', averageRating: 4.9, totalRatings: 127 },
        { stylistId: '2', stylistName: 'Mike Chen', averageRating: 4.8, totalRatings: 98 },
        { stylistId: '3', stylistName: 'Lisa Rodriguez', averageRating: 4.7, totalRatings: 143 }
      ]
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleModerationAction = async () => {
    if (!selectedRating) return;

    try {
      await apiService.moderateRating(selectedRating._id, {
        action: moderationAction,
        reason: moderationReason,
        moderatorId: 'current-admin-id' // Would come from auth context
      });

      // Update local state
      setRatings(prev => prev.map(rating => 
        rating._id === selectedRating._id 
          ? { 
              ...rating, 
              moderationStatus: moderationAction === 'approve' ? 'approved' : 'rejected',
              isFlagged: moderationAction === 'flag' ? true : rating.isFlagged
            }
          : rating
      ));

      setModerationModalVisible(false);
      setSelectedRating(null);
      setModerationReason('');
      
      Alert.alert('Success', `Rating ${moderationAction}d successfully`);
    } catch (error) {
      console.error('Error moderating rating:', error);
      Alert.alert('Error', 'Failed to moderate rating');
    }
  };

  const openModerationModal = (rating: Rating, action: 'approve' | 'reject' | 'flag') => {
    setSelectedRating(rating);
    setModerationAction(action);
    setModerationModalVisible(true);
  };

  const renderStatsCard = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Rating Statistics</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalRatings}</Text>
            <Text style={styles.statLabel}>Total Ratings</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.averageRating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
          
          <View style={[styles.statCard, styles.alertCard]}>
            <Text style={[styles.statNumber, styles.alertText]}>{stats.flaggedRatings}</Text>
            <Text style={[styles.statLabel, styles.alertText]}>Flagged</Text>
          </View>
          
          <View style={[styles.statCard, styles.warningCard]}>
            <Text style={[styles.statNumber, styles.warningText]}>{stats.pendingModeration}</Text>
            <Text style={[styles.statLabel, styles.warningText]}>Pending</Text>
          </View>
        </View>

        <View style={styles.periodStats}>
          <Text style={styles.periodTitle}>Recent Activity</Text>
          <View style={styles.periodRow}>
            <Text style={styles.periodLabel}>Today: {stats.ratingsByPeriod.today}</Text>
            <Text style={styles.periodLabel}>This Week: {stats.ratingsByPeriod.thisWeek}</Text>
            <Text style={styles.periodLabel}>This Month: {stats.ratingsByPeriod.thisMonth}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.sectionTitle}>Filter Ratings</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filtersRow}>
          {[
            { key: 'all', label: 'All Ratings', count: ratings.length },
            { key: 'flagged', label: 'Flagged', count: stats?.flaggedRatings || 0 },
            { key: 'pending', label: 'Pending', count: stats?.pendingModeration || 0 },
            { key: 'reported', label: 'Reported', count: 0 }
          ].map(({ key, label, count }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.filterButton,
                filter === key && styles.filterButtonActive
              ]}
              onPress={() => setFilter(key as any)}
            >
              <Text style={[
                styles.filterButtonText,
                filter === key && styles.filterButtonTextActive
              ]}>
                {label} ({count})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderRatingItem = (rating: Rating) => (
    <View key={rating._id} style={styles.ratingContainer}>
      <RatingDisplay
        rating={rating}
        onVoteHelpful={() => {}} // Admin doesn't vote
        showStylistResponse={true}
      />
      
      <View style={styles.moderationActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => openModerationModal(rating, 'approve')}
        >
          <Ionicons name="checkmark" size={16} color={Colors.WHITE} />
          <Text style={styles.actionButtonText}>Approve</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => openModerationModal(rating, 'reject')}
        >
          <Ionicons name="close" size={16} color={Colors.WHITE} />
          <Text style={styles.actionButtonText}>Reject</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.flagButton]}
          onPress={() => openModerationModal(rating, 'flag')}
        >
          <Ionicons name="flag" size={16} color={Colors.WHITE} />
          <Text style={styles.actionButtonText}>Flag</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderModerationModal = () => (
    <Modal
      visible={moderationModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setModerationModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {moderationAction.charAt(0).toUpperCase() + moderationAction.slice(1)} Rating
          </Text>
          
          <Text style={styles.modalSubtitle}>
            Please provide a reason for this action:
          </Text>
          
          <TextInput
            style={styles.reasonInput}
            placeholder="Enter reason..."
            value={moderationReason}
            onChangeText={setModerationReason}
            multiline
            numberOfLines={3}
          />
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setModerationModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={handleModerationAction}
              disabled={!moderationReason.trim()}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
        <Text style={styles.loadingText}>Loading ratings...</Text>
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
      <View style={styles.header}>
        <Text style={styles.title}>Ratings Management</Text>
        <Text style={styles.subtitle}>Monitor and moderate customer ratings</Text>
      </View>

      {renderStatsCard()}
      {renderFilters()}

      <View style={styles.ratingsListContainer}>
        <Text style={styles.sectionTitle}>
          {filter === 'all' ? 'All Ratings' : 
           filter === 'flagged' ? 'Flagged Ratings' :
           filter === 'pending' ? 'Pending Moderation' : 'Reported Ratings'}
        </Text>
        
        {ratings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No ratings found</Text>
          </View>
        ) : (
          ratings.map(renderRatingItem)
        )}
      </View>

      {renderModerationModal()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.BACKGROUND,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.GRAY_600,
  },
  header: {
    backgroundColor: Colors.WHITE,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAY_200,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.TEXT_PRIMARY,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.GRAY_600,
    textAlign: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.TEXT_PRIMARY,
    marginBottom: 15,
  },
  statsContainer: {
    backgroundColor: Colors.WHITE,
    margin: 10,
    padding: 20,
    borderRadius: 12,
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.GRAY_50,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  alertCard: {
    backgroundColor: Colors.ERROR + '15',
  },
  warningCard: {
    backgroundColor: Colors.WARNING + '15',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.TEXT_PRIMARY,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.GRAY_600,
    marginTop: 4,
  },
  alertText: {
    color: Colors.ERROR,
  },
  warningText: {
    color: Colors.WARNING,
  },
  periodStats: {
    borderTopWidth: 1,
    borderTopColor: Colors.GRAY_200,
    paddingTop: 15,
  },
  periodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.TEXT_PRIMARY,
    marginBottom: 8,
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  periodLabel: {
    fontSize: 14,
    color: Colors.GRAY_600,
  },
  filtersContainer: {
    backgroundColor: Colors.WHITE,
    margin: 10,
    padding: 20,
    borderRadius: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.GRAY_100,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.GRAY_200,
  },
  filterButtonActive: {
    backgroundColor: Colors.PRIMARY,
    borderColor: Colors.PRIMARY,
  },
  filterButtonText: {
    fontSize: 14,
    color: Colors.GRAY_700,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: Colors.WHITE,
  },
  ratingsListContainer: {
    backgroundColor: Colors.WHITE,
    margin: 10,
    padding: 20,
    borderRadius: 12,
  },
  ratingContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAY_200,
    paddingBottom: 15,
    marginBottom: 15,
  },
  moderationActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: Colors.GRAY_200,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  approveButton: {
    backgroundColor: Colors.SUCCESS,
  },
  rejectButton: {
    backgroundColor: Colors.ERROR,
  },
  flagButton: {
    backgroundColor: Colors.WARNING,
  },
  actionButtonText: {
    color: Colors.WHITE,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.GRAY_600,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: Colors.GRAY_600,
    marginBottom: 15,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: Colors.GRAY_300,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: Colors.GRAY_300,
  },
  confirmButton: {
    backgroundColor: Colors.PRIMARY,
  },
  cancelButtonText: {
    color: Colors.GRAY_700,
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButtonText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontWeight: '500',
  },
});