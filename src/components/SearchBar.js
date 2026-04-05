import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export default function SearchBar({ placeholder, value, onChangeText, style }) {
  return (
    <View style={[styles.container, style]}>
      <TextInput
        placeholder={placeholder || 'Plaka veya Müşteri Adı Ara'}
        placeholderTextColor={COLORS.gray}
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    height: '100%',
  },
});
