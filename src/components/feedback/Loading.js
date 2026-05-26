import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

export const Loading = ({ fullScreen = false }) => {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  return <ActivityIndicator size="large" color={COLORS.primary} />;
};

const styles = StyleSheet.create({
  fullScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
});
