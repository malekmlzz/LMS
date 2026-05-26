import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants/colors';

export const Button = ({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  fullWidth = false,
}) => {
  const backgroundColor = disabled
    ? COLORS.grayLight
    : variant === 'primary'
    ? COLORS.primary
    : COLORS.white;
  const textColor = disabled
    ? COLORS.white
    : variant === 'primary'
    ? COLORS.white
    : COLORS.primary;
  const borderColor = variant === 'outline' ? COLORS.primary : 'transparent';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor, borderColor, borderWidth: variant === 'outline' ? 1 : 0, width: fullWidth ? '100%' : 'auto' },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
