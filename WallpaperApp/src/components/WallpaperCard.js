import React from 'react';
import { TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width / 2 - 16;

export default function WallpaperCard({ item, onPress }) {
  // 列表用缩略图，加速加载（米游社图床支持阿里云 OSS 图片处理）
  const thumbUrl = item.url.includes('upload-bbs.miyoushe.com')
    ? `${item.url}?x-oss-process=image/resize,w_400/format,webp`
    : item.url;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item)}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: thumbUrl }}
        style={[
          styles.image,
          { aspectRatio: item.width / item.height || 0.5625 },
        ]}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: undefined,
  },
});
