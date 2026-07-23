import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';

import {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import {
  RootStackParamList,
  TranslationDisplayMode,
} from './ModeSelectionScreen';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'OcrVerification'
>;

const PRIMARY = '#005E53';
const SURFACE = '#F6FAFA';
const SURFACE_LOW = '#F0F4F4';
const ERROR_CONTAINER = '#FFDAD6';
const ERROR = '#BA1A1A';
const OUTLINE = '#6E7A76';

export default function OcrVerificationScreen({
  navigation,
  route,
}: Props): React.JSX.Element {

  const { displayMode } = route.params;

  /**
   * CameraCaptureScreenから受け取る画像
   * FastAPI接続時はOCR入力画像になる
   */
  const [capturedImageUri] = useState<string | undefined>(
    undefined,
  );

  /**
   * OCR結果
   * FastAPI接続時にAPIレスポンスで更新
   */
  const [medicineName, setMedicineName] =
    useState<string>(
      'ロキソプロフェンナトリウム',
    );

  const [dosage, setDosage] =
    useState<string>(
      '1回1錠、1日3回 食後',
    );

  /**
   * OCRスキャンライン
   */
  const scanAnimation =
    useRef(new Animated.Value(0)).current;

  useEffect(() => {

    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();

  }, [scanAnimation]);

  const scanTranslateY =
    scanAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 170],
    });

  const handleRetake = (): void => {
    navigation.goBack();
  };

  const handleConfirm = (): void => {

    if (displayMode === 'textAudio') {

      navigation.navigate(
        'TextAudioResult',
        {
          recognizedText: medicineName,
        },
      );

      return;
    }

    navigation.navigate(
      'SignLanguageResult',
      {
        recognizedText: medicineName,
      },
    );
  };

  return (

    <SafeAreaView style={styles.container}>

      <StatusBar
        barStyle="dark-content"
        backgroundColor={SURFACE}
      />

      {/* Top App Bar */}

      <View style={styles.appBar}>

        <Pressable
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons
            name="arrow-back"
            size={28}
            color={PRIMARY}
          />
        </Pressable>

        <Text style={styles.title}>
          内容の確認
        </Text>

        <Pressable
          style={styles.iconButton}
        >
          <MaterialIcons
            name="help-outline"
            size={28}
            color={PRIMARY}
          />
        </Pressable>

      </View>

      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={false}
      >

        {/* 撮影画像 */}

        <View style={styles.previewContainer}>

          {capturedImageUri ? (

            <Image
              source={{
                uri: capturedImageUri,
              }}
              resizeMode="cover"
              style={styles.previewImage}
            />

          ) : (

            <View style={styles.previewPlaceholder}>

              <MaterialIcons
                name="photo-camera"
                size={60}
                color="#FFFFFF"
              />

              <Text
                style={styles.previewText}
              >
                撮影画像
              </Text>

            </View>

          )}

          {/* OCR Scan Area */}

          <View
            pointerEvents="none"
            style={styles.scanFrame}
          >

            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [
                    {
                      translateY:
                        scanTranslateY,
                    },
                  ],
                },
              ]}
            />

          </View>

          <View style={styles.imageChip}>

            <MaterialIcons
              name="photo-camera"
              size={18}
              color="#FFFFFF"
            />

            <Text
              style={styles.imageChipText}
            >
              撮影された画像
            </Text>

          </View>

        </View>

        {/* ↓ここからOCR結果入力欄へ続く */}

        {/* ==========================
            OCR Result
        ========================== */}

        <View style={styles.formContainer}>

          <View style={styles.sectionHeader}>

            <View style={styles.sectionTitleRow}>

              <MaterialIcons
                name="description"
                size={22}
                color={PRIMARY}
              />

              <Text style={styles.sectionTitle}>
                読み取り結果
              </Text>

            </View>

            <Text style={styles.sectionDescription}>
              文字が間違っている場合は、
              枠内をタップして修正してください。
            </Text>

          </View>

          {/* -----------------------
              Medicine Name
          ----------------------- */}

          <View style={styles.inputSection}>

            <Text style={styles.inputLabel}>
              お薬名 (Medicine Name)
            </Text>

            <View style={styles.inputWrapper}>

              <TextInput
                value={medicineName}
                onChangeText={setMedicineName}
                placeholder="薬品名"
                placeholderTextColor="#888888"
                style={styles.textInput}
              />

              <MaterialIcons
                name="edit"
                size={22}
                color={OUTLINE}
              />

            </View>

          </View>

          {/* -----------------------
              Dosage
          ----------------------- */}

          <View style={styles.inputSection}>

            <Text style={styles.inputLabel}>
              用法・用量 (Dosage)
            </Text>

            <View
              style={[
                styles.inputWrapper,
                styles.textAreaWrapper,
              ]}
            >

              <TextInput
                value={dosage}
                onChangeText={setDosage}
                multiline
                textAlignVertical="top"
                placeholder="用法・用量"
                placeholderTextColor="#888888"
                style={styles.textArea}
              />

              <View style={styles.editIconArea}>

                <MaterialIcons
                  name="edit"
                  size={22}
                  color={OUTLINE}
                />

              </View>

            </View>

          </View>

          {/* -----------------------
                Warning Card
          ----------------------- */}

          <View style={styles.warningCard}>

            <MaterialIcons
              name="warning"
              size={28}
              color={ERROR}
            />

            <View
              style={{
                flex: 1,
              }}
            >

              <Text style={styles.warningTitle}>
                確認のお願い
              </Text>

              <Text style={styles.warningText}>
                AIの読み取りは100%正確ではありません。
                必ず実際のお薬の袋や説明書と比較してください。
              </Text>

            </View>

          </View>

        </View>

      </ScrollView>


      {/* ==========================
          Bottom Action Buttons
      ========================== */}

      <View style={styles.bottomBar}>

        <Pressable
          style={styles.retakeButton}
          onPress={handleRetake}
        >
          <MaterialIcons
            name="refresh"
            size={22}
            color={PRIMARY}
          />

          <Text style={styles.retakeButtonText}>
            再撮影
          </Text>
        </Pressable>

        <Pressable
          style={styles.confirmButton}
          onPress={handleConfirm}
        >
          <MaterialIcons
            name="check-circle"
            size={22}
            color="#FFFFFF"
          />

          <Text style={styles.confirmButtonText}>
            決定
          </Text>
        </Pressable>

      </View>

    </SafeAreaView>

  );

}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: SURFACE,
  },

  appBar: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SURFACE,
    elevation: 2,
  },

  iconButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: PRIMARY,
  },

  scrollContent: {
    paddingBottom: 120,
  },

  previewContainer: {
    height: 310,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },

  previewImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },

  previewPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  previewText: {
    marginTop: 12,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },

  scanFrame: {
    position: 'absolute',
    width: '75%',
    height: '50%',
    borderWidth: 2,
    borderColor: '#97F3E2',
    borderRadius: 12,
    overflow: 'hidden',
  },

  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#97F3E2',
  },

  imageChip: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  imageChipText: {
    color: '#FFFFFF',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },

  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 24,
  },

  sectionHeader: {
    gap: 8,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#181C1D',
  },

  sectionDescription: {
    color: '#555',
    fontSize: 15,
    lineHeight: 22,
  },

  inputSection: {
    gap: 8,
  },

  inputLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#181C1D',
  },

  inputWrapper: {
    minHeight: 56,
    backgroundColor: SURFACE_LOW,
    borderBottomWidth: 2,
    borderBottomColor: OUTLINE,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },

  textInput: {
    flex: 1,
    fontSize: 18,
    color: '#181C1D',
  },

  textAreaWrapper: {
    alignItems: 'flex-start',
    minHeight: 120,
    paddingTop: 16,
  },

  textArea: {
    flex: 1,
    width: '100%',
    fontSize: 18,
    color: '#181C1D',
    paddingRight: 36,
  },

  editIconArea: {
    position: 'absolute',
    top: 16,
    right: 16,
  },

  warningCard: {
    flexDirection: 'row',
    backgroundColor: ERROR_CONTAINER,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },

  warningTitle: {
    color: ERROR,
    fontWeight: '700',
    fontSize: 16,
  },

  warningText: {
    marginTop: 6,
    color: '#93000A',
    fontSize: 14,
    lineHeight: 22,
  },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#DFE3E3',
    borderTopWidth: 1,
    borderTopColor: '#BDC9C5',
  },

  retakeButton: {
    width: '45%',
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  retakeButtonText: {
    marginLeft: 6,
    color: PRIMARY,
    fontWeight: '700',
    fontSize: 16,
  },

  confirmButton: {
    width: '45%',
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  confirmButtonText: {
    marginLeft: 6,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },

});

