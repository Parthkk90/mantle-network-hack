import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { COLORS } from '../theme/colors';

interface ScheduledPayment {
  id: string;
  recipient: string;
  amount: string;
  date: Date;
  time: string;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  note: string;
  active: boolean;
  executed: number;
  total: number;
}

export default function ScheduleScreen({ navigation }: any) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPayment, setNewPayment] = useState({
    recipient: '',
    amount: '',
    time: '12:00',
    frequency: 'once' as 'once' | 'daily' | 'weekly' | 'monthly',
    note: '',
  });

  const [scheduledPayments, setScheduledPayments] = useState<ScheduledPayment[]>([]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const hasScheduledPayment = (day: number | null) => {
    if (!day) return false;
    return scheduledPayments.some(payment => {
      return (
        payment.date.getDate() === day &&
        payment.date.getMonth() === currentMonth.getMonth() &&
        payment.date.getFullYear() === currentMonth.getFullYear()
      );
    });
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDayPress = (day: number | null) => {
    if (!day) return;
    const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(selected);
    setShowCreateModal(true);
  };

  const createScheduledPayment = () => {
    if (!selectedDate || !newPayment.recipient || !newPayment.amount) {
      Alert.alert('ERROR', 'Please fill in all required fields');
      return;
    }

    const payment: ScheduledPayment = {
      id: Date.now().toString(),
      recipient: newPayment.recipient,
      amount: newPayment.amount,
      date: selectedDate,
      time: newPayment.time,
      frequency: newPayment.frequency,
      note: newPayment.note,
      active: true,
      executed: 0,
      total: newPayment.frequency === 'once' ? 1 : 12,
    };

    setScheduledPayments([...scheduledPayments, payment]);
    setShowCreateModal(false);
    setNewPayment({
      recipient: '',
      amount: '',
      time: '12:00',
      frequency: 'once',
      note: '',
    });
    Alert.alert('SUCCESS', 'Payment scheduled successfully');
  };

  const togglePayment = (id: string) => {
    setScheduledPayments(payments =>
      payments.map(p =>
        p.id === id ? { ...p, active: !p.active } : p
      )
    );
  };

  const deletePayment = (id: string) => {
    Alert.alert(
      'DELETE SCHEDULE',
      'Are you sure you want to delete this scheduled payment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setScheduledPayments(payments => payments.filter(p => p.id !== id));
          },
        },
      ]
    );
  };

  const getPaymentsForSelectedDate = () => {
    if (!selectedDate) return scheduledPayments;
    
    return scheduledPayments.filter(payment => {
      return (
        payment.date.getDate() === selectedDate.getDate() &&
        payment.date.getMonth() === selectedDate.getMonth() &&
        payment.date.getFullYear() === selectedDate.getFullYear()
      );
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Schedule</Text>
        <Text style={styles.walletId}>ID: 0x6dfe...F41C</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Calendar Card */}
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Text style={styles.monthYear}>{formatMonthYear(currentMonth)}</Text>
            <View style={styles.calendarControls}>
              <TouchableOpacity onPress={previousMonth} style={styles.navButton}>
                <Text style={styles.navButtonText}>{'<'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
                <Text style={styles.todayButtonText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
                <Text style={styles.navButtonText}>{'>'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Day Labels */}
          <View style={styles.dayLabels}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <Text key={index} style={styles.dayLabel}>{day}</Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {getDaysInMonth(currentMonth).map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  !day && styles.dayCellEmpty,
                  isToday(day) && styles.dayCellToday,
                  hasScheduledPayment(day) && styles.dayCellWithPayment,
                ]}
                onPress={() => handleDayPress(day)}
                disabled={!day}
              >
                {day && (
                  <>
                    <Text style={[
                      styles.dayText,
                      isToday(day) && styles.dayTextToday,
                    ]}>
                      {day}
                    </Text>
                    {hasScheduledPayment(day) && (
                      <View style={styles.paymentDot} />
                    )}
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Scheduled Payments Section */}
        <View style={styles.paymentsSection}>
          <Text style={styles.sectionTitle}>Scheduled Payments</Text>
          
          {scheduledPayments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No scheduled payments</Text>
            </View>
          ) : (
            scheduledPayments.map((payment) => (
              <View key={payment.id} style={styles.paymentCard}>
                <View style={styles.paymentHeader}>
                  <View style={styles.paymentLeft}>
                    <Text style={styles.recurringIcon}>🔄</Text>
                    <View>
                      <Text style={styles.paymentAmount}>{payment.amount} MON</Text>
                      <Text style={styles.paymentRecipient}>To: {payment.recipient}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.statusBadge,
                      payment.active ? styles.statusBadgeActive : styles.statusBadgeInactive
                    ]}
                    onPress={() => togglePayment(payment.id)}
                  >
                    <Text style={[
                      styles.statusText,
                      payment.active ? styles.statusTextActive : styles.statusTextInactive
                    ]}>
                      {payment.active ? 'Active' : 'Inactive'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.paymentDetails}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>INTERVAL</Text>
                    <Text style={styles.detailValue}>{payment.frequency.toUpperCase()}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>PROGRESS</Text>
                    <Text style={styles.detailValue}>{payment.executed}/{payment.total}</Text>
                  </View>
                </View>

                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentDate}>
                    Next: {payment.date.toLocaleDateString()} at {payment.time}
                  </Text>
                  {payment.note && (
                    <Text style={styles.paymentNote}>{payment.note}</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deletePayment(payment.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Create Payment Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule Payment</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {selectedDate && (
                <View style={styles.selectedDateBox}>
                  <Text style={styles.selectedDateLabel}>Selected Date:</Text>
                  <Text style={styles.selectedDateText}>
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Recipient Address *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="0x..."
                  placeholderTextColor={COLORS.textMuted}
                  value={newPayment.recipient}
                  onChangeText={(text) => setNewPayment({...newPayment, recipient: text})}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Amount (MON) *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="decimal-pad"
                  value={newPayment.amount}
                  onChangeText={(text) => setNewPayment({...newPayment, amount: text})}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Time</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="12:00"
                  placeholderTextColor={COLORS.textMuted}
                  value={newPayment.time}
                  onChangeText={(text) => setNewPayment({...newPayment, time: text})}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Frequency</Text>
                <View style={styles.frequencyButtons}>
                  {(['once', 'daily', 'weekly', 'monthly'] as const).map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      style={[
                        styles.frequencyButton,
                        newPayment.frequency === freq && styles.frequencyButtonActive
                      ]}
                      onPress={() => setNewPayment({...newPayment, frequency: freq})}
                    >
                      <Text style={[
                        styles.frequencyButtonText,
                        newPayment.frequency === freq && styles.frequencyButtonTextActive
                      ]}>
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Note (Optional)</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="e.g., Monthly rent"
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  numberOfLines={3}
                  value={newPayment.note}
                  onChangeText={(text) => setNewPayment({...newPayment, note: text})}
                />
              </View>

              <TouchableOpacity
                style={styles.createButton}
                onPress={createScheduledPayment}
              >
                <Text style={styles.createButtonText}>Create Schedule</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  walletId: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  content: {
    flex: 1,
  },
  calendarCard: {
    backgroundColor: COLORS.cardBackground,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  calendarHeader: {
    marginBottom: 20,
  },
  monthYear: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  calendarControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  navButtonText: {
    fontSize: 20,
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  todayButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  todayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  dayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dayLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
    width: 40,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayCellEmpty: {
    opacity: 0,
  },
  dayCellToday: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
  },
  dayCellWithPayment: {
    backgroundColor: COLORS.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  dayText: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  dayTextToday: {
    color: COLORS.background,
    fontWeight: 'bold',
  },
  paymentDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  paymentsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  emptyState: {
    backgroundColor: COLORS.cardBackground,
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  paymentCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  recurringIcon: {
    fontSize: 24,
    color: COLORS.primary,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  paymentRecipient: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(0, 255, 65, 0.1)',
    borderColor: COLORS.primary,
  },
  statusBadgeInactive: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderColor: COLORS.error,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  statusTextActive: {
    color: COLORS.primary,
  },
  statusTextInactive: {
    color: COLORS.error,
  },
  paymentDetails: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  paymentInfo: {
    marginBottom: 12,
  },
  paymentDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  paymentNote: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  deleteButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deleteButtonText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  closeButton: {
    fontSize: 24,
    color: COLORS.textMuted,
    paddingHorizontal: 8,
  },
  modalForm: {
    padding: 20,
  },
  selectedDateBox: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  selectedDateLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  formInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  formTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  frequencyButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  frequencyButton: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  frequencyButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  frequencyButtonTextActive: {
    color: COLORS.background,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.background,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
});
