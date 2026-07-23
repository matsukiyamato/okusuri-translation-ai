import 'react-native-gesture-handler';

import React from 'react';

import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';

import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import AppNavigator from './src/navigation/AppNavigator';

const LIGHT_NAVIGATION_THEME: Theme = {
  ...DefaultTheme,

  colors: {
    ...DefaultTheme.colors,

    primary: '#005E53',
    background: '#F6FAFA',
    card: '#F6FAFA',
    text: '#181C1D',
    border: '#BDC9C5',
    notification: '#BA1A1A',
  },
};

const DARK_NAVIGATION_THEME: Theme = {
  ...DarkTheme,

  colors: {
    ...DarkTheme.colors,

    primary: '#97F3E2',
    background: '#181C1D',
    card: '#181C1D',
    text: '#EDF1F1',
    border: '#3E4946',
    notification: '#FFB4AB',
  },
};

/**
 * アプリケーションのエントリーポイント。
 *
 * NavigationContainerは画面遷移履歴、
 * 戻る操作、URL連携などを管理します。
 *
 * FastAPI・MySQLとの接続処理はApp.tsxに書かず、
 * 後から各画面またはAPI通信層から呼び出します。
 */
export default function App(): React.JSX.Element {
  const colorScheme = useColorScheme();

  const isDarkMode: boolean =
    colorScheme === 'dark';

  return (
    <NavigationContainer
      theme={
        isDarkMode
          ? DARK_NAVIGATION_THEME
          : LIGHT_NAVIGATION_THEME
      }
    >
      <StatusBar
        animated
        style={isDarkMode ? 'light' : 'dark'}
      />

      <AppNavigator />
    </NavigationContainer>
  );
}