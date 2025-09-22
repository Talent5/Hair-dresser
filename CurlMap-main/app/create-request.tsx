import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';

const CreateRequestScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    styleDescription: '',
    offerPrice: '',
    preferredTime: '',
    additionalNotes: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.styleDescription.trim()) {
      Alert.alert('Error', 'Please describe the style you want');
      return false;
    }
    if (!formData.offerPrice.trim() || isNaN(Number(formData.offerPrice))) {
      Alert.alert('Error', 'Please enter a valid offer price');
      return false;
    }
    if (Number(formData.offerPrice) <= 0) {
      Alert.alert('Error', 'Offer price must be greater than 0');
      return false;
    }
    if (!user?.location || !user.location.coordinates || user.location.coordinates.length !== 2) {
      Alert.alert('Error', 'Location is required to create a request. Please update your profile with your location.');
      return false;
    }
    return true;
  };

  const handleCreateRequest = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Format location for backend (GeoJSON format)
      let requestLocation = null;
      if (user?.location && user.location.coordinates && user.location.coordinates.length === 2) {
        requestLocation = {
          type: 'Point',
          coordinates: user.location.coordinates,
          address: user.location.address || ''
        };
      }

      const requestData = {
        styleDescription: formData.styleDescription,
        offerPrice: Number(formData.offerPrice),
        preferredTime: formData.preferredTime,
        additionalNotes: formData.additionalNotes,
        location: requestLocation,
      };

      const response = await apiService.createRequest(requestData);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Your styling request has been created! Nearby stylists will be notified.',
          [
            {
              text: 'OK',
              onPress: () => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)' as any);
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to create request. Please try again.');
      }
    } catch (error: any) {
      console.error('Error creating request:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create request. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Styling Request</Text>
        <Text style={styles.subtitle}>
          Describe what you want and nearby stylists will offer their services
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Style Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the style you want (e.g., hair cut, color, braids, etc.)"
            value={formData.styleDescription}
            onChangeText={(value) => handleInputChange('styleDescription', value)}
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Your Offer Price ($) *</Text>
          <TextInput
            style={styles.input}
            placeholder="How much are you willing to pay?"
            value={formData.offerPrice}
            onChangeText={(value) => handleInputChange('offerPrice', value)}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Preferred Time</Text>
          <TextInput
            style={styles.input}
            placeholder="When would you like this done? (e.g., Today evening, Tomorrow morning)"
            value={formData.preferredTime}
            onChangeText={(value) => handleInputChange('preferredTime', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Additional Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any additional requirements or preferences..."
            value={formData.additionalNotes}
            onChangeText={(value) => handleInputChange('additionalNotes', value)}
            multiline={true}
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.createButton, loading && styles.disabledButton]}
          onPress={handleCreateRequest}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.createButtonText}>Create Request</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)' as any);
            }
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    lineHeight: 22,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#212529',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: '#e91e63',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#adb5bd',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6c757d',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateRequestScreen;