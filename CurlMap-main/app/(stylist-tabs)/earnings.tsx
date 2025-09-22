import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';

interface EarningsData {
  totalEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  pendingPayouts: number;
  completedBookings: number;
  averageBookingValue: number;
}

interface Transaction {
  _id: string;
  type: 'earning' | 'payout' | 'refund';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  bookingId?: string;
}

const PERIOD_OPTIONS = [
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
  { label: 'All Time', value: 'all' },
];

export default function StylistEarnings() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    pendingPayouts: 0,
    completedBookings: 0,
    averageBookingValue: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEarningsData();
  }, [selectedPeriod]);

  const loadEarningsData = async () => {
    // Check if user is a stylist before making API calls
    if (!user || !user.isStylist) {
      console.log('User is not a stylist, skipping earnings data load');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const [earningsResponse, transactionsResponse] = await Promise.all([
        apiService.getStylistEarnings(selectedPeriod),
        apiService.getStylistTransactions({ limit: 20, period: selectedPeriod })
      ]);

      if (earningsResponse.success && earningsResponse.data?.earnings) {
        setEarnings(earningsResponse.data.earnings);
      } else {
        console.warn('Failed to load earnings:', earningsResponse.message);
        // Keep default values for earnings
      }

      if (transactionsResponse.success && transactionsResponse.data?.transactions) {
        setTransactions(transactionsResponse.data.transactions);
      } else {
        console.warn('Failed to load transactions:', transactionsResponse.message);
        // Keep empty array for transactions
      }
    } catch (error) {
      console.error('Failed to load earnings data:', error);
      // Don't show alert for network errors, just log them
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Network')) {
        console.log('Network error - app will retry on next refresh');
      } else {
        Alert.alert('Error', 'Failed to load earnings data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEarningsData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earning': return 'add-circle';
      case 'payout': return 'card';
      case 'refund': return 'remove-circle';
      default: return 'swap-horizontal';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earning': return COLORS.SUCCESS;
      case 'payout': return COLORS.PRIMARY;
      case 'refund': return COLORS.ERROR;
      default: return COLORS.GRAY_400;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return COLORS.SUCCESS;
      case 'pending': return COLORS.WARNING;
      case 'failed': return COLORS.ERROR;
      default: return COLORS.GRAY_400;
    }
  };

  // Non-stylist users should not access this screen
  if (!user || !user.isStylist) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.accessDeniedContainer}>
          <Ionicons name="warning-outline" size={64} color={COLORS.WARNING} />
          <Text style={styles.accessDeniedTitle}>Stylist Access Only</Text>
          <Text style={styles.accessDeniedMessage}>
            Earnings tracking is only available for stylists. Please log in with a stylist account.
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={[COLORS.SUCCESS, COLORS.PRIMARY]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.headerTitle}>Earnings</Text>
                <View style={styles.headerSubtitleContainer}>
                  <Text style={styles.headerSubtitle}>Track your income and payouts</Text>
                  {loading && (
                    <Text style={styles.dataStatus}>• Loading real data...</Text>
                  )}
                  {!loading && (
                    <Text style={styles.dataStatus}>• Live data</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity 
                style={styles.menuButton}
                onPress={() => router.push('/stylist-menu')}
              >
                <Ionicons name="menu-outline" size={24} color={COLORS.WHITE} />
              </TouchableOpacity>
            </View>

            {/* Total Earnings Card */}
            <View style={styles.totalEarningsCard}>
              <Text style={styles.totalLabel}>Total Earnings</Text>
              <Text style={styles.totalAmount}>{formatCurrency(earnings.totalEarnings)}</Text>
              <View style={styles.earningsStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{earnings.completedBookings}</Text>
                  <Text style={styles.statLabel}>Bookings</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{formatCurrency(earnings.averageBookingValue)}</Text>
                  <Text style={styles.statLabel}>Avg. Value</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Period Selector */}
        <View style={styles.periodContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {PERIOD_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.periodButton,
                  selectedPeriod === option.value && styles.periodButtonActive
                ]}
                onPress={() => setSelectedPeriod(option.value)}
              >
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === option.value && styles.periodButtonTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Earnings Overview */}
        <View style={styles.overviewContainer}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <View style={[styles.overviewIcon, { backgroundColor: `${COLORS.SUCCESS}20` }]}>
                <Ionicons name="trending-up" size={24} color={COLORS.SUCCESS} />
              </View>
              <Text style={styles.overviewValue}>{formatCurrency(earnings.monthlyEarnings)}</Text>
              <Text style={styles.overviewLabel}>This Month</Text>
            </View>

            <View style={styles.overviewCard}>
              <View style={[styles.overviewIcon, { backgroundColor: `${COLORS.WARNING}20` }]}>
                <Ionicons name="time" size={24} color={COLORS.WARNING} />
              </View>
              <Text style={styles.overviewValue}>{formatCurrency(earnings.pendingPayouts)}</Text>
              <Text style={styles.overviewLabel}>Pending</Text>
            </View>

            <View style={styles.overviewCard}>
              <View style={[styles.overviewIcon, { backgroundColor: `${COLORS.PRIMARY}20` }]}>
                <Ionicons name="calendar" size={24} color={COLORS.PRIMARY} />
              </View>
              <Text style={styles.overviewValue}>{formatCurrency(earnings.weeklyEarnings)}</Text>
              <Text style={styles.overviewLabel}>This Week</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="card" size={28} color={COLORS.PRIMARY} />
              <Text style={styles.actionLabel}>Request Payout</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="document-text" size={28} color={COLORS.SECONDARY} />
              <Text style={styles.actionLabel}>Generate Report</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="settings" size={28} color={COLORS.TEXT_SECONDARY} />
              <Text style={styles.actionLabel}>Payment Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="help-circle" size={28} color={COLORS.PRIMARY} />
              <Text style={styles.actionLabel}>Help & FAQ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <View key={transaction._id} style={styles.transactionCard}>
                <View style={styles.transactionLeft}>
                  <View style={[
                    styles.transactionIcon,
                    { backgroundColor: `${getTransactionColor(transaction.type)}20` }
                  ]}>
                    <Ionicons
                      name={getTransactionIcon(transaction.type)}
                      size={20}
                      color={getTransactionColor(transaction.type)}
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDescription}>{transaction.description}</Text>
                    <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={[
                    styles.transactionAmount,
                    { 
                      color: transaction.type === 'earning' 
                        ? COLORS.SUCCESS 
                        : transaction.type === 'refund' 
                          ? COLORS.ERROR 
                          : COLORS.TEXT_PRIMARY 
                    }
                  ]}>
                    {transaction.type === 'earning' ? '+' : transaction.type === 'refund' ? '-' : ''}
                    {formatCurrency(transaction.amount)}
                  </Text>
                  <View style={styles.transactionStatus}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(transaction.status) }
                    ]} />
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(transaction.status) }
                    ]}>
                      {transaction.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="card-outline" size={48} color={COLORS.GRAY_400} />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>Your earnings and payouts will appear here</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    borderBottomLeftRadius: BORDER_RADIUS.XL,
    borderBottomRightRadius: BORDER_RADIUS.XL,
  },
  headerContent: {
    padding: SPACING.XL,
    paddingTop: SPACING.LG,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.LG,
  },
  menuButton: {
    padding: SPACING.SM,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BORDER_RADIUS.SM,
  },
  headerTitle: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: SPACING.XS,
  },
  headerSubtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.MD,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  dataStatus: {
    fontSize: FONT_SIZES.SM,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: SPACING.SM,
  },
  totalEarningsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.XL,
    alignItems: 'center',
    marginTop: SPACING.LG,
  },
  totalLabel: {
    fontSize: FONT_SIZES.MD,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: SPACING.SM,
  },
  totalAmount: {
    fontSize: FONT_SIZES.XXXL,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: SPACING.LG,
  },
  earningsStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  statLabel: {
    fontSize: FONT_SIZES.SM,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: SPACING.XS,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: SPACING.LG,
  },
  periodContainer: {
    paddingVertical: SPACING.LG,
    paddingHorizontal: SPACING.XL,
  },
  periodButton: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.LG,
    backgroundColor: COLORS.WHITE,
    marginRight: SPACING.SM,
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
  },
  periodButtonActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  periodButtonText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  periodButtonTextActive: {
    color: COLORS.WHITE,
  },
  overviewContainer: {
    paddingHorizontal: SPACING.XL,
    marginBottom: SPACING.XL,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.LG,
  },
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.LG,
    alignItems: 'center',
    width: '31%',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  overviewValue: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  overviewLabel: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  actionsContainer: {
    paddingHorizontal: SPACING.XL,
    marginBottom: SPACING.XL,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.LG,
    alignItems: 'center',
    width: '48%',
    marginBottom: SPACING.MD,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionLabel: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.SM,
    textAlign: 'center',
  },
  transactionsContainer: {
    paddingHorizontal: SPACING.XL,
    paddingBottom: SPACING.XL,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  viewAllText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  transactionCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.LG,
    marginBottom: SPACING.MD,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  transactionDate: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.XS,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    marginBottom: SPACING.XS,
  },
  transactionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: SPACING.XS,
  },
  statusText: {
    fontSize: FONT_SIZES.XS,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },
  emptyText: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.MD,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: SPACING.SM,
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.XL,
  },
  accessDeniedTitle: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.LG,
    marginBottom: SPACING.MD,
  },
  accessDeniedMessage: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.XL,
  },
  backButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.MD,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
});