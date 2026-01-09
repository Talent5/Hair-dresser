import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { ImagePickerWithPreview } from '@/components/ImagePickerWithPreview';

const { width } = Dimensions.get('window');

// Service options
const SERVICES = [
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
  _id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  caption: string;
  service: string;
  uploadedAt: string;
  likes: number;
}

export default function PortfolioManagement() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [portfolioImages, setPortfolioImages] = useState<PortfolioImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newImages, setNewImages] = useState<Array<{ uri: string; caption: string; service: string }>>([]);

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    setIsLoading(true);
    try {
      const response = await api.getStylistProfile();
      if (response.success && response.data.stylist) {
        const stylist = response.data.stylist;
        const portfolioData = (stylist.portfolio || []).map((item: any) => ({
          _id: item._id,
          imageUrl: item.imageUrl,
          thumbnailUrl: item.thumbnailUrl,
          caption: item.caption || '',
          service: item.service || '',
          uploadedAt: item.uploadedAt,
          likes: item.likes || 0
        }));
        setPortfolioImages(portfolioData);
      }
    } catch (error) {
      console.error('Error loading portfolio:', error);
      Alert.alert('Error', 'Failed to load portfolio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPortfolio();
    setIsRefreshing(false);
  };

  const handleImagesSelected = (images: Array<{ uri: string; caption: string; service: string }>) => {
    setNewImages(images);
  };

  const handleUpload = async () => {
    if (newImages.length === 0) {
      Alert.alert('No Images', 'Please select at least one image to upload');
      return;
    }

    // Check if all images have a service selected
    const imagesWithoutService = newImages.filter(img => !img.service);
    if (imagesWithoutService.length > 0) {
      Alert.alert('Missing Service', 'Please select a service type for all images');
      return;
    }

    setIsUploading(true);
    try {
      // Upload multiple images at once
      const response = await api.addMultiplePortfolioItems(newImages);
      
      if (response.success) {
        Alert.alert(
          'Success',
          `Successfully uploaded ${newImages.length} image${newImages.length > 1 ? 's' : ''}!`,
          [{ text: 'OK', onPress: () => {
            setNewImages([]);
            loadPortfolio();
          }}]
        );
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Error uploading portfolio:', error);
      Alert.alert(
        'Upload Failed',
        error.message || 'Failed to upload images. Please try again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async (imageId: string) => {
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
              setPortfolioImages(prev => prev.filter(img => img._id !== imageId));
              Alert.alert('Success', 'Image removed successfully');
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

  const renderPortfolioImage = (item: PortfolioImage) => (
    <View key={item._id} style={styles.portfolioImageContainer}>
      <Image 
        source={{ uri: item.thumbnailUrl || item.imageUrl }} 
        style={styles.portfolioImage}
        resizeMode="cover"
      />
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveImage(item._id)}
      >
        <Ionicons name="trash-outline" size={18} color={COLORS.WHITE} />
      </TouchableOpacity>
      <View style={styles.imageOverlay}>
        <Text style={styles.serviceBadge}>
          {SERVICES.find(s => s.value === item.service)?.label || item.service}
        </Text>
        {item.caption && (
          <Text style={styles.captionText} numberOfLines={2}>
            {item.caption}
          </Text>
        )}
      </View>
      {item.likes > 0 && (
        <View style={styles.likesContainer}>
          <Ionicons name="heart" size={16} color={COLORS.ERROR} />
          <Text style={styles.likesText}>{item.likes}</Text>
        </View>
      )}
    </View>
  );

  if (isLoading && portfolioImages.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Loading portfolio...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.title}>My Portfolio</Text>
          <View style={styles.headerRight}>
            <Text style={styles.imageCount}>{portfolioImages.length} photos</Text>
          </View>
        </View>

        {/* Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add New Photos</Text>
          <Text style={styles.sectionDescription}>
            Showcase your best work to attract more clients
          </Text>
          
          <ImagePickerWithPreview
            onImagesSelected={handleImagesSelected}
            maxImages={10}
            services={SERVICES}
          />

          {newImages.length > 0 && (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color={COLORS.WHITE} />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={20} color={COLORS.WHITE} />
                  <Text style={styles.uploadButtonText}>
                    Upload {newImages.length} Photo{newImages.length > 1 ? 's' : ''}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Existing Portfolio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Portfolio</Text>
          
          {portfolioImages.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="images-outline" size={64} color={COLORS.TEXT_SECONDARY} />
              <Text style={styles.emptyStateText}>No photos yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Add some photos to showcase your work and attract clients
              </Text>
            </View>
          ) : (
            <View style={styles.portfolioGrid}>
              {portfolioImages.map(renderPortfolioImage)}
            </View>
          )}
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Tips for Great Portfolio Photos</Text>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.SUCCESS} />
            <Text style={styles.tipText}>Use good lighting for clear photos</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.SUCCESS} />
            <Text style={styles.tipText}>Show different angles and styles</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.SUCCESS} />
            <Text style={styles.tipText}>Add captions to describe your work</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.SUCCESS} />
            <Text style={styles.tipText}>Update regularly with new work</Text>
          </View>
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
  scrollView: {
    flex: 1,
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
    minWidth: 60,
    alignItems: 'flex-end',
  },
  imageCount: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  section: {
    padding: SPACING.lg,
    backgroundColor: COLORS.WHITE,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.xs,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.md,
  },
  uploadButton: {
    backgroundColor: COLORS.PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  portfolioImageContainer: {
    width: (width - SPACING.lg * 2 - SPACING.sm) / 2,
    height: (width - SPACING.lg * 2 - SPACING.sm) / 2,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    position: 'relative',
  },
  portfolioImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    backgroundColor: COLORS.ERROR,
    borderRadius: 16,
    padding: 6,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: SPACING.xs,
  },
  serviceBadge: {
    color: COLORS.WHITE,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  captionText: {
    color: COLORS.WHITE,
    fontSize: 11,
  },
  likesContainer: {
    position: 'absolute',
    top: SPACING.xs,
    left: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  likesText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.md,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  tipsSection: {
    padding: SPACING.lg,
    backgroundColor: `${COLORS.PRIMARY}10`,
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  tipText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
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
});
