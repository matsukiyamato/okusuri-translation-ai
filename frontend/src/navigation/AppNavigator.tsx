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

export type MedicationTimingResult = {
  waking: boolean | null;
  morning: boolean | null;
  noon: boolean | null;
  evening: boolean | null;
  bedtime: boolean | null;
  original_text: string | null;
};

export type GeminiStructuredOcrResult = {
  medicine_name: string | null;
  medicine_name_candidates: string[];

  timing: MedicationTimingResult;

  times_per_day: number | null;
  tablets_per_dose: number | null;
  number_of_days: number | null;

  dosage_original_text: string | null;

  medicine_information: string[];
  precautions: string[];
  interactions: string[];
  side_effects: string[];

  unclassified_text: string[];
  warnings: string[];

  requires_user_review: boolean;
};

export type OcrResult = {
  raw_text: string;

  page_count: number;
  block_count: number;
  paragraph_count: number;
  word_count: number;

  average_confidence: number | null;
  detected_languages: string[];
  has_text: boolean;

  quality_status:
    | 'good'
    | 'review_required'
    | 'text_not_detected';

  structured_data: GeminiStructuredOcrResult | null;
};

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
  ///raw_text: string;
  ocr_result: OcrResult;
};

/**
 * OcrVerificationScreenで利用者が確認・修正したデータ。
 *
 * 医療的な情報を新規生成するものではなく、
 * OCR結果を利用者が確認した値のみを保持する。
 */
export type CorrectedOcrResult = {
  correction_id: number;
  upload_id: string;

  medicine_name: string | null;
  timing_original_text: string | null;

  times_per_day: number | null;
  tablets_per_dose: number | null;
  number_of_days: number | null;

  dosage_original_text: string | null;

  medicine_information: string[];
  precautions: string[];
  interactions: string[];
  side_effects: string[];
  unclassified_text: string[];
};

/**
 * ModeSelectionScreen.tsxで定義されている既存の画面遷移型を維持しつつ、
 * OcrVerification画面に画像アップロード結果を追加する。
 */
export type RootStackParamList =
  Omit<
    BaseRootStackParamList,
    'OcrVerification' | 'TextAudioResult'
  > & {
    /**
     * OCR確認画面。
     *
     * 撮影画像をFastAPIへ送信した結果を受け取る。
     */
    OcrVerification:
      BaseRootStackParamList['OcrVerification'] & {
        uploadResult: ImageUploadResult;
      };

    /**
     * Step 13:
     * SQLiteへの保存完了後、
     * 利用者が確認・修正したOCR結果を受け取る。
     */
    TextAudioResult: {
      correctedResult: CorrectedOcrResult;
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