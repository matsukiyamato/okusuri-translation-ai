// frontend/src/screens/CameraCaptureScreen.tsx

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from 'react';
import {
  Animated,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  Vibration,
  View,
  type LayoutChangeEvent,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  CameraView,
  useCameraPermissions,
  type CameraCapturedPicture,
} from 'expo-camera';

import type { RootStackParamList } from './ModeSelectionScreen';

type CameraCaptureScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'CameraCapture'
>;

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

type CameraHeaderButtonProps = {
  accessibilityLabel: string;
  iconName: MaterialIconName;
  isActive?: boolean;
  onPress: () => void;
};

type PermissionContentProps = {
  canAskAgain: boolean;
  onBack: () => void;
  onRequestPermission: () => void;
};

const COLORS = {
  black: '#000000',
  white: '#ffffff',

  primary: '#005e53',
  primaryFixed: '#97f3e2',
  primaryFixedDim: '#7ad7c6',

  onPrimary: '#ffffff',
  onSurface: '#181c1d',
  onSurfaceVariant: '#3e4946',

  surface: '#f6fafa',
  surfaceContainerLow: '#f0f4f4',

  outlineVariant: '#bdc9c5',
  error: '#ba1a1a',

  transparent: 'transparent',

  blackOverlayLight: 'rgba(0, 0, 0, 0.20)',
  blackOverlayMedium: 'rgba(0, 0, 0, 0.40)',
  blackOverlayStrong: 'rgba(0, 0, 0, 0.60)',

  whiteOverlayLight: 'rgba(255, 255, 255, 0.10)',
  whiteOverlayBorder: 'rgba(255, 255, 255, 0.20)',
  whiteFrame: 'rgba(255, 255, 255, 0.90)',
} as const;

const VIEWPORT_HORIZONTAL_MARGIN = 16;
const VIEWPORT_MAX_WIDTH = 400;
const SCAN_DURATION_MS = 3000;
const CAPTURE_FLASH_DURATION_MS = 100;

/**
 * 上部カメラ操作ボタン。
 */
const CameraHeaderButton = ({
  accessibilityLabel,
  iconName,
  isActive = false,
  onPress,
}: CameraHeaderButtonProps): React.JSX.Element => {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      android_ripple={{
        borderless: true,
        color: COLORS.whiteOverlayBorder,
        radius: 24,
      }}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.headerIconButton,
        isActive
          ? styles.headerIconButtonActive
          : styles.headerIconButtonInactive,
        pressed && styles.headerIconButtonPressed,
      ]}
    >
      <MaterialIcons
        color={isActive ? COLORS.primaryFixed : COLORS.white}
        name={iconName}
        size={28}
      />
    </Pressable>
  );
};

/**
 * カメラ権限がない場合の表示。
 */
