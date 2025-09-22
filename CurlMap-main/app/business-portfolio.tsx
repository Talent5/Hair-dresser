import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

// Backend-compatible specialty options
const BACKEND_SPECIALTIES = [
  { label: 'Braids', value: 'braids' },
  { label: 'Weaves', value: 'weaves' },
  { label: 'Natural Hair', value: 'natural_hair' },
  { label: 'Relaxed Hair', value: 'relaxed_hair' },
  { label: 'Cuts', value: 'cuts' },
  { label: 'Color', value: 'color' },
  { label: 'Locs', value: 'locs' },
  { label: 'Extensions', value: 'extensions' },
  { label: 'Treatments', value: 'treatments' },
  { label: 'Styling', value: 'styling' },
  { label: 'Children Hair', value: 'children_hair' },
  { label: 'Men Cuts', value: 'men_cuts' },
  { label: 'Beard Grooming', value: 'beard_grooming' },
];

interface PortfolioImage {
  _id?: string;
  id?: string;
  imageUrl: string;
  caption: string;
  service: string;
  uploadedAt: string;
  likes?: number;
}

export default function BusinessPortfolio() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [experience, setExperience] = useState('');
  const [certifications, setCertifications] = useState('');
  const [portfolioImages, setPortfolioImages] = useState<PortfolioImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Load existing data when component mounts
  useEffect(() => {
    loadStylistData();
  }, []);

  const loadStylistData = async () => {
    setIsLoadingData(true);
    try {
      const response = await api.getStylistProfile();
      if (response.success && response.data.stylist) {
        const stylist = response.data.stylist;
        
        // Populate business information
        setBusinessName(stylist.businessName || '');
        setBusinessDescription(stylist.bio || '');
        setSelectedSpecialties(stylist.specialties || []);
        setExperience(stylist.experience?.years?.toString() || '');
        setCertifications(stylist.experience?.description || '');
        
        // Populate portfolio images
        const portfolioData = (stylist.portfolio || []).map((item: any) => ({
          id: item._id,
          _id: item._id,
          imageUrl: item.imageUrl,
          caption: item.caption || '',
          service: item.service || '',
          uploadedAt: item.uploadedAt,
          likes: item.likes || 0
        }));
        setPortfolioImages(portfolioData);
      }
    } catch (error) {
      console.error('Error loading stylist data:', error);
      // Don't show error alert since this is just data loading
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSavePortfolio = async () => {
    if (!businessName.trim()) {
      Alert.alert('Error', 'Business name is required');
      return;
    }

    setIsLoading(true);
    try {
      // Map form fields to backend schema
      const portfolioData: any = {
        businessName: businessName.trim(),
        bio: businessDescription.trim(), // businessDescription maps to bio
        specialties: selectedSpecialties // Already in correct backend format
      };

      // Add experience if provided
      if (experience.trim()) {
        portfolioData.experience = {
          years: parseInt(experience.trim()) || 0
        };
        
        // Only add description if certifications has content
        if (certifications.trim()) {
          portfolioData.experience.description = certifications.trim();
        }
      }

      console.log('Sending portfolio data:', portfolioData);
      
      const response = await api.updateStylistProfile(portfolioData);
      
      if (response.success) {
        Alert.alert(
          'Success', 
          'Business portfolio updated successfully!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        throw new Error(response.message || 'Failed to update portfolio');
      }
    } catch (error: any) {
      console.error('Error updating business portfolio:', error);
      Alert.alert(
        'Error', 
        error.message || 'Failed to update business portfolio. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddImage = () => {
    Alert.alert('Add Image', 'Photo picker coming soon!');
  };

  const handleRemoveImage = async (imageId: string) => {
    if (!imageId) return;
    
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image from your portfolio?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await api.removePortfolioItem(imageId);
              setPortfolioImages(prev => prev.filter(img => (img.id || img._id) !== imageId));
            } catch (error) {
              console.error('Error removing portfolio item:', error);
              Alert.alert('Error', 'Failed to remove image. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderPortfolioImage = ({ item }: { item: PortfolioImage }) => (
    <View style={styles.imageContainer}>
      <Image source={{ uri: item.imageUrl }} style={styles.portfolioImage} />
      <TouchableOpacity
        style={styles.removeImageButton}
        onPress={() => handleRemoveImage(item.id || item._id || '')}
      >
        <Ionicons name="close-circle" size={24} color={COLORS.ERROR} />
      </TouchableOpacity>
      {item.caption ? (
        <View style={styles.imageCaption}>
          <Text style={styles.imageCaption} numberOfLines={2}>
            {item.caption}
          </Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Portfolio</Text>
        <TouchableOpacity 
          onPress={handleSavePortfolio} 
          style={[styles.headerButton, styles.saveButton]}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Business Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Information</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Business/Brand Name</Text>
            <TextInput
              style={styles.input}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Enter your business or brand name"
              placeholderTextColor={COLORS.TEXT_SECONDARY}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Business Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={businessDescription}
              onChangeText={setBusinessDescription}
              placeholder="Describe your business, style, and what makes you unique..."
              placeholderTextColor={COLORS.TEXT_SECONDARY}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{businessDescription.length}/500</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Specializations</Text>
            <Text style={styles.helperText}>Select your hair care specializations:</Text>
            <View style={styles.specialtyContainer}>
              {BACKEND_SPECIALTIES.map((specialty) => (
                <TouchableOpacity
                  key={specialty.value}
                  style={[
                    styles.specialtyChip,
                    selectedSpecialties.includes(specialty.value) && styles.specialtyChipSelected
                  ]}
                  onPress={() => {
                    setSelectedSpecialties(prev => 
                      prev.includes(specialty.value)
                        ? prev.filter(s => s !== specialty.value)
                        : [...prev, specialty.value]
                    );
                  }}
                >
                  <Text style={[
                    styles.specialtyChipText,
                    selectedSpecialties.includes(specialty.value) && styles.specialtyChipTextSelected
                  ]}>
                    {specialty.label}
                  </Text>
                  {selectedSpecialties.includes(specialty.value) && (
                    <Ionicons name="checkmark" size={16} color={COLORS.WHITE} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Years of Experience</Text>
            <TextInput
              style={styles.input}
              value={experience}
              onChangeText={setExperience}
              placeholder="e.g., 5 years"
              placeholderTextColor={COLORS.TEXT_SECONDARY}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Certifications & Training</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={certifications}
              onChangeText={setCertifications}
              placeholder="List your certifications, training, and qualifications..."
              placeholderTextColor={COLORS.TEXT_SECONDARY}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Portfolio Gallery */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Work Gallery</Text>
            <TouchableOpacity onPress={handleAddImage} style={styles.addButton}>
              <Ionicons name="add" size={20} color={COLORS.WHITE} />
              <Text style={styles.addButtonText}>Add Photo</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.sectionSubtitle}>
            Showcase your best work to attract clients
          </Text>

          {portfolioImages.length > 0 ? (
            <FlatList
              data={portfolioImages}
              renderItem={renderPortfolioImage}
              numColumns={2}
              keyExtractor={(item) => item.id || item._id || Math.random().toString()}
              style={styles.imageGrid}
              columnWrapperStyle={styles.imageRow}
            />
          ) : (
            <View style={styles.emptyGallery}>
              <Ionicons name="images-outline" size={48} color={COLORS.TEXT_SECONDARY} />
              <Text style={styles.emptyText}>No photos yet</Text>
              <Text style={styles.emptySubtext}>
                Add photos of your work to showcase your skills
              </Text>
            </View>
          )}
        </View>

        {/* Business Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Settings</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/business-information')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="location-outline" size={20} color={COLORS.PRIMARY} />
              <Text style={styles.settingText}>Service Areas</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/availability-settings')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="time-outline" size={20} color={COLORS.SUCCESS} />
              <Text style={styles.settingText}>Working Hours</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/services-management')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="card-outline" size={20} color={COLORS.WARNING} />
              <Text style={styles.settingText}>Pricing & Services</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, styles.lastItem]}
            onPress={() => router.push('/business-information')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="business-outline" size={20} color={COLORS.INFO} />
              <Text style={styles.settingText}>Business License</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Keep your portfolio updated to attract more clients
          </Text>
        </View>
      </ScrollView>
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
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_300,
  },
  headerButton: {
    padding: SPACING.SM,
  },
  headerTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: BORDER_RADIUS.MD,
    paddingHorizontal: SPACING.MD,
  },
  saveButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: COLORS.WHITE,
    marginBottom: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.LG,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.LG,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
  },
  addButtonText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.WHITE,
    marginLeft: SPACING.XS,
  },
  formGroup: {
    marginBottom: SPACING.LG,
  },
  label: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
    borderRadius: BORDER_RADIUS.MD,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    backgroundColor: COLORS.WHITE,
  },
  textArea: {
    height: 100,
    paddingTop: SPACING.MD,
  },
  charCount: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'right',
    marginTop: SPACING.XS,
  },
  imageGrid: {
    marginTop: SPACING.MD,
  },
  imageRow: {
    justifyContent: 'space-between',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: SPACING.MD,
  },
  portfolioImage: {
    width: '48%',
    height: 120,
    borderRadius: BORDER_RADIUS.MD,
    backgroundColor: COLORS.GRAY_200,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
  },
  emptyGallery: {
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },
  emptyText: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_300,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.MD,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  footer: {
    padding: SPACING.LG,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  // Specialty Selection Styles
  helperText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.SM,
  },
  specialtyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  specialtyChip: {
    backgroundColor: COLORS.GRAY_200,
    borderRadius: BORDER_RADIUS.LG,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    marginRight: SPACING.XS,
    marginBottom: SPACING.XS,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
  },
  specialtyChipSelected: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  specialtyChipText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    marginRight: SPACING.XS,
  },
  specialtyChipTextSelected: {
    color: COLORS.WHITE,
  },
  imageCaption: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: SPACING.XS,
  },
  imageRemoveButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: COLORS.ERROR,
    borderRadius: 12,
    padding: 4,
  },
});