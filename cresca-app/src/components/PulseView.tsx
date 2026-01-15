import React, { useEffect, useRef } from 'react';
import { ViewStyle, Animated, Easing } from 'react-native';

interface PulseViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  pulseScale?: number;
  duration?: number;
  enabled?: boolean;
}

export default function PulseView({
  children,
  style,
  pulseScale = 1.05,
  duration = 1000,
  enabled = true,
}: PulseViewProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (enabled) {
      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: pulseScale,
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      animationRef.current.start();
    } else {
      animationRef.current?.stop();
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      animationRef.current?.stop();
    };
  }, [enabled, pulseScale, duration]);

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
}
