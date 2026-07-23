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
  ImageBackground,
  Keyboard,
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

type MaterialIconName = ComponentProps<
  typeof MaterialIcons
>['name'];

type CommunityIconName = ComponentProps<
  typeof MaterialCommunityIcons
>['name'];

type SignLanguageResultData = {
  medicineName: string;
  caption: string;
  effectiveness: string;
  dosageHighlight: string;
  dosageSuffix: string;
  source: string;
};

type HeaderButtonProps = {
  accessibilityLabel: string;
  iconName: MaterialIconName;
  disabled?: boolean;
  onPress: () => void;
};

type BottomNavigationItemProps = {
  accessibilityLabel: string;
  label: string;
  iconName?: MaterialIconName;
  communityIconName?: CommunityIconName;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
};

const DESKTOP_BREAKPOINT = 900;
const WEB_CONTENT_MAX_WIDTH = 1180;

const COLORS = {
  primary: '#005E53',
  secondary: '#29695B',
  error: '#BA1A1A',
  surface: '#F6FAFA',
  surfaceContainerLow: '#F0F4F4',
  surfaceContainerHigh: '#E5E9E9',
  surfaceContainerHighest: '#DFE3E3',
  inverseSurface: '#2C3132',
  secondaryContainer: '#ACEDDA',
  onSecondaryContainer: '#2E6D5F',
  onSurface: '#181C1D',
  onSurfaceVariant: '#3E4946',
  outline: '#6E7A76',
  outlineVariant: '#BDC9C5',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

const INTERPRETER_IMAGE_URL =
  'https://lh3.googleusercontent.com/aida-public/'
  + 'AB6AXuA3NoIQOQPZ5m8EwUdbXs-MT9EKyeQwQKunn1nSgSj6vCRqbXkWhcLNOOMl'
  + 'ZzR6eJO4P26Een0m5_1rhVbOy1tUN5RC8qE17CDg5SYmQu4Nb_gi3zuYWr0BI3uPV'
  + '-913N5J-W-JqzuqcZq0Up0jziQENrcyfvsvQzXWtna6IAwBF85XnAkRK0NOS9vQ3X'
  + 'gOlKPgEU-SjM3bm7h9j9CDSvl9gWJ1Po9i1REF7Jl-zG1jykjSl-wPaqv7';

const HeaderButton = ({
  accessibilityLabel,
  iconName,
  disabled = false,
  onPress,
}: HeaderButtonProps): React.JSX.Element => {
  const getButtonStyle = useCallback(
    ({ pressed }: PressableStateCallbackType): ViewStyle[] => [
      styles.headerButton,
      pressed && !disabled
        ? styles.headerButtonPressed
        : styles.headerButtonDefault,
      disabled
        ? styles.headerButtonDisabled
        : styles.headerButtonEnabled,
    ],
    [disabled],
  );

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={getButtonStyle}
    >
      <MaterialIcons
        accessibilityElementsHidden
        color={disabled ? COLORS.outline : COLORS.primary}
        importantForAccessibility="no-hide-descendants"
        name={iconName}
        size={28}
      />
    </Pressable>
  );
};

const BottomNavigationItem = ({
  accessibilityLabel,
  label,
  iconName,
  communityIconName,
  selected = false,
  disabled = false,
  onPress,
}: BottomNavigationItemProps): React.JSX.Element => {
  const handlePress = useCallback((): void => {
    if (disabled || onPress === undefined) {
      return;
    }

    onPress();
  }, [disabled, onPress]);

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
          ? styles.activeNavigationItem
          : styles.inactiveNavigationItem,
        pressed && !disabled
          ? styles.navigationItemPressed
          : styles.navigationItemDefault,
        disabled
          ? styles.navigationItemDisabled
          : styles.navigationItemEnabled,
      ]}
    >
      {communityIconName !== undefined ? (
        <MaterialCommunityIcons
          accessibilityElementsHidden
          color={
            selected
              ? COLORS.onSecondaryContainer
              : COLORS.onSurfaceVariant
          }
          importantForAccessibility="no-hide-descendants"
          name={communityIconName}
          size={25}
        />
      ) : (
        <MaterialIcons
          accessibilityElementsHidden
          color={
            selected
              ? COLORS.onSecondaryContainer
              : COLORS.onSurfaceVariant
          }
          importantForAccessibility="no-hide-descendants"
          name={iconName ?? 'circle'}
          size={25}
        />
      )}

      <Text
        style={
          selected
            ? styles.activeNavigationLabel
            : styles.navigationLabel
        }
      >
        {label}
      </Text>
    </Pressable>
  );
};

