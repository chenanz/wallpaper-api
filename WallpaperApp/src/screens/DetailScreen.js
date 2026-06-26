import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getFavorites, addFavorite, removeFavorite, isFavorite } from '../utils/storage';

const { width, height } = Dimensions.get('window');

export default function DetailScreen({ route, navigation }) {
  const { wallpaper } = route.params;
  const [favorite, setFavorite] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    checkFavoriteStatus();
  }, []);

  const checkFavoriteStatus = async () => {
    const status = await isFavorite(wallpaper.id);
    setFavorite(status);
  };

  const toggleFavorite = async () => {
    if (favorite) {
      await removeFavorite(wallpaper.id);
      setFavorite(false);
    } else {
      await addFavorite(wallpaper);
      setFavorite(true);
    }
  };

  const downloadWallpaper = async () => {
    try {
      setDownloading(true);
      const fileUri = FileSystem.documentDirectory + `wallpaper_${wallpaper.id}.jpg`;
      const downloadObject = await FileSystem.downloadAsync(wallpaper.url, fileUri);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadObject.uri, {
          mimeType: 'image/jpeg',
          dialogTitle: '分享壁纸',
        });
      } else {
        Alert.alert('下载完成', `壁纸已保存至: ${downloadObject.uri}`);
      }
    } catch (error) {
      Alert.alert('下载失败', '请稍后重试');
      console.error(error);
    } finally {
      setDownloading(false);
    }
  };

  const shareWallpaper = async () => {
    try {
      await Share.share({
        message: `发现一张超好看的壁纸: ${wallpaper.title}`,
        url: wallpaper.url,
        title: '壁纸分享',
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="light-content" />
      
      {/* 顶部导航 */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>壁纸详情</Text>
        <View style={{ width: 70 }} />
      </View>

      {/* 图片展示 */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={{ uri: wallpaper.url }}
          style={[styles.image, { aspectRatio: wallpaper.width / wallpaper.height || 0.5625 }]}
          resizeMode="contain"
        />

        {/* 信息区域 */}
        <View style={styles.infoSection}>
          <Text style={styles.wallpaperTitle}>{wallpaper.title}</Text>
          <View style={styles.tagRow}>
            <Text style={styles.tag}>{wallpaper.category}</Text>
            <Text style={styles.tag}>
              {wallpaper.width}×{wallpaper.height}
            </Text>
          </View>
        </View>

        {/* 操作按钮 */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, favorite && styles.favoritedBtn]}
            onPress={toggleFavorite}
          >
            <Text style={styles.actionIcon}>{favorite ? '❤️' : '🤍'}</Text>
            <Text style={[styles.actionText, favorite && styles.favoritedText]}>
              {favorite ? '已收藏' : '收藏'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={downloadWallpaper}
            disabled={downloading}
          >
            <Text style={styles.actionIcon}>⬇️</Text>
            <Text style={styles.actionText}>
              {downloading ? '处理中...' : '下载/分享'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={shareWallpaper}>
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={styles.actionText}>分享</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0f0f23',
  },
  backBtn: {
    width: 70,
  },
  backText: {
    color: '#6c63ff',
    fontSize: 16,
    fontWeight: '600',
  },
  topTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  image: {
    width: width,
    height: undefined,
    backgroundColor: '#1a1a2e',
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  wallpaperTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tag: {
    color: '#aaa',
    backgroundColor: '#1a1a3e',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 15,
    fontSize: 13,
    fontWeight: '500',
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  actionBtn: {
    alignItems: 'center',
    backgroundColor: '#1a1a3e',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 16,
    minWidth: 95,
  },
  favoritedBtn: {
    backgroundColor: '#3d1f3d',
  },
  actionIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  actionText: {
    color: '#ccc',
    fontSize: 13,
    fontWeight: '600',
  },
  favoritedText: {
    color: '#ff6b9d',
  },
});
