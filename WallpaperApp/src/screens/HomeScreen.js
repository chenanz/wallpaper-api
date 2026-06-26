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

// 女角色列表 + 别名映射
const CHARACTER_GROUPS = {
  '原神': {
    alias: {
      '雷电将军': ['雷神', '雷电影'],
      '胡桃': ['堂主'],
      '神里绫华': ['绫华', '白鹭公主'],
      '宵宫': ['长野原宵宫'],
      '心海': ['珊瑚宫心海'],
      '八重神子': ['八重', '狐狸'],
      '纳西妲': ['草神', '小吉祥草王'],
      '妮露': ['莲光落舞筵'],
      '芙宁娜': ['芙芙', '水神'],
      '娜维娅': ['刺玫会'],
      '仆人': ['阿蕾奇诺', '佩露薇利'],
      '克洛琳德': ['决斗代理人'],
    },
    chars: [
      '雷电将军', '甘雨', '胡桃', '刻晴', '优菈', '神里绫华', '宵宫', '心海',
      '八重神子', '纳西妲', '妮露', '申鹤', '云堇', '久岐忍', '柯莱', '珐露珊',
      '瑶瑶', '迪希雅', '琳妮特', '芙宁娜', '娜维娅', '千织', '仆人', '克洛琳德',
      '希格雯', '艾梅莉埃', '玛拉妮', '希诺宁', '恰斯卡',
    ]
  },
  '星铁': {
    alias: {
      '布洛妮娅': ['鸭鸭', '大鸭鸭'],
      '希儿': ['蝴蝶'],
      '停云': ['忘归人'],
      '卡芙卡': ['卡妈'],
      '银狼': ['骇客'],
      '符玄': ['太卜司'],
      '藿藿': ['判官'],
      '黑天鹅': ['占卜师'],
      '黄泉': ['虚无令使'],
      '知更鸟': ['罗宾'],
      '流萤': ['萨姆', '格拉默铁骑'],
      '飞霄': ['天击将军'],
      '灵砂': ['丹鼎司'],
      '阮梅': ['天才俱乐部'],
      '花火': ['假面愚者'],
      '镜流': ['剑首'],
      '遐蝶': ['死荫之蝶'],
    },
    chars: [
      '三月七', '姬子', '布洛妮娅', '希儿', '克拉拉', '停云', '卡芙卡', '银狼',
      '符玄', '藿藿', '黑天鹅', '黄泉', '知更鸟', '流萤', '云璃', '飞霄', '灵砂',
      '阮梅', '花火', '镜流', '翡翠', '遐蝶', '阿格莱雅', '风堇',
    ]
  },
  '崩坏3': {
    alias: {
      '琪亚娜': ['草履虫', '薪炎'],
      '芽衣': ['雷律'],
      '德丽莎': ['大姨妈'],
      '八重樱': ['樱'],
      '符华': ['班长', '识律'],
      '丽塔': ['女仆'],
      '幽兰黛尔': ['呆鹅', '鹅'],
      '希儿': ['黑希', '白希'],
      '识之律者': ['识宝'],
      '终焉之律者': ['终焉'],
      '人律': ['爱莉希雅'],
    },
    chars: [
      '琪亚娜', '芽衣', '德丽莎', '八重樱', '卡莲', '符华', '丽塔', '幽兰黛尔',
      '希儿', '萝莎莉娅', '莉莉娅', '霞', '艾琳', '迷迭', '识之律者',
      '薪炎之律者', '次生银翼', '人律', '终焉之律者', '死生之律者', '薇塔',
    ]
  },
};

// 把 alias 展开成后端可识别的关键词
function getSearchKeywords(character, game) {
  if (character === '全部') return [];
  const info = CHARACTER_GROUPS[game] || { alias: {} };
  const aliases = info.alias[character] || [];
  return [character, ...aliases];
}

