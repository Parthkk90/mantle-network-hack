import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS } from '../theme/colors';

interface MiniLineChartProps {
  data?: number[];
  width?: number;
  height?: number;
  color?: string;
  isPositive?: boolean;
}

// Generate realistic-looking price data based on current price and change
function generateChartData(isPositive: boolean): number[] {
  const points = 12;
  const data: number[] = [];
  let value = 50;
  
  for (let i = 0; i < points; i++) {
    // Add some randomness but trend in the direction of change
    const trend = isPositive ? 0.8 : -0.8;
    const noise = (Math.random() - 0.5) * 15;
    value = Math.max(10, Math.min(90, value + trend + noise));
    data.push(value);
  }
  
  // Ensure final value reflects the trend direction
  if (isPositive) {
    data[data.length - 1] = Math.max(data[0] + 5, data[data.length - 1]);
  } else {
    data[data.length - 1] = Math.min(data[0] - 5, data[data.length - 1]);
  }
  
  return data;
}

export default function MiniLineChart({ 
  data,
  width = 60, 
  height = 32, 
  color,
  isPositive = true 
}: MiniLineChartProps) {
  const chartData = useMemo(() => data || generateChartData(isPositive), [data, isPositive]);
  const lineColor = color || (isPositive ? COLORS.success : COLORS.error);
  
  const path = useMemo(() => {
    if (chartData.length < 2) return '';
    
    const min = Math.min(...chartData);
    const max = Math.max(...chartData);
    const range = max - min || 1;
    
    const stepX = width / (chartData.length - 1);
    const padding = 4;
    const availableHeight = height - padding * 2;
    
    // Create smooth path
    let pathD = '';
    
    chartData.forEach((value, index) => {
      const x = index * stepX;
      const y = padding + availableHeight - ((value - min) / range) * availableHeight;
      
      if (index === 0) {
        pathD = `M ${x} ${y}`;
      } else {
        // Use smooth curve
        const prevX = (index - 1) * stepX;
        const prevValue = chartData[index - 1];
        const prevY = padding + availableHeight - ((prevValue - min) / range) * availableHeight;
        
        const cpX1 = prevX + stepX * 0.5;
        const cpX2 = x - stepX * 0.5;
        
        pathD += ` C ${cpX1} ${prevY}, ${cpX2} ${y}, ${x} ${y}`;
      }
    });
    
    return pathD;
  }, [chartData, width, height]);

  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lineColor} stopOpacity="0.3" />
            <Stop offset="1" stopColor={lineColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path
          d={path}
          stroke={lineColor}
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
