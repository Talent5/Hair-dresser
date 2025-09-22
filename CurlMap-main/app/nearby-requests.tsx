import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AuthContext from '../contexts/AuthContext';
import api from '../services/api';

interface StyleRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  styleDescription: string;
  offerPrice: number;
  preferredTime?: string;
  additionalNotes?: string;
  status: 'pending' | 'offered' | 'accepted' | 'completed';
  location?: any;
  createdAt: string;
  distance?: number;
}

const NearbyRequestsScreen = () => {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const [requests, setRequests] = useState<StyleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNearbyRequests = async () => {
    try {
      if (!user?.location?.coordinates) {
        Alert.alert('Location Required', 'Please enable location services to see nearby requests');
        return;
      }

      const [lng, lat] = user.location.coordinates;
      const response = await api.getNearbyRequests({ lat, lng });
      setRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching nearby requests:', error);
      Alert.alert('Error', 'Failed to load nearby requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNearbyRequests();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNearbyRequests();
  };

  const handleMakeOffer = (requestId: string) => {
    router.push({
      pathname: '/make-offer',
      params: { requestId },
    });
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    return distance < 1 ? `${Math.round(distance * 1000)}m away` : `${distance.toFixed(1)}km away`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  const renderRequestItem = ({ item }: { item: StyleRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{item.clientName}</Text>
          <Text style={styles.timeAgo}>{formatTime(item.createdAt)}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(item.offerPrice)}</Text>
          {item.distance && (
            <Text style={styles.distance}>{formatDistance(item.distance)}</Text>
          )}
        </View>
      </View>

      <View style={styles.requestBody}>
        <Text style={styles.styleDescription}>{item.styleDescription}</Text>
        
        {item.preferredTime && (
          <View style={styles.timePreference}>
            <Text style={styles.timeLabel}>Preferred Time:</Text>
            <Text style={styles.timeValue}>{item.preferredTime}</Text>
          </View>
        )}

        {item.additionalNotes && (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>Additional Notes:</Text>
            <Text style={styles.notesValue}>{item.additionalNotes}</Text>
          </View>
        )}
      </View>

      <View style={styles.requestActions}>
        <TouchableOpacity
          style={styles.offerButton}
          onPress={() => handleMakeOffer(item.id)}
        >
          <Text style={styles.offerButtonText}>Make Offer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No Nearby Requests</Text>
      <Text style={styles.emptySubtitle}>
        There are no styling requests in your area right now.
        Pull down to refresh and check for new requests.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e91e63" />
        <Text style={styles.loadingText}>Loading nearby requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nearby Requests</Text>
        <Text style={styles.subtitle}>
          Styling requests from clients in your area
        </Text>
      </View>

      <FlatList
        data={requests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#e91e63']}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  listContainer: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 2,
  },
  timeAgo: {
    fontSize: 14,
    color: '#6c757d',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e91e63',
    marginBottom: 2,
  },
  distance: {
    fontSize: 12,
    color: '#6c757d',
  },
  requestBody: {
    marginBottom: 16,
  },
  styleDescription: {
    fontSize: 16,
    color: '#212529',
    lineHeight: 22,
    marginBottom: 12,
  },
  timePreference: {
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 14,
    color: '#212529',
  },
  notes: {
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 2,
  },
  notesValue: {
    fontSize: 14,
    color: '#212529',
    lineHeight: 18,
  },
  requestActions: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 12,
  },
  offerButton: {
    backgroundColor: '#e91e63',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  offerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
});

export default NearbyRequestsScreen;