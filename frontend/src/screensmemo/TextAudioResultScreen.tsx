// frontend/src/screens/TextAudioResultScreen.tsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from 'react';

import {
  Animated,
  Keyboard,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type PressableStateCallbackType,
  type ViewStyle,
} from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';

import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import type {
  RootStackParamList,
} from './ModeSelectionScreen';

type TextAudioResultScreenProps =
  NativeStackScreenProps<
    RootStackParamList,
    'TextAudioResult'
  >;

type MaterialIconName =
  ComponentProps<
    typeof MaterialIcons
  >['name'];

type TranslationResult = {
  medicineName: string;
  effectiveness: string;
  dosage: string;
  source: string;
};

type AudioPlaybackStatus =
  | 'idle'
  | 'playing'
  | 'paused'
  | 'unsupported'
  | 'error';

type HeaderIconButtonProps = {
  accessibilityLabel: string;
  iconName: MaterialIconName;
  disabled?: boolean;
  onPress: () => void;
};

type InformationSectionProps = {
  iconName: MaterialIconName;
  title: string;
  content: string;
};

type QuickActionCardProps = {
  accessibilityLabel: string;
  iconName: MaterialIconName;
  label: string;
  variant: 'warning' | 'history';
  disabled?: boolean;
  onPress?: () => void;
};

type BottomNavigationItemProps = {
  accessibilityLabel: string;
  iconName: MaterialIconName;
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
};

const DESKTOP_BREAKPOINT = 900;
const WEB_CONTENT_MAX_WIDTH = 1180;
const WAVE_COUNT = 5;

const COLORS = {
  primary: '#005e53',
  primaryContainer: '#00796b',
  primaryFixed: '#97f3e2',

  onPrimary: '#ffffff',
  onSurface: '#181c1d',
  onSurfaceVariant: '#3e4946',

  surface: '#f6fafa',
  surfaceContainerLow: '#f0f4f4',
  surfaceContainer: '#e9eeee',
  surfaceContainerHigh: '#e5e9e9',
  surfaceContainerHighest: '#dfe3e3',
  surfaceLowest: '#ffffff',

  secondaryContainer: '#acedda',
  onSecondaryContainer: '#2e6d5f',

  outline: '#6e7a76',
  outlineVariant: '#bdc9c5',

  warningBackground: '#fff9eb',
  warningBorder: '#ffe0a3',
  warningIcon: '#d97706',

  black: '#000000',
  white: '#ffffff',
  shadow: '#000000',
  transparent: 'transparent',
} as const;

const MEDICINE_IMAGE_URL =
  'https://lh3.googleusercontent.com/aida-public/' +
  'AB6AXuCgGLC8_Em7ubdmcG17f5uw9hTQTrvOB78ABbqcIhlun4S-' +
  'Depz-3ECqYWl7_cxXIwzvoTbZRgKSiDwgzXMYFVL8lwaJ8Q5cT8cOx-' +
  'AvEREgf3_UMXAhe48ISxyE1GAHNqWQYVZydTCku-' +
  '8A2fezW50Qvh60eWy8Pl1zMVD4IgVc5spmQtMZO1sHSd0oS4uHK_' +
  '0IK4rLpIUBt4uxzoiW-P7ajjHoqyTiDGHAJre7SWxBgu--ZcRleWp';

/**
 * ヘッダーアイコンボタン。
 */
const HeaderIconButton = ({
  accessibilityLabel,
  iconName,
  disabled = false,
  onPress,
}: HeaderIconButtonProps): React.JSX.Element => {
  const getButtonStyle = useCallback(
    ({
      pressed,
    }: PressableStateCallbackType): ViewStyle[] => [
      styles.headerIconButton,

      pressed && !disabled
        ? styles.headerIconButtonPressed
        : styles.headerIconButtonDefault,

      disabled
        ? styles.headerIconButtonDisabled
        : styles.headerIconButtonEnabled,
    ],
    [disabled],
  );

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{
        disabled,
      }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={getButtonStyle}
    >
      <MaterialIcons
        accessibilityElementsHidden
        color={
          disabled
            ? COLORS.outline
            : COLORS.primary
        }
        importantForAccessibility="no-hide-descendants"
        name={iconName}
        size={28}
      />
    </Pressable>
  );
};

/**
 * 翻訳結果内の情報セクション。
 */
const InformationSection = ({
  iconName,
  title,
  content,
}: InformationSectionProps): React.JSX.Element => {
  return (
    <View style={styles.informationSection}>
      <View style={styles.informationHeadingRow}>
        <View style={styles.informationIconCircle}>
          <MaterialIcons
            accessibilityElementsHidden
            color={COLORS.primary}
            importantForAccessibility="no-hide-descendants"
            name={iconName}
            size={23}
          />
        </View>

        <Text style={styles.informationHeading}>
          {title}
        </Text>
      </View>

      <Text style={styles.informationBody}>
        {content}
      </Text>
    </View>
  );
};

/**
 * 注意点・履歴などの補助アクション。
 */
