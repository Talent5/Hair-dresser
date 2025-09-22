import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants';
import * as ImagePicker from 'expo-image-picker';

interface StylistProfileForm {
  businessName: string;
  bio: string;
  specialties: string[];
  experience: number;
  workingRadius: number;
  services: ServiceForm[];
  portfolio: string[];
}

interface ServiceForm {
  name: string;
  category: string;
  basePrice: number;
  estimatedDuration: number;
  description: string;
}

const SPECIALTY_OPTIONS = [
  'braids', 'weaves', 'natural_hair', 'relaxed_hair', 'cuts', 
  'color', 'locs', 'extensions', 'treatments', 'styling', 
  'children_hair', 'men_cuts', 'beard_grooming'
];

const SERVICE_CATEGORIES = [
  'braids', 'weaves', 'natural_hair', 'relaxed_hair', 'cuts', 
  'color', 'locs', 'extensions', 'treatments', 'styling', 
  'children_hair', 'men_cuts', 'beard_grooming'
];

export default function StylistProfileSetupScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  
  const [form, setForm] = useState<StylistProfileForm>({
    businessName: '',
    bio: '',
    specialties: [],
    experience: 0,
    workingRadius: 10,
    services: [],
    portfolio: [],
  });

  const [newService, setNewService] = useState<ServiceForm>({
    name: '',
    category: 'cuts',
    basePrice: 0,
    estimatedDuration: 60,
    description: '',
  });

  useEffect(() => {
    // Check if user is a stylist, if not redirect
    if (user && !user.isStylist) {
      router.replace('/(tabs)');
    }
  }, [user]);

  const formatSpecialtyName = (specialty: string) => {
    return specialty.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatCategoryName = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setForm(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const addService = () => {
    if (!newService.name.trim() || newService.basePrice <= 0) {
      Alert.alert('Error', 'Please fill in all service details');
      return;
    }

    setForm(prev => ({
      ...prev,
      services: [...prev.services, { ...newService }]
    }));

    setNewService({
      name: '',
      category: 'cuts',
      basePrice: 0,
      estimatedDuration: 60,
      description: '',
    });

    setShowServiceModal(false);
  };

  const removeService = (index: number) => {
    setForm(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload portfolio images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setForm(prev => ({
        ...prev,
        portfolio: [...prev.portfolio, result.assets[0].uri]
      }));
    }
  };

  const removePortfolioImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      portfolio: prev.portfolio.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return form.businessName.trim().length > 0 && form.bio.trim().length > 0;
      case 2:
        return form.specialties.length > 0 && form.experience >= 0;
      case 3:
        return form.services.length > 0;
      case 4:
        return true; // Portfolio is optional
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) {
      Alert.alert('Incomplete', 'Please fill in all required fields before continuing');
      return;
    }
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Here you would typically call an API to update the stylist profile
      // For now, we'll simulate a successful profile update
      
      // await apiService.updateStylistProfile(form);
      
      Alert.alert(
        'Profile Complete!',
        'Your stylist profile has been set up successfully. You can now start receiving bookings!',
        [
          {
            text: 'Start Taking Bookings',
            onPress: () => router.replace('/stylist-dashboard')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3, 4].map((step) => (
        <View key={step} style={styles.progressStepContainer}>
          <View style={[
            styles.progressStep,
            step <= currentStep && styles.progressStepActive
          ]}>
            <Text style={[
              styles.progressStepText,
              step <= currentStep && styles.progressStepTextActive
            ]}>
              {step}
            </Text>
          </View>
          {step < 4 && <View style={[
            styles.progressLine,
            step < currentStep && styles.progressLineActive
          ]} />}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Business Information</Text>
      <Text style={styles.stepSubtitle}>Tell us about your styling business</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Business Name</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., Sarah's Hair Studio"
          value={form.businessName}
          onChangeText={(text) => setForm(prev => ({ ...prev, businessName: text }))}
          editable={!isLoading}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Bio</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Describe your experience, style, and what makes you unique..."
          value={form.bio}
          onChangeText={(text) => setForm(prev => ({ ...prev, bio: text }))}
          multiline
          numberOfLines={4}
          editable={!isLoading}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Working Radius (km)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="10"
          value={form.workingRadius.toString()}
          onChangeText={(text) => setForm(prev => ({ ...prev, workingRadius: parseInt(text) || 0 }))}
          keyboardType="numeric"
          editable={!isLoading}
        />
        <Text style={styles.inputHelp}>How far are you willing to travel for appointments?</Text>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Expertise & Experience</Text>
      <Text style={styles.stepSubtitle}>What are your specialties?</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Years of Experience</Text>
        <TextInput
          style={styles.textInput}
          placeholder="5"
          value={form.experience.toString()}
          onChangeText={(text) => setForm(prev => ({ ...prev, experience: parseInt(text) || 0 }))}
          keyboardType="numeric"
          editable={!isLoading}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Specialties (Select all that apply)</Text>
        <View style={styles.specialtiesGrid}>
          {SPECIALTY_OPTIONS.map((specialty) => (
            <TouchableOpacity
              key={specialty}
              style={[
                styles.specialtyChip,
                form.specialties.includes(specialty) && styles.specialtyChipSelected
              ]}
              onPress={() => handleSpecialtyToggle(specialty)}
              disabled={isLoading}
            >
              <Text style={[
                styles.specialtyChipText,
                form.specialties.includes(specialty) && styles.specialtyChipTextSelected
              ]}>
                {formatSpecialtyName(specialty)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Services & Pricing</Text>
      <Text style={styles.stepSubtitle}>Add the services you offer</Text>

      <TouchableOpacity
        style={styles.addServiceButton}
        onPress={() => setShowServiceModal(true)}
        disabled={isLoading}
      >
        <Ionicons name="add-circle-outline" size={24} color={COLORS.PRIMARY} />
        <Text style={styles.addServiceText}>Add Service</Text>
      </TouchableOpacity>

      <View style={styles.servicesList}>
        {form.services.map((service, index) => (
          <View key={index} style={styles.serviceItem}>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceCategory}>{formatCategoryName(service.category)}</Text>
              <Text style={styles.servicePrice}>${service.basePrice} • {service.estimatedDuration}min</Text>
            </View>
            <TouchableOpacity
              style={styles.removeServiceButton}
              onPress={() => removeService(index)}
              disabled={isLoading}
            >
              <Ionicons name="trash-outline" size={20} color="#F44336" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {form.services.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="cut-outline" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No services added yet</Text>
          <Text style={styles.emptyStateSubtext}>Add at least one service to continue</Text>
        </View>
      )}
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Portfolio</Text>
      <Text style={styles.stepSubtitle}>Showcase your best work (optional)</Text>

      <TouchableOpacity
        style={styles.addImageButton}
        onPress={pickImage}
        disabled={isLoading}
      >
        <Ionicons name="camera-outline" size={24} color={COLORS.PRIMARY} />
        <Text style={styles.addImageText}>Add Portfolio Image</Text>
      </TouchableOpacity>

      <View style={styles.portfolioGrid}>
        {form.portfolio.map((image, index) => (
          <View key={index} style={styles.portfolioItem}>
            <Image source={{ uri: image }} style={styles.portfolioImage} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => removePortfolioImage(index)}
              disabled={isLoading}
            >
              <Ionicons name="close-circle" size={24} color="#F44336" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {form.portfolio.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No portfolio images yet</Text>
          <Text style={styles.emptyStateSubtext}>Add some images to showcase your work</Text>
        </View>
      )}
    </View>
  );

  const renderServiceModal = () => (
    <Modal
      visible={showServiceModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowServiceModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add Service</Text>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowServiceModal(false)}
          >
            <Ionicons name="close" size={24} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Service Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Box Braids"
              value={newService.name}
              onChangeText={(text) => setNewService(prev => ({ ...prev, name: text }))}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {SERVICE_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    newService.category === category && styles.categoryChipSelected
                  ]}
                  onPress={() => setNewService(prev => ({ ...prev, category }))}
                >
                  <Text style={[
                    styles.categoryChipText,
                    newService.category === category && styles.categoryChipTextSelected
                  ]}>
                    {formatCategoryName(category)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Base Price ($)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="50"
              value={newService.basePrice.toString()}
              onChangeText={(text) => setNewService(prev => ({ ...prev, basePrice: parseInt(text) || 0 }))}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Estimated Duration (minutes)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="120"
              value={newService.estimatedDuration.toString()}
              onChangeText={(text) => setNewService(prev => ({ ...prev, estimatedDuration: parseInt(text) || 0 }))}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Describe this service..."
              value={newService.description}
              onChangeText={(text) => setNewService(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity style={styles.addButton} onPress={addService}>
            <Text style={styles.addButtonText}>Add Service</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const getCurrentStepComponent = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.PRIMARY_DARK, COLORS.PRIMARY, COLORS.PRIMARY_LIGHT]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => currentStep > 1 ? prevStep() : (router.canGoBack() ? router.back() : router.replace('/stylist-dashboard' as any))}
            disabled={isLoading}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Complete Your Profile</Text>
          <View style={styles.headerRight} />
        </View>
        {renderProgressIndicator()}
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {getCurrentStepComponent()}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.nextButton, isLoading && styles.nextButtonDisabled]}
          onPress={nextStep}
          disabled={isLoading || !validateStep(currentStep)}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.WHITE} />
          ) : (
            <Text style={styles.nextButtonText}>
              {currentStep === 4 ? 'Complete Profile' : 'Continue'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {renderServiceModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.LG,
    marginBottom: SPACING.LG,
  },
  backButton: {
    padding: SPACING.SM,
  },
  headerTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  headerRight: {
    width: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
  },
  progressStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressStep: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressStepActive: {
    backgroundColor: COLORS.WHITE,
  },
  progressStepText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  progressStepTextActive: {
    color: COLORS.PRIMARY,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: SPACING.SM,
  },
  progressLineActive: {
    backgroundColor: COLORS.WHITE,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: SPACING.LG,
  },
  stepTitle: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  stepSubtitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XL,
  },
  inputContainer: {
    marginBottom: SPACING.LG,
  },
  inputLabel: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  textInput: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputHelp: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.SM,
  },
  specialtiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  specialtyChip: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.GRAY_100,
    borderRadius: BORDER_RADIUS.LG,
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
  },
  specialtyChipSelected: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  specialtyChipText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
  },
  specialtyChipTextSelected: {
    color: COLORS.WHITE,
  },
  addServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    borderStyle: 'dashed',
    paddingVertical: SPACING.LG,
    marginBottom: SPACING.LG,
  },
  addServiceText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    marginLeft: SPACING.SM,
  },
  servicesList: {
    gap: SPACING.MD,
  },
  serviceItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  serviceCategory: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS,
  },
  servicePrice: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  removeServiceButton: {
    padding: SPACING.SM,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    borderStyle: 'dashed',
    paddingVertical: SPACING.LG,
    marginBottom: SPACING.LG,
  },
  addImageText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    marginLeft: SPACING.SM,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.MD,
  },
  portfolioItem: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  portfolioImage: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.MD,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.LG,
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  emptyStateSubtext: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  buttonContainer: {
    padding: SPACING.LG,
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_200,
  },
  nextButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: BORDER_RADIUS.LG,
    paddingVertical: SPACING.LG,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  modalTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  modalCloseButton: {
    padding: SPACING.SM,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.LG,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  categoryChip: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.GRAY_100,
    borderRadius: BORDER_RADIUS.LG,
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  categoryChipText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
  },
  categoryChipTextSelected: {
    color: COLORS.WHITE,
  },
  addButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: BORDER_RADIUS.LG,
    paddingVertical: SPACING.LG,
    alignItems: 'center',
    marginTop: SPACING.LG,
  },
  addButtonText: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
});