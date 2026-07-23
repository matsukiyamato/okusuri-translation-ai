// frontend/src/screens/ModeSelectionScreen.tsx

import React, { useCallback } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type PressableStateCallbackType,
  type ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/**
 * アプリ内で使用する表示モード。
 *
 * 後続画面では、この値をnavigation parameterとして引き継ぎます。
 */
export type TranslationDisplayMode = 'textAudio' | 'signLanguage';

/**
 * React Navigationで使用する画面とパラメータの型。
 *
 * 現時点ではModeSelectionとScanGuidanceのみ定義しています。
 * 後ほどAppNavigator.tsxを作成するときに、残りの画面を追加します。
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
  };
  TextAudioResult: {
    recognizedText?: string;
  };
  SignLanguageResult: {
    recognizedText?: string;
  };
};

type ModeSelectionScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ModeSelection'
>;

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

type ModeCardProps = {
  title: string;
  description: string;
  firstIcon: MaterialIconName;
  secondIcon: MaterialIconName;
  accessibilityHint: string;
  onPress: () => void;
};

type BottomNavigationItemProps = {
  label: string;
  iconName: MaterialIconName;
  isSelected?: boolean;
  onPress?: () => void;
};

/**
 * モード選択カード。
 *
 * HTML上のbento-cardをReact Nativeへ変換しています。
 * カードを押している間はscaleを0.97にして、
 * HTMLのactive時の視覚フィードバックを再現します。
 */
const ModeCard = ({
  title,
  description,
  firstIcon,
  secondIcon,
  accessibilityHint,
  onPress,
}: ModeCardProps): React.JSX.Element => {
  const getCardStyle = useCallback(
    ({ pressed }: PressableStateCallbackType): ViewStyle[] => [
      styles.modeCard,
      pressed ? styles.modeCardPressed : styles.modeCardDefault,
    ],
    [],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      android_ripple={{
        color: COLORS.secondaryContainer,
        borderless: false,
        foreground: true,
      }}
      onPress={onPress}
      style={getCardStyle}
    >
      <View style={styles.iconRow}>
        <View style={[styles.iconCircle, styles.primaryIconCircle]}>
          <MaterialIcons
            accessibilityElementsHidden
            color={COLORS.onPrimaryFixed}
            importantForAccessibility="no-hide-descendants"
            name={firstIcon}
            size={38}
          />
        </View>

        <View style={[styles.iconCircle, styles.secondaryIconCircle]}>
          <MaterialIcons
            accessibilityElementsHidden
            color={COLORS.onSecondaryFixed}
            importantForAccessibility="no-hide-descendants"
            name={secondIcon}
            size={38}
          />
        </View>
      </View>

      <View style={styles.modeTextContainer}>
        <Text style={styles.modeTitle}>{title}</Text>

        <Text style={styles.modeDescription}>{description}</Text>
      </View>
    </Pressable>
  );
};

/**
 * 下部ナビゲーションの1項目。
 *
 * 現段階では画面デザインの再現が目的です。
 * 履歴・手話・設定の画面は今回の実装対象に含まれていないため、
 * onPressが渡されていない項目は操作を無効化しています。
 */
