import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

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

import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import type {
  RootStackParamList,
} from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'TextAudioResult'
>;

type TranslationResult = {
  medicineName: string;
  effectiveness: string;
  dosage: string;
  source: string;
};

const PRIMARY = '#005E53';
const PRIMARY_CONTAINER = '#00796B';
const SECONDARY_CONTAINER = '#ACEDDA';

const SURFACE = '#F6FAFA';
const SURFACE_CONTAINER_HIGH = '#E5E9E9';
const SURFACE_LOWEST = '#FFFFFF';

const ON_SURFACE = '#181C1D';
const ON_SURFACE_VARIANT = '#3E4946';
const ON_SECONDARY_CONTAINER = '#2E6D5F';

const OUTLINE = '#6E7A76';
const OUTLINE_VARIANT = '#BDC9C5';
const WHITE = '#FFFFFF';

const MEDICINE_IMAGE_URL =
  'https://lh3.googleusercontent.com/aida-public/'
  + 'AB6AXuCgGLC8_Em7ubdmcG17f5uw9hTQTrvOB78ABbqcIhlun4S-'
  + 'Depz-3ECqYWl7_cxXIwzvoTbZRgKSiDwgzXMYFVL8lwaJ8Q5cT8cOx-'
  + 'AvEREgf3_UMXAhe48ISxyE1GAHNqWQYVZydTCku-'
  + '8A2fezW50Qvh60eWy8Pl1zMVD4IgVc5spmQtMZO1sHSd0oS4uHK_'
  + '0IK4rLpIUBt4uxzoiW-P7ajjHoqyTiDGHAJre7SWxBgu--ZcRleWp';

const WAVE_COUNT = 5;

