import React from 'react';
import { LocationService } from '../utils/location';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  // Debug: Log the user object to see its structure
  console.log('Profile Screen - User object:', { user, hasName: !!user?.name, name: user?.name });

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  const handleBookings = () => {
    router.push('/bookings');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)' as any);
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Profile</Text>
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#666" />
              </View>
            )}
          </View>
          
          <Text style={styles.userName}>
            {user?.name && user.name.trim() !== '' ? user.name : 'User'}
          </Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          
          {user?.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={20} color="#666" />
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{user?.phone || 'Not provided'}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{LocationService.formatAddress(user?.location?.address) || 'Not provided'}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>{user?.memberSince || 'Unknown'}</Text>
          </View>

          {user?.isStylist && (
            <>
              <View style={styles.infoItem}>
                <Ionicons name="star-outline" size={20} color="#666" />
                <Text style={styles.infoLabel}>Rating</Text>
                <Text style={styles.infoValue}>
                  {(() => {
                    const rating = user.rating;
                    if (typeof rating === 'object' && rating && 'average' in rating) {
                      const avgRating = (rating as any).average || 0;
                      const count = (rating as any).count || 0;
                      return avgRating > 0 ? `${avgRating.toFixed(1)} (${count} reviews)` : 'No reviews yet';
                    }
                    return rating > 0 ? `${rating.toFixed(1)} (${user.reviewCount} reviews)` : 'No reviews yet';
                  })()}
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Ionicons name="cut-outline" size={20} color="#666" />
                <Text style={styles.infoLabel}>Specialties</Text>
                <Text style={styles.infoValue}>
                  {user.specialties.length > 0 ? user.specialties.join(', ') : 'None specified'}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEditProfile}>
            <Ionicons name="person-outline" size={20} color="#667eea" />
            <Text style={styles.actionText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleSettings}>
            <Ionicons name="settings-outline" size={20} color="#667eea" />
            <Text style={styles.actionText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => {}}>  
            <Ionicons name="help-circle-outline" size={20} color="#667eea" />
            <Text style={styles.actionText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
    marginLeft: 4,
  },
  infoSection: {
    backgroundColor: 'white',
    marginBottom: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#6b7280',
    flex: 2,
    textAlign: 'right',
  },
  actionsSection: {
    backgroundColor: 'white',
    marginBottom: 40,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  actionText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
});