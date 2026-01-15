import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { COLORS } from '../theme/colors';
import KYCService from '../services/KYCService';
import { KYCTier } from '../services/RWAService';
import WalletService from '../services/WalletService';

export default function KYCVerificationScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [selectedTier, setSelectedTier] = useState<KYCTier>(KYCTier.INTERMEDIATE);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('US');
  const [isAccredited, setIsAccredited] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<any>(null);

  const jurisdictions = KYCService.getSupportedJurisdictions();

  useEffect(() => {
    checkCurrentStatus();
  }, []);

  const checkCurrentStatus = async () => {
    try {
      setCheckingStatus(true);
      const status = await KYCService.getKYCStatus();
      setCurrentStatus(status);
    } catch (error) {
      console.error('Error checking KYC status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleVerify = async () => {
    if (!agreedToTerms) {
      Alert.alert('Agreement Required', 'Please agree to the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      await WalletService.loadWallet();
      const userAddress = await WalletService.getWallet().getAddress();

      const txHash = await KYCService.verifyUserKYC({
        userAddress,
        tier: selectedTier,
        jurisdiction: selectedJurisdiction,
        isAccredited,
      });

      Alert.alert(
        'Verification Successful!',
        `Your identity has been verified.\n\nTransaction: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`,
        [
          {
            text: 'View RWA Assets',
            onPress: () => navigation.navigate('Main', { screen: 'RWATab' }),
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Verification Failed',
        error.message || 'Unable to complete verification. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const tierInfo = KYCService.getTierInfo(selectedTier);

  if (checkingStatus) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>CHECKING_STATUS...</Text>
      </View>
    );
  }

  // If already verified, show status
  if (currentStatus?.isActive) {
    const currentTierInfo = KYCService.getTierInfo(currentStatus.tier);
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>{'<- BACK'}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{'>> KYC_STATUS'}</Text>
        </View>

        <View style={styles.verifiedCard}>
          <Text style={styles.verifiedBadge}>{currentTierInfo.badge}</Text>
          <Text style={styles.verifiedTitle}>VERIFIED</Text>
          <Text style={styles.verifiedTier}>{currentTierInfo.name.toUpperCase()}</Text>
          
          <View style={styles.statusDetails}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>JURISDICTION</Text>
              <Text style={styles.statusValue}>{currentStatus.jurisdiction}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>VERIFIED_ON</Text>
              <Text style={styles.statusValue}>
                {currentStatus.verificationDate.toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>EXPIRES_ON</Text>
              <Text style={styles.statusValue}>
                {currentStatus.expirationDate.toLocaleDateString()}
              </Text>
            </View>
            {currentStatus.isAccredited && (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>ACCREDITED</Text>
                <Text style={[styles.statusValue, styles.accreditedBadge]}>YES</Text>
              </View>
            )}
          </View>

          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsTitle}>YOUR_BENEFITS</Text>
            {currentTierInfo.benefits.map((benefit, index) => (
              <Text key={index} style={styles.benefitItem}>• {benefit}</Text>
            ))}
          </View>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => navigation.navigate('Main', { screen: 'RWATab' })}
          >
            <Text style={styles.doneButtonText}>VIEW_RWA_ASSETS</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Verification form
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{'<- BACK'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{'>> KYC_VERIFICATION'}</Text>
        <Text style={styles.subtitle}>VERIFY_YOUR_IDENTITY</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>DEMO_MODE</Text>
        <Text style={styles.infoText}>
          For demo purposes, verification is instant. In production, this would integrate with real KYC providers like Onfido or Sumsub.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{'>> VERIFICATION_LEVEL'}</Text>
        <Text style={styles.sectionHint}>Choose your verification tier</Text>

        <View style={styles.tierOptions}>
          {[KYCTier.BASIC, KYCTier.INTERMEDIATE, KYCTier.ADVANCED].map((tier) => {
            const info = KYCService.getTierInfo(tier);
            return (
              <TouchableOpacity
                key={tier}
                style={[
                  styles.tierCard,
                  selectedTier === tier && styles.tierCardActive,
                ]}
                onPress={() => setSelectedTier(tier)}
              >
                <Text style={styles.tierBadge}>{info.badge}</Text>
                <Text style={styles.tierName}>{info.name.toUpperCase()}</Text>
                <Text style={styles.tierDescription}>{info.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{'>> JURISDICTION'}</Text>
        <Text style={styles.sectionHint}>Select your country/region</Text>
        
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedJurisdiction}
            onValueChange={(value) => setSelectedJurisdiction(value)}
            style={styles.picker}
            dropdownIconColor={COLORS.primary}
          >
            {jurisdictions.map((j) => (
              <Picker.Item key={j.code} label={j.name} value={j.code} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{'>> BENEFITS'}</Text>
        <View style={styles.benefitsCard}>
          {tierInfo.benefits.map((benefit, index) => (
            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="checkmark" size={16} color={COLORS.success} style={{ marginRight: 8 }} />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>
      </View>

      {selectedTier === KYCTier.ADVANCED && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setIsAccredited(!isAccredited)}
          >
            <View style={[styles.checkbox, isAccredited && styles.checkboxChecked]}>
              {isAccredited && <Ionicons name="checkmark" size={14} color={COLORS.textWhite} />}
            </View>
            <Text style={styles.checkboxLabel}>
              I am an accredited investor ($200k+ income or $1M+ net worth)
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAgreedToTerms(!agreedToTerms)}
        >
          <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
            {agreedToTerms && <Ionicons name="checkmark" size={14} color={COLORS.textWhite} />}
          </View>
          <Text style={styles.checkboxLabel}>
            I agree to the Terms of Service and Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.verifyButton, !agreedToTerms && styles.verifyButtonDisabled]}
        onPress={handleVerify}
        disabled={!agreedToTerms || loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.background} />
        ) : (
          <Text style={styles.verifyButtonText}>VERIFY_MY_IDENTITY</Text>
        )}
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  infoCard: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  section: {
    padding: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  sectionHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  tierOptions: {
    gap: 12,
  },
  tierCard: {
    padding: 16,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  tierCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}15`,
  },
  tierBadge: {
    fontSize: 32,
    marginBottom: 8,
  },
  tierName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  tierDescription: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  pickerContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  picker: {
    color: COLORS.text,
    backgroundColor: COLORS.cardBackground,
  },
  benefitsCard: {
    padding: 16,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    gap: 8,
  },
  benefitText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  verifyButton: {
    margin: 16,
    padding: 18,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.background,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  verifiedCard: {
    margin: 16,
    padding: 24,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    alignItems: 'center',
  },
  verifiedBadge: {
    fontSize: 64,
    marginBottom: 16,
  },
  verifiedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.success,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  verifiedTier: {
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  statusDetails: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statusLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  statusValue: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  accreditedBadge: {
    color: COLORS.success,
  },
  benefitsSection: {
    width: '100%',
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  benefitItem: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  doneButton: {
    width: '100%',
    padding: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.background,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  bottomSpacer: {
    height: 40,
  },
});
