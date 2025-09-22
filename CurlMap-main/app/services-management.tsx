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
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  duration: number; // in minutes
  isActive: boolean;
  // Backend fields for compatibility
  _id?: string;
  basePrice?: {
    amount: number;
    currency: string;
  };
}

interface ServiceFormData {
  name: string;
  description: string;
  category: string;
  price: string;
  duration: string;
}

const SERVICE_CATEGORIES = [
  'Haircuts & Styling',
  'Coloring & Highlights',
  'Chemical Services',
  'Hair Care Treatments',
  'Extensions & Weaves',
  'Braiding & Protective Styles',
  'Special Occasion',
  'Consultations',
  'Add-ons'
];

export default function ServicesManagementScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    category: SERVICE_CATEGORIES[0],
    price: '',
    duration: '',
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const response = await api.getStylistServices();
      if (response.success) {
        // Transform services to map _id to id and basePrice.amount to price for frontend compatibility
        const transformedServices = (response.data.services || []).map((service: any) => ({
          ...service,
          id: service._id || service.id,
          price: service.basePrice?.amount || service.price || 0,
          // Keep basePrice for backward compatibility
          basePrice: service.basePrice
        }));
        setServices(transformedServices);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: SERVICE_CATEGORIES[0],
      price: '',
      duration: '',
    });
    setEditingService(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (service: Service) => {
    setFormData({
      name: service.name,
      description: service.description,
      category: service.category,
      price: (service.price || 0).toString(),
      duration: (service.duration || 0).toString(),
    });
    setEditingService(service);
    setShowAddModal(true);
  };

  const handleSaveService = async () => {
    if (!formData.name.trim() || !formData.price || !formData.duration) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const price = parseFloat(formData.price);
    const duration = parseInt(formData.duration);

    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    if (isNaN(duration) || duration <= 0) {
      Alert.alert('Error', 'Please enter a valid duration in minutes');
      return;
    }

    setIsLoading(true);
    try {
      const serviceData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        price,
        duration,
        isActive: true,
      };

      let response;
      if (editingService) {
        response = await api.updateStylistService(editingService.id, serviceData);
      } else {
        response = await api.createStylistService(serviceData);
      }

      if (response.success) {
        Alert.alert(
          'Success',
          `Service ${editingService ? 'updated' : 'created'} successfully!`
        );
        setShowAddModal(false);
        resetForm();
        await loadServices();
      } else {
        throw new Error(response.message || 'Failed to save service');
      }
    } catch (error: any) {
      console.error('Error saving service:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to save service. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleServiceStatus = async (service: Service) => {
    setIsLoading(true);
    try {
      const response = await api.updateStylistService(service.id, {
        name: service.name,
        description: service.description,
        category: service.category,
        price: service.price,
        duration: service.duration,
        isActive: !service.isActive,
      });

      if (response.success) {
        await loadServices();
      } else {
        throw new Error(response.message || 'Failed to update service status');
      }
    } catch (error: any) {
      console.error('Error updating service status:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to update service status. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const deleteService = async (serviceId: string) => {
    Alert.alert(
      'Delete Service',
      'Are you sure you want to delete this service? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const response = await api.deleteStylistService(serviceId);
              if (response.success) {
                await loadServices();
              } else {
                throw new Error(response.message || 'Failed to delete service');
              }
            } catch (error: any) {
              console.error('Error deleting service:', error);
              Alert.alert(
                'Error',
                error.message || 'Failed to delete service. Please try again.'
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const filteredServices = selectedCategory === 'All' 
    ? services 
    : services.filter(service => service.category === selectedCategory);

  const categories = ['All', ...SERVICE_CATEGORIES];

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const renderService = ({ item }: { item: Service }) => (
    <View style={[styles.serviceCard, !item.isActive && styles.serviceCardInactive]}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceInfo}>
          <Text style={[styles.serviceName, !item.isActive && styles.serviceNameInactive]}>
            {item.name}
          </Text>
          <Text style={styles.serviceCategory}>{item.category}</Text>
          {item.description ? (
            <Text style={styles.serviceDescription}>{item.description}</Text>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={() => toggleServiceStatus(item)}
          style={[styles.statusToggle, item.isActive ? styles.statusActive : styles.statusInactive]}
        >
          <Ionicons 
            name={item.isActive ? "checkmark" : "close"} 
            size={16} 
            color={COLORS.WHITE} 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.serviceDetails}>
        <View style={styles.serviceDetail}>
          <Ionicons name="time-outline" size={16} color={COLORS.TEXT_SECONDARY} />
          <Text style={styles.serviceDetailText}>{formatDuration(item.duration)}</Text>
        </View>
        <View style={styles.serviceDetail}>
          <Ionicons name="cash-outline" size={16} color={COLORS.TEXT_SECONDARY} />
          <Text style={styles.serviceDetailText}>${(item.price || 0).toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.serviceActions}>
        <TouchableOpacity
          onPress={() => openEditModal(item)}
          style={styles.actionButton}
        >
          <Ionicons name="pencil" size={16} color={COLORS.INFO} />
          <Text style={[styles.actionButtonText, { color: COLORS.INFO }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => deleteService(item.id)}
          style={styles.actionButton}
        >
          <Ionicons name="trash-outline" size={16} color={COLORS.ERROR} />
          <Text style={[styles.actionButtonText, { color: COLORS.ERROR }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/stylist-dashboard' as any);
          }
        }} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Services & Pricing</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
          <Ionicons name="add" size={20} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <View style={styles.categoryFilter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonSelected
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.categoryButtonTextSelected
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Services List */}
      <View style={styles.content}>
        {filteredServices.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cut-outline" size={48} color={COLORS.GRAY_400} />
            <Text style={styles.emptyStateTitle}>No Services Found</Text>
            <Text style={styles.emptyStateText}>
              {selectedCategory === 'All' 
                ? 'Start by adding your first service' 
                : `No services in ${selectedCategory} category`}
            </Text>
            <TouchableOpacity onPress={openAddModal} style={styles.emptyStateButton}>
              <Text style={styles.emptyStateButtonText}>Add Service</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredServices}
            renderItem={renderService}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.servicesList}
          />
        )}
      </View>

      {/* Add/Edit Service Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingService ? 'Edit Service' : 'Add Service'}
            </Text>
            <TouchableOpacity onPress={handleSaveService} disabled={isLoading}>
              <Text style={[styles.modalSave, isLoading && styles.modalSaveDisabled]}>
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Service Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(value) => setFormData({ ...formData, name: value })}
                placeholder="e.g., Women's Haircut"
                placeholderTextColor={COLORS.TEXT_SECONDARY}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Category *</Text>
              <View style={styles.categoryGrid}>
                {SERVICE_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryOption,
                      formData.category === category && styles.categoryOptionSelected
                    ]}
                    onPress={() => setFormData({ ...formData, category })}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      formData.category === category && styles.categoryOptionTextSelected
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => setFormData({ ...formData, description: value })}
                placeholder="Brief description of the service"
                placeholderTextColor={COLORS.TEXT_SECONDARY}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.label}>Price ($) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.price}
                  onChangeText={(value) => setFormData({ ...formData, price: value })}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.TEXT_SECONDARY}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.label}>Duration (mins) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.duration}
                  onChangeText={(value) => setFormData({ ...formData, duration: value })}
                  placeholder="60"
                  placeholderTextColor={COLORS.TEXT_SECONDARY}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  addButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: BORDER_RADIUS.SM,
    padding: SPACING.SM,
  },
  categoryFilter: {
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  categoryContainer: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
  },
  categoryButton: {
    backgroundColor: COLORS.GRAY_200,
    borderRadius: BORDER_RADIUS.MD,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    marginRight: SPACING.SM,
  },
  categoryButtonSelected: {
    backgroundColor: COLORS.PRIMARY,
  },
  categoryButtonText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  categoryButtonTextSelected: {
    color: COLORS.WHITE,
  },
  content: {
    flex: 1,
  },
  servicesList: {
    padding: SPACING.LG,
  },
  serviceCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.LG,
    marginBottom: SPACING.MD,
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
  },
  serviceCardInactive: {
    opacity: 0.7,
    backgroundColor: COLORS.GRAY_100,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.MD,
  },
  serviceInfo: {
    flex: 1,
    marginRight: SPACING.MD,
  },
  serviceName: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  serviceNameInactive: {
    color: COLORS.TEXT_SECONDARY,
  },
  serviceCategory: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.SM,
  },
  serviceDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
  statusToggle: {
    borderRadius: BORDER_RADIUS.SM,
    padding: SPACING.XS,
    minWidth: 24,
    alignItems: 'center',
  },
  statusActive: {
    backgroundColor: COLORS.SUCCESS,
  },
  statusInactive: {
    backgroundColor: COLORS.ERROR,
  },
  serviceDetails: {
    flexDirection: 'row',
    marginBottom: SPACING.MD,
  },
  serviceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.LG,
  },
  serviceDetailText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.XS,
    fontWeight: '500',
  },
  serviceActions: {
    flexDirection: 'row',
    paddingTop: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_200,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.LG,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.SM,
    marginLeft: SPACING.XS,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.XL,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.LG,
    marginBottom: SPACING.SM,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.XL,
  },
  emptyStateButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: BORDER_RADIUS.MD,
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.MD,
  },
  emptyStateButtonText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  // Modal Styles
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
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_300,
  },
  modalCancel: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.ERROR,
  },
  modalTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  modalSave: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  modalSaveDisabled: {
    opacity: 0.6,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.LG,
  },
  formGroup: {
    marginBottom: SPACING.LG,
  },
  formGroupHalf: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: SPACING.MD,
  },
  label: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  input: {
    backgroundColor: COLORS.WHITE,
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  categoryOption: {
    backgroundColor: COLORS.GRAY_200,
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
    borderRadius: BORDER_RADIUS.SM,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  categoryOptionSelected: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  categoryOptionText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
  },
  categoryOptionTextSelected: {
    color: COLORS.WHITE,
  },
});