import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Animated,
  ImageBackground,
  Keyboard,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';

import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import type {
  RootStackParamList,
} from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'SignLanguageResult'
>;

type SignLanguageResultData = {
  medicineName: string;
  caption: string;
  effectiveness: string;
  dosageHighlight: string;
  dosageSuffix: string;
  source: string;
};

const PRIMARY = '#005E53';
const SECONDARY = '#29695B';
const ERROR = '#BA1A1A';

const SURFACE = '#F6FAFA';
const SURFACE_CONTAINER_LOW = '#F0F4F4';
const SURFACE_CONTAINER_HIGH = '#E5E9E9';
const SURFACE_CONTAINER_HIGHEST = '#DFE3E3';
const INVERSE_SURFACE = '#2C3132';

const SECONDARY_CONTAINER = '#ACEDDA';
const ON_SECONDARY_CONTAINER = '#2E6D5F';

const ON_SURFACE = '#181C1D';
const ON_SURFACE_VARIANT = '#3E4946';

const OUTLINE = '#6E7A76';
const OUTLINE_VARIANT = '#BDC9C5';

const WHITE = '#FFFFFF';
const BLACK = '#000000';

const INTERPRETER_IMAGE_URL =
  'https://lh3.googleusercontent.com/aida-public/'
  + 'AB6AXuA3NoIQOQPZ5m8EwUdbXs-MT9EKyeQwQKunn1nSgSj6vCRqbXkWhcLNOOMl'
  + 'ZzR6eJO4P26Een0m5_1rhVbOy1tUN5RC8qE17CDg5SYmQu4Nb_gi3zuYWr0BI3uPV'
  + '-913N5J-W-JqzuqcZq0Up0jziQENrcyfvsvQzXWtna6IAwBF85XnAkRK0NOS9vQ3X'
  + 'gOlKPgEU-SjM3bm7h9j9CDSvl9gWJ1Po9i1REF7Jl-zG1jykjSl-wPaqv7';

