import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';

const { width, height } = Dimensions.get('window');

interface PortfolioImage {
  _id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  service?: string;
  likes?: number;
}

interface PortfolioGalleryProps {
  images: PortfolioImage[];
  columns?: number;
}

export const PortfolioGallery: React.FC<PortfolioGalleryProps> = ({
  images,
  columns = 3,
}) => {
  const [selectedImage, setSelectedImage] = useState<PortfolioImage | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const imageSize = (width - SPACING.lg * 2 - SPACING.xs * (columns - 1)) / columns;

  const openImage = (image: PortfolioImage, index: number) => {
    setSelectedImage(image);
    setCurrentIndex(index);
  };

  const closeImage = () => {
    setSelectedImage(null);
  };

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedImage(images[currentIndex + 1]);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedImage(images[currentIndex - 1]);
    }
  };

  const renderGridImage = ({ item, index }: { item: PortfolioImage; index: number }) => (
    <TouchableOpacity
      style={[styles.gridImageContainer, { width: imageSize, height: imageSize }]}
      onPress={() => openImage(item, index)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.thumbnailUrl || item.imageUrl }}
        style={styles.gridImage}
        resizeMode="cover"
      />
      {item.likes && item.likes > 0 && (
        <View style={styles.likesOverlay}>
          <Ionicons name="heart" size={14} color={COLORS.WHITE} />
          <Text style={styles.likesOverlayText}>{item.likes}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={images}
        renderItem={renderGridImage}
        keyExtractor={(item) => item._id}
        numColumns={columns}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={48} color={COLORS.TEXT_SECONDARY} />
            <Text style={styles.emptyText}>No portfolio images yet</Text>
          </View>
        }
      />

      {/* Full Screen Image Modal */}
      <Modal
        visible={selectedImage !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={closeImage}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeImage} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={COLORS.WHITE} />
            </TouchableOpacity>
            <Text style={styles.modalCounter}>
              {currentIndex + 1} / {images.length}
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Image Content */}
          <View style={styles.imageContent}>
            {selectedImage && (
              <>
                <Image
                  source={{ uri: selectedImage.imageUrl }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />

                {/* Navigation Arrows */}
                {currentIndex > 0 && (
                  <TouchableOpacity
                    style={[styles.navButton, styles.navButtonLeft]}
                    onPress={goToPrevious}
                  >
                    <Ionicons name="chevron-back" size={32} color={COLORS.WHITE} />
                  </TouchableOpacity>
                )}

                {currentIndex < images.length - 1 && (
                  <TouchableOpacity
                    style={[styles.navButton, styles.navButtonRight]}
                    onPress={goToNext}
                  >
                    <Ionicons name="chevron-forward" size={32} color={COLORS.WHITE} />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {/* Image Info */}
          {selectedImage && (selectedImage.caption || selectedImage.service) && (
            <View style={styles.imageInfo}>
              {selectedImage.service && (
                <View style={styles.serviceTag}>
                  <Text style={styles.serviceTagText}>{selectedImage.service}</Text>
                </View>
              )}
              {selectedImage.caption && (
                <Text style={styles.captionText}>{selectedImage.caption}</Text>
              )}
            </View>
          )}

          {/* Thumbnail Strip */}
          <View style={styles.thumbnailStrip}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailContent}
            >
              {images.map((image, index) => (
                <TouchableOpacity
                  key={image._id}
                  onPress={() => {
                    setCurrentIndex(index);
                    setSelectedImage(image);
                  }}
                  style={[
                    styles.thumbnailContainer,
                    currentIndex === index && styles.thumbnailActive,
                  ]}
                >
                  <Image
                    source={{ uri: image.thumbnailUrl || image.imageUrl }}
                    style={styles.thumbnail}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gridRow: {
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  gridImageContainer: {
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  likesOverlay: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  likesOverlayText: {
    color: COLORS.WHITE,
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.md,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: 50,
    paddingBottom: SPACING.md,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCounter: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  headerSpacer: {
    width: 44,
  },
  imageContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: width,
    height: height * 0.6,
  },
  navButton: {
    position: 'absolute',
    width: 44,
    height: 44,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonLeft: {
    left: SPACING.md,
  },
  navButtonRight: {
    right: SPACING.md,
  },
  imageInfo: {
    padding: SPACING.lg,
  },
  serviceTag: {
    backgroundColor: COLORS.PRIMARY,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  serviceTagText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  captionText: {
    fontSize: 14,
    color: COLORS.WHITE,
    lineHeight: 20,
  },
  thumbnailStrip: {
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  thumbnailContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  thumbnailContainer: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: COLORS.PRIMARY,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
});