export default function HomeScreen({ navigation }) {
  const [wallpapers, setWallpapers] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const [selectedCharacter, setSelectedCharacter] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState('原神');
  const [showAllChars, setShowAllChars] = useState(true);

  const currentChars = CHARACTER_GROUPS[selectedGame]?.chars || [];
  const filteredChars = searchQuery
    ? currentChars.filter(c => c.includes(searchQuery))
    : currentChars;

  const fetchData = async (p = 1, append = false) => {
    if (loading) return;
    setLoading(true);
    try {
      // category 根据当前游戏动态：原神/星铁/崩坏
      let url = `${API_BASE}?category=${encodeURIComponent(selectedGame)}&page=${p}`;
      
      if (selectedCharacter !== '全部') {
        const keywords = getSearchKeywords(selectedCharacter, selectedGame);
        if (keywords.length > 0) {
          url += `&character=${encodeURIComponent(keywords[0])}`;
        }
      }
      
      const res = await fetch(url);
      const json = await res.json();
      const data = Array.isArray(json) ? json : [];
      
      let filtered = data;
      if (selectedCharacter !== '全部') {
        const keywords = getSearchKeywords(selectedCharacter, selectedGame);
        filtered = data.filter(item => {
          if (!item.title) return false;
          return keywords.some(k => item.title.includes(k));
        });
      }
      
      // 按浏览量降序
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
  }, [selectedCharacter, selectedGame]);

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
  }, [selectedCharacter, selectedGame]);

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>🎮 二游壁纸库</Text>
      
      {/* 游戏切换 */}
      <View style={styles.gameRow}>
        {Object.keys(CHARACTER_GROUPS).map(game => (
          <TouchableOpacity
            key={game}
            style={[styles.gameBtn, selectedGame === game && styles.gameBtnActive]}
            onPress={() => {
              setSelectedGame(game);
              setSelectedCharacter('全部');
              setSearchQuery('');
            }}
          >
            <Text style={[styles.gameBtnText, selectedGame === game && styles.gameBtnTextActive]}>
              {game}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* 搜索框 + 展开/收起 */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索角色..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity 
          style={styles.toggleBtn}
          onPress={() => setShowAllChars(!showAllChars)}
        >
          <Text style={styles.toggleText}>{showAllChars ? '收起' : '展开'}</Text>
        </TouchableOpacity>
      </View>
      
      {/* 全部按钮 */}
      <TouchableOpacity
        style={[styles.allBtn, selectedCharacter === '全部' && styles.allBtnActive]}
        onPress={() => setSelectedCharacter('全部')}
      >
        <Text style={[styles.allBtnText, selectedCharacter === '全部' && styles.allBtnTextActive]}>
          全部角色
        </Text>
      </TouchableOpacity>
      
      {/* 角色网格 */}
      {(showAllChars || searchQuery) && (
        <View style={styles.charGrid}>
          {filteredChars.map(char => (
            <TouchableOpacity
              key={char}
              style={[styles.charItem, selectedCharacter === char && styles.charItemActive]}
              onPress={() => setSelectedCharacter(char)}
            >
              <Text 
                style={[styles.charText, selectedCharacter === char && styles.charTextActive]}
                numberOfLines={1}
              >
                {char}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {!showAllChars && !searchQuery && (
        <TouchableOpacity onPress={() => setShowAllChars(true)}>
          <Text style={styles.showMore}>展开更多角色 ▼</Text>
        </TouchableOpacity>
      )}
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
              <Text style={styles.emptyText}>该角色暂无壁纸，换个角色试试</Text>
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
  gameRow: { flexDirection: 'row', marginBottom: 12 },
  gameBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1a1a3e',
    marginRight: 8,
    alignItems: 'center',
  },
  gameBtnActive: { backgroundColor: '#ff6b9d' },
  gameBtnText: { color: '#aaa', fontSize: 14, fontWeight: '600' },
  gameBtnTextActive: { color: '#fff' },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  searchInput: {
    flex: 1,
    backgroundColor: '#1a1a3e',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    fontSize: 14,
  },
  toggleBtn: {
    marginLeft: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#1a1a3e',
    borderRadius: 12,
  },
  toggleText: { color: '#aaa', fontSize: 13 },
  allBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a3e',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  allBtnActive: { backgroundColor: '#6c63ff' },
  allBtnText: { color: '#aaa', fontSize: 13, fontWeight: '600' },
  allBtnTextActive: { color: '#fff' },
  charGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  charItem: {
    width: (width - 40) / 4,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1a1a3e',
    alignItems: 'center',
  },
  charItemActive: { backgroundColor: '#6c63ff' },
  charText: { color: '#aaa', fontSize: 12, fontWeight: '500' },
  charTextActive: { color: '#fff' },
  showMore: { color: '#6c63ff', textAlign: 'center', marginVertical: 8 },
  listContent: { paddingBottom: 90 },
  columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 6 },
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
  emptyText: { color: '#666', fontSize: 16, textAlign: 'center' },
});
