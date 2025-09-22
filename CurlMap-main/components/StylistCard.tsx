import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StylistSearchResult } from '../types';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZES,
  DEFAULTS,
} from '../constants';
import api from '../services/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - (SPACING.MD * 2);

interface StylistCardProps {
  stylist: StylistSearchResult;
  onPress: () => void;
  showDistance?: boolean;
  isFavorite?: boolean;
  onFavoriteToggle?: (stylistId: string, isFavorite: boolean) => void;
}

const StylistCard: React.FC<StylistCardProps> = ({
  stylist,
  onPress,
  showDistance = false,
  isFavorite = false,
  onFavoriteToggle,
}) => {
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const router = useRouter();

  const handleFavoriteToggle = async (e: any) => {
    e.stopPropagation(); // Prevent card press when tapping favorite
    
    if (!onFavoriteToggle) return;
    
    try {
      setFavoriteLoading(true);
      
      if (isFavorite) {
        await api.removeFavorite(stylist._id);
        onFavoriteToggle(stylist._id, false);
      } else {
        await api.addFavorite(stylist._id);
        onFavoriteToggle(stylist._id, true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleViewRatings = (e: any) => {
    e.stopPropagation();
    router.push(`/stylist-ratings?stylistId=${stylist._id}`);
  };
  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    }
    return `${distance.toFixed(1)}km away`;
  };

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  const getAvailabilityStatus = () => {
    if (stylist.isOnline && stylist.isAvailable) {
      return { text: 'Available now', color: COLORS.SUCCESS };
    } else if (stylist.nextAvailableSlot) {
      const nextSlot = new Date(stylist.nextAvailableSlot);
      const now = new Date();
      const diffHours = Math.ceil((nextSlot.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      if (diffHours < 24) {
        return { text: `Available in ${diffHours}h`, color: COLORS.WARNING };
      } else {
        const diffDays = Math.ceil(diffHours / 24);
        return { text: `Available in ${diffDays}d`, color: COLORS.INFO };
      }
    }
    return { text: 'Unavailable', color: COLORS.ERROR };
  };

  const availabilityStatus = getAvailabilityStatus();
  const lowestPrice = stylist.basePrices && stylist.basePrices.length > 0 
    ? Math.min(...stylist.basePrices.map(price => price.basePrice))
    : 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Header with Avatar and Basic Info */}
      <View style={styles.header}>
        {stylist.user?.avatar && stylist.user.avatar.startsWith('http') ? (
          <Image
            source={{
              uri: stylist.user.avatar,
            }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {stylist.user?.avatar || stylist.user?.name?.substring(0, 2).toUpperCase() || 'U'}
            </Text>
          </View>
        )}
        
        <View style={styles.basicInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {stylist.user?.name || 'Unknown Stylist'}
          </Text>
          
          <TouchableOpacity style={styles.ratingContainer} onPress={handleViewRatings}>
            <Ionicons name="star" size={16} color={COLORS.WARNING} />
            <Text style={styles.rating}>
              {(() => {
                const rating = stylist.rating;
                if (typeof rating === 'object' && rating && 'average' in rating) {
                  return ((rating as any).average || 0).toFixed(1);
                }
                return (rating || 0).toFixed(1);
              })()}
            </Text>
            <Text style={styles.reviewCount}>
              ({(() => {
                const rating = stylist.rating;
                if (typeof rating === 'object' && rating && 'count' in rating) {
                  return (rating as any).count || 0;
                }
                return stylist.reviewCount || 0;
              })()} reviews)
            </Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.GRAY_400} style={styles.chevron} />
          </TouchableOpacity>

          {showDistance && (
            <View style={styles.distanceContainer}>
              <Ionicons name="location" size={14} color={COLORS.GRAY_500} />
              <Text style={styles.distance}>
                {formatDistance(stylist.distance)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.priceAvailability}>
          {onFavoriteToggle && (
            <TouchableOpacity 
              style={styles.favoriteButton}
              onPress={handleFavoriteToggle}
              disabled={favoriteLoading}
            >
              <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={20} 
                color={isFavorite ? "#FF6B6B" : COLORS.GRAY_500} 
              />
            </TouchableOpacity>
          )}
          
          {lowestPrice > 0 && (
            <Text style={styles.price}>
              From {formatPrice(lowestPrice)}
            </Text>
          )}
          
          <View style={[
            styles.availabilityBadge,
            { backgroundColor: availabilityStatus.color }
          ]}>
            <Text style={styles.availabilityText}>
              {availabilityStatus.text}
            </Text>
          </View>
        </View>
      </View>

      {/* Bio */}
      {stylist.bio && (
        <Text style={styles.bio} numberOfLines={2}>
          {stylist.bio}
        </Text>
      )}

      {/* Specialties */}
      {stylist.specialties && stylist.specialties.length > 0 && (
        <View style={styles.specialtiesContainer}>
          {stylist.specialties.slice(0, 3).map((specialty, index) => (
            <View key={index} style={styles.specialtyTag}>
              <Text style={styles.specialtyText}>{specialty}</Text>
            </View>
          ))}
          {stylist.specialties.length > 3 && (
            <View style={styles.specialtyTag}>
              <Text style={styles.specialtyText}>
                +{stylist.specialties.length - 3} more
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Footer Stats */}
      <View style={styles.footer}>
        <View style={styles.stat}>
          <Ionicons name="checkmark-circle" size={16} color={COLORS.SUCCESS} />
          <Text style={styles.statText}>
            {stylist.completedBookings} completed
          </Text>
        </View>

        <View style={styles.stat}>
          <Ionicons name="time" size={16} color={COLORS.INFO} />
          <Text style={styles.statText}>
            {stylist.experience} years exp
          </Text>
        </View>

        {stylist.isOnline && (
          <View style={styles.onlineIndicator}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
    width: CARD_WIDTH,
    shadowColor: COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    marginBottom: SPACING.SM,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.FULL,
    marginRight: SPACING.MD,
  },
  basicInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  rating: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.XS,
  },
  reviewCount: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.XS,
  },
  chevron: {
    marginLeft: SPACING.XS,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distance: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.XS,
  },
  priceAvailability: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    padding: SPACING.XS,
    zIndex: 1,
  },
  price: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    marginBottom: SPACING.XS,
  },
  availabilityBadge: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.MD,
  },
  availabilityText: {
    fontSize: FONT_SIZES.XS,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  bio: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
    marginBottom: SPACING.SM,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.SM,
  },
  specialtyTag: {
    backgroundColor: COLORS.GRAY_100,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.MD,
    marginRight: SPACING.XS,
    marginBottom: SPACING.XS,
  },
  specialtyText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.XS,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: BORDER_RADIUS.FULL,
    backgroundColor: COLORS.SUCCESS,
    marginRight: SPACING.XS,
  },
  onlineText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.SUCCESS,
    fontWeight: '500',
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
  },
});

export default StylistCard;