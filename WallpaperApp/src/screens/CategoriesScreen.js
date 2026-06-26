import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WALLPAPERS, CATEGORIES } from '../data/wallpapers';

const categoryImages = {
  '自然': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300',
  '海洋': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300',
  '城市': 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=300',
  '夜空': 'https://images.unsplash.com/photo-1518495973-0bac4b7c9b1e?w=300',
  '植物': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300',
};

export default function CategoriesScreen({ navigation }) {
  const categoriesWithCount = CATEGORIES.filter(c => c !== '全部').map(cat => ({
    name: cat,
    count: WALLPAPERS.filter(wp => wp.category === cat).length,
    image: categoryImages[cat] || WALLPAPERS[0].url,
  }));

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('Home', { category: item.name })}
    >
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <View style={styles.overlay}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.count}>{item.count} 张壁纸</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📂 分类浏览</Text>
      </View>
      <FlatList
        data={categoriesWithCount}
        keyExtractor={(item) => item.name}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    gap: 14,
  },
  card: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  categoryName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  count: {
    color: '#ddd',
    fontSize: 14,
    marginTop: 4,
  },
});
