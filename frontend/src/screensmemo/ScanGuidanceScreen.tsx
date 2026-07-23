// frontend/src/screens/ScanGuidanceScreen.tsx

import React, {
  useCallback,
  useEffect,
  useRef,
  type ComponentProps,
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
  View,
  type ImageSourcePropType,
  type PressableStateCallbackType,
  type ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type {
  RootStackParamList,
  TranslationDisplayMode,
} from './ModeSelectionScreen';

type ScanGuidanceScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ScanGuidance'
>;

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

type InstructionCardProps = {
  iconName: MaterialIconName;
  title: string;
  description: string;
};

type ScanGuideIllustrationProps = {
  imageSource: ImageSourcePropType;
};

const COLORS = {
  primary: '#005e53',
  primaryContainer: '#00796b',
  surfaceTint: '#006b5e',

  onPrimary: '#ffffff',
  onSurface: '#181c1d',
  onSurfaceVariant: '#3e4946',

  surface: '#f6fafa',
  surfaceContainerLow: '#f0f4f4',
  surfaceContainerHigh: '#e5e9e9',

  secondaryContainer: '#acedda',
  onSecondaryContainer: '#2e6d5f',

  outlineVariant: '#bdc9c5',

  warningBackground: '#fff9eb',
  warningBorder: '#ffe0a3',
  warningIcon: '#d97706',

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
 * 撮影時の注意事項カード。
 *
 * ファイルを増やさない条件に合わせ、この画面内で
 * 再利用可能な内部コンポーネントとして定義しています。
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
        <Text style={styles.instructionTitle}>{title}</Text>

        <Text style={styles.instructionDescription}>{description}</Text>
      </View>
    </View>
  );
};

/**
 * スキャンガイド画像とスキャンライン。
 *
 * HTMLの3秒間隔で上から下へ移動するscanアニメーションを、
 * React Native Animatedで再現しています。
 */
const ScanGuideIllustration = ({
  imageSource,
}: ScanGuideIllustrationProps): React.JSX.Element => {
  const scanProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const scanAnimation = Animated.loop(
      Animated.timing(scanProgress, {
        duration: 3000,
        toValue: 1,
        useNativeDriver: true,
      }),
    );

    scanAnimation.start();

    return () => {
      scanAnimation.stop();
      scanProgress.stopAnimation();
    };
  }, [scanProgress]);

  const scanLineTranslateY = scanProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 285],
  });

  return (
    <View
      accessibilityLabel="お薬の説明書をカメラの枠内に合わせる撮影例"
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
        <View style={[styles.frameCorner, styles.frameCornerTopLeft]} />
        <View style={[styles.frameCorner, styles.frameCornerTopRight]} />
        <View style={[styles.frameCorner, styles.frameCornerBottomLeft]} />
        <View style={[styles.frameCorner, styles.frameCornerBottomRight]} />
      </View>

      <Animated.View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={[
          styles.scanLine,
          {
            transform: [{ translateY: scanLineTranslateY }],
          },
        ]}
      />
    </View>
  );
};

