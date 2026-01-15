import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

interface QRCodeProps {
  value: string;
  size?: number;
  backgroundColor?: string;
  color?: string;
}

// Simple QR code generator (generates a visual QR-like pattern from address)
// For production, use a proper QR library like 'react-native-qrcode-svg'
export default function QRCode({ 
  value, 
  size = 200, 
  backgroundColor = '#FFFFFF',
  color = '#000000' 
}: QRCodeProps) {
  
  const modules = useMemo(() => {
    // Generate a deterministic pattern from the address
    const gridSize = 25;
    const grid: boolean[][] = [];
    
    // Initialize grid
    for (let i = 0; i < gridSize; i++) {
      grid[i] = [];
      for (let j = 0; j < gridSize; j++) {
        grid[i][j] = false;
      }
    }
    
    // Add finder patterns (the 3 corner squares)
    const addFinderPattern = (startRow: number, startCol: number) => {
      // Outer square (7x7)
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          if (i === 0 || i === 6 || j === 0 || j === 6) {
            grid[startRow + i][startCol + j] = true;
          } else if (i >= 2 && i <= 4 && j >= 2 && j <= 4) {
            grid[startRow + i][startCol + j] = true;
          }
        }
      }
    };
    
    // Add finder patterns at 3 corners
    addFinderPattern(0, 0);
    addFinderPattern(0, gridSize - 7);
    addFinderPattern(gridSize - 7, 0);
    
    // Add timing patterns
    for (let i = 8; i < gridSize - 8; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }
    
    // Generate data pattern from address hash
    if (value) {
      let hash = 0;
      for (let i = 0; i < value.length; i++) {
        const char = value.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      // Fill data area with pseudo-random pattern based on address
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          // Skip finder patterns and timing patterns
          const inFinderPattern = 
            (row < 8 && col < 8) || 
            (row < 8 && col >= gridSize - 8) || 
            (row >= gridSize - 8 && col < 8);
          const inTimingPattern = row === 6 || col === 6;
          
          if (!inFinderPattern && !inTimingPattern) {
            // Use hash and position to determine if cell is filled
            const seed = (hash + row * gridSize + col) * 31;
            const charIndex = (row * gridSize + col) % value.length;
            const charCode = value.charCodeAt(charIndex);
            grid[row][col] = ((seed ^ charCode) % 3) !== 0;
          }
        }
      }
    }
    
    return grid;
  }, [value]);
  
  const cellSize = size / 25;
  const padding = cellSize * 2;
  const totalSize = size + padding * 2;
  
  return (
    <View style={[styles.container, { width: totalSize, height: totalSize, backgroundColor }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Rect x="0" y="0" width={size} height={size} fill={backgroundColor} />
        {modules.map((row, rowIndex) =>
          row.map((cell, colIndex) =>
            cell ? (
              <Rect
                key={`${rowIndex}-${colIndex}`}
                x={colIndex * cellSize}
                y={rowIndex * cellSize}
                width={cellSize}
                height={cellSize}
                fill={color}
              />
            ) : null
          )
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
  },
});
