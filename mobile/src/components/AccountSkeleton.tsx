import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export default function AccountSkeleton() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <View style={styles.container}>
      {/* Subscription Card Skeleton */}
      <View style={styles.card}>
        <View style={styles.subHeader}>
          <View>
            <Animated.View style={[styles.skeletonText, { width: 100, marginBottom: 8, opacity }]} />
            <Animated.View style={[styles.skeletonText, { width: 150, height: 24, opacity }]} />
          </View>
          <Animated.View style={[styles.skeletonBadge, { opacity }]} />
        </View>
        <View style={styles.divider} />
        <Animated.View style={[styles.skeletonText, { width: '80%', opacity }]} />
      </View>

      {/* Subtitle Skeleton */}
      <Animated.View style={[styles.skeletonText, { width: 200, marginTop: 20, marginBottom: 16, opacity }]} />

      {/* Profile Form Skeleton */}
      <View style={styles.card}>
        {/* Name Input */}
        <Animated.View style={[styles.skeletonText, { width: 60, marginBottom: 8, opacity }]} />
        <Animated.View style={[styles.skeletonInput, { opacity }]} />

        {/* Email Input */}
        <Animated.View style={[styles.skeletonText, { width: 60, marginTop: 12, marginBottom: 8, opacity }]} />
        <Animated.View style={[styles.skeletonInput, { opacity }]} />

        {/* Save Button */}
        <Animated.View style={[styles.skeletonButton, { marginTop: 20, opacity }]} />

        {/* Password Section */}
        <Animated.View style={[styles.skeletonText, { width: 120, marginTop: 30, marginBottom: 12, height: 20, opacity }]} />
        
        {/* Password Inputs */}
        <Animated.View style={[styles.skeletonText, { width: 90, marginBottom: 8, opacity }]} />
        <Animated.View style={[styles.skeletonInput, { opacity }]} />
        
        <Animated.View style={[styles.skeletonText, { width: 90, marginTop: 12, marginBottom: 8, opacity }]} />
        <Animated.View style={[styles.skeletonInput, { opacity }]} />

        {/* Save Password Button */}
        <Animated.View style={[styles.skeletonButton, { marginTop: 20, opacity }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: '#0e1430',
    borderWidth: 1,
    borderColor: '#1d2340',
    borderRadius: 12,
    padding: 16,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#1d2340',
    marginVertical: 12,
  },
  skeletonText: {
    height: 14,
    backgroundColor: '#1d2340',
    borderRadius: 4,
  },
  skeletonBadge: {
    width: 80,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1d2340',
  },
  skeletonInput: {
    height: 50,
    backgroundColor: '#1d2340',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2b3448',
  },
  skeletonButton: {
    height: 50,
    backgroundColor: '#1d2340',
    borderRadius: 8,
  },
});
