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
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AuthContext from '../contexts/AuthContext';
import api from '../services/api';

interface Offer {
  id: string;
  stylistId: string;
  stylistName: string;
  stylistAvatar?: string;
  stylistRating: number;
  stylistReviewCount: number;
  price: number;
  estimatedTime: string;
  message: string;
  portfolio?: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

const ViewOffersScreen = () => {
  const router = useRouter();
  const { requestId } = useLocalSearchParams();
  const authContext = useContext(AuthContext);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingOffer, setAcceptingOffer] = useState<string | null>(null);

  const fetchOffers = async () => {
    try {
      const response = await api.getRequestOffers(requestId as string);
      setOffers(response.data || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
      Alert.alert('Error', 'Failed to load offers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOffers();
  };

  const handleAcceptOffer = async (offerId: string) => {
    Alert.alert(
      'Accept Offer',
      'Are you sure you want to accept this offer? This will reject all other offers.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setAcceptingOffer(offerId);
            try {
              await api.acceptOffer(requestId as string, offerId);
              Alert.alert(
                'Offer Accepted',
                'You have accepted this offer! You can now chat with the stylist.',
                [
                  {
                    text: 'Start Chat',
                    onPress: () => {
                      const acceptedOffer = offers.find(o => o.id === offerId);
                      if (acceptedOffer) {
                        router.push({
                          pathname: '/chat-room',
                          params: { userId: acceptedOffer.stylistId },
                        });
                      }
                    },
                  },
                ]
              );
              fetchOffers(); // Refresh to show updated status
            } catch (error) {
              console.error('Error accepting offer:', error);
              Alert.alert('Error', 'Failed to accept offer. Please try again.');
            } finally {
              setAcceptingOffer(null);
            }
          },
        },
      ]
    );
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const formatRating = (rating: number, reviewCount: number) => {
    return `${rating.toFixed(1)} (${reviewCount} reviews)`;
  };

  const renderOfferItem = ({ item }: { item: Offer }) => (
    <View style={styles.offerCard}>
      <View style={styles.offerHeader}>
        <View style={styles.stylistInfo}>
          {item.stylistAvatar ? (
            <Image source={{ uri: item.stylistAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {item.stylistName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.stylistDetails}>
            <Text style={styles.stylistName}>{item.stylistName}</Text>
            <Text style={styles.stylistRating}>
              ⭐ {formatRating(item.stylistRating, item.stylistReviewCount)}
            </Text>
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
          <Text style={styles.estimatedTime}>{item.estimatedTime}</Text>
        </View>
      </View>

      <View style={styles.offerBody}>
        <Text style={styles.message}>{item.message}</Text>
        
        {item.portfolio && (
          <TouchableOpacity style={styles.portfolioLink}>
            <Text style={styles.portfolioText}>View Portfolio</Text>
          </TouchableOpacity>
        )}
      </View>

      {item.status === 'pending' && (
        <View style={styles.offerActions}>
          <TouchableOpacity
            style={[
              styles.acceptButton,
              acceptingOffer === item.id && styles.disabledButton
            ]}
            onPress={() => handleAcceptOffer(item.id)}
            disabled={acceptingOffer === item.id}
          >
            {acceptingOffer === item.id ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.acceptButtonText}>Accept Offer</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'accepted' && (
        <View style={styles.statusContainer}>
          <Text style={styles.acceptedStatus}>✅ Accepted</Text>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => router.push({
              pathname: '/chat',
              params: { userId: item.stylistId },
            })}
          >
            <Text style={styles.chatButtonText}>Start Chat</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'rejected' && (
        <View style={styles.statusContainer}>
          <Text style={styles.rejectedStatus}>❌ Not Selected</Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No Offers Yet</Text>
      <Text style={styles.emptySubtitle}>
        Stylists haven't made any offers on your request yet.
        Pull down to refresh and check for new offers.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e91e63" />
        <Text style={styles.loadingText}>Loading offers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Offers</Text>
        <Text style={styles.subtitle}>
          Review offers from stylists and choose the best one
        </Text>
      </View>

      <FlatList
        data={offers}
        renderItem={renderOfferItem}
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
  offerCard: {
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
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stylistInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#e91e63',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stylistDetails: {
    flex: 1,
  },
  stylistName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 2,
  },
  stylistRating: {
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
  estimatedTime: {
    fontSize: 12,
    color: '#6c757d',
  },
  offerBody: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#212529',
    lineHeight: 22,
    marginBottom: 12,
  },
  portfolioLink: {
    alignSelf: 'flex-start',
  },
  portfolioText: {
    color: '#e91e63',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  offerActions: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 12,
  },
  acceptButton: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#adb5bd',
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  acceptedStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  rejectedStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc3545',
  },
  chatButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chatButtonText: {
    color: '#ffffff',
    fontSize: 14,
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

export default ViewOffersScreen;