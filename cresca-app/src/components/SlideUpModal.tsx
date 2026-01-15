import React, { useEffect, useRef } from 'react';
import { ViewStyle, Dimensions, Animated } from 'react-native';

const { height } = Dimensions.get('window');

interface SlideUpModalProps {
  children: React.ReactNode;
  visible: boolean;
  onClose?: () => void;
  style?: ViewStyle;
}

export default function SlideUpModal({
  children,
  visible,
  onClose,
  style,
}: SlideUpModalProps) {
  const translateY = useRef(new Animated.Value(height)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 12,
          bounciness: 6,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: height,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onClose?.();
      });
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
          { opacity },
        ]}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'white',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
          },
          style,
          { transform: [{ translateY }] },
        ]}
      >
        {children}
      </Animated.View>
    </>
  );
}
