import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../constants';

interface Rating {
  _id: string;
  customerId: {
    _id: string;
    name: string;
    profileImage?: string;
  };
  overallRating: number;
  ratingBreakdown?: {
    serviceQuality?: number;
    professionalism?: number;
    communication?: number;
    timeliness?: number;
    valueForMoney?: number;
  };
  review?: {
    title?: string;
    comment?: string;
    pros?: string[];
    cons?: string[];
  };
  serviceDetails: {
    serviceName: string;
    serviceCategory: string;
  };
  wouldRecommend?: boolean;
  wouldBookAgain?: boolean;
  helpfulVotes?: {
    helpful: any[];
    notHelpful: any[];
  };
  stylistResponse?: {
    message: string;
    respondedAt: string;
    isPublic: boolean;
  };
  createdAt: string;
  timeAgo?: string;
  helpfulScore?: number;
}

interface RatingDisplayProps {
  rating: Rating;
  showStylistResponse?: boolean;
  onHelpfulVote?: (ratingId: string, isHelpful: boolean) => void;
  currentUserId?: string;
  canVoteHelpful?: boolean;
}

const RatingDisplay: React.FC<RatingDisplayProps> = ({
  rating,
  showStylistResponse = true,
  onHelpfulVote,
  currentUserId,
  canVoteHelpful = false,
}) => {
  const renderStars = (ratingValue: number, size: number = 16) => {
    const stars = [];
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = ratingValue % 1 !== 0;

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
          color={i <= ratingValue ? COLORS.ACCENT : COLORS.GRAY_300}
          style={styles.star}
        />
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  const handleHelpfulVote = (isHelpful: boolean) => {
    if (onHelpfulVote && canVoteHelpful) {
      onHelpfulVote(rating._id, isHelpful);
    }
  };

  const totalVotes = (rating.helpfulVotes?.helpful.length || 0) + (rating.helpfulVotes?.notHelpful.length || 0);
  const helpfulPercentage = totalVotes > 0 ? Math.round(((rating.helpfulVotes?.helpful.length || 0) / totalVotes) * 100) : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image
            source={{
              uri: rating.customerId.profileImage || 'https://via.placeholder.com/40x40',
            }}
            style={styles.userAvatar}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{rating.customerId.name}</Text>
            <Text style={styles.serviceInfo}>{rating.serviceDetails.serviceName}</Text>
          </View>
        </View>
        <View style={styles.ratingInfo}>
          <Text style={styles.timeAgo}>{formatDate(rating.createdAt)}</Text>
          {renderStars(rating.overallRating, 18)}
        </View>
      </View>

      {/* Review Title */}
      {rating.review?.title && (
        <Text style={styles.reviewTitle}>{rating.review.title}</Text>
      )}

      {/* Review Comment */}
      {rating.review?.comment && (
        <Text style={styles.reviewComment}>{rating.review.comment}</Text>
      )}

      {/* Pros and Cons */}
      {rating.review?.pros && rating.review.pros.length > 0 && (
        <View style={styles.prosConsSection}>
          <Text style={styles.prosConsTitle}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.SUCCESS} />
            {' '}What went well
          </Text>
          {rating.review.pros.map((pro, index) => (
            <Text key={index} style={styles.prosConsItem}>• {pro}</Text>
          ))}
        </View>
      )}

      {rating.review?.cons && rating.review.cons.length > 0 && (
        <View style={styles.prosConsSection}>
          <Text style={styles.prosConsTitle}>
            <Ionicons name="alert-circle" size={16} color={COLORS.WARNING} />
            {' '}Areas for improvement
          </Text>
          {rating.review.cons.map((con, index) => (
            <Text key={index} style={styles.prosConsItem}>• {con}</Text>
          ))}
        </View>
      )}

      {/* Detailed Ratings */}
      {rating.ratingBreakdown && (
        <View style={styles.detailedRatings}>
          <Text style={styles.detailedTitle}>Detailed Ratings</Text>
          {Object.entries(rating.ratingBreakdown).map(([key, value]) => {
            if (!value) return null;
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            return (
              <View key={key} style={styles.detailedRatingRow}>
                <Text style={styles.detailedRatingLabel}>{label}</Text>
                <View style={styles.detailedRatingValue}>
                  {renderStars(value, 14)}
                  <Text style={styles.detailedRatingNumber}>{value}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Recommendation Badges */}
      <View style={styles.recommendationBadges}>
        {rating.wouldRecommend !== undefined && (
          <View style={[
            styles.badge,
            rating.wouldRecommend ? styles.badgePositive : styles.badgeNegative
          ]}>
            <Ionicons
              name={rating.wouldRecommend ? "thumbs-up" : "thumbs-down"}
              size={12}
              color={COLORS.WHITE}
            />
            <Text style={styles.badgeText}>
              {rating.wouldRecommend ? "Recommends" : "Doesn't recommend"}
            </Text>
          </View>
        )}
        
        {rating.wouldBookAgain !== undefined && (
          <View style={[
            styles.badge,
            rating.wouldBookAgain ? styles.badgePositive : styles.badgeNegative
          ]}>
            <Ionicons
              name={rating.wouldBookAgain ? "repeat" : "close-circle"}
              size={12}
              color={COLORS.WHITE}
            />
            <Text style={styles.badgeText}>
              {rating.wouldBookAgain ? "Would book again" : "Wouldn't book again"}
            </Text>
          </View>
        )}
      </View>

      {/* Helpful Votes */}
      {totalVotes > 0 && (
        <View style={styles.helpfulSection}>
          <Text style={styles.helpfulText}>
            {rating.helpfulVotes?.helpful.length || 0} of {totalVotes} people found this helpful ({helpfulPercentage}%)
          </Text>
        </View>
      )}

      {/* Helpful Vote Buttons */}
      {canVoteHelpful && currentUserId !== rating.customerId._id && (
        <View style={styles.voteButtons}>
          <Text style={styles.voteQuestion}>Was this review helpful?</Text>
          <View style={styles.voteButtonContainer}>
            <TouchableOpacity
              style={styles.voteButton}
              onPress={() => handleHelpfulVote(true)}
            >
              <Ionicons name="thumbs-up-outline" size={16} color={COLORS.PRIMARY} />
              <Text style={styles.voteButtonText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.voteButton}
              onPress={() => handleHelpfulVote(false)}
            >
              <Ionicons name="thumbs-down-outline" size={16} color={COLORS.PRIMARY} />
              <Text style={styles.voteButtonText}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Stylist Response */}
      {showStylistResponse && rating.stylistResponse && rating.stylistResponse.isPublic && (
        <View style={styles.stylistResponse}>
          <View style={styles.responseHeader}>
            <Ionicons name="person-circle" size={20} color={COLORS.PRIMARY} />
            <Text style={styles.responseTitle}>Stylist Response</Text>
            <Text style={styles.responseDate}>
              {formatDate(rating.stylistResponse.respondedAt)}
            </Text>
          </View>
          <Text style={styles.responseMessage}>{rating.stylistResponse.message}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
    shadowColor: COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.SM,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  serviceInfo: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  ratingInfo: {
    alignItems: 'flex-end',
  },
  timeAgo: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginLeft: 1,
  },
  reviewTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  reviewComment: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 20,
    marginBottom: SPACING.MD,
  },
  prosConsSection: {
    marginBottom: SPACING.MD,
  },
  prosConsTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
    alignItems: 'center',
  },
  prosConsItem: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.SM,
    marginBottom: 2,
  },
  detailedRatings: {
    backgroundColor: COLORS.GRAY_100,
    borderRadius: BORDER_RADIUS.SM,
    padding: SPACING.SM,
    marginBottom: SPACING.MD,
  },
  detailedTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  detailedRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  detailedRatingLabel: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  detailedRatingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailedRatingNumber: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.XS,
    minWidth: 20,
    textAlign: 'center',
  },
  recommendationBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.XS,
    marginBottom: SPACING.MD,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
    gap: 4,
  },
  badgePositive: {
    backgroundColor: COLORS.SUCCESS,
  },
  badgeNegative: {
    backgroundColor: COLORS.ERROR,
  },
  badgeText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.WHITE,
    fontWeight: '500',
  },
  helpfulSection: {
    marginBottom: SPACING.SM,
  },
  helpfulText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    fontStyle: 'italic',
  },
  voteButtons: {
    marginBottom: SPACING.MD,
  },
  voteQuestion: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  voteButtonContainer: {
    flexDirection: 'row',
    gap: SPACING.SM,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    borderRadius: BORDER_RADIUS.SM,
    gap: 4,
  },
  voteButtonText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.PRIMARY,
  },
  stylistResponse: {
    backgroundColor: COLORS.GRAY_100,
    borderRadius: BORDER_RADIUS.SM,
    padding: SPACING.SM,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.PRIMARY,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  responseTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    marginLeft: SPACING.XS,
    flex: 1,
  },
  responseDate: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  responseMessage: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 18,
  },
});

export default RatingDisplay;