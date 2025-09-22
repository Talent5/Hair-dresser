import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../constants';
import { apiService } from '../services/api';

interface RatingFormProps {
  visible: boolean;
  booking: {
    _id: string;
    service: {
      name: string;
      category: string;
    };
    stylist: {
      _id: string;
      name: string;
      profileImage?: string;
      businessName?: string;
    };
    appointmentDateTime: string;
    completedAt: string;
    pricing: {
      totalAmount: number;
      currency: string;
    };
  };
  existingRating?: any; // Existing rating data for editing
  isEditing?: boolean; // Whether we're editing an existing rating
  onClose: () => void;
  onSubmit: (ratingData: any) => Promise<void>;
}

interface DetailedRatings {
  serviceQuality: number;
  professionalism: number;
  communication: number;
  timeliness: number;
  valueForMoney: number;
}

const RatingForm: React.FC<RatingFormProps> = ({
  visible,
  booking,
  existingRating,
  isEditing = false,
  onClose,
  onSubmit,
}) => {
  const [overallRating, setOverallRating] = useState<number>(existingRating?.overallRating || 0);
  const [detailedRatings, setDetailedRatings] = useState<DetailedRatings>({
    serviceQuality: existingRating?.ratingBreakdown?.serviceQuality || 0,
    professionalism: existingRating?.ratingBreakdown?.professionalism || 0,
    communication: existingRating?.ratingBreakdown?.communication || 0,
    timeliness: existingRating?.ratingBreakdown?.timeliness || 0,
    valueForMoney: existingRating?.ratingBreakdown?.valueForMoney || 0,
  });
  const [reviewTitle, setReviewTitle] = useState(existingRating?.review?.title || '');
  const [reviewComment, setReviewComment] = useState(existingRating?.review?.comment || '');
  const [pros, setPros] = useState<string[]>(existingRating?.review?.pros || ['']);
  const [cons, setCons] = useState<string[]>(existingRating?.review?.cons || ['']);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(existingRating?.wouldRecommend ?? null);
  const [wouldBookAgain, setWouldBookAgain] = useState<boolean | null>(existingRating?.wouldBookAgain ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetailedRatings, setShowDetailedRatings] = useState(false);

  const resetForm = () => {
    setOverallRating(0);
    setDetailedRatings({
      serviceQuality: 0,
      professionalism: 0,
      communication: 0,
      timeliness: 0,
      valueForMoney: 0,
    });
    setReviewTitle('');
    setReviewComment('');
    setPros(['']);
    setCons(['']);
    setWouldRecommend(null);
    setWouldBookAgain(null);
    setShowDetailedRatings(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderStarRating = (
    currentRating: number,
    onPress: (rating: number) => void,
    size: number = 32
  ) => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= currentRating ? 'star' : 'star-outline'}
              size={size}
              color={star <= currentRating ? COLORS.PRIMARY : COLORS.GRAY_300}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const updatePros = (text: string, index: number) => {
    const newPros = [...pros];
    newPros[index] = text;
    if (index === pros.length - 1 && text.trim() !== '') {
      newPros.push('');
    }
    setPros(newPros.filter((pro, i) => pro.trim() !== '' || i === newPros.length - 1));
  };

  const updateCons = (text: string, index: number) => {
    const newCons = [...cons];
    newCons[index] = text;
    if (index === cons.length - 1 && text.trim() !== '') {
      newCons.push('');
    }
    setCons(newCons.filter((con, i) => con.trim() !== '' || i === newCons.length - 1));
  };

  const handleSubmit = async () => {
    if (overallRating === 0) {
      Alert.alert('Rating Required', 'Please provide an overall rating');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const ratingData = {
        bookingId: booking._id,
        overallRating,
        ratingBreakdown: showDetailedRatings ? detailedRatings : undefined,
        review: {
          title: reviewTitle.trim() || undefined,
          comment: reviewComment.trim() || undefined,
          pros: pros.filter(pro => pro.trim() !== ''),
          cons: cons.filter(con => con.trim() !== ''),
        },
        wouldRecommend: wouldRecommend === null ? undefined : wouldRecommend,
        wouldBookAgain: wouldBookAgain === null ? undefined : wouldBookAgain,
      };

      if (isEditing && existingRating?._id) {
        // Update existing rating
        await apiService.updateRating(existingRating._id, ratingData);
      } else {
        // Create new rating
        await apiService.submitRating(ratingData);
      }
      
      await onSubmit(ratingData);
      resetForm();
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'submit'} rating. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Rating' : 'Rate Your Experience'}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Stylist Info */}
          <View style={styles.stylistInfo}>
            <Image
              source={{
                uri: booking.stylist.profileImage || 'https://via.placeholder.com/60x60',
              }}
              style={styles.stylistImage}
            />
            <View style={styles.stylistDetails}>
              <Text style={styles.stylistName}>{booking.stylist.name}</Text>
              {booking.stylist.businessName && (
                <Text style={styles.businessName}>{booking.stylist.businessName}</Text>
              )}
              <Text style={styles.serviceInfo}>
                {booking.service.name} • {formatDate(booking.completedAt)}
              </Text>
            </View>
          </View>

          {/* Overall Rating */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overall Rating *</Text>
            {renderStarRating(overallRating, setOverallRating, 40)}
            {overallRating > 0 && (
              <Text style={styles.ratingText}>
                {overallRating === 1 && 'Poor'}
                {overallRating === 2 && 'Fair'}
                {overallRating === 3 && 'Good'}
                {overallRating === 4 && 'Very Good'}
                {overallRating === 5 && 'Excellent'}
              </Text>
            )}
          </View>

          {/* Detailed Ratings Toggle */}
          <TouchableOpacity
            style={styles.detailedToggle}
            onPress={() => setShowDetailedRatings(!showDetailedRatings)}
          >
            <Text style={styles.detailedToggleText}>
              {showDetailedRatings ? 'Hide' : 'Show'} Detailed Ratings
            </Text>
            <Ionicons
              name={showDetailedRatings ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={COLORS.PRIMARY}
            />
          </TouchableOpacity>

          {/* Detailed Ratings */}
          {showDetailedRatings && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detailed Ratings</Text>
              
              {Object.entries(detailedRatings).map(([key, value]) => (
                <View key={key} style={styles.detailedRatingItem}>
                  <Text style={styles.detailedRatingLabel}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Text>
                  {renderStarRating(
                    value,
                    (rating) => setDetailedRatings(prev => ({ ...prev, [key]: rating })),
                    24
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Review Title */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Review Title (Optional)</Text>
            <TextInput
              style={styles.titleInput}
              value={reviewTitle}
              onChangeText={setReviewTitle}
              placeholder="Give your review a title..."
              maxLength={100}
            />
          </View>

          {/* Review Comment */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Review (Optional)</Text>
            <TextInput
              style={styles.commentInput}
              value={reviewComment}
              onChangeText={setReviewComment}
              placeholder="Share details about your experience..."
              multiline
              numberOfLines={4}
              maxLength={1000}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{reviewComment.length}/1000</Text>
          </View>

          {/* Pros and Cons */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What went well? (Optional)</Text>
            {pros.map((pro, index) => (
              <TextInput
                key={index}
                style={styles.listInput}
                value={pro}
                onChangeText={(text) => updatePros(text, index)}
                placeholder={`What was good about this service?`}
                maxLength={200}
              />
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Areas for improvement (Optional)</Text>
            {cons.map((con, index) => (
              <TextInput
                key={index}
                style={styles.listInput}
                value={con}
                onChangeText={(text) => updateCons(text, index)}
                placeholder={`What could be improved?`}
                maxLength={200}
              />
            ))}
          </View>

          {/* Recommendation Questions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Would you recommend this stylist?</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.recommendButton,
                  wouldRecommend === true && styles.recommendButtonActive,
                ]}
                onPress={() => setWouldRecommend(true)}
              >
                <Ionicons
                  name="thumbs-up"
                  size={20}
                  color={wouldRecommend === true ? COLORS.WHITE : COLORS.PRIMARY}
                />
                <Text
                  style={[
                    styles.recommendButtonText,
                    wouldRecommend === true && styles.recommendButtonTextActive,
                  ]}
                >
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.recommendButton,
                  wouldRecommend === false && styles.recommendButtonActive,
                ]}
                onPress={() => setWouldRecommend(false)}
              >
                <Ionicons
                  name="thumbs-down"
                  size={20}
                  color={wouldRecommend === false ? COLORS.WHITE : COLORS.PRIMARY}
                />
                <Text
                  style={[
                    styles.recommendButtonText,
                    wouldRecommend === false && styles.recommendButtonTextActive,
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Would you book again?</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.recommendButton,
                  wouldBookAgain === true && styles.recommendButtonActive,
                ]}
                onPress={() => setWouldBookAgain(true)}
              >
                <Ionicons
                  name="repeat"
                  size={20}
                  color={wouldBookAgain === true ? COLORS.WHITE : COLORS.PRIMARY}
                />
                <Text
                  style={[
                    styles.recommendButtonText,
                    wouldBookAgain === true && styles.recommendButtonTextActive,
                  ]}
                >
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.recommendButton,
                  wouldBookAgain === false && styles.recommendButtonActive,
                ]}
                onPress={() => setWouldBookAgain(false)}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={wouldBookAgain === false ? COLORS.WHITE : COLORS.PRIMARY}
                />
                <Text
                  style={[
                    styles.recommendButtonText,
                    wouldBookAgain === false && styles.recommendButtonTextActive,
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              overallRating === 0 && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={overallRating === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.WHITE} />
            ) : (
              <Text style={styles.submitButtonText}>{isEditing ? 'Update Rating' : 'Submit Rating'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  closeButton: {
    padding: SPACING.XS,
  },
  headerTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.MD,
  },
  stylistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
    marginBottom: SPACING.MD,
  },
  stylistImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: SPACING.MD,
  },
  stylistDetails: {
    flex: 1,
  },
  stylistName: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  businessName: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS,
  },
  serviceInfo: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  section: {
    marginBottom: SPACING.LG,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  starButton: {
    marginRight: SPACING.XS,
  },
  ratingText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.XS,
  },
  detailedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.SM,
    marginBottom: SPACING.MD,
  },
  detailedToggleText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  detailedRatingItem: {
    marginBottom: SPACING.MD,
  },
  detailedRatingLabel: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
    borderRadius: BORDER_RADIUS.SM,
    padding: SPACING.MD,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
    borderRadius: BORDER_RADIUS.SM,
    padding: SPACING.MD,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    minHeight: 100,
  },
  charCount: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'right',
    marginTop: SPACING.XS,
  },
  listInput: {
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
    borderRadius: BORDER_RADIUS.SM,
    padding: SPACING.MD,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.MD,
  },
  recommendButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.MD,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    borderRadius: BORDER_RADIUS.SM,
    gap: SPACING.XS,
  },
  recommendButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  recommendButtonText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  recommendButtonTextActive: {
    color: COLORS.WHITE,
  },
  submitContainer: {
    padding: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_200,
  },
  submitButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.SM,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.GRAY_300,
  },
  submitButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
});

export default RatingForm;