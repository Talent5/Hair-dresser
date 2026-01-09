import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';

interface ImageItem {
  uri: string;
  caption: string;
  service: string;
}

interface ImagePickerWithPreviewProps {
  onImagesSelected: (images: ImageItem[]) => void;
  maxImages?: number;
  services: Array<{ label: string; value: string }>;
}

export const ImagePickerWithPreview: React.FC<ImagePickerWithPreviewProps> = ({
  onImagesSelected,
  maxImages = 10,
  services,
}) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(null);
  const [tempCaption, setTempCaption] = useState('');
  const [tempService, setTempService] = useState('');

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: maxImages - images.length,
      });

      if (!result.canceled && result.assets) {
        const newImages: ImageItem[] = result.assets.map(asset => ({
          uri: asset.uri,
          caption: '',
          service: services[0]?.value || '',
        }));
        setImages([...images, ...newImages]);
        onImagesSelected([...images, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesSelected(newImages);
  };

  const openCaptionModal = (index: number) => {
    setCurrentImageIndex(index);
    setTempCaption(images[index].caption);
    setTempService(images[index].service);
    setShowCaptionModal(true);
  };

  const saveCaptionAndService = () => {
    if (currentImageIndex !== null) {
      const newImages = [...images];
      newImages[currentImageIndex] = {
        ...newImages[currentImageIndex],
        caption: tempCaption,
        service: tempService,
      };
      setImages(newImages);
      onImagesSelected(newImages);
    }
    setShowCaptionModal(false);
    setCurrentImageIndex(null);
    setTempCaption('');
    setTempService('');
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
        {/* Add Image Button */}
        {images.length < maxImages && (
          <TouchableOpacity
            style={styles.addImageButton}
            onPress={pickImages}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.PRIMARY} />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={40} color={COLORS.PRIMARY} />
                <Text style={styles.addImageText}>Add Photos</Text>
                <Text style={styles.addImageSubtext}>
                  {images.length}/{maxImages}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Image Previews */}
        {images.map((image, index) => (
          <View key={index} style={styles.imagePreview}>
            <Image source={{ uri: image.uri }} style={styles.previewImage} />
            
            {/* Remove Button */}
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeImage(index)}
            >
              <Ionicons name="close-circle" size={24} color={COLORS.ERROR} />
            </TouchableOpacity>

            {/* Edit Caption Button */}
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => openCaptionModal(index)}
            >
              <Ionicons name="create-outline" size={20} color={COLORS.WHITE} />
            </TouchableOpacity>

            {/* Caption Preview */}
            {image.caption && (
              <View style={styles.captionPreview}>
                <Text style={styles.captionText} numberOfLines={1}>
                  {image.caption}
                </Text>
              </View>
            )}

            {/* Service Badge */}
            <View style={styles.serviceBadge}>
              <Text style={styles.serviceBadgeText}>
                {services.find(s => s.value === image.service)?.label || 'No Service'}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Caption and Service Modal */}
      <Modal
        visible={showCaptionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCaptionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Details</Text>

            <TextInput
              style={styles.input}
              placeholder="Add a caption (optional)"
              value={tempCaption}
              onChangeText={setTempCaption}
              multiline
              maxLength={200}
            />

            <Text style={styles.inputLabel}>Select Service *</Text>
            <ScrollView style={styles.serviceList}>
              {services.map((service) => (
                <TouchableOpacity
                  key={service.value}
                  style={[
                    styles.serviceOption,
                    tempService === service.value && styles.serviceOptionSelected,
                  ]}
                  onPress={() => setTempService(service.value)}
                >
                  <Text
                    style={[
                      styles.serviceOptionText,
                      tempService === service.value && styles.serviceOptionTextSelected,
                    ]}
                  >
                    {service.label}
                  </Text>
                  {tempService === service.value && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.PRIMARY} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCaptionModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveCaptionAndService}
                disabled={!tempService}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  imagesScroll: {
    flexDirection: 'row',
  },
  addImageButton: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  addImageText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    marginTop: SPACING.xs,
  },
  addImageSubtext: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  imagePreview: {
    width: 120,
    height: 120,
    marginRight: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
  },
  editButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 16,
    padding: 6,
  },
  captionPreview: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 4,
  },
  captionText: {
    color: COLORS.WHITE,
    fontSize: 10,
  },
  serviceBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  serviceBadgeText: {
    color: COLORS.WHITE,
    fontSize: 9,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.md,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.sm,
  },
  serviceList: {
    maxHeight: 200,
    marginBottom: SPACING.md,
  },
  serviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  serviceOptionSelected: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: `${COLORS.PRIMARY}10`,
  },
  serviceOptionText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  serviceOptionTextSelected: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modalButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.BACKGROUND,
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
});
