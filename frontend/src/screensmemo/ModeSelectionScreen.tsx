// frontend/src/screens/ModeSelectionScreen.tsx

import React, {
  useCallback,
  useMemo,
} from 'react';

import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
  type PressableStateCallbackType,
  type ViewStyle,
} from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';

import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

/**
 * アプリ内で使用する表示モード。
 *
 * 後続画面では、この値をReact Navigationの
 * navigation parameterとして引き継ぎます。
 */
export type TranslationDisplayMode =
  | 'textAudio'
  | 'signLanguage';

/**
 * React Navigationで使用する画面とパラメータの型。
 *
 * CameraCaptureScreenで撮影した画像は、
 * Web版ではdata URLとしてOcrVerificationへ渡せるようにします。
 */
export type RootStackParamList = {
  ModeSelection: undefined;

  ScanGuidance: {
    displayMode: TranslationDisplayMode;
  };

  CameraCapture: {
    displayMode: TranslationDisplayMode;
  };

  OcrVerification: {
    displayMode: TranslationDisplayMode;
    capturedImageUri?: string;
  };

  TextAudioResult: {
    recognizedText?: string;
  };

  SignLanguageResult: {
    recognizedText?: string;
  };
};

type ModeSelectionScreenProps =
  NativeStackScreenProps<
    RootStackParamList,
    'ModeSelection'
  >;

type MaterialIconName =
  React.ComponentProps<
    typeof MaterialIcons
  >['name'];

type ModeCardProps = {
  title: string;
  description: string;
  firstIcon: MaterialIconName;
  secondIcon: MaterialIconName;
  accessibilityHint: string;
  onPress: () => void;
  isDesktopLayout: boolean;
};

type NavigationItemProps = {
  label: string;
  iconName: MaterialIconName;
  isSelected?: boolean;
  onPress?: () => void;
};

type HeaderIconButtonProps = {
  accessibilityLabel: string;
  accessibilityHint: string;
  iconName: MaterialIconName;
  onPress: () => void;
};

/**
 * Web版のブレークポイント。
 *
 * 768px以上ではモードカードを横並びにします。
 */
const DESKTOP_BREAKPOINT = 768;

/**
 * Web版コンテンツの最大幅。
 */
const WEB_CONTENT_MAX_WIDTH = 1120;

/**
 * ヘッダーのアイコンボタン。
 */
const HeaderIconButton = ({
  accessibilityLabel,
  accessibilityHint,
  iconName,
  onPress,
}: HeaderIconButtonProps): React.JSX.Element => {
  const getButtonStyle = useCallback(
    ({
      pressed,
    }: PressableStateCallbackType): ViewStyle[] => [
      styles.headerIconButton,
      pressed
        ? styles.headerIconButtonPressed
        : styles.headerIconButtonDefault,
    ],
    [],
  );

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={getButtonStyle}
    >
      <MaterialIcons
        accessibilityElementsHidden
        color={COLORS.primary}
        importantForAccessibility="no-hide-descendants"
        name={iconName}
        size={28}
      />
    </Pressable>
  );
};

/**
 * モード選択カード。
 *
 * Web版では画面幅768px以上で2枚を横並びにします。
 * 押下時の視覚フィードバックはReact Native Webでも動作します。
 */
const ModeCard = ({
  title,
  description,
  firstIcon,
  secondIcon,
  accessibilityHint,
  onPress,
  isDesktopLayout,
}: ModeCardProps): React.JSX.Element => {
  const getCardStyle = useCallback(
    ({
      pressed,
    }: PressableStateCallbackType): ViewStyle[] => [
      styles.modeCard,
      isDesktopLayout
        ? styles.modeCardDesktop
        : styles.modeCardMobile,
      pressed
        ? styles.modeCardPressed
        : styles.modeCardDefault,
    ],
    [isDesktopLayout],
  );

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={title}
      accessibilityRole="button"
      onPress={onPress}
      style={getCardStyle}
    >
      <View style={styles.iconRow}>
        <View
          style={[
            styles.iconCircle,
            styles.primaryIconCircle,
          ]}
        >
          <MaterialIcons
            accessibilityElementsHidden
            color={COLORS.onPrimaryFixed}
            importantForAccessibility="no-hide-descendants"
            name={firstIcon}
            size={40}
          />
        </View>

        <View
          style={[
            styles.iconCircle,
            styles.secondaryIconCircle,
          ]}
        >
          <MaterialIcons
            accessibilityElementsHidden
            color={COLORS.onSecondaryFixed}
            importantForAccessibility="no-hide-descendants"
            name={secondIcon}
            size={40}
          />
        </View>
      </View>

      <View style={styles.modeTextContainer}>
        <Text style={styles.modeTitle}>
          {title}
        </Text>

        <Text style={styles.modeDescription}>
          {description}
        </Text>
      </View>

      <View style={styles.cardActionRow}>
        <Text style={styles.cardActionText}>
          このモードを選択
        </Text>

        <MaterialIcons
          accessibilityElementsHidden
          color={COLORS.primary}
          importantForAccessibility="no-hide-descendants"
          name="arrow-forward"
          size={22}
        />
      </View>
    </Pressable>
  );
};

