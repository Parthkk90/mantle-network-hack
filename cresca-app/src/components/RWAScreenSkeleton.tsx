import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Shimmer } from './Shimmer';
import { COLORS } from '../theme/colors';

export const RWAScreenSkeleton: React.FC = () => (
  <View style={styles.skeletonContainer}>
    {/* Header */}
    <View style={styles.header}>
      <View>
        <Shimmer width={200} height={28} />
        <Shimmer width={150} height={14} style={{ marginTop: 8 }} />
      </View>
      <Shimmer width={44} height={44} borderRadius={22} />
    </View>

    {/* Portfolio Summary Card */}
    <View style={styles.summaryCard}>
      <View style={styles.summaryRow}>
        <View>
          <Shimmer width={100} height={12} />
          <Shimmer width={150} height={32} style={{ marginTop: 8 }} />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Shimmer width={80} height={12} />
          <Shimmer width={100} height={24} style={{ marginTop: 8 }} />
        </View>
      </View>
    </View>

    {/* KYC Status Card */}
    <View style={styles.kycCard}>
      <View style={styles.kycHeader}>
        <Shimmer width={120} height={20} />
        <Shimmer width={60} height={28} borderRadius={14} />
      </View>
      <Shimmer width="80%" height={14} style={{ marginTop: 12 }} />
      <Shimmer width="100%" height={44} borderRadius={12} style={{ marginTop: 16 }} />
    </View>

    {/* Section Title */}
    <View style={styles.sectionHeader}>
      <Shimmer width={160} height={20} />
    </View>

    {/* Asset Cards */}
    {[1, 2, 3].map((i) => (
      <View key={i} style={styles.assetCard}>
        <View style={styles.assetHeader}>
          <Shimmer width={48} height={48} borderRadius={12} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Shimmer width="40%" height={12} />
            <Shimmer width="70%" height={18} style={{ marginTop: 4 }} />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Shimmer width={60} height={24} borderRadius={8} />
            <Shimmer width={40} height={12} style={{ marginTop: 4 }} />
          </View>
        </View>
        <View style={styles.assetDetails}>
          <View style={styles.detailRow}>
            <Shimmer width={80} height={12} />
            <Shimmer width={100} height={12} />
          </View>
          <View style={styles.detailRow}>
            <Shimmer width={80} height={12} />
            <Shimmer width={100} height={12} />
          </View>
        </View>
        <Shimmer width="100%" height={44} borderRadius={12} style={{ marginTop: 12 }} />
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  skeletonContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryCard: {
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kycCard: {
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 20,
  },
  kycHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  assetCard: {
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  assetDetails: {
    marginTop: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default RWAScreenSkeleton;
