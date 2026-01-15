import React, { useRef } from 'react';
import { Pressable, PressableProps, Animated } from 'react-native';

interface AnimatedPressableProps extends PressableProps {
  children: React.ReactNode;
  scaleValue?: number;
}

export default function AnimatedPressable({
  children,
  scaleValue = 0.95,
  onPressIn,
  onPressOut,
  style,
  ...props
}: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (event: any) => {
    Animated.spring(scale, {
      toValue: scaleValue,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
    onPressIn?.(event);
  };

  const handlePressOut = (event: any) => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
    onPressOut?.(event);
  };

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <Pressable
        {...props}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