const QuickActionCard = ({
  accessibilityLabel,
  iconName,
  label,
  variant,
  disabled = false,
  onPress,
}: QuickActionCardProps): React.JSX.Element => {
  const handlePress = useCallback((): void => {
    if (
      disabled ||
      onPress === undefined
    ) {
      return;
    }

    onPress();
  }, [
    disabled,
    onPress,
  ]);

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{
        disabled,
      }}
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.quickActionCard,

        variant === 'warning'
          ? styles.warningQuickActionCard
          : styles.historyQuickActionCard,

        pressed && !disabled
          ? styles.quickActionCardPressed
          : styles.quickActionCardDefault,

        disabled
          ? styles.quickActionCardDisabled
          : styles.quickActionCardEnabled,
      ]}
    >
      <MaterialIcons
        accessibilityElementsHidden
        color={
          variant === 'warning'
            ? COLORS.onSecondaryContainer
            : COLORS.primary
        }
        importantForAccessibility="no-hide-descendants"
        name={iconName}
        size={30}
      />

      <Text
        style={[
          styles.quickActionText,

          variant === 'warning'
            ? styles.warningQuickActionText
            : styles.historyQuickActionText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

/**
 * 下部ナビゲーション項目。
 */
const BottomNavigationItem = ({
  accessibilityLabel,
  iconName,
  label,
  selected = false,
  disabled = false,
  onPress,
}: BottomNavigationItemProps): React.JSX.Element => {
  const handlePress = useCallback((): void => {
    if (
      disabled ||
      onPress === undefined
    ) {
      return;
    }

    onPress();
  }, [
    disabled,
    onPress,
  ]);

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{
        disabled,
        selected,
      }}
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.navigationItem,

        selected
          ? styles.navigationItemSelected
          : styles.navigationItemDefault,

        pressed && !disabled
          ? styles.navigationItemPressed
          : styles.navigationItemNotPressed,

        disabled
          ? styles.navigationItemDisabled
          : styles.navigationItemEnabled,
      ]}
    >
      <MaterialIcons
        accessibilityElementsHidden
        color={
          selected
            ? COLORS.primary
            : COLORS.outline
        }
        importantForAccessibility="no-hide-descendants"
        name={iconName}
        size={25}
      />

      <Text
        style={[
          styles.navigationLabel,

          selected
            ? styles.activeNavigationLabel
            : styles.inactiveNavigationLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const TextAudioResultScreen = ({
  navigation,
  route,
}: TextAudioResultScreenProps): React.JSX.Element => {
  const {
    width,
  } = useWindowDimensions();

  const isDesktopLayout =
    width >= DESKTOP_BREAKPOINT;

  const recognizedText: string =
    route.params?.recognizedText?.trim() ?? '';

  /**
   * FastAPI接続前の仮データ。
   *
   * FastAPI接続後は、翻訳APIのレスポンスを
   * TranslationResult型へ変換して使用します。
   */
  const translationResult =
    useMemo<TranslationResult>(
      (): TranslationResult => ({
        medicineName:
          recognizedText.length > 0
            ? recognizedText
            : '読み取ったお薬名',

        effectiveness:
          '読み取った説明書の内容を、分かりやすい文章で表示します。',

        dosage:
          '読み取った説明書に記載されている使用方法を表示します。',

        source:
          '現在は画面遷移確認用の仮データです。FastAPI接続後に参照元情報を表示します。',
      }),
      [recognizedText],
    );

  const [playbackStatus, setPlaybackStatus] =
    useState<AudioPlaybackStatus>('idle');

  const [question, setQuestion] =
    useState<string>('');

  const speechUtteranceRef =
    useRef<SpeechSynthesisUtterance | null>(
      null,
    );

  const waveAnimations =
    useRef<Animated.Value[]>(
      Array.from(
        {
          length: WAVE_COUNT,
        },
        (): Animated.Value =>
          new Animated.Value(0),
      ),
    ).current;

  const isSpeechSupported =
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !==
      'undefined';

  const isPlaying =
    playbackStatus === 'playing';

  const readableText =
    useMemo<string>(
      (): string =>
        [
          translationResult.medicineName,
          translationResult.effectiveness,
          translationResult.dosage,
        ].join('。'),
      [translationResult],
    );

  /**
   * ブラウザ読み上げを停止します。
   */
  const stopSpeech =
    useCallback((): void => {
      if (!isSpeechSupported) {
        return;
      }

      window.speechSynthesis.cancel();
      speechUtteranceRef.current = null;
    }, [isSpeechSupported]);

  /**
   * Web Speech APIで日本語を読み上げます。
   */
  const startSpeech =
    useCallback((): void => {
      if (!isSpeechSupported) {
        setPlaybackStatus(
          'unsupported',
        );

        return;
      }

      stopSpeech();

      const utterance =
        new SpeechSynthesisUtterance(
          readableText,
        );

      utterance.lang = 'ja-JP';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = (): void => {
        setPlaybackStatus('playing');
      };

      utterance.onend = (): void => {
        setPlaybackStatus('idle');
        speechUtteranceRef.current =
          null;
      };

      utterance.onerror = (): void => {
        setPlaybackStatus('error');
        speechUtteranceRef.current =
          null;
      };

      speechUtteranceRef.current =
        utterance;

      window.speechSynthesis.speak(
        utterance,
      );
    }, [
      isSpeechSupported,
      readableText,
      stopSpeech,
    ]);

  /**
   * 画面離脱時に読み上げを停止します。
   */
  useEffect(() => {
    return (): void => {
      stopSpeech();
    };
  }, [stopSpeech]);

  /**
   * 音声波形アニメーション。
   */
  useEffect(() => {
    if (!isPlaying) {
      waveAnimations.forEach(
        (
          animationValue: Animated.Value,
        ): void => {
          animationValue.stopAnimation();
          animationValue.setValue(0);
        },
      );

      return undefined;
    }

    const animations:
      Animated.CompositeAnimation[] =
      waveAnimations.map(
        (
          animationValue: Animated.Value,
          index: number,
        ): Animated.CompositeAnimation =>
          Animated.loop(
            Animated.sequence([
              Animated.delay(index * 90),

              Animated.timing(
                animationValue,
                {
                  toValue: 1,
                  duration: 400,
                  useNativeDriver: false,
                },
              ),

              Animated.timing(
                animationValue,
                {
                  toValue: 0,
                  duration: 400,
                  useNativeDriver: false,
                },
              ),
            ]),
          ),
      );

    animations.forEach(
      (
        animation:
          Animated.CompositeAnimation,
      ): void => {
        animation.start();
      },
    );

    return (): void => {
      animations.forEach(
        (
          animation:
            Animated.CompositeAnimation,
        ): void => {
          animation.stop();
        },
      );

      waveAnimations.forEach(
        (
          animationValue: Animated.Value,
        ): void => {
          animationValue.stopAnimation();
          animationValue.setValue(0);
        },
      );
    };
  }, [
    isPlaying,
    waveAnimations,
  ]);

  const handleGoBack =
    useCallback((): void => {
      stopSpeech();
      navigation.goBack();
    }, [
      navigation,
      stopSpeech,
    ]);

  const handleTogglePlayback =
    useCallback((): void => {
      if (!isSpeechSupported) {
        setPlaybackStatus(
          'unsupported',
        );

        return;
      }

      if (
        playbackStatus === 'playing'
      ) {
        window.speechSynthesis.pause();
        setPlaybackStatus('paused');

        return;
      }

      if (
        playbackStatus === 'paused'
      ) {
        window.speechSynthesis.resume();
        setPlaybackStatus('playing');

        return;
      }

      startSpeech();
    }, [
      isSpeechSupported,
      playbackStatus,
      startSpeech,
    ]);

  const handleRestartPlayback =
    useCallback((): void => {
      startSpeech();
    }, [startSpeech]);

  const handleQuestionChange =
    useCallback(
      (
        value: string,
      ): void => {
        setQuestion(value);
      },
      [],
    );

  /**
   * FastAPI接続前のため、質問送信は入力値の保持のみです。
   */
  const handleQuestionSubmit =
    useCallback((): void => {
      const normalizedQuestion =
        question.trim();

      if (
        normalizedQuestion.length === 0
      ) {
        return;
      }

      /*
       * FastAPI接続後:
       *
       * POST /api/questions
       * {
       *   recognizedText,
       *   question
       * }
       */
    }, [question]);

  const handleReturnToModeSelection =
    useCallback((): void => {
      stopSpeech();

      navigation.popToTop();
    }, [
      navigation,
      stopSpeech,
    ]);

  const getPlayButtonStyle =
    useCallback(
      ({
        pressed,
      }: PressableStateCallbackType): ViewStyle[] => [
        styles.playButton,

        pressed
          ? styles.playButtonPressed
          : styles.playButtonDefault,
      ],
      [],
    );

  const getQuestionSendButtonStyle =
    useCallback(
      ({
        pressed,
      }: PressableStateCallbackType): ViewStyle[] => [
        styles.questionSendButton,

        pressed
          ? styles.questionSendButtonPressed
          : styles.questionSendButtonDefault,

        question.trim().length === 0
          ? styles.questionSendButtonDisabled
          : styles.questionSendButtonEnabled,
      ],
      [question],
    );

  const playbackStatusText =
    useMemo<string>(
      (): string => {
        switch (playbackStatus) {
          case 'playing':
            return '音声読み上げ中';

          case 'paused':
            return '読み上げを一時停止しています';

          case 'unsupported':
            return 'このブラウザは音声読み上げに対応していません';

          case 'error':
            return '音声読み上げでエラーが発生しました';

          case 'idle':
          default:
            return '再生ボタンを押すと読み上げます';
        }
      },
      [playbackStatus],
    );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        backgroundColor={COLORS.surface}
        barStyle="dark-content"
      />

      <View style={styles.screen}>
        {/* Web対応ヘッダー */}
        <View style={styles.header}>
          <View style={styles.headerInner}>
            <HeaderIconButton
              accessibilityLabel="前の画面に戻る"
              iconName="arrow-back"
              onPress={handleGoBack}
            />

            <View style={styles.headerTitleArea}>
              <View style={styles.headerLogo}>
                <MaterialIcons
                  accessibilityElementsHidden
                  color={COLORS.onPrimary}
                  importantForAccessibility="no-hide-descendants"
                  name="translate"
                  size={22}
                />
              </View>

              <View style={styles.headerTextArea}>
                <Text
                  accessibilityRole="header"
                  numberOfLines={1}
                  style={styles.headerTitle}
                >
                  お薬翻訳AI
                </Text>

                <Text style={styles.headerSubtitle}>
                  テキスト・音声結果
                </Text>
              </View>
            </View>

            <HeaderIconButton
              accessibilityLabel="アカウント機能は現在利用できません"
              disabled
              iconName="account-circle"
              onPress={(): void => undefined}
            />
          </View>
        </View>

        <ScrollView
          alwaysBounceVertical={false}
          bounces={false}
          contentContainerStyle={
            styles.scrollContent
          }
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.contentContainer,

              isDesktopLayout
                ? styles.contentContainerDesktop
                : styles.contentContainerMobile,
            ]}
          >
            {/* 結果タイトル */}
            <View
              style={[
                styles.resultIntroduction,

                isDesktopLayout
                  ? styles.resultIntroductionDesktop
                  : styles.resultIntroductionMobile,
              ]}
            >
              <View style={styles.translationBadge}>
                <MaterialIcons
                  accessibilityElementsHidden
                  color={COLORS.primary}
                  importantForAccessibility="no-hide-descendants"
                  name="record-voice-over"
                  size={19}
                />

                <Text style={styles.translationBadgeText}>
                  テキスト・音声モード
                </Text>
              </View>

              <Text
                accessibilityRole="header"
                style={[
                  styles.medicineTitle,

                  isDesktopLayout
                    ? styles.medicineTitleDesktop
                    : styles.medicineTitleMobile,
                ]}
              >
                {translationResult.medicineName}
              </Text>

              <View style={styles.verifiedRow}>
                <MaterialIcons
                  accessibilityElementsHidden
                  color={COLORS.primary}
                  importantForAccessibility="no-hide-descendants"
                  name="check-circle"
                  size={19}
                />

                <Text style={styles.verifiedText}>
                  読み取り結果から生成した表示内容
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.mainLayout,

                isDesktopLayout
                  ? styles.mainLayoutDesktop
                  : styles.mainLayoutMobile,
              ]}
            >
              {/* 左側：音声・テキスト結果 */}
              <View
                style={[
                  styles.mainColumn,

                  isDesktopLayout
                    ? styles.mainColumnDesktop
                    : styles.mainColumnMobile,
                ]}
              >
                {/* 音声コントローラー */}
                <View style={styles.audioCard}>
                  <View style={styles.audioTopRow}>
                    <View style={styles.audioMainArea}>
                      <Pressable
                        accessibilityLabel={
                          isPlaying
                            ? '音声読み上げを一時停止する'
                            : playbackStatus ===
                                'paused'
                              ? '音声読み上げを再開する'
                              : '音声読み上げを開始する'
                        }
                        accessibilityRole="button"
                        accessibilityState={{
                          selected: isPlaying,
                        }}
                        hitSlop={6}
                        onPress={
                          handleTogglePlayback
                        }
                        style={
                          getPlayButtonStyle
                        }
                      >
                        <MaterialIcons
                          accessibilityElementsHidden
                          color={COLORS.white}
                          importantForAccessibility="no-hide-descendants"
                          name={
                            isPlaying
                              ? 'pause'
                              : 'play-arrow'
                          }
                          size={34}
                        />
                      </Pressable>

                      <View style={styles.audioInformation}>
                        <Text style={styles.audioStatus}>
                          {playbackStatusText}
                        </Text>

                        <View
                          accessibilityElementsHidden
                          importantForAccessibility="no-hide-descendants"
                          style={[
                            styles.waveRow,

                            !isPlaying
                              ? styles.waveRowStopped
                              : styles.waveRowPlaying,
                          ]}
                        >
                          {waveAnimations.map(
                            (
                              animationValue:
                                Animated.Value,
                              index: number,
                            ): React.JSX.Element => {
                              const scaleY =
                                animationValue.interpolate({
                                  inputRange: [
                                    0,
                                    1,
                                  ],
                                  outputRange: [
                                    0.25,
                                    1,
                                  ],
                                });

                              return (
                                <Animated.View
                                  key={`audio-wave-${index}`}
                                  style={[
                                    styles.waveBar,
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

                    <Pressable
                      accessibilityLabel="音声を最初から再生する"
                      accessibilityRole="button"
                      onPress={
                        handleRestartPlayback
                      }
                      style={({ pressed }) => [
                        styles.restartAudioButton,

                        pressed
                          ? styles.restartAudioButtonPressed
                          : styles.restartAudioButtonDefault,
                      ]}
                    >
                      <MaterialIcons
                        accessibilityElementsHidden
                        color={COLORS.white}
                        importantForAccessibility="no-hide-descendants"
                        name="replay"
                        size={24}
                      />
                    </Pressable>
                  </View>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressValue,

                        isPlaying
                          ? styles.progressValuePlaying
                          : styles.progressValueStopped,
                      ]}
                    />
                  </View>

                  <View style={styles.audioSupportRow}>
                    <MaterialIcons
                      accessibilityElementsHidden
                      color={COLORS.primaryFixed}
                      importantForAccessibility="no-hide-descendants"
                      name="language"
                      size={18}
                    />

                    <Text style={styles.audioSupportText}>
                      ブラウザ標準の日本語音声を使用します
                    </Text>
                  </View>
                </View>

                {/* 翻訳結果 */}
                <View style={styles.translationCard}>
                  <InformationSection
                    content={
                      translationResult.effectiveness
                    }
                    iconName="info-outline"
                    title="表示内容"
                  />

                  <InformationSection
                    content={
                      translationResult.dosage
                    }
                    iconName="schedule"
                    title="読み取った使用方法"
                  />

                  <Image
                    accessibilityIgnoresInvertColors
                    accessibilityLabel="薬と包装のイメージ画像"
                    resizeMode="cover"
                    source={{
                      uri:
                        MEDICINE_IMAGE_URL,
                    }}
                    style={styles.medicineImage}
                  />

                  <View style={styles.sourceArea}>
                    <MaterialIcons
                      accessibilityElementsHidden
                      color={
                        COLORS.onSurfaceVariant
                      }
                      importantForAccessibility="no-hide-descendants"
                      name="source"
                      size={19}
                    />

                    <Text style={styles.sourceText}>
                      {translationResult.source}
                    </Text>
                  </View>
                </View>

                {/* 注意表示 */}
                <View style={styles.noticeCard}>
                  <View style={styles.noticeIconCircle}>
                    <MaterialIcons
                      accessibilityElementsHidden
                      color={COLORS.warningIcon}
                      importantForAccessibility="no-hide-descendants"
                      name="info-outline"
                      size={26}
                    />
                  </View>

                  <View style={styles.noticeTextArea}>
                    <Text style={styles.noticeTitle}>
                      表示内容について
                    </Text>

                    <Text style={styles.noticeText}>
                      現在は画面遷移とUI確認用の仮表示です。
                      FastAPI接続後にOCR結果と翻訳結果を表示します。
                    </Text>
                  </View>
                </View>
              </View>

              {/* 右側：補助機能 */}
              <View
                style={[
                  styles.sideColumn,

                  isDesktopLayout
                    ? styles.sideColumnDesktop
                    : styles.sideColumnMobile,
                ]}
              >
                <View style={styles.sideSectionHeader}>
                  <Text style={styles.sideSectionTitle}>
                    補助機能
                  </Text>

                  <Text style={styles.sideSectionDescription}>
                    現段階では未接続の機能です。
                  </Text>
                </View>

                <View
                  style={[
                    styles.quickActionLayout,

                    isDesktopLayout
                      ? styles.quickActionLayoutDesktop
                      : styles.quickActionLayoutMobile,
                  ]}
                >
                  <QuickActionCard
                    accessibilityLabel="注意点を確認する機能は現在利用できません"
                    disabled
                    iconName="warning-amber"
                    label="注意点を確認"
                    variant="warning"
                  />

                  <QuickActionCard
                    accessibilityLabel="過去の履歴と比較する機能は現在利用できません"
                    disabled
                    iconName="history"
                    label="過去の履歴と比較"
                    variant="history"
                  />
                </View>

                {/* 追加質問 */}
                <View style={styles.questionCard}>
                  <View style={styles.questionHeader}>
                    <View style={styles.questionIconCircle}>
                      <MaterialIcons
                        accessibilityElementsHidden
                        color={COLORS.primary}
                        importantForAccessibility="no-hide-descendants"
                        name="chat"
                        size={23}
                      />
                    </View>

                    <View style={styles.questionHeaderTextArea}>
                      <Text style={styles.questionTitle}>
                        追加で質問する
                      </Text>

                      <Text style={styles.questionDescription}>
                        FastAPI接続後に質問機能を実装します。
                      </Text>
                    </View>
                  </View>

                  <View style={styles.questionInputContainer}>
                    <TextInput
                      accessibilityLabel="追加質問入力欄"
                      multiline
                      onChangeText={
                        handleQuestionChange
                      }
                      placeholder="質問を入力してください"
                      placeholderTextColor={
                        COLORS.outline
                      }
                      style={
                        styles.questionInput
                      }
                      textAlignVertical="top"
                      value={question}
                    />

                    <Pressable
                      accessibilityLabel="質問を送信する"
                      accessibilityRole="button"
                      accessibilityState={{
                        disabled:
                          question.trim()
                            .length === 0,
                      }}
                      disabled={
                        question.trim()
                          .length === 0
                      }
                      onPress={
                        handleQuestionSubmit
                      }
                      style={
                        getQuestionSendButtonStyle
                      }
                    >
                      <MaterialIcons
                        accessibilityElementsHidden
                        color={COLORS.white}
                        importantForAccessibility="no-hide-descendants"
                        name="send"
                        size={22}
                      />
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  accessibilityLabel="モード選択画面に戻る"
                  accessibilityRole="button"
                  onPress={
                    handleReturnToModeSelection
                  }
                  style={({ pressed }) => [
                    styles.newTranslationButton,

                    pressed
                      ? styles.newTranslationButtonPressed
                      : styles.newTranslationButtonDefault,
                  ]}
                >
                  <MaterialIcons
                    accessibilityElementsHidden
                    color={COLORS.primary}
                    importantForAccessibility="no-hide-descendants"
                    name="add-photo-alternate"
                    size={23}
                  />

                  <Text
                    style={
                      styles.newTranslationButtonText
                    }
                  >
                    別の説明書を読み取る
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* 下部ナビゲーション */}
        <View style={styles.bottomNavigationBar}>
          <View style={styles.bottomNavigationInner}>
            <BottomNavigationItem
              accessibilityLabel="翻訳"
              iconName="translate"
              label="翻訳"
              selected
            />

            <BottomNavigationItem
              accessibilityLabel="履歴機能は現在利用できません"
              disabled
              iconName="history"
              label="履歴"
            />

            <BottomNavigationItem
              accessibilityLabel="手話画面は現在利用できません"
              disabled
              iconName="sign-language"
              label="手話"
            />

            <BottomNavigationItem
              accessibilityLabel="設定機能は現在利用できません"
              disabled
              iconName="settings"
              label="設定"
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default TextAudioResultScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  screen: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  /*
   * ヘッダー
   */
  header: {
    zIndex: 50,
    width: '100%',
    minHeight: 68,

    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.outlineVariant,

    backgroundColor: COLORS.surface,

    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,

    elevation: 3,
  },

  headerInner: {
    width: '100%',
    maxWidth: WEB_CONTENT_MAX_WIDTH,
    minHeight: 68,

    paddingHorizontal: 20,
    alignSelf: 'center',

    flexDirection: 'row',
    alignItems: 'center',
  },

  headerIconButton: {
    width: 48,
    height: 48,

    borderRadius: 24,

    alignItems: 'center',
    justifyContent: 'center',
  },

  headerIconButtonDefault: {
    backgroundColor:
      COLORS.transparent,

    transform: [
      {
        scale: 1,
      },
    ],
  },

  headerIconButtonPressed: {
    backgroundColor:
      COLORS.surfaceContainerHigh,

    transform: [
      {
        scale: 0.95,
      },
    ],
  },

  headerIconButtonDisabled: {
    opacity: 0.45,
  },

  headerIconButtonEnabled: {
    opacity: 1,
  },

  headerTitleArea: {
    flex: 1,

    minWidth: 0,
    paddingHorizontal: 12,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerLogo: {
    width: 38,
    height: 38,

    marginRight: 10,
    borderRadius: 19,

    backgroundColor:
      COLORS.primaryContainer,

    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTextArea: {
    minWidth: 0,
    alignItems: 'flex-start',
  },

  headerTitle: {
    color: COLORS.onSurface,

    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),

    fontSize: 20,
    fontWeight: '700',
    lineHeight: 27,
  },

  headerSubtitle: {
    color:
      COLORS.onSurfaceVariant,

    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),

    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },

  /*
   * ScrollView
   */
  scrollContent: {
    flexGrow: 1,
    width: '100%',

    paddingBottom: 120,
  },

  contentContainer: {
    width: '100%',
    maxWidth: WEB_CONTENT_MAX_WIDTH,

    alignSelf: 'center',
  },

  contentContainerDesktop: {
    paddingHorizontal: 32,
  },

  contentContainerMobile: {
    paddingHorizontal: 18,
  },

  /*
   * 結果タイトル
   */
  resultIntroduction: {
    width: '100%',
  },

  resultIntroductionDesktop: {
    marginTop: 48,
    marginBottom: 32,

    alignItems: 'center',
  },

  resultIntroductionMobile: {
    marginTop: 30,
    marginBottom: 24,

    alignItems: 'flex-start',
  },

  translationBadge: {
    marginBottom: 14,

    paddingHorizontal: 15,
    paddingVertical: 7,

    borderRadius: 999,

    backgroundColor:
      COLORS.secondaryContainer,

    flexDirection: 'row',
    alignItems: 'center',
  },

  translationBadgeText: {
    marginLeft: 7,

    color:
      COLORS.onSecondaryContainer,

    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),

    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },

  medicineTitle: {
    marginBottom: 10,

    color: COLORS.onSurface,

    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),

    fontWeight: '800',
  },

  medicineTitleDesktop: {
    maxWidth: 820,

    fontSize: 36,
    lineHeight: 46,

    textAlign: 'center',
  },

  medicineTitleMobile: {
    width: '100%',

    fontSize: 28,
    lineHeight: 37,

    textAlign: 'left',
  },

  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  verifiedText: {
    marginLeft: 7,

    color: COLORS.primary,

    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),

    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },

  /*
   * メインレイアウト
   */
  mainLayout: {
    width: '100%',
  },

  mainLayoutDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    gap: 28,
  },

  mainLayoutMobile: {
    flexDirection: 'column',

    gap: 24,
  },

  mainColumn: {
    width: '100%',
  },

  mainColumnDesktop: {
    flex: 1,
    minWidth: 0,
  },

  mainColumnMobile: {
    flex: 0,
  },

  /*
   * 音声コントローラー
   */
  audioCard: {
    width: '100%',

    marginBottom: 24,
    padding: 20,

    borderRadius: 16,

    backgroundColor:
      COLORS.primaryContainer,

    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 9,

    elevation: 5,
  },

  audioTopRow: {
    width: '100%',

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  audioMainArea: {
    flex: 1,
    minWidth: 0,

    flexDirection: 'row',
    alignItems: 'center',
  },

  playButton: {
    flexShrink: 0,

    width: 58,
    height: 58,

    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.25)',

    borderRadius: 29,

    backgroundColor:
      COLORS.primary,

    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,

    elevation: 3,
  },

  playButtonDefault: {
    opacity: 1,

    transform: [
      {
        scale: 1,
      },
    ],
  },

  playButtonPressed: {
    opacity: 0.86,

    transform: [
      {
        scale: 0.94,
      },
    ],
  },

  audioInformation: {
    flex: 1,
    minWidth: 0,

    marginLeft: 14,
  },

  audioStatus: {
    color: COLORS.white,

    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),

    fontSize: 16,
    fontWeight: '700',
    lineHeight: 23,
  },

  waveRow: {
    height: 20,

    marginTop: 6,

    flexDirection: 'row',
    alignItems: 'center',

    gap: 4,
  },

  waveRowPlaying: {
    opacity: 0.8,
  },

  waveRowStopped: {
    opacity: 0.3,
  },

  waveBar: {
    width: 4,
    height: 18,

    borderRadius: 2,

    backgroundColor:
      COLORS.white,
  },

  restartAudioButton: {
    flexShrink: 0,

    width: 44,
    height: 44,

    marginLeft: 12,

    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.25)',

    borderRadius: 22,

    alignItems: 'center',
    justifyContent: 'center',
  },

  restartAudioButtonDefault: {
    backgroundColor:
      'rgba(255,255,255,0.12)',

    transform: [
      {
        scale: 1,
      },
    ],
  },

  restartAudioButtonPressed: {
    backgroundColor:
      'rgba(255,255,255,0.22)',

    transform: [
      {
        scale: 0.94,
      },
    ],
  },

  progressTrack: {
    width: '100%',
    height: 6,

    marginTop: 18,

    overflow: 'hidden',

    borderRadius: 3,

    backgroundColor:
      'rgba(255,255,255,0.22)',
  },

  progressValue: {
    height: '100%',

    borderRadius: 3,

    backgroundColor:
      COLORS.white,
  },

  progressValuePlaying: {
    width: '58%',
  },

  progressValueStopped: {
    width: '0%',
  },

  audioSupportRow: {
    marginTop: 13,

    flexDirection: 'row',
    alignItems: 'center',
  },

  audioSupportText: {
    flex: 1,

    marginLeft: 7,

    color:
      'rgba(255,255,255,0.84)',

    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),

    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },

  /*
   * 翻訳結果カード
   */
  translationCard: {
    width: '100%',

    padding: 24,

    borderWidth: 1,
    borderColor:
      COLORS.outlineVariant,

    borderRadius: 16,

    backgroundColor:
      COLORS.surfaceLowest,

    gap: 30,

    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.07,
    shadowRadius: 8,

    elevation: 2,
  },

  informationSection: {
    width: '100%',
  },

  informationHeadingRow: {
    marginBottom: 12,

    flexDirection: 'row',
    alignItems: 'center',
  },

  informationIconCircle: {
    width: 42,
    height: 42,

    marginRight: 11,

    borderRadius: 21,

    backgroundColor:
      COLORS.secondaryContainer,

    alignItems: 'center',
    justifyContent: 'center',
  },

  informationHeading: {
    flex: 1,

    color: COLORS.primary,

    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),

    fontSize: 18,
    fontWeight: '700',
    lineHeight: 25,
  },

  informationBody: {
    color: COLORS.onSurface,

    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),

    fontSize: 19,
    fontWeight: '400',
    lineHeight: 31,
    letterSpacing: 0.3,
  },

  medicineImage: {
    width: '100%',
    height: 190,

    borderRadius: 12,

    backgroundColor:
      COLORS.surfaceContainerHigh,
  },

  sourceArea: {
    paddingTop: 17,

    borderTopWidth: 1,
    borderTopColor:
      COLORS.outlineVariant,

    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  sourceText: {
    flex: 1,

    marginLeft: 9,

    color:
      COLORS.onSurfaceVariant,

    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),

    fontSize: 13,
    fontStyle: 'italic',
    fontWeight: '500',
    lineHeight: 21,
  },

  /*
   * 注意表示
   */
  noticeCard: {
    width: '100%',

    marginTop: 20,
    padding: 17,

    borderWidth: 1,
    borderColor:
      COLORS.warningBorder,

    borderRadius: 14,

    backgroundColor:
      COLORS.warningBackground,

    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  noticeIconCircle: {
    flexShrink: 0,

    width: 46,
    height: 46,

    marginRight: 13,

    borderRadius: 23,

    backgroundColor: '#fff0c8',

    alignItems: 'center',
    justifyContent: 'center',
  },

  noticeTextArea: {
    flex: 1,
  },

  noticeTitle: {
    marginBottom: 4,

    color: COLORS.onSurface,

    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),

    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },

  noticeText: {
    color:
      COLORS.onSurfaceVariant,

    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),

    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
  },

  /*
   * 右側カラム
   */
  sideColumn: {
    width: '100%',
  },

  sideColumnDesktop: {
    flexBasis: 340,
    maxWidth: 360,
  },

  sideColumnMobile: {
    maxWidth: '100%',
  },

  sideSectionHeader: {
    marginBottom: 16,
  },

  sideSectionTitle: {
    marginBottom: 4,

    color: COLORS.onSurface,

    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),

    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
  },

  sideSectionDescription: {
    color:
      COLORS.onSurfaceVariant,

    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),

    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
  },

  /*
   * クイックアクション
   */
  quickActionLayout: {
    width: '100%',
  },

  quickActionLayoutDesktop: {
    flexDirection: 'column',

    gap: 12,
  },

  quickActionLayoutMobile: {
    flexDirection: 'row',

    gap: 12,
  },

  quickActionCard: {
    minHeight: 126,

    padding: 17,

    borderWidth: 1,

    borderRadius: 14,

    justifyContent: 'space-between',
  },

  warningQuickActionCard: {
    borderColor:
      COLORS.secondaryContainer,

    backgroundColor:
      COLORS.secondaryContainer,
  },

  historyQuickActionCard: {
    borderColor:
      COLORS.outlineVariant,

    backgroundColor:
      COLORS.surfaceContainerHigh,
  },

  quickActionCardDefault: {
    transform: [
      {
        scale: 1,
      },
    ],
  },

  quickActionCardPressed: {
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  quickActionCardDisabled: {
    opacity: 0.65,
  },

  quickActionCardEnabled: {
    opacity: 1,
  },

  quickActionText: {
    marginTop: 20,

    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),

    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },

  warningQuickActionText: {
    color:
      COLORS.onSecondaryContainer,
  },

  historyQuickActionText: {
    color: COLORS.onSurface,
  },

  /*
   * 質問入力
   */
  questionCard: {
    width: '100%',

    marginTop: 20,
    padding: 20,

    borderWidth: 1,
    borderColor:
      COLORS.outlineVariant,

    borderRadius: 16,

    backgroundColor:
      COLORS.surfaceLowest,

    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 7,

    elevation: 2,
  },

  questionHeader: {
    marginBottom: 16,

    flexDirection: 'row',
    alignItems: 'center',
  },

  questionIconCircle: {
    flexShrink: 0,

    width: 46,
    height: 46,

    marginRight: 12,

    borderRadius: 23,

    backgroundColor:
      COLORS.secondaryContainer,

    alignItems: 'center',
    justifyContent: 'center',
  },

  questionHeaderTextArea: {
    flex: 1,
  },

  questionTitle: {
    marginBottom: 3,

    color: COLORS.onSurface,

    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),

    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
  },

  questionDescription: {
    color:
      COLORS.onSurfaceVariant,

    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),

    fontSize: 13,
    fontWeight: '400',
    lineHeight: 20,
  },

  questionInputContainer: {
    position: 'relative',

    width: '100%',
    minHeight: 126,

    borderWidth: 1,
    borderColor:
      COLORS.outlineVariant,

    borderBottomWidth: 2,
    borderBottomColor:
      COLORS.primary,

    borderRadius: 12,

    backgroundColor:
      COLORS.surfaceContainerLow,
  },

  questionInput: {
    width: '100%',
    minHeight: 124,

    paddingTop: 15,
    paddingRight: 58,
    paddingBottom: 15,
    paddingLeft: 15,

    color: COLORS.onSurface,

    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),

    fontSize: 15,
    fontWeight: '400',
    lineHeight: 23,
  },

  questionSendButton: {
    position: 'absolute',
    right: 10,
    bottom: 10,

    width: 42,
    height: 42,

    borderRadius: 21,

    backgroundColor:
      COLORS.primary,

    alignItems: 'center',
    justifyContent: 'center',
  },

  questionSendButtonDefault: {
    transform: [
      {
        scale: 1,
      },
    ],
  },

  questionSendButtonPressed: {
    opacity: 0.84,

    transform: [
      {
        scale: 0.93,
      },
    ],
  },

  questionSendButtonDisabled: {
    opacity: 0.4,
  },

  questionSendButtonEnabled: {
    opacity: 1,
  },

  /*
   * 新規読み取りボタン
   */
  newTranslationButton: {
    width: '100%',
    minHeight: 56,

    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,

    borderWidth: 2,
    borderColor: COLORS.primary,

    borderRadius: 999,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  newTranslationButtonDefault: {
    backgroundColor: COLORS.surface,

    transform: [
      {
        scale: 1,
      },
    ],
  },

  newTranslationButtonPressed: {
    backgroundColor:
      COLORS.surfaceContainerHigh,

    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  newTranslationButtonText: {
    marginLeft: 8,

    color: COLORS.primary,

    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),

    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },

  /*
   * 下部ナビゲーション
   */
  bottomNavigationBar: {
    zIndex: 50,

    width: '100%',

    borderTopWidth: 1,
    borderTopColor:
      COLORS.outlineVariant,

    backgroundColor:
      COLORS.surface,

    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,

    elevation: 10,
  },

  bottomNavigationInner: {
    width: '100%',
    maxWidth: 620,
    minHeight: 70,

    paddingHorizontal: 12,
    paddingVertical: 8,

    alignSelf: 'center',

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  navigationItem: {
    minWidth: 70,
    minHeight: 52,

    paddingHorizontal: 12,
    paddingVertical: 6,

    borderRadius: 14,

    alignItems: 'center',
    justifyContent: 'center',
  },

  navigationItemSelected: {
    backgroundColor:
      COLORS.secondaryContainer,
  },

  navigationItemDefault: {
    backgroundColor:
      COLORS.transparent,
  },

  navigationItemPressed: {
    transform: [
      {
        scale: 0.95,
      },
    ],
  },

  navigationItemNotPressed: {
    transform: [
      {
        scale: 1,
      },
    ],
  },

  navigationItemDisabled: {
    opacity: 0.42,
  },

  navigationItemEnabled: {
    opacity: 1,
  },

  navigationLabel: {
    marginTop: 2,

    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),

    fontSize: 11,
    lineHeight: 15,
  },

  activeNavigationLabel: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  inactiveNavigationLabel: {
    color: COLORS.outline,
    fontWeight: '500',
  },
});
