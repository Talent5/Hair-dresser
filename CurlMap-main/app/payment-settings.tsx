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
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

interface BankDetails {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  accountType: 'checking' | 'savings';
}

interface PaymentSettings {
  acceptCash: boolean;
  acceptCard: boolean;
  acceptDigitalPayments: boolean;
  acceptDeposits: boolean;
  depositPercentage: number;
  cancellationPolicy: string;
  refundPolicy: string;
  bankDetails: BankDetails;
  payoutSchedule: 'daily' | 'weekly' | 'monthly';
  minimumPayout: number;
  taxId: string;
  businessEIN: string;
}

const PAYOUT_SCHEDULES = [
  { value: 'daily', label: 'Daily', description: 'Receive payouts every business day' },
  { value: 'weekly', label: 'Weekly', description: 'Receive payouts every Friday' },
  { value: 'monthly', label: 'Monthly', description: 'Receive payouts on the 1st of each month' },
] as const;

const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking Account' },
  { value: 'savings', label: 'Savings Account' },
] as const;

export default function PaymentSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [settings, setSettings] = useState<PaymentSettings>({
    acceptCash: true,
    acceptCard: true,
    acceptDigitalPayments: true,
    acceptDeposits: false,
    depositPercentage: 25,
    cancellationPolicy: '',
    refundPolicy: '',
    bankDetails: {
      accountHolderName: '',
      bankName: '',
      accountNumber: '',
      routingNumber: '',
      accountType: 'checking',
    },
    payoutSchedule: 'weekly',
    minimumPayout: 25,
    taxId: '',
    businessEIN: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('payment-methods');

  useEffect(() => {
    loadPaymentSettings();
  }, []);

  const loadPaymentSettings = async () => {
    setIsLoading(true);
    try {
      const response = await api.getStylistPaymentSettings();
      if (response.success && response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Error loading payment settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = (field: keyof PaymentSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const updateBankDetails = (field: keyof BankDetails, value: string) => {
    setSettings(prev => ({
      ...prev,
      bankDetails: { ...prev.bankDetails, [field]: value }
    }));
  };

  const handleSave = async () => {
    // Validation
    if (!settings.acceptCash && !settings.acceptCard && !settings.acceptDigitalPayments) {
      Alert.alert('Error', 'Please select at least one payment method');
      return;
    }

    if (settings.acceptDeposits && (settings.depositPercentage < 1 || settings.depositPercentage > 100)) {
      Alert.alert('Error', 'Deposit percentage must be between 1% and 100%');
      return;
    }

    if (settings.acceptCard || settings.acceptDigitalPayments) {
      const { bankDetails } = settings;
      if (!bankDetails.accountHolderName || !bankDetails.bankName || 
          !bankDetails.accountNumber || !bankDetails.routingNumber) {
        Alert.alert('Error', 'Bank details are required for card and digital payments');
        return;
      }
    }

    setIsLoading(true);
    try {
      const response = await api.updateStylistPaymentSettings(settings);
      if (response.success) {
        Alert.alert(
          'Success',
          'Payment settings updated successfully!',
          [{ text: 'OK', onPress: () => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/stylist-dashboard' as any);
            }
          }}]
        );
      } else {
        throw new Error(response.message || 'Failed to update payment settings');
      }
    } catch (error: any) {
      console.error('Error updating payment settings:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to update payment settings. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderSection = (sectionId: string, title: string, icon: string, children: React.ReactNode) => {
    const isActive = activeSection === sectionId;
    
    return (
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setActiveSection(isActive ? '' : sectionId)}
        >
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name={icon as any} size={20} color={COLORS.PRIMARY} />
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
          <Ionicons 
            name={isActive ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={COLORS.TEXT_SECONDARY} 
          />
        </TouchableOpacity>
        
        {isActive && <View style={styles.sectionContent}>{children}</View>}
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>Payment Settings</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={isLoading}>
          <Text style={[styles.saveButtonText, isLoading && styles.saveButtonDisabled]}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Payment Methods */}
        {renderSection('payment-methods', 'Payment Methods', 'card-outline', (
          <View>
            <View style={styles.paymentMethod}>
              <View style={styles.paymentMethodLeft}>
                <Ionicons name="cash-outline" size={20} color={COLORS.SUCCESS} />
                <View style={styles.paymentMethodInfo}>
                  <Text style={styles.paymentMethodTitle}>Cash Payments</Text>
                  <Text style={styles.paymentMethodDescription}>Accept cash at appointment</Text>
                </View>
              </View>
              <Switch
                value={settings.acceptCash}
                onValueChange={(value) => updateSettings('acceptCash', value)}
                trackColor={{ false: COLORS.GRAY_300, true: COLORS.SUCCESS + '40' }}
                thumbColor={settings.acceptCash ? COLORS.SUCCESS : COLORS.GRAY_400}
              />
            </View>

            <View style={styles.paymentMethod}>
              <View style={styles.paymentMethodLeft}>
                <Ionicons name="card-outline" size={20} color={COLORS.INFO} />
                <View style={styles.paymentMethodInfo}>
                  <Text style={styles.paymentMethodTitle}>Card Payments</Text>
                  <Text style={styles.paymentMethodDescription}>Credit/debit cards via app</Text>
                </View>
              </View>
              <Switch
                value={settings.acceptCard}
                onValueChange={(value) => updateSettings('acceptCard', value)}
                trackColor={{ false: COLORS.GRAY_300, true: COLORS.SUCCESS + '40' }}
                thumbColor={settings.acceptCard ? COLORS.SUCCESS : COLORS.GRAY_400}
              />
            </View>

            <View style={styles.paymentMethod}>
              <View style={styles.paymentMethodLeft}>
                <Ionicons name="phone-portrait-outline" size={20} color={COLORS.PRIMARY} />
                <View style={styles.paymentMethodInfo}>
                  <Text style={styles.paymentMethodTitle}>Digital Payments</Text>
                  <Text style={styles.paymentMethodDescription}>Apple Pay, Google Pay, etc.</Text>
                </View>
              </View>
              <Switch
                value={settings.acceptDigitalPayments}
                onValueChange={(value) => updateSettings('acceptDigitalPayments', value)}
                trackColor={{ false: COLORS.GRAY_300, true: COLORS.SUCCESS + '40' }}
                thumbColor={settings.acceptDigitalPayments ? COLORS.SUCCESS : COLORS.GRAY_400}
              />
            </View>
          </View>
        ))}

        {/* Deposits */}
        {renderSection('deposits', 'Deposits & Booking', 'wallet-outline', (
          <View>
            <View style={styles.depositToggle}>
              <View style={styles.depositToggleLeft}>
                <View style={styles.depositToggleInfo}>
                  <Text style={styles.depositToggleTitle}>Require Deposits</Text>
                  <Text style={styles.depositToggleDescription}>
                    Collect deposits when clients book appointments
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.acceptDeposits}
                onValueChange={(value) => updateSettings('acceptDeposits', value)}
                trackColor={{ false: COLORS.GRAY_300, true: COLORS.SUCCESS + '40' }}
                thumbColor={settings.acceptDeposits ? COLORS.SUCCESS : COLORS.GRAY_400}
              />
            </View>

            {settings.acceptDeposits && (
              <View style={styles.depositPercentage}>
                <Text style={styles.label}>Deposit Percentage</Text>
                <View style={styles.percentageInput}>
                  <TextInput
                    style={styles.percentageInputField}
                    value={settings.depositPercentage.toString()}
                    onChangeText={(value) => {
                      const percentage = parseInt(value) || 0;
                      updateSettings('depositPercentage', Math.min(100, Math.max(0, percentage)));
                    }}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                  <Text style={styles.percentageSymbol}>%</Text>
                </View>
                <Text style={styles.percentageDescription}>
                  Clients will pay {settings.depositPercentage}% upfront when booking
                </Text>
              </View>
            )}
          </View>
        ))}

        {/* Bank Details */}
        {(settings.acceptCard || settings.acceptDigitalPayments) && renderSection('bank-details', 'Bank Details', 'business-outline', (
          <View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Account Holder Name *</Text>
              <TextInput
                style={styles.input}
                value={settings.bankDetails.accountHolderName}
                onChangeText={(value) => updateBankDetails('accountHolderName', value)}
                placeholder="Full name on account"
                placeholderTextColor={COLORS.TEXT_SECONDARY}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Bank Name *</Text>
              <TextInput
                style={styles.input}
                value={settings.bankDetails.bankName}
                onChangeText={(value) => updateBankDetails('bankName', value)}
                placeholder="Your bank's name"
                placeholderTextColor={COLORS.TEXT_SECONDARY}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Account Type</Text>
              <View style={styles.accountTypeRow}>
                {ACCOUNT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.accountTypeButton,
                      settings.bankDetails.accountType === type.value && styles.accountTypeButtonSelected
                    ]}
                    onPress={() => updateBankDetails('accountType', type.value)}
                  >
                    <Text style={[
                      styles.accountTypeText,
                      settings.bankDetails.accountType === type.value && styles.accountTypeTextSelected
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Account Number *</Text>
              <TextInput
                style={styles.input}
                value={settings.bankDetails.accountNumber}
                onChangeText={(value) => updateBankDetails('accountNumber', value)}
                placeholder="Your account number"
                placeholderTextColor={COLORS.TEXT_SECONDARY}
                keyboardType="numeric"
                secureTextEntry
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Routing Number *</Text>
              <TextInput
                style={styles.input}
                value={settings.bankDetails.routingNumber}
                onChangeText={(value) => updateBankDetails('routingNumber', value)}
                placeholder="9-digit routing number"
                placeholderTextColor={COLORS.TEXT_SECONDARY}
                keyboardType="numeric"
                maxLength={9}
              />
            </View>
          </View>
        ))}

        {/* Payout Settings */}
        {renderSection('payout-settings', 'Payout Settings', 'trending-up-outline', (
          <View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Payout Schedule</Text>
              {PAYOUT_SCHEDULES.map((schedule) => (
                <TouchableOpacity
                  key={schedule.value}
                  style={[
                    styles.payoutOption,
                    settings.payoutSchedule === schedule.value && styles.payoutOptionSelected
                  ]}
                  onPress={() => updateSettings('payoutSchedule', schedule.value)}
                >
                  <View style={styles.payoutOptionLeft}>
                    <View style={[
                      styles.radioButton,
                      settings.payoutSchedule === schedule.value && styles.radioButtonSelected
                    ]}>
                      {settings.payoutSchedule === schedule.value && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                    <View style={styles.payoutOptionInfo}>
                      <Text style={styles.payoutOptionTitle}>{schedule.label}</Text>
                      <Text style={styles.payoutOptionDescription}>{schedule.description}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Minimum Payout Amount</Text>
              <View style={styles.minimumPayoutInput}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.minimumPayoutField}
                  value={settings.minimumPayout.toString()}
                  onChangeText={(value) => {
                    const amount = parseFloat(value) || 0;
                    updateSettings('minimumPayout', Math.max(0, amount));
                  }}
                  keyboardType="decimal-pad"
                  placeholder="25.00"
                  placeholderTextColor={COLORS.TEXT_SECONDARY}
                />
              </View>
              <Text style={styles.minimumPayoutDescription}>
                Payouts will be held until this amount is reached
              </Text>
            </View>
          </View>
        ))}

        {/* Tax Information */}
        {renderSection('tax-info', 'Tax Information', 'document-text-outline', (
          <View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tax ID (SSN/ITIN)</Text>
              <TextInput
                style={styles.input}
                value={settings.taxId}
                onChangeText={(value) => updateSettings('taxId', value)}
                placeholder="XXX-XX-XXXX"
                placeholderTextColor={COLORS.TEXT_SECONDARY}
                keyboardType="numeric"
                secureTextEntry
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Business EIN (if applicable)</Text>
              <TextInput
                style={styles.input}
                value={settings.businessEIN}
                onChangeText={(value) => updateSettings('businessEIN', value)}
                placeholder="XX-XXXXXXX"
                placeholderTextColor={COLORS.TEXT_SECONDARY}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.taxDisclaimer}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.INFO} />
              <Text style={styles.taxDisclaimerText}>
                Tax information is required for payment processing and 1099 reporting
              </Text>
            </View>
          </View>
        ))}

        {/* Policies */}
        {renderSection('policies', 'Policies', 'shield-checkmark-outline', (
          <View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Cancellation Policy</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={settings.cancellationPolicy}
                onChangeText={(value) => updateSettings('cancellationPolicy', value)}
                placeholder="Describe your cancellation policy..."
                placeholderTextColor={COLORS.TEXT_SECONDARY}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Refund Policy</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={settings.refundPolicy}
                onChangeText={(value) => updateSettings('refundPolicy', value)}
                placeholder="Describe your refund policy..."
                placeholderTextColor={COLORS.TEXT_SECONDARY}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        ))}

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
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.MD,
  },
  sectionContent: {
    padding: SPACING.LG,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodInfo: {
    marginLeft: SPACING.MD,
  },
  paymentMethodTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  paymentMethodDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.XS,
  },
  depositToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.LG,
  },
  depositToggleLeft: {
    flex: 1,
  },
  depositToggleInfo: {
    flex: 1,
  },
  depositToggleTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  depositToggleDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.XS,
  },
  depositPercentage: {
    marginTop: SPACING.MD,
  },
  percentageInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY_100,
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
    borderRadius: BORDER_RADIUS.MD,
    paddingHorizontal: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  percentageInputField: {
    flex: 1,
    paddingVertical: SPACING.MD,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
  },
  percentageSymbol: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.SM,
  },
  percentageDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  formGroup: {
    marginBottom: SPACING.LG,
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
    height: 100,
    textAlignVertical: 'top',
  },
  accountTypeRow: {
    flexDirection: 'row',
    gap: SPACING.SM,
  },
  accountTypeButton: {
    flex: 1,
    backgroundColor: COLORS.GRAY_200,
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
    borderRadius: BORDER_RADIUS.MD,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
  },
  accountTypeButtonSelected: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  accountTypeText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  accountTypeTextSelected: {
    color: COLORS.WHITE,
  },
  payoutOption: {
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  payoutOptionSelected: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY + '10',
  },
  payoutOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.GRAY_300,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.MD,
  },
  radioButtonSelected: {
    borderColor: COLORS.PRIMARY,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.PRIMARY,
  },
  payoutOptionInfo: {
    flex: 1,
  },
  payoutOptionTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  payoutOptionDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.XS,
  },
  minimumPayoutInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY_100,
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
    borderRadius: BORDER_RADIUS.MD,
    paddingHorizontal: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  currencySymbol: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    marginRight: SPACING.SM,
  },
  minimumPayoutField: {
    flex: 1,
    paddingVertical: SPACING.MD,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
  },
  minimumPayoutDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  taxDisclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.INFO + '10',
    borderRadius: BORDER_RADIUS.SM,
    padding: SPACING.MD,
    marginTop: SPACING.MD,
  },
  taxDisclaimerText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.INFO,
    marginLeft: SPACING.SM,
    flex: 1,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: SPACING.XL,
  },
});