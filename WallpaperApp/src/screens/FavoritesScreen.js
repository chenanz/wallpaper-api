import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import WallpaperCard from '../components/WallpaperCard';
import { getFavorites } from '../utils/storage';

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 2;

export default function FavoritesScreen({ navigation }) {
  const [favorites, setFavorites] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    const data = await getFavorites();
    setFavorites(data);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const renderItem = ({ item }) => (
    <View style={{ width: width / NUM_COLUMNS - 12 }}>
      <WallpaperCard
        item={item}
        onPress={(wp) => navigation.navigate('Detail', { wallpaper: wp })}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>❤️ 我的收藏</Text>
      </View>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💔</Text>
            <Text style={styles.emptyText}>还没有收藏壁纸哦</Text>
            <Text style={styles.emptySubtext}>快去首页挑选喜欢的吧</Text>
          </View>
        }
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
    paddingBottom: 30,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  empty: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 16,
  },
  emptyText: {
    color: '#888',
    fontSize: 17,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#555',
    fontSize: 14,
    marginTop: 6,
  },
});
