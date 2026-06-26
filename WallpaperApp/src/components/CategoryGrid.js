import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CategoryGrid() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Category Grid Placeholder</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { color: '#fff', fontSize: 16 },
});