export default function SignLanguageResultScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const { width } = useWindowDimensions();

  const isDesktopLayout =
    width >= DESKTOP_BREAKPOINT;

  const recognizedText: string =
  route.params?.recognizedText?.trim() ?? '';

  const resultData = useMemo<SignLanguageResultData>(
    (): SignLanguageResultData => ({
      medicineName:
        recognizedText.length > 0
          ? recognizedText
          : '読み取ったお薬名',
      caption:
        '読み取った内容を手話動画と字幕で表示します。',
      effectiveness:
        '読み取った説明書の内容を、やさしい日本語で表示します。',
      dosageHighlight:
        '読み取った使用方法の重要な部分',
      dosageSuffix:
        'を強調して表示します。',
      source:
        '現在は画面遷移確認用の仮データです。FastAPI接続後に参照元を表示します。',
    }),
    [recognizedText],
  );

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

  const handleGoBack = useCallback((): void => {
    navigation.goBack();
  }, [navigation]);

  const handleToggleVideo = useCallback((): void => {
    setIsVideoPlaying(
      (previousValue: boolean): boolean =>
        !previousValue,
    );
  }, []);

  const handleToggleListening = useCallback((): void => {
    Keyboard.dismiss();

    setIsListening(
      (previousValue: boolean): boolean =>
        !previousValue,
    );
  }, []);

  const handleQuestionChange = useCallback(
    (value: string): void => {
      setQuestion(value);
    },
    [],
  );

  const handleQuestionSubmit = useCallback((): void => {
    const normalizedQuestion = question.trim();

    if (normalizedQuestion.length === 0) {
      return;
    }

    Keyboard.dismiss();

    /*
     * FastAPI接続後:
     * POST /api/questions
     * {
     *   recognizedText,
     *   question: normalizedQuestion,
     *   outputMode: 'signLanguage'
     * }
     */
  }, [question]);

  const handleReturnToModeSelection = useCallback((): void => {
    navigation.popToTop();
  }, [navigation]);

  const isQuestionEmpty =
    question.trim().length === 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        backgroundColor={COLORS.surface}
        barStyle="dark-content"
      />

      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerInner}>
            <HeaderButton
              accessibilityLabel="前の画面に戻る"
              iconName="arrow-back"
              onPress={handleGoBack}
            />

            <View style={styles.headerTitleArea}>
              <View style={styles.headerLogo}>
                <MaterialCommunityIcons
                  accessibilityElementsHidden
                  color={COLORS.white}
                  importantForAccessibility="no-hide-descendants"
                  name="hand-wave"
                  size={21}
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
                  手話動画結果
                </Text>
              </View>
            </View>

            <HeaderButton
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
          contentContainerStyle={styles.scrollContent}
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
            <View
              style={[
                styles.resultHeader,
                isDesktopLayout
                  ? styles.resultHeaderDesktop
                  : styles.resultHeaderMobile,
              ]}
            >
              <View style={styles.modeBadge}>
                <MaterialCommunityIcons
                  accessibilityElementsHidden
                  color={COLORS.onSecondaryContainer}
                  importantForAccessibility="no-hide-descendants"
                  name="hand-wave"
                  size={18}
                />

                <Text style={styles.modeBadgeText}>
                  手話動画モード
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
                {resultData.medicineName}
              </Text>

              <Text
                style={[
                  styles.resultDescription,
                  isDesktopLayout
                    ? styles.resultDescriptionDesktop
                    : styles.resultDescriptionMobile,
                ]}
              >
                読み取り結果を手話動画と字幕で確認できます。
              </Text>
            </View>

            <View
              style={[
                styles.mainLayout,
                isDesktopLayout
                  ? styles.mainLayoutDesktop
                  : styles.mainLayoutMobile,
              ]}
            >
              <View
                style={[
                  styles.videoColumn,
                  isDesktopLayout
                    ? styles.videoColumnDesktop
                    : styles.videoColumnMobile,
                ]}
              >
                <Pressable
                  accessibilityLabel={
                    isVideoPlaying
                      ? '手話動画を一時停止する'
                      : '手話動画を再生する'
                  }
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: isVideoPlaying,
                  }}
                  onPress={handleToggleVideo}
                  style={({ pressed }) => [
                    styles.videoViewport,
                    pressed
                      ? styles.videoViewportPressed
                      : styles.videoViewportDefault,
                  ]}
                >
                  <ImageBackground
                    accessibilityLabel="手話で内容を伝える通訳者"
                    imageStyle={styles.videoImageStyle}
                    resizeMode="cover"
                    source={{
                      uri: INTERPRETER_IMAGE_URL,
                    }}
                    style={styles.videoImage}
                  >
                    <View style={styles.videoDarkOverlay} />

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
                        SIGN LANGUAGE
                      </Text>
                    </View>

                    <View style={styles.videoControlContainer}>
                      <View style={styles.videoControlButton}>
                        <MaterialIcons
                          accessibilityElementsHidden
                          color={COLORS.white}
                          importantForAccessibility="no-hide-descendants"
                          name={
                            isVideoPlaying
                              ? 'pause'
                              : 'play-arrow'
                          }
                          size={50}
                        />
                      </View>
                    </View>

                    <View style={styles.captionArea}>
                      <View style={styles.captionContainer}>
                        <Text style={styles.captionText}>
                          {resultData.caption}
                        </Text>
                      </View>
                    </View>
                  </ImageBackground>
                </Pressable>

                <View style={styles.videoStatusCard}>
                  <MaterialIcons
                    accessibilityElementsHidden
                    color={COLORS.primary}
                    importantForAccessibility="no-hide-descendants"
                    name="closed-caption"
                    size={23}
                  />

                  <View style={styles.videoStatusTextArea}>
                    <Text style={styles.videoStatusTitle}>
                      字幕表示対応
                    </Text>

                    <Text style={styles.videoStatusText}>
                      手話動画の内容を画面下部の字幕でも確認できます。
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.informationColumn,
                  isDesktopLayout
                    ? styles.informationColumnDesktop
                    : styles.informationColumnMobile,
                ]}
              >
                <View style={styles.easyJapaneseSection}>
                  <View style={styles.sectionHeadingRow}>
                    <View style={styles.sectionIconCircle}>
                      <MaterialIcons
                        accessibilityElementsHidden
                        color={COLORS.secondary}
                        importantForAccessibility="no-hide-descendants"
                        name="auto-awesome"
                        size={22}
                      />
                    </View>

                    <View style={styles.sectionHeadingTextArea}>
                      <Text style={styles.sectionHeading}>
                        やさしい日本語
                      </Text>

                      <Text style={styles.sectionSubheading}>
                        Easy Japanese
                      </Text>
                    </View>
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

                  <View style={styles.sourceSection}>
                    <View style={styles.sourceInformation}>
                      <MaterialIcons
                        accessibilityElementsHidden
                        color={COLORS.onSurfaceVariant}
                        importantForAccessibility="no-hide-descendants"
                        name="source"
                        size={19}
                      />

                      <Text style={styles.sourceText}>
                        {resultData.source}
                      </Text>
                    </View>

                    <Pressable
                      accessibilityLabel="詳細情報は現在利用できません"
                      accessibilityRole="button"
                      accessibilityState={{
                        disabled: true,
                      }}
                      disabled
                      style={styles.detailButton}
                    >
                      <MaterialIcons
                        accessibilityElementsHidden
                        color={COLORS.primary}
                        importantForAccessibility="no-hide-descendants"
                        name="info-outline"
                        size={18}
                      />

                      <Text style={styles.detailButtonText}>
                        詳細
                      </Text>
                    </Pressable>
                  </View>
                </View>

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
                        現段階では入力と画面動作のみ確認します。
                      </Text>
                    </View>
                  </View>

                  <View style={styles.interactionBar}>
                    <View style={styles.questionInputWrapper}>
                      <TextInput
                        accessibilityLabel="追加質問入力欄"
                        multiline
                        onChangeText={handleQuestionChange}
                        onSubmitEditing={handleQuestionSubmit}
                        placeholder="質問を入力してください"
                        placeholderTextColor={COLORS.onSurfaceVariant}
                        returnKeyType="send"
                        style={styles.questionInput}
                        textAlignVertical="top"
                        value={question}
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
                        accessibilityLabel={
                          isListening
                            ? '音声入力を停止する'
                            : '音声入力を開始する'
                        }
                        accessibilityRole="button"
                        accessibilityState={{
                          selected: isListening,
                        }}
                        onPress={handleToggleListening}
                        style={({ pressed }) => [
                          styles.microphoneButton,
                          isListening
                            ? styles.microphoneButtonListening
                            : styles.microphoneButtonIdle,
                          pressed
                            ? styles.microphoneButtonPressed
                            : styles.microphoneButtonDefault,
                        ]}
                      >
                        <MaterialIcons
                          accessibilityElementsHidden
                          color={COLORS.white}
                          importantForAccessibility="no-hide-descendants"
                          name={
                            isListening
                              ? 'stop'
                              : 'mic'
                          }
                          size={30}
                        />
                      </Pressable>
                    </Animated.View>
                  </View>

                  <Pressable
                    accessibilityLabel="質問を送信する"
                    accessibilityRole="button"
                    accessibilityState={{
                      disabled: isQuestionEmpty,
                    }}
                    disabled={isQuestionEmpty}
                    onPress={handleQuestionSubmit}
                    style={({ pressed }) => [
                      styles.submitButton,
                      isQuestionEmpty
                        ? styles.submitButtonDisabled
                        : styles.submitButtonEnabled,
                      pressed && !isQuestionEmpty
                        ? styles.submitButtonPressed
                        : styles.submitButtonDefault,
                    ]}
                  >
                    <MaterialIcons
                      accessibilityElementsHidden
                      color={COLORS.white}
                      importantForAccessibility="no-hide-descendants"
                      name="send"
                      size={21}
                    />

                    <Text style={styles.submitButtonText}>
                      質問を送信
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                  accessibilityLabel="モード選択画面に戻る"
                  accessibilityRole="button"
                  onPress={handleReturnToModeSelection}
                  style={({ pressed }) => [
                    styles.newScanButton,
                    pressed
                      ? styles.newScanButtonPressed
                      : styles.newScanButtonDefault,
                  ]}
                >
                  <MaterialIcons
                    accessibilityElementsHidden
                    color={COLORS.primary}
                    importantForAccessibility="no-hide-descendants"
                    name="add-photo-alternate"
                    size={23}
                  />

                  <Text style={styles.newScanButtonText}>
                    別の説明書を読み取る
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomNavigationBar}>
          <View style={styles.bottomNavigationInner}>
            <BottomNavigationItem
              accessibilityLabel="翻訳機能は現在利用できません"
              disabled
              iconName="translate"
              label="翻訳"
            />

            <BottomNavigationItem
              accessibilityLabel="履歴機能は現在利用できません"
              disabled
              iconName="history"
              label="履歴"
            />

            <BottomNavigationItem
              accessibilityLabel="手話"
              communityIconName="hand-wave"
              label="手話"
              selected
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
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  screen: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  header: {
    zIndex: 50,
    width: '100%',
    minHeight: 68,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.black,
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

  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerButtonDefault: {
    backgroundColor: COLORS.transparent,
    transform: [
      {
        scale: 1,
      },
    ],
  },

  headerButtonPressed: {
    backgroundColor: COLORS.surfaceContainerHigh,
    transform: [
      {
        scale: 0.95,
      },
    ],
  },

  headerButtonDisabled: {
    opacity: 0.45,
  },

  headerButtonEnabled: {
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
    backgroundColor: COLORS.primary,
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
    color: COLORS.onSurfaceVariant,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },

  scrollContent: {
    flexGrow: 1,
    width: '100%',
    paddingBottom: 112,
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

  resultHeader: {
    width: '100%',
  },

  resultHeaderDesktop: {
    marginTop: 46,
    marginBottom: 30,
    alignItems: 'center',
  },

  resultHeaderMobile: {
    marginTop: 28,
    marginBottom: 22,
    alignItems: 'flex-start',
  },

  modeBadge: {
    marginBottom: 13,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.secondaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
  },

  modeBadgeText: {
    marginLeft: 7,
    color: COLORS.onSecondaryContainer,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },

  medicineTitle: {
    marginBottom: 9,
    color: COLORS.primary,
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

  resultDescription: {
    color: COLORS.onSurfaceVariant,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 16,
    lineHeight: 25,
  },

  resultDescriptionDesktop: {
    textAlign: 'center',
  },

  resultDescriptionMobile: {
    textAlign: 'left',
  },

  mainLayout: {
    width: '100%',
  },

  mainLayoutDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 30,
  },

  mainLayoutMobile: {
    flexDirection: 'column',
    gap: 24,
  },

  videoColumn: {
    width: '100%',
  },

  videoColumnDesktop: {
    flex: 1.15,
    minWidth: 0,
  },

  videoColumnMobile: {
    flex: 0,
  },

  videoViewport: {
    width: '100%',
    aspectRatio: 16 / 9,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 18,
    backgroundColor: COLORS.inverseSurface,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },

  videoViewportDefault: {
    transform: [
      {
        scale: 1,
      },
    ],
  },

  videoViewportPressed: {
    transform: [
      {
        scale: 0.995,
      },
    ],
  },

  videoImage: {
    flex: 1,
    position: 'relative',
  },

  videoImageStyle: {
    backgroundColor: COLORS.inverseSurface,
  },

  videoDarkOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },

  liveBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  liveIndicator: {
    width: 8,
    height: 8,
    marginRight: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },

  liveBadgeText: {
    color: COLORS.white,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: 40,
    backgroundColor: 'rgba(0,94,83,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },

  captionArea: {
    position: 'absolute',
    right: 0,
    bottom: 22,
    left: 0,
    zIndex: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
  },

  captionContainer: {
    maxWidth: '92%',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.88)',
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },

  captionText: {
    color: COLORS.white,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 28,
    textAlign: 'center',
  },

  videoStatusCard: {
    width: '100%',
    marginTop: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceContainerLow,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  videoStatusTextArea: {
    flex: 1,
    marginLeft: 11,
  },

  videoStatusTitle: {
    marginBottom: 3,
    color: COLORS.onSurface,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },

  videoStatusText: {
    color: COLORS.onSurfaceVariant,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 14,
    lineHeight: 21,
  },

  informationColumn: {
    width: '100%',
  },

  informationColumnDesktop: {
    flex: 0.85,
    minWidth: 0,
  },

  informationColumnMobile: {
    flex: 0,
  },

  easyJapaneseSection: {
    width: '100%',
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },

  sectionHeadingRow: {
    marginBottom: 17,
    flexDirection: 'row',
    alignItems: 'center',
  },

  sectionIconCircle: {
    width: 46,
    height: 46,
    marginRight: 12,
    borderRadius: 23,
    backgroundColor: COLORS.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionHeadingTextArea: {
    flex: 1,
  },

  sectionHeading: {
    color: COLORS.secondary,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 26,
  },

  sectionSubheading: {
    color: COLORS.onSurfaceVariant,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 12,
    lineHeight: 17,
  },

  easyJapaneseCard: {
    padding: 18,
    borderLeftWidth: 6,
    borderLeftColor: COLORS.primary,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerLow,
    gap: 10,
  },

  easyJapaneseText: {
    color: COLORS.onSurface,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 19,
    fontWeight: '400',
    lineHeight: 33,
    letterSpacing: 0.4,
  },

  highlightedText: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.secondary,
    backgroundColor: 'rgba(172,237,218,0.40)',
    fontWeight: '700',
  },

  sourceSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sourceInformation: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  sourceText: {
    flex: 1,
    marginLeft: 8,
    color: COLORS.onSurfaceVariant,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
  },

  detailButton: {
    minWidth: 66,
    minHeight: 44,
    marginLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  detailButtonText: {
    marginLeft: 4,
    color: COLORS.primary,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },

  questionCard: {
    width: '100%',
    marginTop: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.black,
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
    width: 46,
    height: 46,
    marginRight: 12,
    borderRadius: 23,
    backgroundColor: COLORS.secondaryContainer,
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
    color: COLORS.onSurfaceVariant,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 13,
    lineHeight: 20,
  },

  interactionBar: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceContainerHighest,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  questionInputWrapper: {
    flex: 1,
    minWidth: 0,
    minHeight: 96,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },

  questionInput: {
    minHeight: 94,
    paddingTop: 13,
    paddingBottom: 13,
    color: COLORS.onSurface,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 15,
    lineHeight: 22,
  },

  microphoneButton: {
    width: 54,
    height: 54,
    marginLeft: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },

  microphoneButtonIdle: {
    backgroundColor: COLORS.primary,
  },

  microphoneButtonListening: {
    backgroundColor: COLORS.error,
  },

  microphoneButtonDefault: {
    opacity: 1,
  },

  microphoneButtonPressed: {
    opacity: 0.84,
  },

  submitButton: {
    width: '100%',
    minHeight: 52,
    marginTop: 13,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitButtonDisabled: {
    opacity: 0.4,
  },

  submitButtonEnabled: {
    opacity: 1,
  },

  submitButtonDefault: {
    transform: [
      {
        scale: 1,
      },
    ],
  },

  submitButtonPressed: {
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  submitButtonText: {
    marginLeft: 8,
    color: COLORS.white,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },

  newScanButton: {
    width: '100%',
    minHeight: 56,
    marginTop: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  newScanButtonDefault: {
    backgroundColor: COLORS.surface,
    transform: [
      {
        scale: 1,
      },
    ],
  },

  newScanButtonPressed: {
    backgroundColor: COLORS.surfaceContainerHigh,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  newScanButtonText: {
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

  bottomNavigationBar: {
    zIndex: 50,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.black,
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
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  activeNavigationItem: {
    backgroundColor: COLORS.secondaryContainer,
  },

  inactiveNavigationItem: {
    backgroundColor: COLORS.transparent,
  },

  navigationItemDefault: {
    transform: [
      {
        scale: 1,
      },
    ],
  },

  navigationItemPressed: {
    transform: [
      {
        scale: 0.95,
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
    color: COLORS.onSurfaceVariant,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },

  activeNavigationLabel: {
    marginTop: 2,
    color: COLORS.onSecondaryContainer,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
  },
});