const PermissionContent = ({
  canAskAgain,
  onBack,
  onRequestPermission,
}: PermissionContentProps): React.JSX.Element => {
  return (
    <SafeAreaView style={styles.permissionSafeArea}>
      <StatusBar
        backgroundColor={COLORS.surface}
        barStyle="dark-content"
      />

      <View style={styles.permissionHeader}>
        <Pressable
          accessibilityLabel="戻る"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onBack}
          style={({ pressed }) => [
            styles.permissionBackButton,
            pressed && styles.permissionBackButtonPressed,
          ]}
        >
          <MaterialIcons
            color={COLORS.primary}
            name="arrow-back"
            size={28}
          />
        </Pressable>

        <Text style={styles.permissionHeaderTitle}>カメラ</Text>
      </View>

      <View style={styles.permissionContent}>
        <View style={styles.permissionIconCircle}>
          <MaterialIcons
            color={COLORS.primary}
            name="photo-camera"
            size={48}
          />
        </View>

        <Text style={styles.permissionTitle}>
          カメラの使用を許可してください
        </Text>

        <Text style={styles.permissionDescription}>
          お薬の説明書を撮影するために、端末のカメラ権限が必要です。
        </Text>

        {canAskAgain ? (
          <Pressable
            accessibilityLabel="カメラの使用を許可する"
            accessibilityRole="button"
            android_ripple={{
              color: COLORS.primaryFixedDim,
              foreground: true,
            }}
            onPress={onRequestPermission}
            style={({ pressed }) => [
              styles.permissionButton,
              pressed && styles.permissionButtonPressed,
            ]}
          >
            <MaterialIcons
              color={COLORS.onPrimary}
              name="photo-camera"
              size={24}
            />

            <Text style={styles.permissionButtonText}>
              カメラを許可する
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.permissionErrorText}>
            Androidの設定画面から、このアプリのカメラ権限を許可してください。
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const CameraCaptureScreen = ({
  navigation,
  route,
}: CameraCaptureScreenProps): React.JSX.Element => {
  const { displayMode } = route.params;

  const isFocused = useIsFocused();
  const cameraRef = useRef<CameraView | null>(null);
  const scanProgress = useRef(new Animated.Value(0)).current;
  const captureFlashOpacity = useRef(new Animated.Value(0)).current;

  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isTorchEnabled, setIsTorchEnabled] = useState<boolean>(false);
  const [viewportHeight, setViewportHeight] = useState<number>(0);

  useEffect(() => {
    if (!isFocused || !permission?.granted) {
      scanProgress.stopAnimation();
      scanProgress.setValue(0);
      return undefined;
    }

    const scanningAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanProgress, {
          duration: SCAN_DURATION_MS,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(scanProgress, {
          duration: 0,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    scanningAnimation.start();

    return () => {
      scanningAnimation.stop();
      scanProgress.stopAnimation();
      scanProgress.setValue(0);
    };
  }, [isFocused, permission?.granted, scanProgress]);

  const handleClosePress = useCallback((): void => {
    navigation.goBack();
  }, [navigation]);

  const handleToggleTorch = useCallback((): void => {
    setIsTorchEnabled((previousValue) => !previousValue);
  }, []);

  const handleCameraReady = useCallback((): void => {
    setIsCameraReady(true);
  }, []);

  const handleCameraMountError = useCallback((): void => {
    setIsCameraReady(false);
  }, []);

  const handleViewportLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      setViewportHeight(event.nativeEvent.layout.height);
    },
    [],
  );

  const showCaptureFlash = useCallback((): void => {
    captureFlashOpacity.stopAnimation();

    Animated.sequence([
      Animated.timing(captureFlashOpacity, {
        duration: 0,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(captureFlashOpacity, {
        delay: CAPTURE_FLASH_DURATION_MS,
        duration: 100,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  }, [captureFlashOpacity]);

  const handleCapturePress = useCallback(async (): Promise<void> => {
    if (
      cameraRef.current === null ||
      !isCameraReady ||
      isCapturing
    ) {
      return;
    }

    setIsCapturing(true);

    try {
      showCaptureFlash();
      Vibration.vibrate(50);

      const capturedPicture: CameraCapturedPicture | undefined =
        await cameraRef.current.takePictureAsync({
          quality: 0.9,
          skipProcessing: false,
        });

      if (capturedPicture === undefined) {
        return;
      }

      /*
       * 現在のRootStackParamListではOcrVerificationへ渡す値が
       * displayModeのみのため、現段階では画面遷移だけ行います。
       *
       * OCR実装時にはRootStackParamListを次の形へ変更します。
       *
       * OcrVerification: {
       *   displayMode: TranslationDisplayMode;
       *   capturedImageUri: string;
       * };
       */
      navigation.navigate('OcrVerification', {
        displayMode,
      });

      /*
       * FastAPI接続時に使用する画像URI:
       * capturedPicture.uri
       *
       * FormDataへ変換し、OCR APIへ送信できます。
       */
      void capturedPicture.uri;
    } catch {
      setIsCameraReady(false);
    } finally {
      setIsCapturing(false);
    }
  }, [
    displayMode,
    isCameraReady,
    isCapturing,
    navigation,
    showCaptureFlash,
  ]);

  const handleHelpPress = useCallback((): void => {
    navigation.navigate('ScanGuidance', {
      displayMode,
    });
  }, [displayMode, navigation]);

  const getShutterStyle = useCallback(
    ({ pressed }: PressableStateCallbackType): StyleProp<ViewStyle> => [
      styles.shutterRing,
      pressed || isCapturing
        ? styles.shutterRingPressed
        : styles.shutterRingDefault,
      !isCameraReady && styles.shutterRingDisabled,
    ],
    [isCameraReady, isCapturing],
  );

  const scanLineTranslateY = scanProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(viewportHeight - 2, 0)],
  });

  const scanLineOpacity = scanProgress.interpolate({
    inputRange: [0, 0.05, 0.95, 1],
    outputRange: [0, 1, 1, 0],
  });

  if (permission === null) {
    return (
      <View style={styles.permissionLoading}>
        <StatusBar
          backgroundColor={COLORS.surface}
          barStyle="dark-content"
        />

        <Text style={styles.permissionLoadingText}>
          カメラを準備しています
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <PermissionContent
        canAskAgain={permission.canAskAgain}
        onBack={handleClosePress}
        onRequestPermission={() => {
          void requestPermission();
        }}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar
        backgroundColor={COLORS.black}
        barStyle="light-content"
        translucent
      />

      {isFocused ? (
        <CameraView
          ref={cameraRef}
          active={isFocused}
          animateShutter={false}
          enableTorch={isTorchEnabled}
          facing="back"
          onCameraReady={handleCameraReady}
          onMountError={handleCameraMountError}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View style={styles.cameraInactiveBackground} />
      )}

      <SafeAreaView style={styles.overlaySafeArea}>
        <View style={styles.overlay}>
          {/* Top App Bar */}
          <View style={styles.header}>
            <CameraHeaderButton
              accessibilityLabel="撮影画面を閉じる"
              iconName="close"
              onPress={handleClosePress}
            />

            <View style={styles.documentTypeChip}>
              <MaterialIcons
                color={COLORS.primaryFixed}
                name="description"
                size={18}
              />

              <Text style={styles.documentTypeText}>
                薬剤情報提供書
              </Text>
            </View>

            <CameraHeaderButton
              accessibilityLabel={
                isTorchEnabled
                  ? 'フラッシュを消す'
                  : 'フラッシュを点ける'
              }
              iconName={isTorchEnabled ? 'flash-on' : 'flash-off'}
              isActive={isTorchEnabled}
              onPress={handleToggleTorch}
            />
          </View>

          {/* Main Viewport */}
          <View style={styles.mainContent}>
            <View style={styles.instructionBox}>
              <Text style={styles.instructionTitle}>
                枠の中にお薬の説明書を合わせてください
              </Text>

              <Text style={styles.instructionDescription}>
                文字がはっきり見えるように近づけてください
              </Text>
            </View>

            <View style={styles.viewportWrapper}>
              <View
                onLayout={handleViewportLayout}
                style={styles.viewport}
              >
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.scanningLine,
                    {
                      opacity: scanLineOpacity,
                      transform: [
                        {
                          translateY: scanLineTranslateY,
                        },
                      ],
                    },
                  ]}
                />

                <View
                  pointerEvents="none"
                  style={[
                    styles.viewportCorner,
                    styles.viewportCornerTopLeft,
                  ]}
                />

                <View
                  pointerEvents="none"
                  style={[
                    styles.viewportCorner,
                    styles.viewportCornerTopRight,
                  ]}
                />

                <View
                  pointerEvents="none"
                  style={[
                    styles.viewportCorner,
                    styles.viewportCornerBottomLeft,
                  ]}
                />

                <View
                  pointerEvents="none"
                  style={[
                    styles.viewportCorner,
                    styles.viewportCornerBottomRight,
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Bottom Controls */}
          <View style={styles.footer}>
            <Pressable
              accessibilityHint="お薬の説明書を撮影します"
              accessibilityLabel="撮影する"
              accessibilityRole="button"
              accessibilityState={{
                busy: isCapturing,
                disabled: !isCameraReady || isCapturing,
              }}
              disabled={!isCameraReady || isCapturing}
              onPress={() => {
                void handleCapturePress();
              }}
              style={getShutterStyle}
            >
              <View style={styles.shutterCenter} />
            </Pressable>

            <Pressable
              accessibilityHint="撮影方法の確認画面へ戻ります"
              accessibilityLabel="撮影ヘルプ"
              accessibilityRole="button"
              android_ripple={{
                color: COLORS.whiteOverlayBorder,
                foreground: true,
              }}
              onPress={handleHelpPress}
              style={({ pressed }) => [
                styles.helpButton,
                pressed && styles.helpButtonPressed,
              ]}
            >
              <MaterialIcons
                color={COLORS.white}
                name="help"
                size={24}
              />

              <Text style={styles.helpButtonText}>ヘルプ</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      {/* Capture Feedback Overlay */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.captureFlash,
          {
            opacity: captureFlashOpacity,
          },
        ]}
      />
    </View>
  );
};

export default CameraCaptureScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.black,
  },

  cameraInactiveBackground: {
    ...StyleSheet.absoluteFill,
    backgroundColor: COLORS.black,
  },

  overlaySafeArea: {
    flex: 1,
    backgroundColor: COLORS.transparent,
  },

  overlay: {
    flex: 1,
  },

  header: {
    width: '100%',
    minHeight: 72,
    paddingTop: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerIconButton: {
    width: 48,
    height: 48,
    overflow: 'hidden',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerIconButtonInactive: {
    backgroundColor: COLORS.blackOverlayMedium,
  },

  headerIconButtonActive: {
    backgroundColor: 'rgba(0, 94, 83, 0.60)',
  },

  headerIconButtonPressed: {
    transform: [{ scale: 0.95 }],
  },

  documentTypeChip: {
    minHeight: 36,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.whiteOverlayBorder,
    borderRadius: 999,
    backgroundColor: COLORS.blackOverlayMedium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  documentTypeText: {
    color: COLORS.white,
    fontFamily: 'sans-serif',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.4,
  },

  mainContent: {
    flex: 1,
    paddingHorizontal: VIEWPORT_HORIZONTAL_MARGIN,
    alignItems: 'center',
    justifyContent: 'center',
  },

  instructionBox: {
    width: '100%',
    maxWidth: VIEWPORT_MAX_WIDTH,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.blackOverlayLight,
    alignItems: 'center',
  },

  instructionTitle: {
    marginBottom: 4,
    color: COLORS.white,
    fontFamily: 'sans-serif',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    textAlign: 'center',

    textShadowColor: 'rgba(0, 0, 0, 0.80)',
    textShadowOffset: {
      width: 0,
      height: 2,
    },
    textShadowRadius: 4,
  },

  instructionDescription: {
    color: 'rgba(255, 255, 255, 0.90)',
    fontFamily: 'sans-serif',
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 28,
    textAlign: 'center',

    textShadowColor: 'rgba(0, 0, 0, 0.80)',
    textShadowOffset: {
      width: 0,
      height: 2,
    },
    textShadowRadius: 4,
  },

  viewportWrapper: {
    width: '100%',
    maxWidth: VIEWPORT_MAX_WIDTH,
    aspectRatio: 3 / 4,
  },

  viewport: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.whiteFrame,
    borderRadius: 12,
    backgroundColor: COLORS.transparent,

    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.9,
    shadowRadius: 30,
  },

  scanningLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
    width: '100%',
    height: 2,
    backgroundColor: COLORS.primaryFixed,
  },

  viewportCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: COLORS.primaryFixed,
  },

  viewportCornerTopLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },

  viewportCornerTopRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },

  viewportCornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },

  viewportCornerBottomRight: {
    right: -2,
    bottom: -2,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderBottomRightRadius: 12,
  },

  footer: {
    height: 160,
    paddingHorizontal: 20,
    paddingBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  shutterRing: {
    width: 80,
    height: 80,
    borderWidth: 4,
    borderColor: COLORS.white,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  shutterRingDefault: {
    opacity: 1,
    transform: [{ scale: 1 }],
  },

  shutterRingPressed: {
    transform: [{ scale: 0.92 }],
  },

  shutterRingDisabled: {
    opacity: 0.55,
  },

  shutterCenter: {
    width: 64,
    height: 64,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 32,
    backgroundColor: COLORS.white,
  },

  helpButton: {
    minHeight: 48,
    overflow: 'hidden',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.whiteOverlayBorder,
    borderRadius: 999,
    backgroundColor: COLORS.whiteOverlayLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  helpButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },

  helpButtonText: {
    color: COLORS.white,
    fontFamily: 'sans-serif',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },

  captureFlash: {
    zIndex: 100,
    backgroundColor: COLORS.white,
  },

  permissionLoading: {
    flex: 1,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  permissionLoadingText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 16,
    fontWeight: '600',
  },

  permissionSafeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  permissionHeader: {
    height: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },

  permissionBackButton: {
    width: 48,
    height: 48,
    marginLeft: -8,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  permissionBackButtonPressed: {
    backgroundColor: COLORS.surfaceContainerLow,
  },

  permissionHeaderTitle: {
    marginLeft: 8,
    color: COLORS.onSurface,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },

  permissionContent: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  permissionIconCircle: {
    width: 96,
    height: 96,
    marginBottom: 24,
    borderRadius: 48,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  permissionTitle: {
    marginBottom: 12,
    color: COLORS.onSurface,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    textAlign: 'center',
  },

  permissionDescription: {
    maxWidth: 360,
    marginBottom: 32,
    color: COLORS.onSurfaceVariant,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    textAlign: 'center',
  },

  permissionButton: {
    minHeight: 56,
    overflow: 'hidden',
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  permissionButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },

  permissionButtonText: {
    color: COLORS.onPrimary,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },

  permissionErrorText: {
    maxWidth: 360,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffdad6',
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
    textAlign: 'center',
  },
});