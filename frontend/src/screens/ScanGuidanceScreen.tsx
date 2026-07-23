// frontend/src/screens/ScanGuidanceScreen.tsx

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from 'react';

import {
  Animated,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
  type LayoutChangeEvent,
  type PressableStateCallbackType,
  type ViewStyle,
} from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';

import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import type {
  RootStackParamList,
  TranslationDisplayMode,
} from './ModeSelectionScreen';

type ScanGuidanceScreenProps =
  NativeStackScreenProps<
    RootStackParamList,
    'ScanGuidance'
  >;

type MaterialIconName =
  ComponentProps<
    typeof MaterialIcons
  >['name'];

type InstructionCardProps = {
  iconName: MaterialIconName;
  title: string;
  description: string;
};

type ScanGuideIllustrationProps = {
  imageSource: ImageSourcePropType;
};

type SelectedModeCardProps = {
  displayMode: TranslationDisplayMode;
};

type HeaderBackButtonProps = {
  onPress: () => void;
};

const DESKTOP_BREAKPOINT = 900;
const WEB_CONTENT_MAX_WIDTH = 1180;
const SCAN_DURATION_MS = 3000;

const COLORS = {
  primary: '#005e53',
  primaryContainer: '#00796b',
  surfaceTint: '#006b5e',

  onPrimary: '#ffffff',
  onSurface: '#181c1d',
  onSurfaceVariant: '#3e4946',

  surface: '#f6fafa',
  surfaceContainerLow: '#f0f4f4',
  surfaceContainer: '#e9eeee',
  surfaceContainerHigh: '#e5e9e9',

  secondaryContainer: '#acedda',
  onSecondaryContainer: '#2e6d5f',

  outlineVariant: '#bdc9c5',

  warningBackground: '#fff9eb',
  warningBorder: '#ffe0a3',
  warningIcon: '#d97706',

  white: '#ffffff',
  transparent: 'transparent',
  shadow: '#000000',
} as const;

const SCAN_GUIDE_IMAGE: ImageSourcePropType = {
  uri:
    'https://lh3.googleusercontent.com/aida-public/' +
    'AB6AXuDP7ZY6RnvjDnWTBrmd-m9hfbL5fxrUmYaN5LJGRqcGiOxqsLixpKQS3grM' +
    'k3CY-K15Y9acZ23-C6hlE20XvcXUdtgJjx7ZZ1xkxNC_Fk2x2XolTfCzjJOcgwY8' +
    'XSV_CX3hxTXPKzF0tZPNUF4Eed0g3QlIRl5WPa8BJpeMD85hXSeThIQrW4nSnkve' +
    'sJqp5tfmq5ISnIWoJ4VAJ9TqgfBTzoVKFmdqICwP0-1pzwrO8WZ3W_jE7jVO',
};

/**
 * ヘッダーの戻るボタン。
 */
const HeaderBackButton = ({
  onPress,
}: HeaderBackButtonProps): React.JSX.Element => {
  const getButtonStyle = useCallback(
    ({
      pressed,
    }: PressableStateCallbackType): ViewStyle[] => [
      styles.backButton,
      pressed
        ? styles.backButtonPressed
        : styles.backButtonDefault,
    ],
    [],
  );

  return (
    <Pressable
      accessibilityHint="モード選択画面に戻ります"
      accessibilityLabel="戻る"
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={getButtonStyle}
    >
      <MaterialIcons
        accessibilityElementsHidden
        color={COLORS.primary}
        importantForAccessibility="no-hide-descendants"
        name="arrow-back"
        size={28}
      />
    </Pressable>
  );
};

/**
 * 現在選択されている表示モードを示すカード。
 */
const SelectedModeCard = ({
  displayMode,
}: SelectedModeCardProps): React.JSX.Element => {
  const isTextAudio =
    displayMode === 'textAudio';

  return (
    <View
      accessibilityLabel={
        isTextAudio
          ? '選択中のモードはテキスト音声モードです'
          : '選択中のモードは手話動画モードです'
      }
      style={styles.selectedModeCard}
    >
      <View style={styles.selectedModeIcon}>
        <MaterialIcons
          accessibilityElementsHidden
          color={COLORS.primary}
          importantForAccessibility="no-hide-descendants"
          name={
            isTextAudio
              ? 'record-voice-over'
              : 'sign-language'
          }
          size={24}
        />
      </View>

      <View style={styles.selectedModeTextArea}>
        <Text style={styles.selectedModeLabel}>
          選択中の表示モード
        </Text>

        <Text style={styles.selectedModeTitle}>
          {isTextAudio
            ? 'テキスト・音声モード'
            : '手話動画モード'}
        </Text>
      </View>

      <MaterialIcons
        accessibilityElementsHidden
        color={COLORS.primary}
        importantForAccessibility="no-hide-descendants"
        name="check-circle"
        size={25}
      />
    </View>
  );
};

