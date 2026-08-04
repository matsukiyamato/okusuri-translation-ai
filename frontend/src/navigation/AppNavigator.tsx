// frontend/src/navigation/AppNavigator.tsx

import React from 'react';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import CameraCaptureScreen from '../screens/CameraCaptureScreen';
import ModeSelectionScreen from '../screens/ModeSelectionScreen';
import OcrVerificationScreen from '../screens/OcrVerificationScreen';
import ScanGuidanceScreen from '../screens/ScanGuidanceScreen';
import SignLanguageResultScreen from '../screens/SignLanguageResultScreen';
import TextAudioResultScreen from '../screens/TextAudioResultScreen';

import type {
  RootStackParamList as BaseRootStackParamList,
  TranslationDisplayMode,
} from '../screens/ModeSelectionScreen';

/**
 * FastAPIの画像アップロードAPIが返すデータ形式。
 *
 * POST /api/ocr/upload
 */
export type ImageUploadResult = {
  status: 'accepted';
  upload_id: string;
  filename: string;
  content_type:
    | 'image/jpeg'
    | 'image/png'
    | 'image/webp';
  size_bytes: number;
  message: string;
  raw_text: string;
};

/**
 * ModeSelectionScreen.tsxで定義されている既存の画面遷移型を維持しつつ、
 * OcrVerification画面に画像アップロード結果を追加する。
 */
export type RootStackParamList =
  Omit<
    BaseRootStackParamList,
    'OcrVerification'
  > & {
    OcrVerification:
      BaseRootStackParamList['OcrVerification'] & {
        uploadResult: ImageUploadResult;
      };
  };

/**
 * 既存画面との互換性維持。
 */
export type {
  TranslationDisplayMode,
};

const Stack =
  createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName="ModeSelection"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: '#F6FAFA',
        },
      }}
    >
      <Stack.Screen
        name="ModeSelection"
        component={ModeSelectionScreen}
        options={{
          animation: 'fade',
        }}
      />

      <Stack.Screen
        name="ScanGuidance"
        component={ScanGuidanceScreen}
      />

      <Stack.Screen
        name="CameraCapture"
        component={CameraCaptureScreen}
        options={{
          animation: 'fade',
          gestureEnabled: false,
        }}
      />

      <Stack.Screen
        name="OcrVerification"
        component={OcrVerificationScreen}
      />

      <Stack.Screen
        name="TextAudioResult"
        component={TextAudioResultScreen}
        options={{
          animation: 'fade_from_bottom',
        }}
      />

      <Stack.Screen
        name="SignLanguageResult"
        component={SignLanguageResultScreen}
        options={{
          animation: 'fade_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
}