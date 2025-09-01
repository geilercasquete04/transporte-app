import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContexts';

export function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }
      ]}
    >
      <Ionicons
        name={isDarkMode ? 'sunny' : 'moon'}
        size={20}
        color={isDarkMode ? '#fbbf24' : '#6366f1'}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 20,
    marginRight: 10,
  },
});