/**
 * 撮影時の注意事項カード。
 *
 * ファイル追加を行わないため、このファイル内で
 * 再利用可能な内部コンポーネントとして定義します。
 */
const InstructionCard = ({
  iconName,
  title,
  description,
}: InstructionCardProps): React.JSX.Element => {
  return (
    <View
      accessibilityLabel={`${title}。${description}`}
      style={styles.instructionCard}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.instructionIconCircle}
      >
        <MaterialIcons
          color={COLORS.onSecondaryContainer}
          name={iconName}
          size={28}
        />
      </View>

      <View style={styles.instructionTextArea}>
        <Text style={styles.instructionTitle}>
          {title}
        </Text>

        <Text style={styles.instructionDescription}>
          {description}
        </Text>
      </View>
    </View>
  );
};

/**
 * スキャンガイド画像とスキャンライン。
 *
 * Web版ではコンテナの実際の高さを取得し、
 * スキャンラインの移動距離を動的に設定します。
 */
const ScanGuideIllustration = ({
  imageSource,
}: ScanGuideIllustrationProps): React.JSX.Element => {
  const scanProgress =
    useRef(new Animated.Value(0)).current;

  const [containerHeight, setContainerHeight] =
    useState<number>(0);

  const handleLayout = useCallback(
    (
      event: LayoutChangeEvent,
    ): void => {
      setContainerHeight(
        event.nativeEvent.layout.height,
      );
    },
    [],
  );

  useEffect(() => {
    const scanAnimation =
      Animated.loop(
        Animated.sequence([
          Animated.timing(
            scanProgress,
            {
              duration:
                SCAN_DURATION_MS,
              toValue: 1,
              useNativeDriver: false,
            },
          ),

          Animated.timing(
            scanProgress,
            {
              duration: 0,
              toValue: 0,
              useNativeDriver: false,
            },
          ),
        ]),
      );

    scanAnimation.start();

    return (): void => {
      scanAnimation.stop();
      scanProgress.stopAnimation();
      scanProgress.setValue(0);
    };
  }, [scanProgress]);

  const scanDistance =
    containerHeight > 0
      ? Math.max(
          containerHeight - 6,
          0,
        )
      : 300;

  const scanLineTranslateY =
    scanProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [
        0,
        scanDistance,
      ],
    });

  return (
    <View
      accessibilityLabel="お薬の説明書をWebカメラの枠内に合わせる撮影例"
      onLayout={handleLayout}
      style={styles.guideImageContainer}
    >
      <Image
        accessibilityIgnoresInvertColors
        resizeMode="contain"
        source={imageSource}
        style={styles.guideImage}
      />

      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={styles.frameOverlay}
      >
        <View
          style={[
            styles.frameCorner,
            styles.frameCornerTopLeft,
          ]}
        />

        <View
          style={[
            styles.frameCorner,
            styles.frameCornerTopRight,
          ]}
        />

        <View
          style={[
            styles.frameCorner,
            styles.frameCornerBottomLeft,
          ]}
        />

        <View
          style={[
            styles.frameCorner,
            styles.frameCornerBottomRight,
          ]}
        />
      </View>

      <Animated.View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={[
          styles.scanLine,
          {
            transform: [
              {
                translateY:
                  scanLineTranslateY,
              },
            ],
          },
        ]}
      />

      <View style={styles.cameraPreviewBadge}>
        <MaterialIcons
          accessibilityElementsHidden
          color={COLORS.white}
          importantForAccessibility="no-hide-descendants"
          name="videocam"
          size={18}
        />

        <Text style={styles.cameraPreviewBadgeText}>
          Webカメラ撮影イメージ
        </Text>
      </View>
    </View>
  );
};

