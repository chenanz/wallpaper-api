import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@wallpaper_favorites';

export const getFavorites = async () => {
  try {
    const json = await AsyncStorage.getItem(FAVORITES_KEY);
    return json != null ? JSON.parse(json) : [];
  } catch (error) {
    console.error('读取收藏失败:', error);
    return [];
  }
};

export const addFavorite = async (wallpaper) => {
  try {
    const favorites = await getFavorites();
    if (!favorites.some(item => item.id === wallpaper.id)) {
      favorites.unshift(wallpaper);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
    return favorites;
  } catch (error) {
    console.error('添加收藏失败:', error);
    return [];
  }
};

export const removeFavorite = async (wallpaperId) => {
  try {
    let favorites = await getFavorites();
    favorites = favorites.filter(item => item.id !== wallpaperId);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return favorites;
  } catch (error) {
    console.error('移除收藏失败:', error);
    return [];
  }
};

export const isFavorite = async (wallpaperId) => {
  try {
    const favorites = await getFavorites();
    return favorites.some(item => item.id === wallpaperId);
  } catch (error) {
    console.error('检查收藏状态失败:', error);
    return false;
  }
};
