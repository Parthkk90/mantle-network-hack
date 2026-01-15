import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { COLORS } from '../theme/colors';

const { width } = Dimensions.get('window');

export default function TokenDetailsScreen({ route, navigation }: any) {
  const { token } = route.params;
  const [timeframe, setTimeframe] = useState('1D');

  // Mock price history data for chart
  const generateMockChartData = () => {
    const points = 20;
    const data = [];
    let basePrice = token.price;
    
    for (let i = 0; i < points; i++) {
      const variance = (Math.random() - 0.5) * 0.1 * basePrice;
      basePrice += variance;
      data.push(basePrice);
    }
    return data;
  };

  const chartData = generateMockChartData();
  const maxPrice = Math.max(...chartData);
  const minPrice = Math.min(...chartData);
  const priceRange = maxPrice - minPrice;

  const renderChart = () => {
    const chartHeight = 200;
    const chartWidth = width - 64;
    const padding = 16;
    
    // Create smooth line path
    const createLinePath = () => {
      const points = chartData.map((price, index) => {
        const x = padding + (index / (chartData.length - 1)) * (chartWidth - padding * 2);
        const y = padding + ((maxPrice - price) / priceRange) * (chartHeight - padding * 2);
        return { x, y };
      });
      
      // Create smooth curve using bezier
      let path = `M ${points[0].x} ${points[0].y}`;
      
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cpX = (prev.x + curr.x) / 2;
        path += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
      }
      
      return path;
    };
    
    // Create gradient area path
    const createAreaPath = () => {
      const linePath = createLinePath();
      const lastPoint = chartData.length - 1;
      const lastX = padding + (lastPoint / (chartData.length - 1)) * (chartWidth - padding * 2);
      const firstX = padding;
      return `${linePath} L ${lastX} ${chartHeight - padding} L ${firstX} ${chartHeight - padding} Z`;
    };

    const lineColor = token.change24h >= 0 ? COLORS.success : COLORS.error;
    const lastPoint = chartData[chartData.length - 1];
    const lastX = padding + ((chartData.length - 1) / (chartData.length - 1)) * (chartWidth - padding * 2);
    const lastY = padding + ((maxPrice - lastPoint) / priceRange) * (chartHeight - padding * 2);

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          <Svg width={chartWidth} height={chartHeight}>
            <Defs>
              <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={lineColor} stopOpacity="0.3" />
                <Stop offset="1" stopColor={lineColor} stopOpacity="0.05" />
              </LinearGradient>
            </Defs>
            {/* Gradient area fill */}
            <Path
              d={createAreaPath()}
              fill="url(#areaGradient)"
            />
            {/* Line */}
            <Path
              d={createLinePath()}
              stroke={lineColor}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* End point dot */}
            <Circle
              cx={lastX}
              cy={lastY}
              r={5}
              fill={lineColor}
            />
            <Circle
              cx={lastX}
              cy={lastY}
              r={8}
              fill={lineColor}
              opacity={0.3}
            />
          </Svg>
        </View>
        <View style={styles.chartLabels}>
          <Text style={styles.chartLabel}>${minPrice.toFixed(2)}</Text>
          <Text style={styles.chartLabel}>${maxPrice.toFixed(2)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{'>> TOKEN_DETAILS'}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.tokenHeader}>
          <View style={styles.tokenIcon}>
            <Text style={styles.tokenIconText}>{token.symbol.charAt(0)}</Text>
          </View>
          <Text style={styles.tokenName}>{token.name.toUpperCase()}</Text>
          <Text style={styles.tokenSymbol}>{token.symbol.toUpperCase()}</Text>
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.currentPrice}>${token.price.toFixed(6)}</Text>
          <View style={[
            styles.changeBadge,
            token.change24h >= 0 ? styles.changeBadgePositive : styles.changeBadgeNegative
          ]}>
            <Text style={[
              styles.changeText,
              token.change24h >= 0 ? styles.changeTextPositive : styles.changeTextNegative
            ]}>
              {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
            </Text>
          </View>
        </View>

        <View style={styles.timeframeSelector}>
          <View style={styles.timeframeContainer}>
            {['1H', '1D', '1W', '1M', '1Y'].map((tf) => (
              <TouchableOpacity
                key={tf}
                style={[
                  styles.timeframeButton,
                  timeframe === tf && styles.timeframeButtonActive
                ]}
                onPress={() => setTimeframe(tf)}
              >
                <Text style={[
                  styles.timeframeText,
                  timeframe === tf && styles.timeframeTextActive
                ]}>
                  {tf}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {renderChart()}

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>{'>> MARKET_STATS'}</Text>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>MARKET_CAP</Text>
            <Text style={styles.statValue}>${(token.marketCap / 1000000).toFixed(2)}M</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>VOLUME_24H</Text>
            <Text style={styles.statValue}>${(token.volume24h / 1000000).toFixed(2)}M</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>CIRCULATING_SUPPLY</Text>
            <Text style={styles.statValue}>
              {((token.marketCap / token.price) / 1000000).toFixed(2)}M {token.symbol}
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>ALL_TIME_HIGH</Text>
            <Text style={styles.statValue}>${(token.price * 1.5).toFixed(6)}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>ALL_TIME_LOW</Text>
            <Text style={styles.statValue}>${(token.price * 0.2).toFixed(6)}</Text>
          </View>
        </View>

        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>{'>> ABOUT'}</Text>
          <Text style={styles.aboutText}>
            {token.name} ({token.symbol}) is a digital asset available on the Mantle Network. 
            Trade with confidence using our secure and efficient platform.
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.buyButton}
            onPress={() => {
              // Navigate to buy flow
              console.log('Buy', token.symbol);
            }}
          >
            <Text style={styles.buyButtonText}>{'[ BUY ]'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.sellButton}
            onPress={() => {
              // Navigate to sell flow
              console.log('Sell', token.symbol);
            }}
          >
            <Text style={styles.sellButtonText}>{'[ SELL ]'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 24,
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    flex: 1,
  },
  tokenHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tokenIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  tokenIconText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.background,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  tokenName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  tokenSymbol: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  priceSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  currentPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  changeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  changeBadgePositive: {
    backgroundColor: 'rgba(0, 255, 65, 0.1)',
  },
  changeBadgeNegative: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  changeText: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  changeTextPositive: {
    color: COLORS.primary,
  },
  changeTextNegative: {
    color: COLORS.error,
  },
  timeframeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  timeframeContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeframeButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timeframeButtonActive: {
    backgroundColor: COLORS.text,
  },
  timeframeText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  timeframeTextActive: {
    color: COLORS.textWhite,
  },
  chartContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chart: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  chartLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  statsSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  statValue: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  aboutSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  aboutText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  buyButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.background,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  sellButton: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  sellButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.error,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
});
