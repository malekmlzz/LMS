import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/colors';

export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  error,
  icon,
  autoCapitalize = 'none',
  keyboardType = 'default',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = secureTextEntry;
  const inputSecure = isPassword ? !showPassword : false;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <TextInput
          style={[styles.input, icon && { paddingLeft: 8 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.grayLight}
          secureTextEntry={inputSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
            <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.grayDark,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    transitionDuration: '0.2s',
  },
  inputFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: COLORS.white,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
    paddingVertical: 14,
  },
  icon: {
    fontSize: 18,
    marginRight: 8,
  },
  eyeButton: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 18,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
  },
});