const BottomNavigationItem = ({
  label,
  iconName,
  isSelected = false,
  onPress,
}: BottomNavigationItemProps): React.JSX.Element => {
  const handlePress = useCallback(
    (event: GestureResponderEvent): void => {
      event.stopPropagation();
      onPress?.();
    },
    [onPress],
  );

  const getItemStyle = useCallback(
    ({ pressed }: PressableStateCallbackType): ViewStyle[] => [
      styles.bottomNavigationItem,
      isSelected
        ? styles.bottomNavigationItemSelected
        : styles.bottomNavigationItemUnselected,
      pressed && onPress !== undefined
        ? styles.bottomNavigationItemPressed
        : styles.bottomNavigationItemNotPressed,
    ],
    [isSelected, onPress],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
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
          styles.bottomNavigationLabel,
          isSelected
            ? styles.bottomNavigationLabelSelected
            : styles.bottomNavigationLabelUnselected,
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
  /**
   * ④で選択したモードを⑤へ渡します。
   *
   * textAudio:
   * ScanGuidance → CameraCapture → OcrVerification → TextAudioResult
   *
   * signLanguage:
   * ScanGuidance → CameraCapture → OcrVerification → SignLanguageResult
   */
  const handleSelectMode = useCallback(
    (displayMode: TranslationDisplayMode): void => {
      navigation.navigate('ScanGuidance', {
        displayMode,
      });
    },
    [navigation],
  );

  const handleTextAudioModePress = useCallback((): void => {
    handleSelectMode('textAudio');
  }, [handleSelectMode]);

  const handleSignLanguageModePress = useCallback((): void => {
    handleSelectMode('signLanguage');
  }, [handleSelectMode]);

  /**
   * ログイン・ユーザー登録は今回実装しないため、
   * アカウントボタンは表示のみとします。
   */
  const handleMenuPress = useCallback((): void => {
    // メニュー画面は今回の実装対象外です。
  }, []);

  const handleAccountPress = useCallback((): void => {
    // ユーザー登録・ログイン画面は今回の実装対象外です。
  }, []);

  const handleTranslationTabPress = useCallback((): void => {
    // 現在表示中の画面なので遷移処理は不要です。
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        backgroundColor={COLORS.surface}
        barStyle="dark-content"
      />

      <View style={styles.screen}>
        {/* TopAppBar */}
        <View style={styles.topAppBar}>
          <Pressable
            accessibilityHint="アプリのメニューを開きます"
            accessibilityLabel="メニュー"
            accessibilityRole="button"
            android_ripple={{
              borderless: true,
              color: COLORS.surfaceVariant,
              radius: 24,
            }}
            hitSlop={8}
            onPress={handleMenuPress}
            style={({ pressed }) => [
              styles.topAppBarIconButton,
              pressed && styles.topAppBarIconButtonPressed,
            ]}
          >
            <MaterialIcons
              color={COLORS.primary}
              name="menu"
              size={28}
            />
          </Pressable>

          <Text
            accessibilityRole="header"
            numberOfLines={1}
            style={styles.appTitle}
          >
            お薬翻訳AI
          </Text>

          <Pressable
            accessibilityHint="アカウント情報を開きます"
            accessibilityLabel="アカウント"
            accessibilityRole="button"
            android_ripple={{
              borderless: true,
              color: COLORS.surfaceVariant,
              radius: 24,
            }}
            hitSlop={8}
            onPress={handleAccountPress}
            style={({ pressed }) => [
              styles.topAppBarIconButton,
              pressed && styles.topAppBarIconButtonPressed,
            ]}
          >
            <MaterialIcons
              color={COLORS.primary}
              name="account-circle"
              size={29}
            />
          </Pressable>
        </View>

        {/* Main Content Canvas */}
        <ScrollView
          alwaysBounceVertical={false}
          bounces={false}
          contentContainerStyle={styles.scrollContent}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
        >
          {/* Screen Title Section */}
          <View style={styles.titleSection}>
            <Text
              accessibilityRole="header"
              style={styles.screenTitle}
            >
              表示モードの選択
            </Text>

            <Text style={styles.screenSubtitle}>
              どちらの表示方法を希望しますか？
            </Text>
          </View>

          {/* Symmetrical Grid Layout */}
          <View style={styles.modeCardContainer}>
            <ModeCard
              accessibilityHint="テキストと音声による説明を選択して、撮影案内画面へ進みます"
              description="お薬の説明を「やさしい日本語」の文字で表示し、自動で読み上げます。"
              firstIcon="description"
              onPress={handleTextAudioModePress}
              secondIcon="volume-up"
              title="テキスト・音声モード"
            />

            <ModeCard
              accessibilityHint="手話動画による説明を選択して、撮影案内画面へ進みます"
              description="字幕付きの手話動画と音声でお薬の説明を再生します。"
              firstIcon="sign-language"
              onPress={handleSignLanguageModePress}
              secondIcon="play-circle-outline"
              title="手話動画モード"
            />
          </View>

          {/* Decorative Illustration Placeholder */}
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.decorativeArea}
          >
            <View style={styles.decorativeLine} />
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNavigation}>
          <BottomNavigationItem
            iconName="translate"
            isSelected
            label="翻訳"
            onPress={handleTranslationTabPress}
          />

          <BottomNavigationItem
            iconName="history"
            label="履歴"
          />

          <BottomNavigationItem
            iconName="sign-language"
            label="手話"
          />

          <BottomNavigationItem
            iconName="settings"
            label="設定"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ModeSelectionScreen;

/**
 * HTMLで定義されているMaterial Design 3カラーパレット。
 *
 * 今回の画面で使用する色のみを抽出しています。
 * 新しいthemeファイルは追加しないという条件に従い、
 * このファイル内で管理しています。
 */
const COLORS = {
  primary: '#005e53',
  surface: '#f6fafa',
  background: '#f6fafa',
  secondaryContainer: '#acedda',
  primaryFixed: '#97f3e2',
  secondaryFixed: '#afefdd',
  surfaceVariant: '#dfe3e3',
  onPrimaryFixed: '#00201b',
  onSecondaryFixed: '#00201a',
  onBackground: '#181c1d',
  onSurface: '#181c1d',
  onSurfaceVariant: '#3e4946',
  onSecondaryContainer: '#2e6d5f',
  surfaceContainerLow: '#f0f4f4',
  outlineVariant: '#bdc9c5',
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

  /*
   * HTML:
   * fixed top-0 / h-touch-target-critical（56px）
   * px-margin-mobile（20px）
   */
  topAppBar: {
    zIndex: 50,
    height: 56,
    paddingHorizontal: 20,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    elevation: 2,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.12,
    shadowRadius: 2,
  },

  topAppBarIconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  topAppBarIconButtonPressed: {
    backgroundColor: COLORS.surfaceVariant,
    transform: [{ scale: 0.95 }],
  },

  appTitle: {
    flex: 1,
    paddingHorizontal: 8,
    color: COLORS.primary,
    fontFamily: 'sans-serif',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    textAlign: 'center',
  },

  /*
   * BottomNavigationがabsolute配置のため、
   * 下部に100pxの余白を確保しています。
   */
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 512,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  /*
   * HTML:
   * mt-8（32px）
   * mb-10（40px）
   */
  titleSection: {
    marginTop: 32,
    marginBottom: 40,
    alignItems: 'center',
  },

  screenTitle: {
    marginBottom: 8,
    color: COLORS.onSurface,
    fontFamily: 'sans-serif',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    textAlign: 'center',
  },

  screenSubtitle: {
    color: COLORS.onSurfaceVariant,
    fontFamily: 'sans-serif',
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 28,
    textAlign: 'center',
  },

  /*
   * HTML:
   * flex flex-col gap-6 flex-grow
   */
  modeCardContainer: {
    flexGrow: 1,
    gap: 24,
  },

  /*
   * HTML:
   * p-gutter（16px）
   * min-h-[220px]
   * rounded-xl（12px）
   */
  modeCard: {
    width: '100%',
    minHeight: 220,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',

    elevation: 2,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  modeCardDefault: {
    backgroundColor: COLORS.surfaceContainerLow,
    transform: [{ scale: 1 }],
  },

  modeCardPressed: {
    backgroundColor: COLORS.secondaryContainer,
    transform: [{ scale: 0.97 }],
  },

  iconRow: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },

  /*
   * HTML:
   * w-16 h-16 rounded-full
   */
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryIconCircle: {
    backgroundColor: COLORS.primaryFixed,
  },

  secondaryIconCircle: {
    backgroundColor: COLORS.secondaryFixed,
  },

  modeTextContainer: {
    width: '100%',
    alignItems: 'center',
  },

  modeTitle: {
    marginBottom: 12,
    color: COLORS.primary,
    fontFamily: 'sans-serif',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    textAlign: 'center',
  },

  modeDescription: {
    paddingHorizontal: 16,
    color: COLORS.onSurfaceVariant,
    fontFamily: 'sans-serif',
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 28,
    textAlign: 'center',
  },

  decorativeArea: {
    marginTop: 'auto',
    paddingTop: 32,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.4,
  },

  decorativeLine: {
    width: 128,
    height: 4,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceVariant,
  },

  /*
   * HTML:
   * fixed bottom-0
   * h-[80px]
   */
  bottomNavigation: {
    height: 80,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',

    elevation: 12,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  bottomNavigationItem: {
    minWidth: 64,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomNavigationItemSelected: {
    minWidth: 96,
    borderRadius: 999,
    backgroundColor: COLORS.secondaryContainer,
  },

  bottomNavigationItemUnselected: {
    borderRadius: 12,
    backgroundColor: 'transparent',
  },

  bottomNavigationItemPressed: {
    backgroundColor: COLORS.primaryFixed,
  },

  bottomNavigationItemNotPressed: {
    opacity: 1,
  },

  bottomNavigationLabel: {
    marginTop: 1,
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.1,
    textAlign: 'center',
  },

  bottomNavigationLabelSelected: {
    color: COLORS.onSecondaryContainer,
  },

  bottomNavigationLabelUnselected: {
    color: COLORS.onSurfaceVariant,
  },
});