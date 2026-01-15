import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../theme/colors';

interface ShimmerProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Shimmer: React.FC<ShimmerProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.shimmer,
        {
          width: width as any,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Preset shimmer components for common UI elements
export const ShimmerText: React.FC<{ width?: number | string; lines?: number }> = ({
  width = '80%',
  lines = 1,
}) => (
  <View style={{ gap: 8 }}>
    {Array.from({ length: lines }).map((_, i) => (
      <Shimmer
        key={i}
        width={i === lines - 1 && lines > 1 ? '60%' : width}
        height={16}
      />
    ))}
  </View>
);

export const ShimmerAvatar: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <Shimmer width={size} height={size} borderRadius={size / 2} />
);

export const ShimmerCard: React.FC<{ height?: number }> = ({ height = 120 }) => (
  <View style={styles.cardContainer}>
    <Shimmer width="100%" height={height} borderRadius={16} />
  </View>
);

export const ShimmerButton: React.FC<{ width?: number | string }> = ({ width = '100%' }) => (
  <Shimmer width={width} height={48} borderRadius={12} />
);

// Skeleton layouts for specific screens
export const HomeScreenSkeleton: React.FC = () => (
  <View style={styles.skeletonContainer}>
    {/* Header */}
    <View style={styles.headerSkeleton}>
      <View style={styles.headerLeft}>
        <ShimmerAvatar size={40} />
        <Shimmer width={80} height={20} style={{ marginLeft: 12 }} />
      </View>
      <View style={styles.headerRight}>
        <Shimmer width={40} height={40} borderRadius={12} />
        <Shimmer width={40} height={40} borderRadius={12} style={{ marginLeft: 12 }} />
      </View>
    </View>

    {/* Balance */}
    <View style={styles.balanceSkeleton}>
      <Shimmer width={100} height={14} />
      <Shimmer width={180} height={48} style={{ marginTop: 8 }} />
      <Shimmer width={120} height={14} style={{ marginTop: 8 }} />
    </View>

    {/* Actions */}
    <View style={styles.actionsSkeleton}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.actionItem}>
          <Shimmer width={48} height={48} borderRadius={24} />
          <Shimmer width={40} height={12} style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>

    {/* Transactions */}
    <View style={styles.transactionsSkeleton}>
      <Shimmer width={160} height={24} style={{ marginBottom: 16 }} />
      <View style={styles.filtersSkeleton}>
        {[1, 2, 3].map((i) => (
          <Shimmer key={i} width={70} height={32} borderRadius={16} />
        ))}
      </View>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.transactionItemSkeleton}>
          <Shimmer width={40} height={40} borderRadius={12} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Shimmer width="60%" height={16} />
            <Shimmer width="40%" height={12} style={{ marginTop: 4 }} />
          </View>
          <Shimmer width={24} height={24} />
        </View>
      ))}
    </View>
  </View>
);

export const MarketsScreenSkeleton: React.FC = () => (
  <View style={styles.skeletonContainer}>
    {/* Header */}
    <View style={styles.marketsHeader}>
      <Shimmer width={180} height={20} />
      <View style={styles.headerRight}>
        <Shimmer width={36} height={36} borderRadius={18} />
        <Shimmer width={36} height={36} borderRadius={18} style={{ marginLeft: 12 }} />
      </View>
    </View>

    {/* Token List */}
    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
      <View key={i} style={styles.tokenItemSkeleton}>
        <Shimmer width={44} height={44} borderRadius={22} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Shimmer width="50%" height={16} />
          <Shimmer width="30%" height={12} style={{ marginTop: 4 }} />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Shimmer width={80} height={16} />
          <Shimmer width={50} height={12} style={{ marginTop: 4 }} />
        </View>
      </View>
    ))}
  </View>
);

export const BundlesScreenSkeleton: React.FC = () => (
  <View style={styles.skeletonContainer}>
    {/* Header */}
    <View style={styles.bundlesHeader}>
      <View>
        <Shimmer width={200} height={28} />
        <Shimmer width={150} height={14} style={{ marginTop: 4 }} />
      </View>
      <Shimmer width={44} height={44} borderRadius={22} />
    </View>

    {/* Categories */}
    <View style={styles.categoriesSkeleton}>
      {[1, 2, 3, 4].map((i) => (
        <Shimmer key={i} width={70} height={36} borderRadius={18} />
      ))}
    </View>

    {/* Bundle Cards */}
    {[1, 2, 3].map((i) => (
      <View key={i} style={styles.bundleCardSkeleton}>
        <View style={styles.bundleCardHeader}>
          <Shimmer width={44} height={44} borderRadius={12} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Shimmer width="60%" height={16} />
            <Shimmer width="80%" height={12} style={{ marginTop: 4 }} />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Shimmer width={60} height={20} />
            <Shimmer width={50} height={12} style={{ marginTop: 4 }} />
          </View>
        </View>
        <View style={styles.bundleTagsSkeleton}>
          {[1, 2, 3, 4].map((j) => (
            <Shimmer key={j} width={60} height={28} borderRadius={14} />
          ))}
        </View>
      </View>
    ))}
  </View>
);

export const ProfileScreenSkeleton: React.FC = () => (
  <View style={styles.skeletonContainer}>
    {/* Header */}
    <View style={styles.profileHeader}>
      <View>
        <Shimmer width={100} height={28} />
        <Shimmer width={140} height={14} style={{ marginTop: 4 }} />
      </View>
      <Shimmer width={44} height={44} borderRadius={22} />
    </View>

    {/* Avatar */}
    <View style={styles.avatarSection}>
      <Shimmer width={100} height={100} borderRadius={50} />
      <Shimmer width={100} height={22} style={{ marginTop: 16 }} />
    </View>

    {/* Settings List */}
    <View style={styles.settingsListSkeleton}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.settingItemSkeleton}>
          <Shimmer width={44} height={44} borderRadius={12} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Shimmer width="50%" height={16} />
            <Shimmer width="70%" height={12} style={{ marginTop: 4 }} />
          </View>
          <Shimmer width={20} height={20} />
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  shimmer: {
    backgroundColor: COLORS.border,
  },
  skeletonContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 60,
  },
  cardContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  // Home Screen
  headerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceSkeleton: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  actionsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 24,
  },
  actionItem: {
    alignItems: 'center',
  },
  transactionsSkeleton: {
    paddingHorizontal: 20,
  },
  filtersSkeleton: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  transactionItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  // Markets Screen
  marketsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  tokenItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  // Bundles Screen
  bundlesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  categoriesSkeleton: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  bundleCardSkeleton: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bundleCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bundleTagsSkeleton: {
    flexDirection: 'row',
    gap: 8,
  },
  // Profile Screen
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  settingsListSkeleton: {
    marginHorizontal: 20,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  settingItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
});

export default Shimmer;