/**
 * 下部ナビゲーションの各項目。
 *
 * 今回の実装対象外画面はdisabled状態にします。
 */
const NavigationItem = ({
  label,
  iconName,
  isSelected = false,
  onPress,
}: NavigationItemProps): React.JSX.Element => {
  const handlePress = useCallback(
    (
      event: GestureResponderEvent,
    ): void => {
      event.stopPropagation();
      onPress?.();
    },
    [onPress],
  );

  const getItemStyle = useCallback(
    ({
      pressed,
    }: PressableStateCallbackType): ViewStyle[] => [
      styles.navigationItem,
      isSelected
        ? styles.navigationItemSelected
        : styles.navigationItemUnselected,
      pressed && onPress !== undefined
        ? styles.navigationItemPressed
        : styles.navigationItemIdle,
    ],
    [isSelected, onPress],
  );

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{
        disabled: onPress === undefined,
        selected: isSelected,
      }}
      disabled={onPress === undefined}
      onPress={handlePress}
      style={getItemStyle}
    >
      <MaterialIcons
        accessibilityElementsHidden
        color={
          isSelected
            ? COLORS.onSecondaryContainer
            : COLORS.onSurfaceVariant
        }
        importantForAccessibility="no-hide-descendants"
        name={iconName}
        size={25}
      />

      <Text
        style={[
          styles.navigationLabel,
          isSelected
            ? styles.navigationLabelSelected
            : styles.navigationLabelUnselected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const ModeSelectionScreen = ({
  navigation,
}: ModeSelectionScreenProps): React.JSX.Element => {
  const {
    width,
  } = useWindowDimensions();

  /**
   * 画面幅768px以上をデスクトップレイアウトとします。
   */
  const isDesktopLayout = useMemo(
    (): boolean =>
      width >= DESKTOP_BREAKPOINT,
    [width],
  );

  /**
   * ④で選択したモードを⑤へ渡します。
   *
   * textAudio:
   * ScanGuidance
   * → CameraCapture
   * → OcrVerification
   * → TextAudioResult
   *
   * signLanguage:
   * ScanGuidance
   * → CameraCapture
   * → OcrVerification
   * → SignLanguageResult
   */
  const handleSelectMode = useCallback(
    (
      displayMode: TranslationDisplayMode,
    ): void => {
      navigation.navigate(
        'ScanGuidance',
        {
          displayMode,
        },
      );
    },
    [navigation],
  );

  const handleTextAudioModePress =
    useCallback((): void => {
      handleSelectMode('textAudio');
    }, [handleSelectMode]);

  const handleSignLanguageModePress =
    useCallback((): void => {
      handleSelectMode('signLanguage');
    }, [handleSelectMode]);

  /**
   * メニュー画面は今回の実装対象外です。
   */
  const handleMenuPress =
    useCallback((): void => {
      // 現段階では処理を実装しません。
    }, []);

  /**
   * ユーザー登録・ログイン画面は今回実装しません。
   */
  const handleAccountPress =
    useCallback((): void => {
      // 現段階では処理を実装しません。
    }, []);

  /**
   * 現在表示中の画面なので遷移処理は不要です。
   */
  const handleTranslationTabPress =
    useCallback((): void => {
      // 現在選択中のタブです。
    }, []);

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
              accessibilityHint="アプリのメニューを開きます"
              accessibilityLabel="メニュー"
              iconName="menu"
              onPress={handleMenuPress}
            />

            <View style={styles.brandArea}>
              <View style={styles.brandIcon}>
                <MaterialIcons
                  accessibilityElementsHidden
                  color={COLORS.onPrimary}
                  importantForAccessibility="no-hide-descendants"
                  name="medication"
                  size={25}
                />
              </View>

              <Text
                accessibilityRole="header"
                numberOfLines={1}
                style={styles.appTitle}
              >
                お薬翻訳AI
              </Text>
            </View>

            <HeaderIconButton
              accessibilityHint="アカウント情報を開きます"
              accessibilityLabel="アカウント"
              iconName="account-circle"
              onPress={handleAccountPress}
            />
          </View>
        </View>

        {/* メインコンテンツ */}
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
            {/* タイトル */}
            <View
              style={[
                styles.titleSection,
                isDesktopLayout
                  ? styles.titleSectionDesktop
                  : styles.titleSectionMobile,
              ]}
            >
              <View style={styles.titleBadge}>
                <MaterialIcons
                  accessibilityElementsHidden
                  color={COLORS.primary}
                  importantForAccessibility="no-hide-descendants"
                  name="translate"
                  size={19}
                />

                <Text style={styles.titleBadgeText}>
                  翻訳方法を選択
                </Text>
              </View>

              <Text
                accessibilityRole="header"
                style={[
                  styles.screenTitle,
                  isDesktopLayout
                    ? styles.screenTitleDesktop
                    : styles.screenTitleMobile,
                ]}
              >
                表示モードの選択
              </Text>

              <Text
                style={[
                  styles.screenSubtitle,
                  isDesktopLayout
                    ? styles.screenSubtitleDesktop
                    : styles.screenSubtitleMobile,
                ]}
              >
                お薬の説明を受け取る方法を
                選択してください。
              </Text>
            </View>

            {/* Webでは横並び、狭い画面では縦並び */}
            <View
              style={[
                styles.modeCardContainer,
                isDesktopLayout
                  ? styles.modeCardContainerDesktop
                  : styles.modeCardContainerMobile,
              ]}
            >
              <ModeCard
                accessibilityHint="テキストと音声による説明を選択し、撮影案内画面へ進みます"
                description="お薬の説明を「やさしい日本語」の文字で表示し、ブラウザの音声機能で読み上げます。"
                firstIcon="description"
                isDesktopLayout={isDesktopLayout}
                onPress={handleTextAudioModePress}
                secondIcon="volume-up"
                title="テキスト・音声モード"
              />

              <ModeCard
                accessibilityHint="手話動画による説明を選択し、撮影案内画面へ進みます"
                description="字幕付きの手話動画を使って、お薬の説明を分かりやすく表示します。"
                firstIcon="sign-language"
                isDesktopLayout={isDesktopLayout}
                onPress={handleSignLanguageModePress}
                secondIcon="play-circle-outline"
                title="手話動画モード"
              />
            </View>

            {/* 補足 */}
            <View style={styles.informationCard}>
              <MaterialIcons
                accessibilityElementsHidden
                color={COLORS.primary}
                importantForAccessibility="no-hide-descendants"
                name="info-outline"
                size={23}
              />

              <Text style={styles.informationText}>
                選択後、Webカメラを使って
                お薬の説明書を撮影します。
                カメラの使用許可が求められた場合は、
                ブラウザ上で許可してください。
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* 下部ナビゲーション */}
        <View style={styles.bottomNavigation}>
          <View
            style={[
              styles.bottomNavigationInner,
              isDesktopLayout
                ? styles.bottomNavigationInnerDesktop
                : styles.bottomNavigationInnerMobile,
            ]}
          >
            <NavigationItem
              iconName="translate"
              isSelected
              label="翻訳"
              onPress={
                handleTranslationTabPress
              }
            />

            <NavigationItem
              iconName="history"
              label="履歴"
            />

            <NavigationItem
              iconName="sign-language"
              label="手話"
            />

            <NavigationItem
              iconName="settings"
              label="設定"
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ModeSelectionScreen;

const COLORS = {
  primary: '#005e53',
  primaryContainer: '#00796b',
  onPrimary: '#ffffff',

  surface: '#f6fafa',
  background: '#f6fafa',
  surfaceContainerLow: '#f0f4f4',
  surfaceContainer: '#e9eeee',
  surfaceVariant: '#dfe3e3',

  secondaryContainer: '#acedda',
  primaryFixed: '#97f3e2',
  secondaryFixed: '#afefdd',

  onPrimaryFixed: '#00201b',
  onSecondaryFixed: '#00201a',

  onBackground: '#181c1d',
  onSurface: '#181c1d',
  onSurfaceVariant: '#3e4946',
  onSecondaryContainer: '#2e6d5f',

  outlineVariant: '#bdc9c5',

  white: '#ffffff',
  shadow: '#000000',
} as const;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  /**
   * Webヘッダー
   */
  header: {
    zIndex: 50,
    minHeight: 68,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
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
    justifyContent: 'space-between',
  },

  brandArea: {
    flex: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandIcon: {
    width: 38,
    height: 38,
    marginRight: 10,
    borderRadius: 19,
    backgroundColor:
      COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },

  appTitle: {
    maxWidth: 300,
    color: COLORS.primary,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    textAlign: 'center',
  },

  headerIconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerIconButtonDefault: {
    backgroundColor: 'transparent',
    transform: [
      {
        scale: 1,
      },
    ],
  },

  headerIconButtonPressed: {
    backgroundColor:
      COLORS.surfaceVariant,
    transform: [
      {
        scale: 0.95,
      },
    ],
  },

  /**
   * メイン領域
   */
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    paddingBottom: 32,
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
    paddingHorizontal: 20,
  },

  /**
   * タイトル
   */
  titleSection: {
    alignItems: 'center',
  },

  titleSectionDesktop: {
    marginTop: 64,
    marginBottom: 44,
  },

  titleSectionMobile: {
    marginTop: 36,
    marginBottom: 32,
  },

  titleBadge: {
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor:
      COLORS.secondaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
  },

  titleBadgeText: {
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

  screenTitle: {
    marginBottom: 12,
    color: COLORS.onSurface,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontWeight: '700',
    textAlign: 'center',
  },

  screenTitleDesktop: {
    fontSize: 38,
    lineHeight: 48,
  },

  screenTitleMobile: {
    fontSize: 28,
    lineHeight: 36,
  },

  screenSubtitle: {
    maxWidth: 640,
    color: COLORS.onSurfaceVariant,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontWeight: '400',
    textAlign: 'center',
  },

  screenSubtitleDesktop: {
    fontSize: 19,
    lineHeight: 30,
  },

  screenSubtitleMobile: {
    fontSize: 17,
    lineHeight: 26,
  },

  /**
   * モードカード
   */
  modeCardContainer: {
    width: '100%',
  },

  modeCardContainerDesktop: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 28,
  },

  modeCardContainerMobile: {
    flexDirection: 'column',
    gap: 20,
  },

  modeCard: {
    minHeight: 330,
    paddingHorizontal: 28,
    paddingVertical: 32,
    borderWidth: 1,
    borderColor:
      COLORS.outlineVariant,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,

    elevation: 3,
  },

  modeCardDesktop: {
    flex: 1,
    maxWidth: 520,
  },

  modeCardMobile: {
    width: '100%',
  },

  modeCardDefault: {
    backgroundColor:
      COLORS.surfaceContainerLow,
    transform: [
      {
        scale: 1,
      },
    ],
  },

  modeCardPressed: {
    backgroundColor:
      COLORS.secondaryContainer,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  iconRow: {
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },

  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryIconCircle: {
    backgroundColor:
      COLORS.primaryFixed,
  },

  secondaryIconCircle: {
    backgroundColor:
      COLORS.secondaryFixed,
  },

  modeTextContainer: {
    width: '100%',
    alignItems: 'center',
  },

  modeTitle: {
    marginBottom: 14,
    color: COLORS.primary,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 23,
    fontWeight: '700',
    lineHeight: 31,
    textAlign: 'center',
  },

  modeDescription: {
    maxWidth: 420,
    color: COLORS.onSurfaceVariant,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 28,
    textAlign: 'center',
  },

  cardActionRow: {
    marginTop: 28,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor:
      COLORS.secondaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardActionText: {
    marginRight: 8,
    color: COLORS.primary,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },

  /**
   * Webカメラについての補足
   */
  informationCard: {
    width: '100%',
    maxWidth: 760,
    marginTop: 36,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor:
      COLORS.outlineVariant,
    borderRadius: 14,
    backgroundColor:
      COLORS.surfaceContainer,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  informationText: {
    flex: 1,
    marginLeft: 12,
    color: COLORS.onSurfaceVariant,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 24,
  },

  /**
   * 下部ナビゲーション
   */
  bottomNavigation: {
    borderTopWidth: 1,
    borderTopColor:
      COLORS.outlineVariant,
    backgroundColor: COLORS.surface,

    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 4,

    elevation: 8,
  },

  bottomNavigationInner: {
    width: '100%',
    maxWidth: WEB_CONTENT_MAX_WIDTH,
    minHeight: 76,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  bottomNavigationInnerDesktop: {
    paddingHorizontal: 120,
  },

  bottomNavigationInnerMobile: {
    paddingHorizontal: 8,
  },

  navigationItem: {
    minWidth: 68,
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  navigationItemSelected: {
    backgroundColor:
      COLORS.secondaryContainer,
  },

  navigationItemUnselected: {
    backgroundColor: 'transparent',
  },

  navigationItemPressed: {
    backgroundColor:
      COLORS.primaryFixed,
    transform: [
      {
        scale: 0.97,
      },
    ],
  },

  navigationItemIdle: {
    transform: [
      {
        scale: 1,
      },
    ],
  },

  navigationLabel: {
    marginTop: 2,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
    textAlign: 'center',
  },

  navigationLabelSelected: {
    color:
      COLORS.onSecondaryContainer,
  },

  navigationLabelUnselected: {
    color:
      COLORS.onSurfaceVariant,
  },
});