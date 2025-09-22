import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

interface TimeSlot {
  start: string;
  end: string;
}

interface DaySchedule {
  isAvailable: boolean;
  timeSlots: TimeSlot[];
}

interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface AvailabilitySettings {
  weeklySchedule: WeeklySchedule;
  advanceBookingDays: number;
  bufferTime: number; // minutes between appointments
  allowSameDayBooking: boolean;
  allowWeekendBooking: boolean;
  breakTimes: TimeSlot[];
  isVacationMode: boolean;
  vacationMessage: string;
}

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

const TIME_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
];

export default function AvailabilitySettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [settings, setSettings] = useState<AvailabilitySettings>({
    weeklySchedule: {
      monday: { isAvailable: false, timeSlots: [] },
      tuesday: { isAvailable: false, timeSlots: [] },
      wednesday: { isAvailable: false, timeSlots: [] },
      thursday: { isAvailable: false, timeSlots: [] },
      friday: { isAvailable: false, timeSlots: [] },
      saturday: { isAvailable: false, timeSlots: [] },
      sunday: { isAvailable: false, timeSlots: [] },
    },
    advanceBookingDays: 30,
    bufferTime: 15,
    allowSameDayBooking: true,
    allowWeekendBooking: true,
    breakTimes: [],
    isVacationMode: false,
    vacationMessage: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  useEffect(() => {
    loadAvailabilitySettings();
  }, []);

  const loadAvailabilitySettings = async () => {
    setIsLoading(true);
    try {
      const response = await api.getStylistAvailability();
      if (response.success && response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Error loading availability settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateDayAvailability = (day: keyof WeeklySchedule, isAvailable: boolean) => {
    setSettings(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day],
          isAvailable,
          timeSlots: isAvailable ? prev.weeklySchedule[day].timeSlots : [],
        }
      }
    }));
  };

  const addTimeSlot = (day: keyof WeeklySchedule) => {
    const newSlot: TimeSlot = { start: '09:00', end: '17:00' };
    setSettings(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day],
          timeSlots: [...prev.weeklySchedule[day].timeSlots, newSlot],
        }
      }
    }));
  };

  const updateTimeSlot = (
    day: keyof WeeklySchedule,
    slotIndex: number,
    field: 'start' | 'end',
    value: string
  ) => {
    setSettings(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day],
          timeSlots: prev.weeklySchedule[day].timeSlots.map((slot, index) =>
            index === slotIndex ? { ...slot, [field]: value } : slot
          ),
        }
      }
    }));
  };

  const removeTimeSlot = (day: keyof WeeklySchedule, slotIndex: number) => {
    setSettings(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day],
          timeSlots: prev.weeklySchedule[day].timeSlots.filter((_, index) => index !== slotIndex),
        }
      }
    }));
  };

  const applyToAllDays = (sourceDay: keyof WeeklySchedule) => {
    const sourceSchedule = settings.weeklySchedule[sourceDay];
    Alert.alert(
      'Apply to All Days',
      'This will copy the current day\'s schedule to all other days. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: () => {
            const newSchedule = { ...settings.weeklySchedule };
            Object.keys(newSchedule).forEach(day => {
              if (day !== sourceDay) {
                newSchedule[day as keyof WeeklySchedule] = {
                  isAvailable: sourceSchedule.isAvailable,
                  timeSlots: [...sourceSchedule.timeSlots],
                };
              }
            });
            setSettings(prev => ({ ...prev, weeklySchedule: newSchedule }));
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    // Validation
    const hasValidSchedule = Object.values(settings.weeklySchedule).some(day => 
      day.isAvailable && day.timeSlots.length > 0
    );

    if (!hasValidSchedule && !settings.isVacationMode) {
      Alert.alert('Error', 'Please set at least one available day and time slot');
      return;
    }

    // Validate time slots
    for (const [dayKey, day] of Object.entries(settings.weeklySchedule)) {
      if (day.isAvailable) {
        for (const slot of day.timeSlots) {
          if (slot.start >= slot.end) {
            Alert.alert('Error', `Invalid time slot on ${dayKey}: Start time must be before end time`);
            return;
          }
        }
      }
    }

    setIsLoading(true);
    try {
      const response = await api.updateStylistAvailability(settings);
      if (response.success) {
        Alert.alert(
          'Success',
          'Availability settings updated successfully!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        throw new Error(response.message || 'Failed to update availability settings');
      }
    } catch (error: any) {
      console.error('Error updating availability settings:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to update availability settings. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderTimeSelector = (value: string, onSelect: (time: string) => void) => (
    <View style={styles.timeSelector}>
      <TouchableOpacity
        style={styles.timeSelectorButton}
        onPress={() => {
          Alert.alert(
            'Select Time',
            '',
            TIME_OPTIONS.map(time => ({
              text: time,
              onPress: () => onSelect(time),
            }))
          );
        }}
      >
        <Text style={styles.timeSelectorText}>{value}</Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.TEXT_SECONDARY} />
      </TouchableOpacity>
    </View>
  );

  const renderDaySchedule = (dayKey: keyof WeeklySchedule, dayLabel: string) => {
    const daySchedule = settings.weeklySchedule[dayKey];
    const isExpanded = expandedDay === dayKey;

    return (
      <View key={dayKey} style={styles.dayContainer}>
        <View style={styles.dayHeader}>
          <TouchableOpacity
            style={styles.dayToggle}
            onPress={() => setExpandedDay(isExpanded ? null : dayKey)}
          >
            <Text style={styles.dayLabel}>{dayLabel}</Text>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={COLORS.TEXT_SECONDARY} 
            />
          </TouchableOpacity>
          <Switch
            value={daySchedule.isAvailable}
            onValueChange={(value) => updateDayAvailability(dayKey, value)}
            trackColor={{ false: COLORS.GRAY_300, true: COLORS.SUCCESS + '40' }}
            thumbColor={daySchedule.isAvailable ? COLORS.SUCCESS : COLORS.GRAY_400}
          />
        </View>

        {isExpanded && daySchedule.isAvailable && (
          <View style={styles.dayContent}>
            {daySchedule.timeSlots.map((slot, index) => (
              <View key={index} style={styles.timeSlotRow}>
                <View style={styles.timeSlotInputs}>
                  {renderTimeSelector(slot.start, (time) => updateTimeSlot(dayKey, index, 'start', time))}
                  <Text style={styles.timeSlotSeparator}>to</Text>
                  {renderTimeSelector(slot.end, (time) => updateTimeSlot(dayKey, index, 'end', time))}
                </View>
                <TouchableOpacity
                  onPress={() => removeTimeSlot(dayKey, index)}
                  style={styles.removeSlotButton}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.ERROR} />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.dayActions}>
              <TouchableOpacity
                onPress={() => addTimeSlot(dayKey)}
                style={styles.addSlotButton}
              >
                <Ionicons name="add" size={16} color={COLORS.SUCCESS} />
                <Text style={styles.addSlotText}>Add Time Slot</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => applyToAllDays(dayKey)}
                style={styles.copyButton}
              >
                <Ionicons name="copy-outline" size={16} color={COLORS.INFO} />
                <Text style={styles.copyText}>Copy to All</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Availability Settings</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={isLoading}>
          <Text style={[styles.saveButtonText, isLoading && styles.saveButtonDisabled]}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Vacation Mode */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vacation Mode</Text>
          <View style={styles.vacationModeToggle}>
            <View style={styles.vacationModeLeft}>
              <Ionicons name="airplane-outline" size={20} color={COLORS.WARNING} />
              <Text style={styles.vacationModeLabel}>Vacation Mode</Text>
              <Text style={styles.vacationModeDescription}>Disable all bookings</Text>
            </View>
            <Switch
              value={settings.isVacationMode}
              onValueChange={(value) => setSettings(prev => ({ ...prev, isVacationMode: value }))}
              trackColor={{ false: COLORS.GRAY_300, true: COLORS.WARNING + '40' }}
              thumbColor={settings.isVacationMode ? COLORS.WARNING : COLORS.GRAY_400}
            />
          </View>
        </View>

        {!settings.isVacationMode && (
          <>
            {/* Weekly Schedule */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Weekly Schedule</Text>
              {DAYS.map(({ key, label }) => renderDaySchedule(key, label))}
            </View>

            {/* Booking Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Booking Settings</Text>
              
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.INFO} />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Same Day Booking</Text>
                    <Text style={styles.settingDescription}>Allow clients to book appointments today</Text>
                  </View>
                </View>
                <Switch
                  value={settings.allowSameDayBooking}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, allowSameDayBooking: value }))}
                  trackColor={{ false: COLORS.GRAY_300, true: COLORS.SUCCESS + '40' }}
                  thumbColor={settings.allowSameDayBooking ? COLORS.SUCCESS : COLORS.GRAY_400}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.INFO} />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Weekend Booking</Text>
                    <Text style={styles.settingDescription}>Accept bookings on weekends</Text>
                  </View>
                </View>
                <Switch
                  value={settings.allowWeekendBooking}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, allowWeekendBooking: value }))}
                  trackColor={{ false: COLORS.GRAY_300, true: COLORS.SUCCESS + '40' }}
                  thumbColor={settings.allowWeekendBooking ? COLORS.SUCCESS : COLORS.GRAY_400}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="hourglass-outline" size={20} color={COLORS.INFO} />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Advance Booking</Text>
                    <Text style={styles.settingDescription}>How far in advance clients can book</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.settingValue}
                  onPress={() => {
                    Alert.alert(
                      'Advance Booking Days',
                      '',
                      [7, 14, 30, 60, 90].map(days => ({
                        text: `${days} days`,
                        onPress: () => setSettings(prev => ({ ...prev, advanceBookingDays: days })),
                      }))
                    );
                  }}
                >
                  <Text style={styles.settingValueText}>{settings.advanceBookingDays} days</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.TEXT_SECONDARY} />
                </TouchableOpacity>
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="time-outline" size={20} color={COLORS.INFO} />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Buffer Time</Text>
                    <Text style={styles.settingDescription}>Time between appointments</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.settingValue}
                  onPress={() => {
                    Alert.alert(
                      'Buffer Time',
                      '',
                      [0, 5, 10, 15, 30, 45, 60].map(minutes => ({
                        text: minutes === 0 ? 'No buffer' : `${minutes} minutes`,
                        onPress: () => setSettings(prev => ({ ...prev, bufferTime: minutes })),
                      }))
                    );
                  }}
                >
                  <Text style={styles.settingValueText}>
                    {settings.bufferTime === 0 ? 'No buffer' : `${settings.bufferTime} min`}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.TEXT_SECONDARY} />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

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
  vacationModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vacationModeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vacationModeLabel: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.MD,
  },
  vacationModeDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.SM,
  },
  dayContainer: {
    marginBottom: SPACING.MD,
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
    borderRadius: BORDER_RADIUS.MD,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.MD,
    backgroundColor: COLORS.GRAY_50,
  },
  dayToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dayLabel: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginRight: SPACING.SM,
  },
  dayContent: {
    padding: SPACING.MD,
    backgroundColor: COLORS.WHITE,
  },
  timeSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.MD,
  },
  timeSlotInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeSelector: {
    flex: 1,
  },
  timeSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.GRAY_100,
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
    borderRadius: BORDER_RADIUS.SM,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  timeSelectorText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
  },
  timeSlotSeparator: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginHorizontal: SPACING.MD,
  },
  removeSlotButton: {
    padding: SPACING.SM,
    marginLeft: SPACING.MD,
  },
  dayActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.MD,
    paddingTop: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_200,
  },
  addSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addSlotText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.SUCCESS,
    marginLeft: SPACING.SM,
    fontWeight: '500',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.INFO,
    marginLeft: SPACING.SM,
    fontWeight: '500',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingInfo: {
    marginLeft: SPACING.MD,
    flex: 1,
  },
  settingLabel: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
  },
  settingDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.XS,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValueText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginRight: SPACING.SM,
  },
  bottomSpacing: {
    height: SPACING.XL,
  },
});