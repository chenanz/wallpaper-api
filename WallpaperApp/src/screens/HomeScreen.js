import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WallpaperCard from '../components/WallpaperCard';

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 2;

// ★★★ 改成你电脑的局域网 IP（不要用 localhost）
const API_BASE = 'https://wallpaper-api-bw5h.onrender.com/wallpapers';

const CATEGORIES = ['原神COS', '原神同人', '星铁同人', '崩坏同人'];

export default function HomeScreen({ navigation }) {
  const [wallpapers, setWallpapers] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('原神COS');

  const fetchData = async (p = 1, category = selectedCategory, append = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const url = `${API_BASE}?category=${encodeURIComponent(category)}&page=${p}`;
      const res = await fetch(url);
      const json = await res.json();
      const data = Array.isArray(json) ? json : [];

      // 按 id 去重（米游社 API 可能返回重复帖子）
      const unique = [...new Map(data.map(item => [item.id, item])).values()];

      if (append) {
        setWallpapers(prev => {
          const combined = [...prev, ...unique];
          return [...new Map(combined.map(item => [item.id, item])).values()];
        });
      } else {
        setWallpapers(unique);
      }
      setHasMore(unique.length > 0);
    } catch (e) {
      console.error('获取壁纸失败:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    setPage(1);
    fetchData(1, selectedCategory, false);
  }, [selectedCategory]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const next = page + 1;
      setPage(next);
      fetchData(next, selectedCategory, true);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await fetchData(1, selectedCategory, false);
    setRefreshing(false);
  }, [selectedCategory]);

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>🎮 二游壁纸</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={CATEGORIES}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => (
          <Text
            style={[
              styles.categoryItem,
              selectedCategory === item && styles.categoryActive,
            ]}
            onPress={() => setSelectedCategory(item)}
          >
            {item}
          </Text>
        )}
      />
    </View>
  );

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
      <FlatList
        data={wallpapers}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        numColumns={NUM_COLUMNS}
        ListHeaderComponent={renderHeader}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          loading ? <ActivityIndicator size="small" color="#6c63ff" style={{ margin: 20 }} /> : null
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>暂无壁纸，下拉刷新试试</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  header: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', marginBottom: 14 },
  categoryList: { gap: 10 },
  categoryItem: {
    color: '#aaa',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a3e',
    fontSize: 14,
    fontWeight: '600',
    overflow: 'hidden',
  },
  categoryActive: { color: '#fff', backgroundColor: '#6c63ff' },
  listContent: { paddingBottom: 90 },
  columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 6 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#666', fontSize: 16 },
});