const ScanGuidanceScreen = ({
  navigation,
  route,
}: ScanGuidanceScreenProps): React.JSX.Element => {
  const { displayMode } = route.params;

  const handleBackPress = useCallback((): void => {
    navigation.goBack();
  }, [navigation]);

  const handleStartCameraPress = useCallback((): void => {
    navigation.navigate('CameraCapture', {
      displayMode,
    });
  }, [displayMode, navigation]);

  const getCameraButtonStyle = useCallback(
    ({ pressed }: PressableStateCallbackType): ViewStyle[] => [
      styles.cameraButton,
      pressed ? styles.cameraButtonPressed : styles.cameraButtonDefault,
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
        {/* Top Navigation Bar */}
        <View style={styles.header}>
          <Pressable
            accessibilityHint="モード選択画面に戻ります"
            accessibilityLabel="戻る"
            accessibilityRole="button"
            android_ripple={{
              borderless: true,
              color: COLORS.surfaceContainerHigh,
              radius: 24,
            }}
            hitSlop={8}
            onPress={handleBackPress}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <MaterialIcons
              color={COLORS.primary}
              name="arrow-back"
              size={28}
            />
          </Pressable>

          <Text
            accessibilityRole="header"
            numberOfLines={1}
            style={styles.headerTitle}
          >
            撮影をはじめる前の確認
          </Text>
        </View>

        {/* Main Content Canvas */}
        <ScrollView
          alwaysBounceVertical={false}
          bounces={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.illustrationSection}>
            <ScanGuideIllustration imageSource={SCAN_GUIDE_IMAGE} />
          </View>

          <View style={styles.instructionList}>
            <InstructionCard
              description="文字がはっきり読めるよう、十分な光がある場所でスキャンを開始します。"
              iconName="light-mode"
              title="明るい場所で撮影してください"
            />

            <InstructionCard
              description="カメラを平行に保ち、文書全体が枠内に収まるようにしてください。"
              iconName="crop-free"
              title="お薬の説明書を、カメラの青い枠の中に合わせてください"
            />

            <View
              accessibilityLabel="注意。影が入らないように注意してください"
              style={styles.warningChip}
            >
              <MaterialIcons
                accessibilityElementsHidden
                color={COLORS.warningIcon}
                importantForAccessibility="no-hide-descendants"
                name="info"
                size={24}
              />

              <Text style={styles.warningText}>
                影が入らないように注意してください
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Action Bar */}
        <View style={styles.bottomActionBar}>
          <View style={styles.bottomActionContent}>
            <Pressable
              accessibilityHint="カメラ撮影画面に進みます"
              accessibilityLabel="カメラを起動する"
              accessibilityRole="button"
              android_ripple={{
                color: COLORS.surfaceTint,
                foreground: true,
              }}
              onPress={handleStartCameraPress}
              style={getCameraButtonStyle}
            >
              <MaterialIcons
                accessibilityElementsHidden
                color={COLORS.onPrimary}
                importantForAccessibility="no-hide-descendants"
                name="photo-camera"
                size={25}
              />

              <Text style={styles.cameraButtonText}>
                カメラを起動する
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ScanGuidanceScreen;

/**
 * 現在選択されている表示モードを後続処理で利用するための補助関数。
 *
 * 現在は画面遷移だけですが、FastAPI接続時には、
 * OCRリクエストや結果生成リクエストのパラメータとして利用できます。
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

  /*
   * HTML:
   * h-touch-target-critical = 56px
   * px-margin-mobile = 20px
   */
  header: {
    zIndex: 50,
    height: 56,
    paddingHorizontal: 20,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',

    elevation: 2,

    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.12,
    shadowRadius: 2,
  },

  backButton: {
    width: 48,
    height: 48,
    marginLeft: -8,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backButtonPressed: {
    backgroundColor: COLORS.surfaceContainerHigh,
    transform: [{ scale: 0.95 }],
  },

  headerTitle: {
    flex: 1,
    marginLeft: 8,
    color: COLORS.onSurface,
    fontFamily: 'sans-serif',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },

  /*
   * 下部固定ボタンに本文が隠れないよう、
   * HTMLのpb-32に相当する余白を確保します。
   */
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 512,
    alignSelf: 'center',
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 128,
  },

  illustrationSection: {
    marginBottom: 24,
  },

  /*
   * HTML:
   * aspect-[4/3]
   * rounded-xl
   * bg-surface-container-high
   */
  guideImageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 4 / 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },

  guideImage: {
    zIndex: 10,
    width: '80%',
    height: '80%',
  },

  /*
   * HTMLのinset-8に相当する32pxの内側フレーム。
   */
  frameOverlay: {
    position: 'absolute',
    top: 32,
    right: 32,
    bottom: 32,
    left: 32,
    zIndex: 20,
    borderWidth: 2,
    borderColor: 'rgba(0, 94, 83, 0.40)',
    borderRadius: 8,
  },

  frameCorner: {
    position: 'absolute',
    width: 24,
    height: 24,
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
  },

  instructionList: {
    gap: 16,
  },

  instructionCard: {
    width: '100%',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(189, 201, 197, 0.30)',
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerLow,
    flexDirection: 'row',
    alignItems: 'flex-start',

    elevation: 2,

    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },

  instructionIconCircle: {
    flexShrink: 0,
    width: 48,
    height: 48,
    marginRight: 16,
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
    marginBottom: 4,
    color: COLORS.onSurface,
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: 0.1,
  },

  instructionDescription: {
    color: COLORS.onSurfaceVariant,
    fontFamily: 'sans-serif',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
  },

  warningChip: {
    width: '100%',
    minHeight: 50,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.warningBorder,
    borderRadius: 8,
    backgroundColor: COLORS.warningBackground,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  warningText: {
    flex: 1,
    color: COLORS.onSurfaceVariant,
    fontFamily: 'sans-serif',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },

  /*
   * HTML:
   * fixed bottom-0
   * px-margin-mobile
   * pt-4
   */
  bottomActionBar: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 40,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(189, 201, 197, 0.20)',
    backgroundColor: 'rgba(246, 250, 250, 0.96)',

    elevation: 12,

    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  bottomActionContent: {
    width: '100%',
    maxWidth: 512,
    alignSelf: 'center',
  },

  cameraButton: {
    width: '100%',
    height: 56,
    overflow: 'hidden',
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,

    elevation: 6,

    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.22,
    shadowRadius: 5,
  },

  cameraButtonDefault: {
    backgroundColor: COLORS.primary,
    transform: [{ scale: 1 }],
  },

  cameraButtonPressed: {
    backgroundColor: COLORS.surfaceTint,
    transform: [{ scale: 0.95 }],
  },

  cameraButtonText: {
    color: COLORS.onPrimary,
    fontFamily: 'sans-serif',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: 0.1,
  },
});