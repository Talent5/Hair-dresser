import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../constants';

interface RatingStats {
  totalRatings: number;
  averageOverall: number;
  averageServiceQuality?: number;
  averageProfessionalism?: number;
  averageCommunication?: number;
  averageTimeliness?: number;
  averageValueForMoney?: number;
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  recommendationRate: number;
  returnRate: number;
}

interface RatingSummaryProps {
  stats: RatingStats;
  showDetailedBreakdown?: boolean;
  onViewAllReviews?: () => void;
  compact?: boolean;
}

const RatingSummary: React.FC<RatingSummaryProps> = ({
  stats,
  showDetailedBreakdown = false,
  onViewAllReviews,
  compact = false,
}) => {
  const renderStars = (rating: number, size: number = 16, showNumber: boolean = true) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      let iconName: 'star' | 'star-half' | 'star-outline';
      if (i <= fullStars) {
        iconName = 'star';
      } else if (i === fullStars + 1 && hasHalfStar) {
        iconName = 'star-half';
      } else {
        iconName = 'star-outline';
      }

      stars.push(
        <Ionicons
          key={i}
          name={iconName}
          size={size}
          color={i <= rating ? COLORS.ACCENT : COLORS.GRAY_300}
          style={styles.star}
        />
      );
    }

    return (
      <View style={styles.starsContainer}>
        {stars}
        {showNumber && (
          <Text style={[styles.ratingNumber, { fontSize: size * 0.75 }]}>
            {rating.toFixed(1)}
          </Text>
        )}
      </View>
    );
  };

  const renderRatingBar = (starCount: number, count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    
    return (
      <View style={styles.ratingBarRow}>
        <Text style={styles.starLabel}>{starCount}</Text>
        <Ionicons name="star" size={12} color={COLORS.ACCENT} />
        <View style={styles.barContainer}>
          <View style={[styles.barFill, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.ratingCount}>{count}</Text>
      </View>
    );
  };

  if (stats.totalRatings === 0) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <View style={styles.noRatingsContainer}>
          <Ionicons name="star-outline" size={48} color={COLORS.GRAY_300} />
          <Text style={styles.noRatingsText}>No ratings yet</Text>
          <Text style={styles.noRatingsSubtext}>
            Be the first to rate this stylist
          </Text>
        </View>
      </View>
    );
  }

  if (compact) {
    return (
      <View style={[styles.container, styles.containerCompact]}>
        <View style={styles.compactHeader}>
          {renderStars(stats.averageOverall, 18)}
          <Text style={styles.compactRatingText}>
            ({stats.totalRatings} review{stats.totalRatings !== 1 ? 's' : ''})
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Overall Rating */}
      <View style={styles.header}>
        <View style={styles.overallRating}>
          <Text style={styles.averageScore}>{stats.averageOverall.toFixed(1)}</Text>
          {renderStars(stats.averageOverall, 24, false)}
          <Text style={styles.totalReviews}>
            Based on {stats.totalRatings} review{stats.totalRatings !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Rating Distribution */}
      <View style={styles.distributionSection}>
        <Text style={styles.sectionTitle}>Rating Distribution</Text>
        {[5, 4, 3, 2, 1].map((starCount) => (
          <View key={starCount}>
            {renderRatingBar(starCount, stats.ratingBreakdown[starCount as keyof typeof stats.ratingBreakdown], stats.totalRatings)}
          </View>
        ))}
      </View>

      {/* Detailed Breakdown */}
      {showDetailedBreakdown && (
        <View style={styles.detailedSection}>
          <Text style={styles.sectionTitle}>Detailed Ratings</Text>
          {stats.averageServiceQuality !== undefined && (
            <View style={styles.detailedRow}>
              <Text style={styles.detailedLabel}>Service Quality</Text>
              {renderStars(stats.averageServiceQuality, 16)}
            </View>
          )}
          {stats.averageProfessionalism !== undefined && (
            <View style={styles.detailedRow}>
              <Text style={styles.detailedLabel}>Professionalism</Text>
              {renderStars(stats.averageProfessionalism, 16)}
            </View>
          )}
          {stats.averageCommunication !== undefined && (
            <View style={styles.detailedRow}>
              <Text style={styles.detailedLabel}>Communication</Text>
              {renderStars(stats.averageCommunication, 16)}
            </View>
          )}
          {stats.averageTimeliness !== undefined && (
            <View style={styles.detailedRow}>
              <Text style={styles.detailedLabel}>Timeliness</Text>
              {renderStars(stats.averageTimeliness, 16)}
            </View>
          )}
          {stats.averageValueForMoney !== undefined && (
            <View style={styles.detailedRow}>
              <Text style={styles.detailedLabel}>Value for Money</Text>
              {renderStars(stats.averageValueForMoney, 16)}
            </View>
          )}
        </View>
      )}

      {/* Customer Satisfaction */}
      <View style={styles.satisfactionSection}>
        <Text style={styles.sectionTitle}>Customer Satisfaction</Text>
        <View style={styles.satisfactionRow}>
          <View style={styles.satisfactionItem}>
            <Text style={styles.satisfactionPercentage}>
              {Math.round(stats.recommendationRate * 100)}%
            </Text>
            <Text style={styles.satisfactionLabel}>Would Recommend</Text>
          </View>
          <View style={styles.satisfactionItem}>
            <Text style={styles.satisfactionPercentage}>
              {Math.round(stats.returnRate * 100)}%
            </Text>
            <Text style={styles.satisfactionLabel}>Would Book Again</Text>
          </View>
        </View>
      </View>

      {/* View All Reviews Button */}
      {onViewAllReviews && (
        <TouchableOpacity style={styles.viewAllButton} onPress={onViewAllReviews}>
          <Text style={styles.viewAllText}>View All Reviews</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    shadowColor: COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  containerCompact: {
    padding: SPACING.SM,
    shadowOpacity: 0,
    elevation: 0,
    backgroundColor: 'transparent',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  overallRating: {
    alignItems: 'center',
  },
  averageScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  star: {
    marginRight: 2,
  },
  ratingNumber: {
    marginLeft: SPACING.XS,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  totalReviews: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
  },
  compactRatingText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  distributionSection: {
    marginBottom: SPACING.LG,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  starLabel: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    width: 12,
    textAlign: 'right',
    marginRight: SPACING.XS,
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.GRAY_200,
    borderRadius: 4,
    marginLeft: SPACING.XS,
    marginRight: SPACING.SM,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.ACCENT,
    borderRadius: 4,
  },
  ratingCount: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    width: 30,
    textAlign: 'right',
  },
  detailedSection: {
    marginBottom: SPACING.LG,
  },
  detailedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  detailedLabel: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  satisfactionSection: {
    marginBottom: SPACING.MD,
  },
  satisfactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  satisfactionItem: {
    alignItems: 'center',
  },
  satisfactionPercentage: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: SPACING.XS,
  },
  satisfactionLabel: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.SM,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_200,
    marginTop: SPACING.SM,
  },
  viewAllText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.PRIMARY,
    fontWeight: '500',
    marginRight: SPACING.XS,
  },
  noRatingsContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.XL,
  },
  noRatingsText: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.SM,
    marginBottom: SPACING.XS,
  },
  noRatingsSubtext: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
  },
});

export default RatingSummary;