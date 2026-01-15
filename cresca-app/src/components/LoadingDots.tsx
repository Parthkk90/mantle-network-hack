import React, { useEffect, useRef } from 'react';
import { View, ViewStyle, Animated, Easing } from 'react-native';

interface LoadingDotsProps {
  color?: string;
  size?: number;
  style?: ViewStyle;
}

export default function LoadingDots({
  color = '#6366F1',
  size = 8,
  style,
}: LoadingDotsProps) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createDotAnimation = (dot: Animated.Value, delay: number) => {
      const timeout = setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot, {
              toValue: 1,
              duration: 400,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 400,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, delay);
      return timeout;
    };

    const timeout1 = createDotAnimation(dot1, 0);
    const timeout2 = createDotAnimation(dot2, 200);
    const timeout3 = createDotAnimation(dot3, 400);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, []);

  const dotStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
    marginHorizontal: size / 2,
  };

  const getAnimatedStyle = (dot: Animated.Value) => ({
    opacity: dot.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
    transform: [
      {
        translateY: dot.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -5],
        }),
      },
    ],
  });

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      <Animated.View style={[dotStyle, getAnimatedStyle(dot1)]} />
      <Animated.View style={[dotStyle, getAnimatedStyle(dot2)]} />
      <Animated.View style={[dotStyle, getAnimatedStyle(dot3)]} />
    </View>
  );
}
