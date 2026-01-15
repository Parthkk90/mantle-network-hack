import React, { useState, useRef } from 'react';
import { Pressable, ViewStyle, Animated } from 'react-native';

interface FlipCardProps {
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  style?: ViewStyle;
  duration?: number;
}

export default function FlipCard({
  frontContent,
  backContent,
  style,
  duration = 500,
}: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const rotation = useRef(new Animated.Value(0)).current;

  const handleFlip = () => {
    Animated.timing(rotation, {
      toValue: isFlipped ? 0 : 180,
      duration,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const frontRotate = rotation.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backRotate = rotation.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = rotation.interpolate({
    inputRange: [89, 90],
    outputRange: [1, 0],
  });

  const backOpacity = rotation.interpolate({
    inputRange: [89, 90],
    outputRange: [0, 1],
  });

  return (
    <Pressable onPress={handleFlip} style={style}>
      <Animated.View
        style={[
          style,
          {
            transform: [{ perspective: 1000 }, { rotateY: frontRotate }],
            opacity: frontOpacity,
            backfaceVisibility: 'hidden',
          },
        ]}
      >
        {frontContent}
      </Animated.View>
      <Animated.View
        style={[
          style,
          {
            transform: [{ perspective: 1000 }, { rotateY: backRotate }],
            opacity: backOpacity,
            backfaceVisibility: 'hidden',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          },
        ]}
      >
        {backContent}
      </Animated.View>
    </Pressable>
  );
}
