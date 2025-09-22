import React, { useState, useContext } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import AuthContext from '../contexts/AuthContext';
import api from '../services/api';

const MakeOfferScreen = () => {
  const router = useRouter();
  const { requestId } = useLocalSearchParams();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    price: '',
    estimatedTime: '',
    message: '',
    portfolio: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.price.trim() || isNaN(Number(formData.price))) {
      Alert.alert('Error', 'Please enter a valid price');
      return false;
    }
    if (Number(formData.price) <= 0) {
      Alert.alert('Error', 'Price must be greater than 0');
      return false;
    }
    if (!formData.estimatedTime.trim()) {
      Alert.alert('Error', 'Please provide estimated time');
      return false;
    }
    if (!formData.message.trim()) {
      Alert.alert('Error', 'Please provide a message to the client');
      return false;
    }
    return true;
  };

  const handleSubmitOffer = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const offerData = {
        stylistId: user?.id,
        price: Number(formData.price),
        estimatedTime: formData.estimatedTime,
        message: formData.message,
        portfolio: formData.portfolio || undefined,
      };

      await api.makeOffer(requestId as string, offerData);
      
      Alert.alert(
        'Offer Submitted',
        'Your offer has been sent to the client. You will be notified if they accept.',
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
    } catch (error) {
      console.error('Error submitting offer:', error);
      Alert.alert('Error', 'Failed to submit offer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Make an Offer</Text>
        <Text style={styles.subtitle}>
          Provide your pricing and details for this styling request
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Your Price ($) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your price for this service"
            value={formData.price}
            onChangeText={(value) => handleInputChange('price', value)}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Estimated Time *</Text>
          <TextInput
            style={styles.input}
            placeholder="How long will this take? (e.g., 2 hours, 1.5 hours)"
            value={formData.estimatedTime}
            onChangeText={(value) => handleInputChange('estimatedTime', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Message to Client *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Introduce yourself and explain why you're the right stylist for this job..."
            value={formData.message}
            onChangeText={(value) => handleInputChange('message', value)}
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Portfolio Link (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Link to your work examples (Instagram, website, etc.)"
            value={formData.portfolio}
            onChangeText={(value) => handleInputChange('portfolio', value)}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmitOffer}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Offer</Text>
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
  submitButton: {
    backgroundColor: '#e91e63',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#adb5bd',
  },
  submitButtonText: {
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

export default MakeOfferScreen;