export default function TextAudioResultScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const recognizedText = route.params?.recognizedText?.trim();

  const translationResult: TranslationResult = {
    medicineName:
      recognizedText && recognizedText.length > 0
        ? recognizedText
        : 'ロキソプロフェンナトリウム',

    effectiveness:
      'いたみ や 熱を おさえる お薬です。',

    dosage:
      '1日に 3回、ご飯を 食べたあとに のんでください。',

    source:
      '出典：PMDA（医薬品医療機器総合機構）公的データ',
  };

  const [isPlaying, setIsPlaying] =
    useState<boolean>(true);

  const [question, setQuestion] =
    useState<string>('');

  const waveAnimations = useRef<Animated.Value[]>(
    Array.from(
      { length: WAVE_COUNT },
      () => new Animated.Value(0),
    ),
  ).current;

  useEffect(() => {
    if (!isPlaying) {
      waveAnimations.forEach(
        (animationValue: Animated.Value): void => {
          animationValue.stopAnimation();
          animationValue.setValue(0);
        },
      );

      return undefined;
    }

    const animations: Animated.CompositeAnimation[] =
      waveAnimations.map(
        (
          animationValue: Animated.Value,
          index: number,
        ): Animated.CompositeAnimation =>
          Animated.loop(
            Animated.sequence([
              Animated.delay(index * 90),

              Animated.timing(animationValue, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
              }),

              Animated.timing(animationValue, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
              }),
            ]),
          ),
      );

    animations.forEach(
      (animation: Animated.CompositeAnimation): void => {
        animation.start();
      },
    );

    return (): void => {
      animations.forEach(
        (animation: Animated.CompositeAnimation): void => {
          animation.stop();
        },
      );

      waveAnimations.forEach(
        (animationValue: Animated.Value): void => {
          animationValue.stopAnimation();
          animationValue.setValue(0);
        },
      );
    };
  }, [isPlaying, waveAnimations]);

  const handleTogglePlayback = (): void => {
    setIsPlaying(
      (previousValue: boolean): boolean =>
        !previousValue,
    );
  };

  const handleGoBack = (): void => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor={SURFACE}
        barStyle="dark-content"
      />

      {/* TopAppBar */}

      <View style={styles.appBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="前の画面に戻る"
          android_ripple={{
            color: '#DFE3E3',
            borderless: true,
          }}
          hitSlop={8}
          onPress={handleGoBack}
          style={styles.iconButton}
        >
          <MaterialIcons
            name="arrow-back"
            size={28}
            color={PRIMARY}
          />
        </Pressable>

        <Text
          numberOfLines={1}
          style={styles.appTitle}
        >
          お薬翻訳AI
        </Text>

        {/*
          今回はログイン・ユーザー登録機能を実装しないため、
          アカウントボタンは表示のみとする。
        */}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="アカウント機能は現在利用できません"
          accessibilityState={{
            disabled: true,
          }}
          disabled
          style={styles.iconButton}
        >
          <MaterialIcons
            name="account-circle"
            size={30}
            color={PRIMARY}
          />
        </Pressable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Medicine title */}

        <View style={styles.titleContainer}>
          <Text style={styles.medicineTitle}>
            {translationResult.medicineName}
          </Text>

          <View style={styles.verifiedRow}>
            <MaterialIcons
              name="verified"
              size={18}
              color={PRIMARY}
            />

            <Text style={styles.verifiedText}>
              AIによる高精度翻訳済み
            </Text>
          </View>
        </View>

        {/* Audio controller */}

        <View style={styles.audioCard}>
          <View style={styles.audioTop}>
            <View style={styles.audioLeft}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  isPlaying
                    ? '音声読み上げを停止する'
                    : '音声読み上げを再開する'
                }
                accessibilityState={{
                  selected: isPlaying,
                }}
                android_ripple={{
                  color: 'rgba(255,255,255,0.20)',
                  borderless: true,
                }}
                hitSlop={6}
                onPress={handleTogglePlayback}
                style={({ pressed }) => [
                  styles.playButton,
                  pressed && styles.playButtonPressed,
                ]}
              >
                <MaterialIcons
                  name={
                    isPlaying
                      ? 'pause'
                      : 'play-arrow'
                  }
                  size={34}
                  color={WHITE}
                />
              </Pressable>

              <View style={styles.audioInformation}>
                <Text style={styles.audioStatus}>
                  {isPlaying
                    ? '自動音声読み上げ中...'
                    : '読み上げ停止中'}
                </Text>

                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={[
                    styles.waveRow,
                    !isPlaying && styles.waveRowStopped,
                  ]}
                >
                  {waveAnimations.map(
                    (
                      animationValue: Animated.Value,
                      index: number,
                    ): React.JSX.Element => {
                      const scaleY =
                        animationValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.25, 1],
                        });

                      return (
                        <Animated.View
                          key={`audio-wave-${index}`}
                          style={[
                            styles.wave,
                            {
                              transform: [
                                {
                                  scaleY,
                                },
                              ],
                            },
                          ]}
                        />
                      );
                    },
                  )}
                </View>
              </View>
            </View>

            <View style={styles.audioRight}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="音量設定は現在利用できません"
                accessibilityState={{
                  disabled: true,
                }}
                disabled
                style={styles.audioOptionButton}
              >
                <MaterialIcons
                  name="volume-up"
                  size={24}
                  color={WHITE}
                />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="音声設定は現在利用できません"
                accessibilityState={{
                  disabled: true,
                }}
                disabled
                style={styles.audioOptionButton}
              >
                <MaterialIcons
                  name="settings"
                  size={24}
                  color={WHITE}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.progressBar}>
            <View style={styles.progress} />
          </View>
        </View>

        {/* Translation details */}

        <View style={styles.translationCard}>
          <View style={styles.translationSection}>
            <View style={styles.translationHeadingRow}>
              <MaterialIcons
                name="info-outline"
                size={23}
                color={PRIMARY}
              />

              <Text style={styles.translationHeading}>
                【ききめ（効果）】
              </Text>
            </View>

            <Text style={styles.translationBody}>
              {translationResult.effectiveness}
            </Text>
          </View>

          <View style={styles.translationSection}>
            <View style={styles.translationHeadingRow}>
              <MaterialIcons
                name="schedule"
                size={23}
                color={PRIMARY}
              />

              <Text style={styles.translationHeading}>
                【のみかた（用法）】
              </Text>
            </View>

            <Text style={styles.translationBody}>
              {translationResult.dosage}
            </Text>
          </View>

          <Image
            source={{
              uri: MEDICINE_IMAGE_URL,
            }}
            accessibilityLabel="薬の錠剤と包装のイメージ画像"
            resizeMode="cover"
            style={styles.medicineImage}
          />

          <View style={styles.sourceArea}>
            <Text style={styles.sourceText}>
              {translationResult.source}
            </Text>
          </View>
        </View>

        {/* Related actions */}

        <View style={styles.quickActionRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="注意点を確認する機能は現在利用できません"
            accessibilityState={{
              disabled: true,
            }}
            disabled
            style={styles.quickActionCard}
          >
            <View
              style={[
                styles.quickActionCardBackground,
                styles.warningActionCard,
              ]}
            >
              <MaterialIcons
                name="warning-amber"
                size={28}
                color={ON_SECONDARY_CONTAINER}
              />

              <Text style={styles.warningActionText}>
                注意点を確認する
              </Text>
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="過去の履歴と比較する機能は現在利用できません"
            accessibilityState={{
              disabled: true,
            }}
            disabled
            style={styles.quickActionCard}
          >
            <View
              style={[
                styles.quickActionCardBackground,
                styles.historyActionCard,
              ]}
            >
              <MaterialIcons
                name="history"
                size={28}
                color={PRIMARY}
              />

              <Text style={styles.historyActionText}>
                過去の履歴と比較
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* Bottom persistent interaction area */}

      <View style={styles.bottomArea}>
        <View style={styles.questionInputContainer}>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder="このお薬について追加で質問する"
            placeholderTextColor={OUTLINE}
            returnKeyType="send"
            accessibilityLabel="追加質問入力欄"
            style={styles.questionInput}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="音声入力機能は現在利用できません"
            accessibilityState={{
              disabled: true,
            }}
            disabled
            style={styles.microphoneButton}
          >
            <MaterialIcons
              name="mic"
              size={24}
              color={WHITE}
            />
          </Pressable>
        </View>

        <View style={styles.bottomNavigation}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="翻訳"
            accessibilityState={{
              selected: true,
            }}
            style={styles.navigationItem}
          >
            <MaterialIcons
              name="translate"
              size={25}
              color={PRIMARY}
            />

            <Text style={styles.activeNavigationLabel}>
              翻訳
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="履歴機能は現在利用できません"
            accessibilityState={{
              disabled: true,
            }}
            disabled
            style={styles.navigationItem}
          >
            <MaterialIcons
              name="history"
              size={25}
              color={OUTLINE}
            />

            <Text style={styles.inactiveNavigationLabel}>
              履歴
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="手話画面は現在利用できません"
            accessibilityState={{
              disabled: true,
            }}
            disabled
            style={styles.navigationItem}
          >
            <MaterialIcons
              name="sign-language"
              size={25}
              color={OUTLINE}
            />

            <Text style={styles.inactiveNavigationLabel}>
              手話
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="設定機能は現在利用できません"
            accessibilityState={{
              disabled: true,
            }}
            disabled
            style={styles.navigationItem}
          >
            <MaterialIcons
              name="settings"
              size={25}
              color={OUTLINE}
            />

            <Text style={styles.inactiveNavigationLabel}>
              設定
            </Text>
          </Pressable>
        </View>
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
    height: 56,
    paddingHorizontal: 20,
    backgroundColor: SURFACE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    elevation: 3,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,

    zIndex: 10,
  },

  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  appTitle: {
    flex: 1,
    marginHorizontal: 8,
    color: PRIMARY,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    textAlign: 'center',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 190,
  },

  titleContainer: {
    marginBottom: 24,
  },

  medicineTitle: {
    color: ON_SURFACE,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '800',
    marginBottom: 8,
  },

  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  verifiedText: {
    color: PRIMARY,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },

  audioCard: {
    padding: 16,
    marginBottom: 24,
    borderRadius: 12,
    backgroundColor: PRIMARY_CONTAINER,
    gap: 12,

    elevation: 5,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },

  audioTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  audioLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  playButton: {
    width: 48,
    height: 48,
    flexShrink: 0,
    borderRadius: 24,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',

    elevation: 3,
  },

  playButtonPressed: {
    opacity: 0.85,
    transform: [
      {
        scale: 0.96,
      },
    ],
  },

  audioInformation: {
    flex: 1,
    minWidth: 0,
  },

  audioStatus: {
    color: WHITE,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },

  waveRow: {
    height: 16,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    opacity: 0.65,
  },

  waveRowStopped: {
    opacity: 0.3,
  },

  wave: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: WHITE,
  },

  audioRight: {
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  audioOptionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  progressBar: {
    width: '100%',
    height: 6,
    overflow: 'hidden',
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.20)',
  },

  progress: {
    width: '33%',
    height: '100%',
    borderRadius: 3,
    backgroundColor: WHITE,
  },

  translationCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: OUTLINE_VARIANT,
    borderRadius: 12,
    backgroundColor: SURFACE_LOWEST,
    gap: 32,

    elevation: 1,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },

  translationSection: {
    gap: 8,
  },

  translationHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  translationHeading: {
    color: PRIMARY,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },

  translationBody: {
    color: ON_SURFACE,
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '400',
    letterSpacing: 0.5,
  },

  medicineImage: {
    width: '100%',
    height: 128,
    borderRadius: 8,
    backgroundColor: SURFACE_CONTAINER_HIGH,
  },

  sourceArea: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: OUTLINE_VARIANT,
  },

  sourceText: {
    color: ON_SURFACE_VARIANT,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
    fontWeight: '500',
  },

  quickActionRow: {
    marginTop: 24,
    flexDirection: 'row',
    gap: 8,
  },

  quickActionCard: {
    flex: 1,
    aspectRatio: 1,
  },

  quickActionCardBackground: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    justifyContent: 'space-between',
  },

  warningActionCard: {
    backgroundColor: SECONDARY_CONTAINER,
  },

  historyActionCard: {
    backgroundColor: SURFACE_CONTAINER_HIGH,
  },

  warningActionText: {
    color: ON_SECONDARY_CONTAINER,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },

  historyActionText: {
    color: ON_SURFACE,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },

  bottomArea: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,

    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,

    backgroundColor: SURFACE,

    borderTopWidth: 1,
    borderTopColor: OUTLINE_VARIANT,

    elevation: 12,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },

  questionInputContainer: {
    height: 56,
    paddingLeft: 16,
    paddingRight: 6,

    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 28,

    backgroundColor: SURFACE_CONTAINER_HIGH,

    flexDirection: 'row',
    alignItems: 'center',
  },

  questionInput: {
    flex: 1,
    minWidth: 0,

    paddingVertical: 0,
    paddingRight: 8,

    color: ON_SURFACE,
    fontSize: 16,
    lineHeight: 22,
  },

  microphoneButton: {
    width: 40,
    height: 40,
    flexShrink: 0,

    borderRadius: 20,
    backgroundColor: PRIMARY,

    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomNavigation: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  navigationItem: {
    minWidth: 56,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  activeNavigationLabel: {
    marginTop: 1,
    color: PRIMARY,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
  },

  inactiveNavigationLabel: {
    marginTop: 1,
    color: OUTLINE,
    fontSize: 10,
    lineHeight: 13,
    opacity: 0.45,
  },
});