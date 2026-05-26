import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { COLORS } from '../../constants/colors';

const SearchBar = ({ onSearch, placeholder = "جستجو..." }) => {
  const [query, setQuery] = useState('');

  const handleChange = (text) => {
    setQuery(text);
    onSearch(text);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchIcon}>
        <Text style={styles.iconText}>🔍</Text>
      </View>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.grayLight}
      />
      {query.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearIcon}>
          <Text style={styles.clearIconText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  iconText: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.black,
    paddingVertical: 12,
  },
  clearIcon: {
    padding: 4,
  },
  clearIconText: {
    fontSize: 14,
    color: COLORS.gray,
  },
});

export default SearchBar;
