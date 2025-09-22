import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SearchFilters } from '../types';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZES,
  SERVICE_TYPES,
  BOOKING_CONFIG,
  RATING_CONFIG,
} from '../constants';

const { width, height } = Dimensions.get('window');

interface SearchFiltersModalProps {
  visible: boolean;
  filters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
  onClose: () => void;
}

const SearchFiltersModal: React.FC<SearchFiltersModalProps> = ({
  visible,
  filters,
  onApply,
  onClose,
}) => {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, visible]);

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleReset = () => {
    const defaultFilters: SearchFilters = {
      radius: 0, // Default to "All" stylists
      sortBy: 'distance',
    };
    setLocalFilters(defaultFilters);
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleServiceType = (serviceType: string) => {
    if (localFilters.serviceType === serviceType) {
      updateFilter('serviceType', undefined);
    } else {
      updateFilter('serviceType', serviceType);
    }
  };

  const updatePriceRange = (key: 'min' | 'max', value: number) => {
    const currentRange = localFilters.priceRange || { min: 0, max: 200 };
    updateFilter('priceRange', {
      ...currentRange,
      [key]: value,
    });
  };

  const sortOptions = [
    { value: 'distance', label: 'Distance', icon: 'location' },
    { value: 'rating', label: 'Rating', icon: 'star' },
    { value: 'price', label: 'Price', icon: 'cash' },
    { value: 'reviews', label: 'Reviews', icon: 'chatbubbles' },
  ];

  const availabilityOptions = [
    { value: undefined, label: 'Any time' },
    { value: 'now', label: 'Available now' },
    { value: 'today', label: 'Available today' },
    { value: 'week', label: 'This week' },
  ];

  const ratingStars = [1, 2, 3, 4, 5];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
          
          <Text style={styles.title}>Search Filters</Text>
          
          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Search Radius */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Search Radius</Text>
            <View style={styles.radiusContainer}>
              <Text style={styles.radiusValue}>
                {localFilters.radius === 0 ? 'All' : `${localFilters.radius}km`}
              </Text>
              <View style={styles.radiusButtons}>
                <TouchableOpacity
                  style={[
                    styles.radiusButton,
                    localFilters.radius === 0 && styles.radiusButtonActive,
                  ]}
                  onPress={() => updateFilter('radius', 0)}
                >
                  <Text
                    style={[
                      styles.radiusButtonText,
                      localFilters.radius === 0 && styles.radiusButtonTextActive,
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {[1, 5, 10, 20, 50].map((radius) => (
                  <TouchableOpacity
                    key={radius}
                    style={[
                      styles.radiusButton,
                      localFilters.radius === radius && styles.radiusButtonActive,
                    ]}
                    onPress={() => updateFilter('radius', radius)}
                  >
                    <Text
                      style={[
                        styles.radiusButtonText,
                        localFilters.radius === radius && styles.radiusButtonTextActive,
                      ]}
                    >
                      {radius}km
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Service Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Type</Text>
            <View style={styles.serviceTypes}>
              {SERVICE_TYPES.map((serviceType) => (
                <TouchableOpacity
                  key={serviceType}
                  style={[
                    styles.serviceTypeChip,
                    localFilters.serviceType === serviceType && styles.serviceTypeChipActive,
                  ]}
                  onPress={() => toggleServiceType(serviceType)}
                >
                  <Text
                    style={[
                      styles.serviceTypeText,
                      localFilters.serviceType === serviceType && styles.serviceTypeTextActive,
                    ]}
                  >
                    {serviceType}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Price Range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Range</Text>
            <View style={styles.priceRangeContainer}>
              <View style={styles.priceInputs}>
                <View style={styles.priceInput}>
                  <Text style={styles.priceLabel}>Min</Text>
                  <Text style={styles.priceValue}>
                    ${localFilters.priceRange?.min || 0}
                  </Text>
                </View>
                <Text style={styles.priceSeparator}>-</Text>
                <View style={styles.priceInput}>
                  <Text style={styles.priceLabel}>Max</Text>
                  <Text style={styles.priceValue}>
                    ${localFilters.priceRange?.max || 200}
                  </Text>
                </View>
              </View>
              
              <View style={styles.priceButtons}>
                <Text style={styles.sliderLabel}>Price Range</Text>
                <View style={styles.priceButtonsRow}>
                  {[
                    { min: 0, max: 50, label: '$0-50' },
                    { min: 50, max: 100, label: '$50-100' },
                    { min: 100, max: 200, label: '$100-200' },
                    { min: 200, max: 500, label: '$200+' },
                  ].map((range) => (
                    <TouchableOpacity
                      key={range.label}
                      style={[
                        styles.priceButton,
                        localFilters.priceRange?.min === range.min &&
                        localFilters.priceRange?.max === range.max &&
                        styles.priceButtonActive,
                      ]}
                      onPress={() => updateFilter('priceRange', { min: range.min, max: range.max })}
                    >
                      <Text
                        style={[
                          styles.priceButtonText,
                          localFilters.priceRange?.min === range.min &&
                          localFilters.priceRange?.max === range.max &&
                          styles.priceButtonTextActive,
                        ]}
                      >
                        {range.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Minimum Rating */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Minimum Rating</Text>
            <View style={styles.ratingContainer}>
              {ratingStars.map((star) => (
                <TouchableOpacity
                  key={star}
                  style={styles.ratingButton}
                  onPress={() => updateFilter('rating', star)}
                >
                  <Ionicons
                    name="star"
                    size={32}
                    color={
                      (localFilters.rating || 0) >= star
                        ? COLORS.WARNING
                        : COLORS.GRAY_300
                    }
                  />
                </TouchableOpacity>
              ))}
              {localFilters.rating && (
                <TouchableOpacity
                  style={styles.clearRatingButton}
                  onPress={() => updateFilter('rating', undefined)}
                >
                  <Text style={styles.clearRatingText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Availability */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Availability</Text>
            <View style={styles.availabilityOptions}>
              {availabilityOptions.map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    styles.availabilityOption,
                    localFilters.availability === option.value && styles.availabilityOptionActive,
                  ]}
                  onPress={() => updateFilter('availability', option.value)}
                >
                  <View style={[
                    styles.radioButton,
                    localFilters.availability === option.value && styles.radioButtonActive,
                  ]}>
                    {localFilters.availability === option.value && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                  <Text style={[
                    styles.availabilityText,
                    localFilters.availability === option.value && styles.availabilityTextActive,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sort By */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sort By</Text>
            <View style={styles.sortOptions}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortOption,
                    localFilters.sortBy === option.value && styles.sortOptionActive,
                  ]}
                  onPress={() => updateFilter('sortBy', option.value)}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={
                      localFilters.sortBy === option.value
                        ? COLORS.WHITE
                        : COLORS.PRIMARY
                    }
                  />
                  <Text
                    style={[
                      styles.sortOptionText,
                      localFilters.sortBy === option.value && styles.sortOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApply}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
    backgroundColor: COLORS.WHITE,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FONT_SIZES.XL,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  resetButton: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
  },
  resetText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.MD,
  },
  section: {
    paddingVertical: SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  radiusContainer: {
    marginBottom: SPACING.SM,
  },
  radiusValue: {
    fontSize: FONT_SIZES.XL,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  radiusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  radiusButton: {
    minWidth: (width - SPACING.MD * 3) / 6 - SPACING.SM, // Accommodate 6 buttons (All + 5 distances)
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.XS,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
    backgroundColor: COLORS.WHITE,
    alignItems: 'center',
  },
  radiusButtonActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  radiusButtonText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  radiusButtonTextActive: {
    color: COLORS.WHITE,
  },
  serviceTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  serviceTypeChip: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.LG,
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
    backgroundColor: COLORS.WHITE,
  },
  serviceTypeChipActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  serviceTypeText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  serviceTypeTextActive: {
    color: COLORS.WHITE,
  },
  priceRangeContainer: {
    marginBottom: SPACING.SM,
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.LG,
  },
  priceInput: {
    alignItems: 'center',
    flex: 1,
  },
  priceLabel: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS,
  },
  priceValue: {
    fontSize: FONT_SIZES.XL,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  priceSeparator: {
    fontSize: FONT_SIZES.XL,
    color: COLORS.TEXT_SECONDARY,
    marginHorizontal: SPACING.MD,
  },
  priceButtons: {
    marginTop: SPACING.MD,
  },
  priceButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
    marginTop: SPACING.SM,
  },
  priceButton: {
    flex: 1,
    minWidth: (width - SPACING.MD * 3) / 2 - SPACING.SM,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.XS,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
    backgroundColor: COLORS.WHITE,
    alignItems: 'center',
  },
  priceButtonActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  priceButtonText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  priceButtonTextActive: {
    color: COLORS.WHITE,
  },
  sliderLabel: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingButton: {
    padding: SPACING.XS,
  },
  clearRatingButton: {
    marginLeft: SPACING.MD,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.GRAY_200,
    borderRadius: BORDER_RADIUS.MD,
  },
  clearRatingText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  availabilityOptions: {
    gap: SPACING.SM,
  },
  availabilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
  },
  availabilityOptionActive: {
    // Add any active styling if needed
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.GRAY_400,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.MD,
  },
  radioButtonActive: {
    borderColor: COLORS.PRIMARY,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.PRIMARY,
  },
  availabilityText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
  },
  availabilityTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  sortOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.LG,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.WHITE,
    minWidth: (width - SPACING.MD * 3) / 2,
    justifyContent: 'center',
  },
  sortOptionActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  sortOptionText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    marginLeft: SPACING.XS,
  },
  sortOptionTextActive: {
    color: COLORS.WHITE,
  },
  footer: {
    padding: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_200,
  },
  applyButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
    alignItems: 'center',
  },
  applyButtonText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
  },
});

export default SearchFiltersModal;