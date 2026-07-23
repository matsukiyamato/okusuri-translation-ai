// frontend/src/screens/OcrVerificationScreen.tsx

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
  TextInput,
  useWindowDimensions,
  View,
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
} from './ModeSelectionScreen';

type OcrVerificationScreenProps =
  NativeStackScreenProps<
    RootStackParamList,
    'OcrVerification'
  >;

type MaterialIconName =
  ComponentProps<
    typeof MaterialIcons
  >['name'];

type HeaderButtonProps = {
  accessibilityLabel: string;
  iconName: MaterialIconName;
  onPress: () => void;
};

type FieldSectionProps = {
  label: string;
  value: string;
  placeholder: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
};

type ActionButtonProps = {
  accessibilityLabel: string;
  iconName: MaterialIconName;
  label: string;
  variant: 'outlined' | 'filled';
  disabled?: boolean;
  onPress: () => void;
};

const DESKTOP_BREAKPOINT = 900;
const WEB_CONTENT_MAX_WIDTH = 1180;
const SCAN_DURATION_MS = 1800;

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

  secondaryContainer: '#acedda',
  onSecondaryContainer: '#2e6d5f',

  outline: '#6e7a76',
  outlineVariant: '#bdc9c5',

  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',

  warningBackground: '#fff9eb',
  warningBorder: '#ffe0a3',
  warningIcon: '#d97706',

  black: '#000000',
  white: '#ffffff',
  shadow: '#000000',
  transparent: 'transparent',
} as const;

/**
 * 上部ヘッダーで使用するアイコンボタン。
 */
const HeaderButton = ({
  accessibilityLabel,
  iconName,
  onPress,
}: HeaderButtonProps): React.JSX.Element => {
  const getButtonStyle = useCallback(
    ({
      pressed,
    }: PressableStateCallbackType): ViewStyle[] => [
      styles.headerButton,
      pressed
        ? styles.headerButtonPressed
        : styles.headerButtonDefault,
    ],
    [],
  );

  return (
    <Pressable
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
 * OCR結果の編集フィールド。
 *
 * ファイル数を増やさない条件に合わせて、
 * この画面内の内部コンポーネントとして定義します。
 */
const FieldSection = ({
  label,
  value,
  placeholder,
  multiline = false,
  onChangeText,
}: FieldSectionProps): React.JSX.Element => {
  return (
    <View style={styles.fieldSection}>
      <Text style={styles.fieldLabel}>
        {label}
      </Text>

      <View
        style={[
          styles.inputWrapper,
          multiline
            ? styles.multilineInputWrapper
            : styles.singleLineInputWrapper,
        ]}
      >
        <TextInput
          accessibilityLabel={label}
          multiline={multiline}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.outline}
          style={[
            styles.textInput,
            multiline
              ? styles.multilineTextInput
              : styles.singleLineTextInput,
          ]}
          textAlignVertical={
            multiline
              ? 'top'
              : 'center'
          }
          value={value}
        />

        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.editIconArea,
            multiline
              ? styles.editIconAreaMultiline
              : styles.editIconAreaSingleLine,
          ]}
        >
          <MaterialIcons
            color={COLORS.outline}
            name="edit"
            size={21}
          />
        </View>
      </View>
    </View>
  );
};

/**
 * 再撮影・決定ボタン。
 */