const ScanGuidanceScreen = ({
  navigation,
  route,
}: ScanGuidanceScreenProps): React.JSX.Element => {
  const {
    width,
  } = useWindowDimensions();

  const {
    displayMode,
  } = route.params;

  const isDesktopLayout =
    width >= DESKTOP_BREAKPOINT;

  const handleBackPress =
    useCallback((): void => {
      navigation.goBack();
    }, [navigation]);

  const handleStartCameraPress =
    useCallback((): void => {
      navigation.navigate(
        'CameraCapture',
        {
          displayMode,
        },
      );
    }, [
      displayMode,
      navigation,
    ]);

  const getCameraButtonStyle =
    useCallback(
      ({
        pressed,
      }: PressableStateCallbackType): ViewStyle[] => [
        styles.cameraButton,
        pressed
          ? styles.cameraButtonPressed
          : styles.cameraButtonDefault,
      ],
      [],
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
            <HeaderBackButton
              onPress={handleBackPress}
            />

            <View style={styles.headerTitleArea}>
              <View style={styles.headerIconCircle}>
                <MaterialIcons
                  accessibilityElementsHidden
                  color={COLORS.onPrimary}
                  importantForAccessibility="no-hide-descendants"
                  name="document-scanner"
                  size={22}
                />
              </View>

              <Text
                accessibilityRole="header"
                numberOfLines={1}
                style={styles.headerTitle}
              >
                撮影をはじめる前の確認
              </Text>
            </View>

            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={styles.headerSpacer}
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
            {/* ページ見出し */}
            <View
              style={[
                styles.pageIntroduction,
                isDesktopLayout
                  ? styles.pageIntroductionDesktop
                  : styles.pageIntroductionMobile,
              ]}
            >
              <View style={styles.pageBadge}>
                <MaterialIcons
                  accessibilityElementsHidden
                  color={COLORS.primary}
                  importantForAccessibility="no-hide-descendants"
                  name="photo-camera"
                  size={19}
                />

                <Text style={styles.pageBadgeText}>
                  撮影ガイド
                </Text>
              </View>

              <Text
                accessibilityRole="header"
                style={[
                  styles.pageTitle,
                  isDesktopLayout
                    ? styles.pageTitleDesktop
                    : styles.pageTitleMobile,
                ]}
              >
                説明書をきれいに撮影しましょう
              </Text>

              <Text
                style={[
                  styles.pageDescription,
                  isDesktopLayout
                    ? styles.pageDescriptionDesktop
                    : styles.pageDescriptionMobile,
                ]}
              >
                OCRで文字を正確に読み取るために、
                撮影前に以下のポイントを確認してください。
              </Text>
            </View>

            <SelectedModeCard
              displayMode={displayMode}
            />

            {/* Webでは左右2カラム */}
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
                  styles.illustrationColumn,
                  isDesktopLayout
                    ? styles.illustrationColumnDesktop
                    : styles.illustrationColumnMobile,
                ]}
              >
                <ScanGuideIllustration
                  imageSource={
                    SCAN_GUIDE_IMAGE
                  }
                />

                <View style={styles.securityNotice}>
                  <MaterialIcons
                    accessibilityElementsHidden
                    color={COLORS.primary}
                    importantForAccessibility="no-hide-descendants"
                    name="lock"
                    size={21}
                  />

                  <Text style={styles.securityNoticeText}>
                    カメラ映像は、撮影ボタンを押すまで
                    OCR処理には送信されません。
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.guideColumn,
                  isDesktopLayout
                    ? styles.guideColumnDesktop
                    : styles.guideColumnMobile,
                ]}
              >
                <View style={styles.guideSectionHeader}>
                  <Text style={styles.guideSectionTitle}>
                    きれいに読み取るためのポイント
                  </Text>

                  <Text style={styles.guideSectionDescription}>
                    ブラウザからカメラの使用許可を
                    求められた場合は「許可」を選択してください。
                  </Text>
                </View>

                <View style={styles.instructionList}>
                  <InstructionCard
                    description="文字がはっきり読めるよう、十分な光がある場所でスキャンを開始します。"
                    iconName="light-mode"
                    title="明るい場所で撮影してください"
                  />

                  <InstructionCard
                    description="Webカメラを文書に対して平行にし、説明書全体が枠内に収まるようにしてください。"
                    iconName="crop-free"
                    title="説明書を枠の中央に合わせてください"
                  />

                  <InstructionCard
                    description="文字がぼやける場合は、カメラと説明書の距離を少しずつ調整してください。"
                    iconName="center-focus-strong"
                    title="文字にピントを合わせてください"
                  />

                  <View
                    accessibilityLabel="注意。影や光の反射が入らないようにしてください"
                    style={styles.warningCard}
                  >
                    <View style={styles.warningIconCircle}>
                      <MaterialIcons
                        accessibilityElementsHidden
                        color={COLORS.warningIcon}
                        importantForAccessibility="no-hide-descendants"
                        name="warning-amber"
                        size={26}
                      />
                    </View>

                    <View style={styles.warningTextArea}>
                      <Text style={styles.warningTitle}>
                        影や反射に注意してください
                      </Text>

                      <Text style={styles.warningText}>
                        手や照明の影、薬の袋からの強い反射が
                        文字に重ならないようにしてください。
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Web向けアクションボタン */}
                <View style={styles.desktopActionArea}>
                  <Pressable
                    accessibilityHint="Webカメラ撮影画面に進みます"
                    accessibilityLabel="Webカメラを起動する"
                    accessibilityRole="button"
                    onPress={
                      handleStartCameraPress
                    }
                    style={
                      getCameraButtonStyle
                    }
                  >
                    <MaterialIcons
                      accessibilityElementsHidden
                      color={COLORS.onPrimary}
                      importantForAccessibility="no-hide-descendants"
                      name="videocam"
                      size={26}
                    />

                    <Text style={styles.cameraButtonText}>
                      Webカメラを起動する
                    </Text>

                    <MaterialIcons
                      accessibilityElementsHidden
                      color={COLORS.onPrimary}
                      importantForAccessibility="no-hide-descendants"
                      name="arrow-forward"
                      size={22}
                    />
                  </Pressable>

                  <Text style={styles.permissionNote}>
                    起動後、ブラウザのカメラ権限を
                    許可してください。
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default ScanGuidanceScreen;