export default function SignLanguageResultScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const recognizedText =
    route.params?.recognizedText?.trim();

  const resultData: SignLanguageResultData = {
    medicineName:
      recognizedText && recognizedText.length > 0
        ? recognizedText
        : 'ロキソプロフェンナトリウム',

    caption:
      '1日に3回、ご飯を食べた後に飲んでください。',

    effectiveness:
      'いたみ や 熱を おさえる お薬です。',

    dosageHighlight:
      '1日に 3回、ご飯を 食べたあと',

    dosageSuffix:
      'に のんでください。',

    source:
      'ソース: 医療用医薬品 添付文書翻訳AI',
  };

  const [isVideoPlaying, setIsVideoPlaying] =
    useState<boolean>(true);

  const [isListening, setIsListening] =
    useState<boolean>(false);

  const [question, setQuestion] =
    useState<string>('');

  const livePulseAnimation =
    useRef(new Animated.Value(1)).current;

  const microphoneAnimation =
    useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const liveAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(
          livePulseAnimation,
          {
            toValue: 0.35,
            duration: 700,
            useNativeDriver: true,
          },
        ),

        Animated.timing(
          livePulseAnimation,
          {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          },
        ),
      ]),
    );

    liveAnimation.start();

    return (): void => {
      liveAnimation.stop();
      livePulseAnimation.setValue(1);
    };
  }, [livePulseAnimation]);

  useEffect(() => {
    if (!isListening) {
      microphoneAnimation.stopAnimation();
      microphoneAnimation.setValue(1);

      return undefined;
    }

    const microphonePulse = Animated.loop(
      Animated.sequence([
        Animated.timing(
          microphoneAnimation,
          {
            toValue: 1.05,
            duration: 700,
            useNativeDriver: true,
          },
        ),

        Animated.timing(
          microphoneAnimation,
          {
            toValue: 0.95,
            duration: 700,
            useNativeDriver: true,
          },
        ),
      ]),
    );

    microphonePulse.start();

    return (): void => {
      microphonePulse.stop();
      microphoneAnimation.setValue(1);
    };
  }, [
    isListening,
    microphoneAnimation,
  ]);

  const handleGoBack = (): void => {
    navigation.goBack();
  };

  const handleToggleVideo = (): void => {
    setIsVideoPlaying(
      (previousValue: boolean): boolean =>
        !previousValue,
    );
  };

  const handleToggleListening = (): void => {
    Keyboard.dismiss();

    setIsListening(
      (previousValue: boolean): boolean =>
        !previousValue,
    );
  };

  const handleQuestionSubmit = (): void => {
    const normalizedQuestion =
      question.trim();

    if (normalizedQuestion.length === 0) {
      return;
    }

    Keyboard.dismiss();

    /*
     * FastAPI接続後に、ここから質問APIへ送信する。
     * 現段階では画面と入力動作の確認のみ行う。
     */
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor={SURFACE}
        barStyle="dark-content"
      />

      {/* Top Navigation Bar */}

      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
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
        </View>

        {/*
          ログイン・ユーザー登録機能は今回実装しないため、
          アカウントアイコンは表示のみとする。
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
        contentContainerStyle={
          styles.scrollContent
        }
      >
        {/* Header Section */}

        <View style={styles.headerSection}>
          <View style={styles.modeBadge}>
            <Text style={styles.modeBadgeText}>
              手話モード
            </Text>
          </View>

          <Text style={styles.medicineTitle}>
            {resultData.medicineName}
          </Text>
        </View>

        {/* 16:9 Sign Language Video Mockup */}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isVideoPlaying
              ? '手話動画を一時停止する'
              : '手話動画を再生する'
          }
          accessibilityState={{
            selected: isVideoPlaying,
          }}
          onPress={handleToggleVideo}
          style={styles.videoViewport}
        >
          <ImageBackground
            source={{
              uri: INTERPRETER_IMAGE_URL,
            }}
            accessibilityLabel="手話で内容を伝える通訳者"
            resizeMode="cover"
            style={styles.videoImage}
            imageStyle={styles.videoImageStyle}
          >
            {/* LIVE label */}

            <View style={styles.liveBadge}>
              <Animated.View
                style={[
                  styles.liveIndicator,
                  {
                    opacity:
                      livePulseAnimation,
                  },
                ]}
              />

              <Text style={styles.liveBadgeText}>
                LIVE INTERPRET
              </Text>
            </View>

            {/* Dark overlay */}

            <View style={styles.videoDarkOverlay} />

            {/* Play/Pause Button */}

            <View style={styles.videoControlContainer}>
              <View style={styles.videoControlButton}>
                <MaterialIcons
                  name={
                    isVideoPlaying
                      ? 'pause'
                      : 'play-arrow'
                  }
                  size={50}
                  color={WHITE}
                />
              </View>
            </View>

            {/* Caption */}

            <View style={styles.captionArea}>
              <View style={styles.captionContainer}>
                <Text style={styles.captionText}>
                  {resultData.caption}
                </Text>
              </View>
            </View>
          </ImageBackground>
        </Pressable>

        {/* Easy Japanese Section */}

        <View style={styles.descriptionSection}>
          <View style={styles.descriptionHeadingRow}>
            <MaterialIcons
              name="auto-awesome"
              size={22}
              color={SECONDARY}
            />

            <Text style={styles.descriptionHeading}>
              やさしい日本語 (Easy Japanese)
            </Text>
          </View>

          <View style={styles.easyJapaneseCard}>
            <Text style={styles.easyJapaneseText}>
              {resultData.effectiveness}
            </Text>

            <Text style={styles.easyJapaneseText}>
              <Text style={styles.highlightedText}>
                {resultData.dosageHighlight}
              </Text>

              {resultData.dosageSuffix}
            </Text>
          </View>

          {/* Source Information */}

          <View style={styles.sourceSection}>
            <View style={styles.sourceRow}>
              <View style={styles.sourceInformation}>
                <MaterialIcons
                  name="verified-user"
                  size={18}
                  color={ON_SURFACE_VARIANT}
                />

                <Text style={styles.sourceText}>
                  {resultData.source}
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="詳細情報は現在利用できません"
                accessibilityState={{
                  disabled: true,
                }}
                disabled
                style={styles.detailButton}
              >
                <MaterialIcons
                  name="info-outline"
                  size={18}
                  color={PRIMARY}
                />

                <Text style={styles.detailButtonText}>
                  詳細
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Persistent Panel */}

      <View style={styles.bottomPanel}>
        {/* Floating Interaction Bar */}

        <View style={styles.interactionWrapper}>
          <View style={styles.interactionBar}>
            <View style={styles.questionInputWrapper}>
              <TextInput
                value={question}
                onChangeText={setQuestion}
                onSubmitEditing={
                  handleQuestionSubmit
                }
                placeholder="質問を入力... (例: 追加で確認したいこと)"
                placeholderTextColor={
                  ON_SURFACE_VARIANT
                }
                returnKeyType="send"
                accessibilityLabel="追加質問入力欄"
                style={styles.questionInput}
              />
            </View>

            <Animated.View
              style={{
                transform: [
                  {
                    scale:
                      microphoneAnimation,
                  },
                ],
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  isListening
                    ? '音声入力を停止する'
                    : '音声入力を開始する'
                }
                accessibilityState={{
                  selected: isListening,
                }}
                android_ripple={{
                  color:
                    'rgba(255,255,255,0.20)',
                }}
                onPress={
                  handleToggleListening
                }
                style={[
                  styles.microphoneButton,
                  isListening
                    ? styles.microphoneButtonListening
                    : styles.microphoneButtonIdle,
                ]}
              >
                <MaterialIcons
                  name={
                    isListening
                      ? 'stop'
                      : 'mic'
                  }
                  size={31}
                  color={WHITE}
                />
              </Pressable>
            </Animated.View>
          </View>
        </View>

        {/* Global Navigation */}

        <View style={styles.bottomNavigation}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="翻訳機能は現在利用できません"
            accessibilityState={{
              disabled: true,
            }}
            disabled
            style={styles.navigationItem}
          >
            <MaterialIcons
              name="translate"
              size={25}
              color={ON_SURFACE_VARIANT}
            />

            <Text style={styles.navigationLabel}>
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
              color={ON_SURFACE_VARIANT}
            />

            <Text style={styles.navigationLabel}>
              履歴
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="手話"
            accessibilityState={{
              selected: true,
            }}
            style={[
              styles.navigationItem,
              styles.activeNavigationItem,
            ]}
          >
            <MaterialCommunityIcons
              name="hand-wave"
              size={25}
              color={ON_SECONDARY_CONTAINER}
            />

            <Text
              style={
                styles.activeNavigationLabel
              }
            >
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
              color={ON_SURFACE_VARIANT}
            />

            <Text style={styles.navigationLabel}>
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

    shadowColor: BLACK,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,

    zIndex: 50,
  },

  appBarLeft: {
    flex: 1,
    minWidth: 0,

    flexDirection: 'row',
    alignItems: 'center',

    gap: 16,
  },

  iconButton: {
    width: 48,
    height: 48,
    flexShrink: 0,

    borderRadius: 24,

    alignItems: 'center',
    justifyContent: 'center',
  },

  appTitle: {
    flex: 1,

    color: PRIMARY,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
  },

  scrollContent: {
    paddingBottom: 190,
  },

  headerSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  modeBadge: {
    alignSelf: 'flex-start',

    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,

    borderRadius: 999,
    backgroundColor: SECONDARY_CONTAINER,
  },

  modeBadgeText: {
    color: ON_SECONDARY_CONTAINER,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },

  medicineTitle: {
    color: PRIMARY,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
  },

  videoViewport: {
    width: '100%',
    aspectRatio: 16 / 9,

    overflow: 'hidden',
    backgroundColor: INVERSE_SURFACE,
  },

  videoImage: {
    flex: 1,
    position: 'relative',
  },

  videoImageStyle: {
    backgroundColor: INVERSE_SURFACE,
  },

  videoDarkOverlay: {
    ...StyleSheet.absoluteFill,

    backgroundColor:
      'rgba(0,0,0,0.18)',
  },

  liveBadge: {
    position: 'absolute',
    top: 16,
    right: 16,

    zIndex: 10,

    paddingHorizontal: 12,
    paddingVertical: 6,

    borderRadius: 8,
    backgroundColor:
      'rgba(0,0,0,0.48)',

    flexDirection: 'row',
    alignItems: 'center',

    gap: 8,
  },

  liveIndicator: {
    width: 8,
    height: 8,

    borderRadius: 4,
    backgroundColor: '#EF4444',
  },

  liveBadgeText: {
    color: WHITE,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },

  videoControlContainer: {
    ...StyleSheet.absoluteFill,

    zIndex: 5,

    alignItems: 'center',
    justifyContent: 'center',
  },

  videoControlButton: {
    width: 80,
    height: 80,

    borderRadius: 40,
    backgroundColor:
      'rgba(0,94,83,0.82)',

    alignItems: 'center',
    justifyContent: 'center',

    elevation: 8,

    shadowColor: BLACK,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },

  captionArea: {
    position: 'absolute',
    right: 0,
    bottom: 24,
    left: 0,

    zIndex: 8,

    paddingHorizontal: 20,

    alignItems: 'center',
  },

  captionContainer: {
    maxWidth: '90%',

    paddingHorizontal: 20,
    paddingVertical: 12,

    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.20)',

    borderRadius: 12,
    backgroundColor:
      'rgba(0,0,0,0.90)',

    elevation: 10,

    shadowColor: BLACK,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },

  captionText: {
    color: WHITE,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    textAlign: 'center',
  },

  descriptionSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },

  descriptionHeadingRow: {
    marginBottom: 8,

    flexDirection: 'row',
    alignItems: 'center',

    gap: 8,
  },

  descriptionHeading: {
    color: SECONDARY,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },

  easyJapaneseCard: {
    padding: 16,

    borderLeftWidth: 6,
    borderLeftColor: PRIMARY,

    borderRadius: 12,
    backgroundColor:
      SURFACE_CONTAINER_LOW,

    gap: 8,

    elevation: 2,

    shadowColor: BLACK,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },

  easyJapaneseText: {
    color: ON_SURFACE,
    fontSize: 20,
    lineHeight: 36,
    letterSpacing: 0.5,
    fontWeight: '400',
  },

  highlightedText: {
    backgroundColor:
      'rgba(172,237,218,0.40)',

    borderBottomWidth: 2,
    borderBottomColor: SECONDARY,

    fontWeight: '700',
  },

  sourceSection: {
    marginTop: 32,
    paddingTop: 16,

    borderTopWidth: 1,
    borderTopColor: OUTLINE_VARIANT,
  },

  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    gap: 12,
  },

  sourceInformation: {
    flex: 1,
    minWidth: 0,

    flexDirection: 'row',
    alignItems: 'center',

    gap: 8,
  },

  sourceText: {
    flex: 1,

    color: ON_SURFACE_VARIANT,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },

  detailButton: {
    minWidth: 64,
    minHeight: 48,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 4,
  },

  detailButtonText: {
    color: PRIMARY,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },

  bottomPanel: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,

    zIndex: 40,
  },

  interactionWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },

  interactionBar: {
    padding: 12,

    borderWidth: 1,
    borderColor: OUTLINE_VARIANT,

    borderRadius: 16,
    backgroundColor:
      SURFACE_CONTAINER_HIGHEST,

    flexDirection: 'row',
    alignItems: 'center',

    gap: 12,

    elevation: 10,

    shadowColor: BLACK,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.16,
    shadowRadius: 10,
  },

  questionInputWrapper: {
    flex: 1,
    minWidth: 0,

    paddingHorizontal: 16,

    borderWidth: 1,
    borderColor: OUTLINE,

    borderRadius: 12,
    backgroundColor: SURFACE,

    justifyContent: 'center',
  },

  questionInput: {
    minHeight: 48,
    paddingVertical: 0,

    color: ON_SURFACE,
    fontSize: 16,
    lineHeight: 22,
  },

  microphoneButton: {
    width: 56,
    height: 56,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',

    elevation: 4,

    shadowColor: BLACK,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },

  microphoneButtonIdle: {
    backgroundColor: PRIMARY,
  },

  microphoneButtonListening: {
    backgroundColor: ERROR,
  },

  bottomNavigation: {
    minHeight: 80,

    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,

    borderTopWidth: 1,
    borderTopColor: OUTLINE_VARIANT,

    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,

    backgroundColor: SURFACE,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',

    elevation: 12,

    shadowColor: BLACK,
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },

  navigationItem: {
    minWidth: 64,
    minHeight: 56,

    paddingHorizontal: 10,
    paddingVertical: 6,

    borderRadius: 28,

    alignItems: 'center',
    justifyContent: 'center',
  },

  activeNavigationItem: {
    paddingHorizontal: 24,
    backgroundColor: SECONDARY_CONTAINER,
  },

  navigationLabel: {
    marginTop: 2,

    color: ON_SURFACE_VARIANT,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },

  activeNavigationLabel: {
    marginTop: 2,

    color: ON_SECONDARY_CONTAINER,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
});