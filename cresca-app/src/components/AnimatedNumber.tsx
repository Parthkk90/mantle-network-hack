import React, { useEffect, useRef, useState } from 'react';
import { Text, TextStyle, Animated } from 'react-native';

interface AnimatedNumberProps {
  value: number;
  style?: TextStyle;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
}

export default function AnimatedNumber({
  value,
  style,
  prefix = '',
  suffix = '',
  decimals = 2,
  duration = 800,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const previousValue = useRef(0);

  useEffect(() => {
    const startValue = previousValue.current;
    previousValue.current = value;
    
    animatedValue.setValue(0);
    
    const listener = animatedValue.addListener(({ value: progress }) => {
      const currentValue = startValue + (value - startValue) * progress;
      setDisplayValue(currentValue);
    });

    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      useNativeDriver: false, // Text content animation requires native driver false
    }).start();

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [value, duration]);

  return (
    <Text style={style}>
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </Text>
  );
}