/**
 * 現在選択されている表示モードを判定します。
 *
 * FastAPI接続時には、OCR後のレスポンス形式や
 * 表示結果の分岐に利用できます。
 */
export const isTextAudioMode = (
  displayMode: TranslationDisplayMode,
): boolean => {
  return displayMode === 'textAudio';
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  screen: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  /**
   * ヘッダー
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
  },

  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backButtonDefault: {
    backgroundColor: COLORS.transparent,
    transform: [
      {
        scale: 1,
      },
    ],
  },

  backButtonPressed: {
    backgroundColor: COLORS.surfaceContainerHigh,
    transform: [
      {
        scale: 0.95,
      },
    ],
  },

  headerTitleArea: {
    flex: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerIconCircle: {
    width: 36,
    height: 36,
    marginRight: 10,
    borderRadius: 18,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    maxWidth: 520,
    color: COLORS.onSurface,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
    textAlign: 'center',
  },

  headerSpacer: {
    width: 48,
    height: 48,
  },

  /**
   * 本文
   */
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    paddingBottom: 48,
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

  pageIntroduction: {
    alignItems: 'center',
  },

  pageIntroductionDesktop: {
    marginTop: 54,
    marginBottom: 30,
  },

  pageIntroductionMobile: {
    marginTop: 32,
    marginBottom: 24,
  },

  pageBadge: {
    marginBottom: 14,
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.secondaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
  },

  pageBadgeText: {
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

  pageTitle: {
    marginBottom: 12,
    color: COLORS.onSurface,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontWeight: '700',
    textAlign: 'center',
  },

  pageTitleDesktop: {
    fontSize: 34,
    lineHeight: 44,
  },

  pageTitleMobile: {
    fontSize: 27,
    lineHeight: 36,
  },

  pageDescription: {
    maxWidth: 700,
    color: COLORS.onSurfaceVariant,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontWeight: '400',
    textAlign: 'center',
  },

  pageDescriptionDesktop: {
    fontSize: 18,
    lineHeight: 29,
  },

  pageDescriptionMobile: {
    fontSize: 16,
    lineHeight: 25,
  },

  /**
   * 選択中モード
   */
  selectedModeCard: {
    width: '100%',
    maxWidth: 720,
    marginBottom: 28,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceContainerLow,
    flexDirection: 'row',
    alignItems: 'center',
  },

  selectedModeIcon: {
    width: 44,
    height: 44,
    marginRight: 13,
    borderRadius: 22,
    backgroundColor: COLORS.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedModeTextArea: {
    flex: 1,
  },

  selectedModeLabel: {
    marginBottom: 2,
    color: COLORS.onSurfaceVariant,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },

  selectedModeTitle: {
    color: COLORS.primary,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
  },

  /**
   * メイン2カラム
   */
  mainLayout: {
    width: '100%',
  },

  mainLayoutDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 36,
  },

  mainLayoutMobile: {
    flexDirection: 'column',
    gap: 26,
  },

  illustrationColumn: {
    width: '100%',
  },

  illustrationColumnDesktop: {
    flex: 1.08,
  },

  illustrationColumnMobile: {
    flex: 0,
  },

  guideColumn: {
    width: '100%',
  },

  guideColumnDesktop: {
    flex: 0.92,
  },

  guideColumnMobile: {
    flex: 0,
  },

  /**
   * 撮影イメージ
   */
  guideImageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 4 / 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.12,
    shadowRadius: 14,

    elevation: 4,
  },

  guideImage: {
    zIndex: 10,
    width: '82%',
    height: '82%',
  },

  frameOverlay: {
    position: 'absolute',
    top: '10%',
    right: '9%',
    bottom: '10%',
    left: '9%',
    zIndex: 20,
    borderWidth: 2,
    borderColor: 'rgba(0, 94, 83, 0.40)',
    borderRadius: 10,
  },

  frameCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLORS.primary,
  },

  frameCornerTopLeft: {
    top: -4,
    left: -4,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },

  frameCornerTopRight: {
    top: -4,
    right: -4,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },

  frameCornerBottomLeft: {
    bottom: -4,
    left: -4,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },

  frameCornerBottomRight: {
    right: -4,
    bottom: -4,
    borderRightWidth: 4,
    borderBottomWidth: 4,
  },

  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 30,
    width: '100%',
    height: 4,
    backgroundColor: COLORS.primaryContainer,
    opacity: 0.85,

    shadowColor: COLORS.primaryContainer,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 5,
  },

  cameraPreviewBadge: {
    position: 'absolute',
    left: 18,
    bottom: 18,
    zIndex: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 94, 83, 0.88)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  cameraPreviewBadgeText: {
    marginLeft: 7,
    color: COLORS.white,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },

  securityNotice: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerLow,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  securityNoticeText: {
    flex: 1,
    marginLeft: 10,
    color: COLORS.onSurfaceVariant,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
  },

  /**
   * ガイド
   */
  guideSectionHeader: {
    marginBottom: 18,
  },

  guideSectionTitle: {
    marginBottom: 7,
    color: COLORS.onSurface,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 23,
    fontWeight: '700',
    lineHeight: 31,
  },

  guideSectionDescription: {
    color: COLORS.onSurfaceVariant,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 24,
  },

  instructionList: {
    gap: 14,
  },

  instructionCard: {
    width: '100%',
    padding: 17,
    borderWidth: 1,
    borderColor: 'rgba(189, 201, 197, 0.50)',
    borderRadius: 14,
    backgroundColor: COLORS.surfaceContainerLow,
    flexDirection: 'row',
    alignItems: 'flex-start',

    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 3,

    elevation: 2,
  },

  instructionIconCircle: {
    flexShrink: 0,
    width: 48,
    height: 48,
    marginRight: 15,
    borderRadius: 24,
    backgroundColor: COLORS.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },

  instructionTextArea: {
    flex: 1,
    paddingTop: 1,
  },

  instructionTitle: {
    marginBottom: 5,
    color: COLORS.onSurface,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 23,
  },

  instructionDescription: {
    color: COLORS.onSurfaceVariant,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
  },

  warningCard: {
    width: '100%',
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.warningBorder,
    borderRadius: 14,
    backgroundColor: COLORS.warningBackground,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  warningIconCircle: {
    flexShrink: 0,
    width: 44,
    height: 44,
    marginRight: 14,
    borderRadius: 22,
    backgroundColor: '#fff0c8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  warningTextArea: {
    flex: 1,
  },

  warningTitle: {
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

  warningText: {
    color: COLORS.onSurfaceVariant,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
  },

  /**
   * カメラ起動ボタン
   */
  desktopActionArea: {
    width: '100%',
    marginTop: 24,
  },

  cameraButton: {
    width: '100%',
    minHeight: 58,
    paddingHorizontal: 24,
    paddingVertical: 15,
    overflow: 'hidden',
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 7,

    elevation: 5,
  },

  cameraButtonDefault: {
    backgroundColor: COLORS.primary,
    transform: [
      {
        scale: 1,
      },
    ],
  },

  cameraButtonPressed: {
    backgroundColor: COLORS.surfaceTint,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  cameraButtonText: {
    marginHorizontal: 10,
    color: COLORS.onPrimary,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
  },

  permissionNote: {
    marginTop: 10,
    color: COLORS.onSurfaceVariant,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 20,
    textAlign: 'center',
  },
});