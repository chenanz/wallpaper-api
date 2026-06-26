import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import DetailScreen from '../screens/DetailScreen';
import CategoriesScreen from '../screens/CategoriesScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen
        name="Detail"
        component={DetailScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}

function FavoritesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FavoritesMain" component={FavoritesScreen} />
      <Stack.Screen
        name="Detail"
        component={DetailScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}

function CategoriesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CategoriesMain" component={CategoriesScreen} />
      <Stack.Screen
        name="Detail"
        component={DetailScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}

const tabIcons = {
  '首页': '🏠',
  '分类': '📂',
  '收藏': '❤️',
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.6 }}>
            {tabIcons[route.name] || '📱'}
          </Text>
        ),
        tabBarActiveTintColor: '#6c63ff',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#12122a',
          borderTopColor: '#2a2a4a',
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 62,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="首页" component={HomeStack} />
      <Tab.Screen name="分类" component={CategoriesStack} />
      <Tab.Screen name="收藏" component={FavoritesStack} />
    </Tab.Navigator>
  );
}