const ActionButton = ({
  accessibilityLabel,
  iconName,
  label,
  variant,
  disabled = false,
  onPress,
}: ActionButtonProps): React.JSX.Element => {
  const getButtonStyle = useCallback(
    ({
      pressed,
    }: PressableStateCallbackType): ViewStyle[] => [
      styles.actionButton,

      variant === 'filled'
        ? styles.filledButton
        : styles.outlinedButton,

      pressed && !disabled
        ? styles.actionButtonPressed
        : styles.actionButtonDefault,

      disabled
        ? styles.actionButtonDisabled
        : styles.actionButtonEnabled,
    ],
    [
      disabled,
      variant,
    ],
  );

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{
        disabled,
      }}
      disabled={disabled}
      onPress={onPress}
      style={getButtonStyle}
    >
      <MaterialIcons
        accessibilityElementsHidden
        color={
          variant === 'filled'
            ? COLORS.onPrimary
            : COLORS.primary
        }
        importantForAccessibility="no-hide-descendants"
        name={iconName}
        size={23}
      />

      <Text
        style={[
          styles.actionButtonText,
          variant === 'filled'
            ? styles.filledButtonText
            : styles.outlinedButtonText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const OcrVerificationScreen = ({
  navigation,
  route,
}: OcrVerificationScreenProps): React.JSX.Element => {
  const {
    width,
  } = useWindowDimensions();

  const {
    displayMode,
    capturedImageUri,
  } = route.params;

  const isDesktopLayout =
    width >= DESKTOP_BREAKPOINT;

  /**
   * FastAPI接続前の仮OCR結果。
   *
   * FastAPI接続後は、APIレスポンスで
   * medicineNameとdosageを更新します。
   */
  const [medicineName, setMedicineName] =
    useState<string>(
      'ロキソプロフェンナトリウム',
    );

  const [dosage, setDosage] =
    useState<string>(
      '1回1錠、1日3回 食後',
    );

  const [previewHeight, setPreviewHeight] =
    useState<number>(0);

  const scanProgress =
    useRef(
      new Animated.Value(0),
    ).current;

  /**
   * OCR処理中を表現するスキャンライン。
   *
   * 現段階では画面表現のみです。
   * FastAPI接続後はAPI通信中だけ動かす設計に変更できます。
   */
  useEffect(() => {
    const scanAnimation =
      Animated.loop(
        Animated.sequence([
          Animated.timing(
            scanProgress,
            {
              toValue: 1,
              duration:
                SCAN_DURATION_MS,
              useNativeDriver: false,
            },
          ),

          Animated.timing(
            scanProgress,
            {
              toValue: 0,
              duration: 0,
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

  const handlePreviewLayout =
    useCallback(
      (
        event: LayoutChangeEvent,
      ): void => {
        setPreviewHeight(
          event.nativeEvent.layout.height,
        );
      },
      [],
    );

  const handleBackPress =
    useCallback((): void => {
      navigation.goBack();
    }, [navigation]);

  /**
   * 再撮影時はCameraCaptureへ戻します。
   */
  const handleRetake =
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

  /**
   * 撮影方法の確認画面へ移動します。
   */
  const handleHelpPress =
    useCallback((): void => {
      navigation.navigate(
        'ScanGuidance',
        {
          displayMode,
        },
      );
    }, [
      displayMode,
      navigation,
    ]);

  /**
   * 選択されたモードに応じて、
   * 最終表示画面を切り替えます。
   */
  const handleConfirm =
    useCallback((): void => {
      const normalizedMedicineName =
        medicineName.trim();

      if (
        normalizedMedicineName.length === 0
      ) {
        return;
      }

      if (
        displayMode === 'textAudio'
      ) {
        navigation.navigate(
          'TextAudioResult',
          {
            recognizedText:
              normalizedMedicineName,
          },
        );

        return;
      }

      navigation.navigate(
        'SignLanguageResult',
        {
          recognizedText:
            normalizedMedicineName,
        },
      );
    }, [
      displayMode,
      medicineName,
      navigation,
    ]);

  const scanTranslateY =
    scanProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [
        0,
        Math.max(
          previewHeight - 4,
          0,
        ),
      ],
    });

  const scanOpacity =
    scanProgress.interpolate({
      inputRange: [
        0,
        0.05,
        0.95,
        1,
      ],
      outputRange: [
        0,
        1,
        1,
        0,
      ],
    });

  const normalizedMedicineName =
    medicineName.trim();

  const isConfirmDisabled =
    normalizedMedicineName.length === 0;

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
            <HeaderButton
              accessibilityLabel="前の画面に戻る"
              iconName="arrow-back"
              onPress={handleBackPress}
            />

            <View style={styles.headerTitleArea}>
              <View style={styles.headerIconCircle}>
                <MaterialIcons
                  accessibilityElementsHidden
                  color={COLORS.onPrimary}
                  importantForAccessibility="no-hide-descendants"
                  name="fact-check"
                  size={22}
                />
              </View>

              <View style={styles.headerTextArea}>
                <Text
                  accessibilityRole="header"
                  numberOfLines={1}
                  style={styles.headerTitle}
                >
                  読み取り内容の確認
                </Text>

                <Text style={styles.headerSubtitle}>
                  OCR確認
                </Text>
              </View>
            </View>

            <HeaderButton
              accessibilityLabel="撮影方法を確認する"
              iconName="help-outline"
              onPress={handleHelpPress}
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
            {/* ページタイトル */}
            <View
              style={[
                styles.introduction,

                isDesktopLayout
                  ? styles.introductionDesktop
                  : styles.introductionMobile,
              ]}
            >
              <View style={styles.modeBadge}>
                <MaterialIcons
                  accessibilityElementsHidden
                  color={COLORS.primary}
                  importantForAccessibility="no-hide-descendants"
                  name={
                    displayMode ===
                    'textAudio'
                      ? 'record-voice-over'
                      : 'sign-language'
                  }
                  size={19}
                />

                <Text style={styles.modeBadgeText}>
                  {displayMode ===
                  'textAudio'
                    ? 'テキスト・音声モード'
                    : '手話動画モード'}
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
                読み取った内容を確認してください
              </Text>

              <Text
                style={[
                  styles.pageDescription,

                  isDesktopLayout
                    ? styles.pageDescriptionDesktop
                    : styles.pageDescriptionMobile,
                ]}
              >
                読み取り結果に間違いがある場合は、
                入力欄を選択して修正できます。
              </Text>
            </View>

            {/* Webでは左右2カラム */}
            <View
              style={[
                styles.verificationLayout,

                isDesktopLayout
                  ? styles.verificationLayoutDesktop
                  : styles.verificationLayoutMobile,
              ]}
            >
              {/* 撮影画像 */}
              <View
                style={[
                  styles.previewColumn,

                  isDesktopLayout
                    ? styles.previewColumnDesktop
                    : styles.previewColumnMobile,
                ]}
              >
                <View style={styles.columnHeader}>
                  <View style={styles.columnHeaderTitleRow}>
                    <MaterialIcons
                      accessibilityElementsHidden
                      color={COLORS.primary}
                      importantForAccessibility="no-hide-descendants"
                      name="image"
                      size={22}
                    />

                    <Text style={styles.columnHeaderTitle}>
                      撮影された画像
                    </Text>
                  </View>

                  <Text style={styles.columnHeaderDescription}>
                    OCRの読み取り元として使用する画像です。
                  </Text>
                </View>

                <View
                  onLayout={
                    handlePreviewLayout
                  }
                  style={styles.previewContainer}
                >
                  {capturedImageUri !==
                    undefined &&
                  capturedImageUri.length >
                    0 ? (
                    <Image
                      accessibilityLabel="Webカメラで撮影されたお薬の説明書"
                      resizeMode="contain"
                      source={{
                        uri:
                          capturedImageUri,
                      }}
                      style={
                        styles.previewImage
                      }
                    />
                  ) : (
                    <View
                      style={
                        styles.previewPlaceholder
                      }
                    >
                      <View
                        style={
                          styles.placeholderIconCircle
                        }
                      >
                        <MaterialIcons
                          accessibilityElementsHidden
                          color={
                            COLORS.primaryFixed
                          }
                          importantForAccessibility="no-hide-descendants"
                          name="no-photography"
                          size={50}
                        />
                      </View>

                      <Text
                        style={
                          styles.previewPlaceholderTitle
                        }
                      >
                        撮影画像がありません
                      </Text>

                      <Text
                        style={
                          styles.previewPlaceholderText
                        }
                      >
                        再撮影ボタンからWebカメラを起動してください。
                      </Text>
                    </View>
                  )}

                  {capturedImageUri !==
                    undefined &&
                  capturedImageUri.length >
                    0 ? (
                    <>
                      <View
                        pointerEvents="none"
                        style={
                          styles.previewOverlay
                        }
                      />

                      <View
                        pointerEvents="none"
                        style={
                          styles.scanFrame
                        }
                      >
                        <Animated.View
                          style={[
                            styles.scanLine,
                            {
                              opacity:
                                scanOpacity,

                              transform: [
                                {
                                  translateY:
                                    scanTranslateY,
                                },
                              ],
                            },
                          ]}
                        />

                        <View
                          style={[
                            styles.scanCorner,
                            styles.scanCornerTopLeft,
                          ]}
                        />

                        <View
                          style={[
                            styles.scanCorner,
                            styles.scanCornerTopRight,
                          ]}
                        />

                        <View
                          style={[
                            styles.scanCorner,
                            styles.scanCornerBottomLeft,
                          ]}
                        />

                        <View
                          style={[
                            styles.scanCorner,
                            styles.scanCornerBottomRight,
                          ]}
                        />
                      </View>
                    </>
                  ) : null}

                  <View style={styles.imageChip}>
                    <MaterialIcons
                      accessibilityElementsHidden
                      color={COLORS.white}
                      importantForAccessibility="no-hide-descendants"
                      name="photo-camera"
                      size={18}
                    />

                    <Text
                      style={
                        styles.imageChipText
                      }
                    >
                      Webカメラ画像
                    </Text>
                  </View>
                </View>

                <View style={styles.imageInformationCard}>
                  <MaterialIcons
                    accessibilityElementsHidden
                    color={COLORS.primary}
                    importantForAccessibility="no-hide-descendants"
                    name="lock"
                    size={22}
                  />

                  <Text
                    style={
                      styles.imageInformationText
                    }
                  >
                    現段階では画像をブラウザ内で保持しています。
                    FastAPI接続後は、この画像をOCR APIへ送信します。
                  </Text>
                </View>
              </View>

              {/* OCR結果 */}
              <View
                style={[
                  styles.resultColumn,

                  isDesktopLayout
                    ? styles.resultColumnDesktop
                    : styles.resultColumnMobile,
                ]}
              >
                <View style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    <View
                      style={
                        styles.resultHeaderTitleRow
                      }
                    >
                      <View
                        style={
                          styles.resultHeaderIcon
                        }
                      >
                        <MaterialIcons
                          accessibilityElementsHidden
                          color={COLORS.primary}
                          importantForAccessibility="no-hide-descendants"
                          name="description"
                          size={24}
                        />
                      </View>

                      <View
                        style={
                          styles.resultHeaderTextArea
                        }
                      >
                        <Text
                          style={
                            styles.resultTitle
                          }
                        >
                          読み取り結果
                        </Text>

                        <Text
                          style={
                            styles.resultDescription
                          }
                        >
                          必要に応じて内容を修正してください。
                        </Text>
                      </View>
                    </View>

                    <View style={styles.ocrStatusBadge}>
                      <MaterialIcons
                        accessibilityElementsHidden
                        color={COLORS.primary}
                        importantForAccessibility="no-hide-descendants"
                        name="check-circle"
                        size={17}
                      />

                      <Text
                        style={
                          styles.ocrStatusBadgeText
                        }
                      >
                        OCR完了
                      </Text>
                    </View>
                  </View>

                  <View style={styles.fieldList}>
                    <FieldSection
                      label="お薬名（Medicine Name）"
                      onChangeText={
                        setMedicineName
                      }
                      placeholder="お薬名を入力してください"
                      value={medicineName}
                    />

                    <FieldSection
                      label="用法・用量（Dosage）"
                      multiline
                      onChangeText={setDosage}
                      placeholder="用法・用量を入力してください"
                      value={dosage}
                    />
                  </View>

                  {isConfirmDisabled ? (
                    <View style={styles.validationCard}>
                      <MaterialIcons
                        accessibilityElementsHidden
                        color={COLORS.error}
                        importantForAccessibility="no-hide-descendants"
                        name="error-outline"
                        size={22}
                      />

                      <Text
                        style={
                          styles.validationText
                        }
                      >
                        お薬名を入力してください。
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.warningCard}>
                    <View style={styles.warningIconCircle}>
                      <MaterialIcons
                        accessibilityElementsHidden
                        color={COLORS.warningIcon}
                        importantForAccessibility="no-hide-descendants"
                        name="warning-amber"
                        size={27}
                      />
                    </View>

                    <View style={styles.warningTextArea}>
                      <Text style={styles.warningTitle}>
                        読み取り結果を確認してください
                      </Text>

                      <Text style={styles.warningText}>
                        OCRによる文字認識には誤りが含まれる可能性があります。
                        表示された文字と撮影画像を比較してください。
                      </Text>
                    </View>
                  </View>
                </View>

                {/* アクション */}
                <View
                  style={[
                    styles.actionArea,

                    isDesktopLayout
                      ? styles.actionAreaDesktop
                      : styles.actionAreaMobile,
                  ]}
                >
                  <ActionButton
                    accessibilityLabel="Webカメラで再撮影する"
                    iconName="refresh"
                    label="再撮影"
                    onPress={handleRetake}
                    variant="outlined"
                  />

                  <ActionButton
                    accessibilityLabel={
                      displayMode ===
                      'textAudio'
                        ? 'テキスト音声結果を表示する'
                        : '手話動画結果を表示する'
                    }
                    disabled={
                      isConfirmDisabled
                    }
                    iconName="check-circle"
                    label={
                      displayMode ===
                      'textAudio'
                        ? 'テキスト・音声結果へ'
                        : '手話動画結果へ'
                    }
                    onPress={handleConfirm}
                    variant="filled"
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default OcrVerificationScreen;

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

  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerButtonDefault: {
    backgroundColor:
      COLORS.transparent,
    transform: [
      {
        scale: 1,
      },
    ],
  },

  headerButtonPressed: {
    backgroundColor:
      COLORS.surfaceContainerHigh,
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

  /**
   * メインコンテンツ
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
    paddingHorizontal: 18,
  },

  introduction: {
    alignItems: 'center',
  },

  introductionDesktop: {
    marginTop: 48,
    marginBottom: 32,
  },

  introductionMobile: {
    marginTop: 30,
    marginBottom: 24,
  },

  modeBadge: {
    marginBottom: 14,
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor:
      COLORS.secondaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
  },

  modeBadgeText: {
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

  pageTitle: {
    marginBottom: 11,
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
   * 2カラム
   */
  verificationLayout: {
    width: '100%',
  },

  verificationLayoutDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 32,
  },

  verificationLayoutMobile: {
    flexDirection: 'column',
    gap: 26,
  },

  previewColumn: {
    width: '100%',
  },

  previewColumnDesktop: {
    flex: 1.05,
  },

  previewColumnMobile: {
    flex: 0,
  },

  resultColumn: {
    width: '100%',
  },

  resultColumnDesktop: {
    flex: 0.95,
  },

  resultColumnMobile: {
    flex: 0,
  },

  columnHeader: {
    marginBottom: 14,
  },

  columnHeaderTitleRow: {
    marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },

  columnHeaderTitle: {
    marginLeft: 8,
    color: COLORS.onSurface,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 21,
    fontWeight: '700',
    lineHeight: 29,
  },

  columnHeaderDescription: {
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
   * 画像プレビュー
   */
  previewContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 4 / 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor:
      COLORS.outlineVariant,
    borderRadius: 18,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 14,

    elevation: 5,
  },

  previewImage: {
    width: '100%',
    height: '100%',
  },

  previewPlaceholder: {
    width: '100%',
    height: '100%',
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeholderIconCircle: {
    width: 88,
    height: 88,
    marginBottom: 18,
    borderRadius: 44,
    backgroundColor:
      'rgba(0,94,83,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  previewPlaceholderTitle: {
    marginBottom: 7,
    color: COLORS.white,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    textAlign: 'center',
  },

  previewPlaceholderText: {
    maxWidth: 360,
    color:
      'rgba(255,255,255,0.76)',
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    textAlign: 'center',
  },

  previewOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor:
      'rgba(0,0,0,0.08)',
  },

  scanFrame: {
    position: 'absolute',
    top: '10%',
    right: '10%',
    bottom: '10%',
    left: '10%',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor:
      COLORS.primaryFixed,
    borderRadius: 12,
  },

  scanLine: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    height: 3,
    backgroundColor:
      COLORS.primaryFixed,

    shadowColor:
      COLORS.primaryFixed,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },

  scanCorner: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderColor:
      COLORS.primaryFixed,
  },

  scanCornerTopLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },

  scanCornerTopRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },

  scanCornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },

  scanCornerBottomRight: {
    right: -2,
    bottom: -2,
    borderRightWidth: 4,
    borderBottomWidth: 4,
  },

  imageChip: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor:
      'rgba(0,0,0,0.68)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  imageChipText: {
    marginLeft: 6,
    color: COLORS.white,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },

  imageInformationCard: {
    marginTop: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor:
      COLORS.outlineVariant,
    borderRadius: 13,
    backgroundColor:
      COLORS.surfaceContainerLow,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  imageInformationText: {
    flex: 1,
    marginLeft: 10,
    color: COLORS.onSurfaceVariant,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 21,
  },

  /**
   * OCR結果カード
   */
  resultCard: {
    width: '100%',
    padding: 24,
    borderWidth: 1,
    borderColor:
      COLORS.outlineVariant,
    borderRadius: 18,
    backgroundColor: COLORS.surface,

    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.09,
    shadowRadius: 12,

    elevation: 3,
  },

  resultHeader: {
    marginBottom: 25,
  },

  resultHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  resultHeaderIcon: {
    width: 48,
    height: 48,
    marginRight: 13,
    borderRadius: 24,
    backgroundColor:
      COLORS.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resultHeaderTextArea: {
    flex: 1,
  },

  resultTitle: {
    marginBottom: 3,
    color: COLORS.onSurface,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
  },

  resultDescription: {
    color: COLORS.onSurfaceVariant,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
  },

  ocrStatusBadge: {
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor:
      COLORS.secondaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
  },

  ocrStatusBadgeText: {
    marginLeft: 6,
    color:
      COLORS.onSecondaryContainer,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },

  fieldList: {
    gap: 22,
  },

  fieldSection: {
    width: '100%',
  },

  fieldLabel: {
    marginBottom: 8,
    color: COLORS.onSurface,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 23,
  },

  inputWrapper: {
    position: 'relative',
    width: '100%',
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

  singleLineInputWrapper: {
    minHeight: 58,
    justifyContent: 'center',
  },

  multilineInputWrapper: {
    minHeight: 130,
  },

  textInput: {
    width: '100%',
    paddingLeft: 16,
    paddingRight: 48,
    color: COLORS.onSurface,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 17,
    fontWeight: '400',
  },

  singleLineTextInput: {
    minHeight: 56,
    paddingVertical: 10,
  },

  multilineTextInput: {
    minHeight: 128,
    paddingTop: 15,
    paddingBottom: 15,
  },

  editIconArea: {
    position: 'absolute',
    right: 15,
  },

  editIconAreaSingleLine: {
    top: 18,
  },

  editIconAreaMultiline: {
    top: 16,
  },

  validationCard: {
    marginTop: 17,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor:
      COLORS.errorContainer,
    flexDirection: 'row',
    alignItems: 'center',
  },

  validationText: {
    flex: 1,
    marginLeft: 9,
    color:
      COLORS.onErrorContainer,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
  },

  warningCard: {
    marginTop: 24,
    padding: 16,
    borderWidth: 1,
    borderColor:
      COLORS.warningBorder,
    borderRadius: 14,
    backgroundColor:
      COLORS.warningBackground,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  warningIconCircle: {
    flexShrink: 0,
    width: 46,
    height: 46,
    marginRight: 13,
    borderRadius: 23,
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
    lineHeight: 22,
  },

  /**
   * アクションボタン
   */
  actionArea: {
    width: '100%',
    marginTop: 20,
  },

  actionAreaDesktop: {
    flexDirection: 'row',
    gap: 14,
  },

  actionAreaMobile: {
    flexDirection: 'column',
    gap: 12,
  },

  actionButton: {
    flex: 1,
    minHeight: 58,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,

    elevation: 3,
  },

  outlinedButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },

  filledButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },

  actionButtonDefault: {
    transform: [
      {
        scale: 1,
      },
    ],
  },

  actionButtonPressed: {
    opacity: 0.86,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  actionButtonDisabled: {
    opacity: 0.45,
  },

  actionButtonEnabled: {
    opacity: 1,
  },

  actionButtonText: {
    marginLeft: 8,
    fontFamily: Platform.select({
      web: 'system-ui',
      default: 'sans-serif',
    }),
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'center',
  },

  outlinedButtonText: {
    color: COLORS.primary,
  },

  filledButtonText: {
    color: COLORS.onPrimary,
  },
});