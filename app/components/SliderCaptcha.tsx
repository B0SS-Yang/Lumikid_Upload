import * as React from 'react';
import { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { View, Text, PanResponder, Animated, StyleSheet } from 'react-native';

const SLIDER_WIDTH = 260;
const SLIDER_HEIGHT = 40;
const THUMB_SIZE = 36;

export interface SliderCaptchaRef {
  reset: () => void;
}

const SliderCaptcha = forwardRef<SliderCaptchaRef, { onVerify: () => void }>(({ onVerify }, ref) => {
  const [verified, setVerified] = useState(false);
  const pan = useRef(new Animated.Value(0)).current;

  const reset = () => {
    setVerified(false);
    Animated.spring(pan, {
      toValue: 0,
      useNativeDriver: false,
    }).start();
  };

  useImperativeHandle(ref, () => ({
    reset
  }));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !verified,
      onMoveShouldSetPanResponder: () => !verified,
      onPanResponderMove: (_, gestureState) => {
        if (!verified) {
          let newX = Math.max(0, Math.min(gestureState.dx, SLIDER_WIDTH - THUMB_SIZE));
          pan.setValue(newX);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!verified) {
          if (gestureState.dx > SLIDER_WIDTH - THUMB_SIZE - 5) {
            setVerified(true);
            Animated.timing(pan, {
              toValue: SLIDER_WIDTH - THUMB_SIZE,
              duration: 100,
              useNativeDriver: false,
            }).start();
            onVerify();
          } else {
            Animated.spring(pan, {
              toValue: 0,
              useNativeDriver: false,
            }).start();
          }
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{verified ? 'Verification successful' : 'Please slide to verify'}</Text>
      <View style={styles.slider}>
        <Animated.View
          style={[
            styles.thumb,
            { transform: [{ translateX: pan }] },
            verified && styles.thumbVerified,
          ]}
          {...panResponder.panHandlers}
        >
          <Text style={styles.thumbText}>{verified ? '✔' : '→'}</Text>
        </Animated.View>
        {verified && <View style={styles.verifiedOverlay} />}
      </View>
    </View>
  );
});

export default SliderCaptcha;

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginBottom: 20 },
  label: { marginBottom: 8, color: '#888' },
  slider: {
    width: SLIDER_WIDTH,
    height: SLIDER_HEIGHT,
    backgroundColor: '#eee',
    borderRadius: SLIDER_HEIGHT / 2,
    justifyContent: 'center',
  },
  thumb: {
    position: 'absolute',
    left: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    zIndex: 2,
  },
  thumbVerified: {
    backgroundColor: '#4caf50',
    borderColor: '#388e3c',
  },
  thumbText: {
    fontSize: 20,
    color: '#888',
  },
  verifiedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(76,175,80,0.15)',
    borderRadius: SLIDER_HEIGHT / 2,
    zIndex: 1,
  },
}); 