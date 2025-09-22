import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

interface BusinessInfo {
  businessName: string;
  businessType: string;
  businessRegistration: string;
  taxNumber: string;
  licenseNumber: string;
  insuranceProvider: string;
  insurancePolicy: string;
  certifications: string[];
  businessAddress: string;
  operatingHours: string;
  contactNumber: string;
  websiteUrl: string;
  socialMedia: {
    instagram: string;
    facebook: string;
    tiktok: string;
  };
  isRegistered: boolean;
  isInsured: boolean;
  isLicensed: boolean;
}

export default function BusinessInformationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    businessName: '',
    businessType: 'sole_proprietorship',
    businessRegistration: '',
    taxNumber: '',
    licenseNumber: '',
    insuranceProvider: '',
    insurancePolicy: '',
    certifications: [],
    businessAddress: '',
    operatingHours: '',
    contactNumber: '',
    websiteUrl: '',
    socialMedia: {
      instagram: '',
      facebook: '',
      tiktok: '',
    },
    isRegistered: false,
    isInsured: false,
    isLicensed: false,
  });

  const [newCertification, setNewCertification] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field: keyof BusinessInfo, value: any) => {
    setBusinessInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateSocialMedia = (platform: keyof BusinessInfo['socialMedia'], value: string) => {
    setBusinessInfo(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value
      }
    }));
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      setBusinessInfo(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()]
      }));
      setNewCertification('');
    }
  };

  const removeCertification = (index: number) => {
    setBusinessInfo(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!businessInfo.businessName.trim()) {
      Alert.alert('Error', 'Business name is required');
      return;
    }

    setIsLoading(true);
    try {
      // Map to backend format - send individual fields according to schema
      const businessData: any = {
        businessName: businessInfo.businessName,
      };

      // Map location info if available
      if (businessInfo.businessAddress) {
        businessData.location = {
          isHomeBased: true, // assuming home-based for now
          isMobile: true,    // assuming mobile service too
          homeStudio: {
            address: businessInfo.businessAddress,
            description: `${businessInfo.businessName} - Professional hair styling services`,
            amenities: []
          }
        };
      }

      console.log('Sending business data:', businessData);

      const response = await api.updateStylistProfile(businessData);

      if (response.success) {
        Alert.alert(
          'Success',
          'Business information updated successfully!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        throw new Error(response.message || 'Failed to update business information');
      }
    } catch (error: any) {
      console.error('Error updating business information:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to update business information. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const businessTypes = [
    { label: 'Sole Proprietorship', value: 'sole_proprietorship' },
    { label: 'Partnership', value: 'partnership' },
    { label: 'Limited Company', value: 'limited_company' },
    { label: 'Freelancer', value: 'freelancer' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Information</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={isLoading}>
          <Text style={[styles.saveButtonText, isLoading && styles.saveButtonDisabled]}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Business Name *</Text>
            <TextInput
              style={styles.input}
              value={businessInfo.businessName}
              onChangeText={(value) => updateField('businessName', value)}
              placeholder="Your salon/business name"
              placeholderTextColor={COLORS.TEXT_SECONDARY}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Business Type</Text>
            <View style={styles.buttonGroup}>
              {businessTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    businessInfo.businessType === type.value && styles.typeButtonSelected
                  ]}
                  onPress={() => updateField('businessType', type.value)}
                >
                  <Text style={[
                    styles.typeButtonText,
                    businessInfo.businessType === type.value && styles.typeButtonTextSelected
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Business Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={businessInfo.businessAddress}
              onChangeText={(value) => updateField('businessAddress', value)}
              placeholder="Full business address"
              placeholderTextColor={COLORS.TEXT_SECONDARY}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Contact Number</Text>
            <TextInput
              style={styles.input}
              value={businessInfo.contactNumber}
              onChangeText={(value) => updateField('contactNumber', value)}
              placeholder="Business phone number"
              placeholderTextColor={COLORS.TEXT_SECONDARY}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Legal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal & Registration</Text>
          
          <View style={styles.toggleGroup}>
            <View style={styles.toggleItem}>
              <View style={styles.toggleLeft}>
                <Ionicons name="document-text-outline" size={20} color={COLORS.INFO} />
                <Text style={styles.toggleLabel}>Business Registered</Text>
              </View>
              <Switch
                value={businessInfo.isRegistered}
                onValueChange={(value) => updateField('isRegistered', value)}
                trackColor={{ false: COLORS.GRAY_300, true: COLORS.SUCCESS + '40' }}
                thumbColor={businessInfo.isRegistered ? COLORS.SUCCESS : COLORS.GRAY_400}
              />
            </View>
          </View>

          {businessInfo.isRegistered && (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Business Registration Number</Text>
                <TextInput
                  style={styles.input}
                  value={businessInfo.businessRegistration}
                  onChangeText={(value) => updateField('businessRegistration', value)}
                  placeholder="Registration certificate number"
                  placeholderTextColor={COLORS.TEXT_SECONDARY}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Tax Number (TIN)</Text>
                <TextInput
                  style={styles.input}
                  value={businessInfo.taxNumber}
                  onChangeText={(value) => updateField('taxNumber', value)}
                  placeholder="Tax identification number"
                  placeholderTextColor={COLORS.TEXT_SECONDARY}
                />
              </View>
            </>
          )}

          <View style={styles.toggleGroup}>
            <View style={styles.toggleItem}>
              <View style={styles.toggleLeft}>
                <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.SUCCESS} />
                <Text style={styles.toggleLabel}>Licensed</Text>
              </View>
              <Switch
                value={businessInfo.isLicensed}
                onValueChange={(value) => updateField('isLicensed', value)}
                trackColor={{ false: COLORS.GRAY_300, true: COLORS.SUCCESS + '40' }}
                thumbColor={businessInfo.isLicensed ? COLORS.SUCCESS : COLORS.GRAY_400}
              />
            </View>
          </View>

          {businessInfo.isLicensed && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>License Number</Text>
              <TextInput
                style={styles.input}
                value={businessInfo.licenseNumber}
                onChangeText={(value) => updateField('licenseNumber', value)}
                placeholder="Professional license number"
                placeholderTextColor={COLORS.TEXT_SECONDARY}
              />
            </View>
          )}

          <View style={styles.toggleGroup}>
            <View style={styles.toggleItem}>
              <View style={styles.toggleLeft}>
                <Ionicons name="umbrella-outline" size={20} color={COLORS.WARNING} />
                <Text style={styles.toggleLabel}>Insured</Text>
              </View>
              <Switch
                value={businessInfo.isInsured}
                onValueChange={(value) => updateField('isInsured', value)}
                trackColor={{ false: COLORS.GRAY_300, true: COLORS.SUCCESS + '40' }}
                thumbColor={businessInfo.isInsured ? COLORS.SUCCESS : COLORS.GRAY_400}
              />
            </View>
          </View>

          {businessInfo.isInsured && (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Insurance Provider</Text>
                <TextInput
                  style={styles.input}
                  value={businessInfo.insuranceProvider}
                  onChangeText={(value) => updateField('insuranceProvider', value)}
                  placeholder="Insurance company name"
                  placeholderTextColor={COLORS.TEXT_SECONDARY}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Policy Number</Text>
                <TextInput
                  style={styles.input}
                  value={businessInfo.insurancePolicy}
                  onChangeText={(value) => updateField('insurancePolicy', value)}
                  placeholder="Insurance policy number"
                  placeholderTextColor={COLORS.TEXT_SECONDARY}
                />
              </View>
            </>
          )}
        </View>

        {/* Certifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certifications</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Add Certification</Text>
            <View style={styles.addCertificationRow}>
              <TextInput
                style={[styles.input, styles.addCertificationInput]}
                value={newCertification}
                onChangeText={setNewCertification}
                placeholder="Certificate or qualification name"
                placeholderTextColor={COLORS.TEXT_SECONDARY}
              />
              <TouchableOpacity style={styles.addButton} onPress={addCertification}>
                <Ionicons name="add" size={20} color={COLORS.WHITE} />
              </TouchableOpacity>
            </View>
          </View>

          {businessInfo.certifications.map((cert, index) => (
            <View key={index} style={styles.certificationItem}>
              <View style={styles.certificationLeft}>
                <Ionicons name="ribbon-outline" size={16} color={COLORS.SUCCESS} />
                <Text style={styles.certificationText}>{cert}</Text>
              </View>
              <TouchableOpacity onPress={() => removeCertification(index)}>
                <Ionicons name="close-circle" size={20} color={COLORS.ERROR} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Online Presence */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Online Presence</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Website URL</Text>
            <TextInput
              style={styles.input}
              value={businessInfo.websiteUrl}
              onChangeText={(value) => updateField('websiteUrl', value)}
              placeholder="https://yourwebsite.com"
              placeholderTextColor={COLORS.TEXT_SECONDARY}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Instagram</Text>
            <TextInput
              style={styles.input}
              value={businessInfo.socialMedia.instagram}
              onChangeText={(value) => updateSocialMedia('instagram', value)}
              placeholder="@yourusername"
              placeholderTextColor={COLORS.TEXT_SECONDARY}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Facebook</Text>
            <TextInput
              style={styles.input}
              value={businessInfo.socialMedia.facebook}
              onChangeText={(value) => updateSocialMedia('facebook', value)}
              placeholder="facebook.com/yourpage"
              placeholderTextColor={COLORS.TEXT_SECONDARY}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>TikTok</Text>
            <TextInput
              style={styles.input}
              value={businessInfo.socialMedia.tiktok}
              onChangeText={(value) => updateSocialMedia('tiktok', value)}
              placeholder="@yourusername"
              placeholderTextColor={COLORS.TEXT_SECONDARY}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.bottomSpacing} />
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
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
  },
  saveButtonText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.LG,
  },
  section: {
    marginTop: SPACING.LG,
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.LG,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.LG,
  },
  formGroup: {
    marginBottom: SPACING.MD,
  },
  label: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  input: {
    backgroundColor: COLORS.GRAY_100,
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
    borderRadius: BORDER_RADIUS.MD,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  typeButton: {
    backgroundColor: COLORS.GRAY_200,
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
    borderRadius: BORDER_RADIUS.MD,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  typeButtonSelected: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  typeButtonText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
  },
  typeButtonTextSelected: {
    color: COLORS.WHITE,
  },
  toggleGroup: {
    marginBottom: SPACING.MD,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.SM,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.MD,
  },
  addCertificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  addCertificationInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: COLORS.SUCCESS,
    borderRadius: BORDER_RADIUS.SM,
    padding: SPACING.SM,
  },
  certificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.GRAY_100,
    borderRadius: BORDER_RADIUS.SM,
    padding: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  certificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  certificationText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.SM,
    flex: 1,
  },
  bottomSpacing: {
    height: SPACING.XL,
  },
});