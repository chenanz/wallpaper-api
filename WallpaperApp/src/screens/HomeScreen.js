import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WallpaperCard from '../components/WallpaperCard';

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 2;

const API_BASE = 'https://wallpaper-api-bw5h.onrender.com/wallpapers';

// 女角色列表（游戏分组）
const CHARACTER_GROUPS = {
  '原神': [
    '雷电将军', '甘雨', '胡桃', '刻晴', '优菈', '神里绫华', '宵宫', '心海',
    '八重神子', '纳西妲', '妮露', '申鹤', '云堇', '久岐忍', '柯莱', '珐露珊',
    '瑶瑶', '迪希雅', '琳妮特', '芙宁娜', '娜维娅', '千织', '仆人', '克洛琳德',
    '希格雯', '艾梅莉埃', '玛拉妮', '希诺宁', '恰斯卡',
  ],
  '星铁': [
    '三月七', '姬子', '布洛妮娅', '希儿', '克拉拉', '停云', '卡芙卡', '银狼',
    '符玄', '藿藿', '黑天鹅', '黄泉', '知更鸟', '流萤', '云璃', '飞霄', '灵砂',
    '阮梅', '花火', '镜流', '翡翠', '遐蝶', '阿格莱雅', '风堇',
  ],
  '崩坏3': [
    '琪亚娜', '芽衣', '德丽莎', '八重樱', '卡莲', '符华', '丽塔', '幽兰黛尔',
    '希儿', '萝莎莉娅', '莉莉娅', '霞', '艾琳', '迷迭', '识之律者',
    '薪炎之律者', '次生银翼', '人律', '终焉之律者', '死生之律者', '薇塔',
  ],
};

export default function HomeScreen({ navigation }) {
  const [wallpapers, setWallpapers] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const [selectedCharacter, setSelectedCharacter] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState('原神');

  const fetchData = async (p = 1, append = false) => {
    if (loading) return;
    setLoading(true);
    try {
      let url = `${API_BASE}?category=原神COS&page=${p}`;
      
      if (selectedCharacter !== '全部') {
        url += `&character=${encodeURIComponent(selectedCharacter)}`;
      }
      
      const res = await fetch(url);
      const json = await res.json();
      const data = Array.isArray(json) ? json : [];
      
      let filtered = data;
      if (selectedCharacter !== '全部') {
        filtered = data.filter(item => 
          item.tags && item.tags.includes(selectedCharacter)
        );
      }
      
      filtered.sort((a, b) => (b.views || 0) - (a.views || 0));

      if (append) {
        setWallpapers(prev => {
          const combined = [...prev, ...filtered];
          return [...new Map(combined.map(item => [item.id, item])).values()];
        });
      } else {
        setWallpapers(filtered);
      }
      setHasMore(filtered.length > 0);
    } catch (e) {
      console.error('获取壁纸失败:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    setPage(1);
    fetchData(1, false);
  }, [selectedCharacter]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const next = page + 1;
      setPage(next);
      fetchData(next, true);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await fetchData(1, false);
    setRefreshing(false);
  }, [selectedCharacter]);

  const getCurrentCharacters = () => {
    const chars = CHARACTER_GROUPS[selectedGame] || [];
    if (!searchQuery) return ['全部', ...chars];
    const filtered = chars.filter(c => c.includes(searchQuery));
    return ['全部', ...filtered];
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>🎮 二游壁纸库</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gameRow}>
        {Object.keys(CHARACTER_GROUPS).map(game => (
          <TouchableOpacity
            key={game}
            style={[
              styles.gameBtn,
              selectedGame === game && styles.gameBtnActive
            ]}
            onPress={() => {
              setSelectedGame(game);
              setSelectedCharacter('全部');
            }}
          >
            <Text style={[
              styles.gameBtnText,
              selectedGame === game && styles.gameBtnTextActive
            ]}>
              {game}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <TextInput
        style={styles.searchInput}
        placeholder="搜索角色..."
        placeholderTextColor="#666"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={getCurrentCharacters()}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.characterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.characterItem,
              selectedCharacter === item && styles.characterActive,
            ]}
            onPress={() => setSelectedCharacter(item)}
          >
            <Text
              style={[
                styles.characterText,
                selectedCharacter === item && styles.characterTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
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
  gameRow: { marginBottom: 12 },
  gameBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a3e',
    marginRight: 10,
  },
  gameBtnActive: { backgroundColor: '#ff6b9d' },
  gameBtnText: { color: '#aaa', fontSize: 14, fontWeight: '600' },
  gameBtnTextActive: { color: '#fff' },
  searchInput: {
    backgroundColor: '#1a1a3e',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  characterList: { gap: 10 },
  characterItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a3e',
    marginRight: 8,
  },
  characterActive: { backgroundColor: '#6c63ff' },
  characterText: { color: '#aaa', fontSize: 13, fontWeight: '600' },
  characterTextActive: { color: '#fff' },
  listContent: { paddingBottom: 90 },
  columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 6 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#666', fontSize: 16 },
});
