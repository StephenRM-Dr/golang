import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const Card = ({ children, title }: { children: React.ReactNode, title?: string }) => (
  <View style={styles.card}>
    {title && <Text style={styles.title}>{title}</Text>}
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#374151' }
});
