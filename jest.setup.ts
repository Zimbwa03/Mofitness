import '@testing-library/jest-native/extend-expect';
import './src/i18n';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View, Text, Image } = require('react-native');

  return {
    __esModule: true,
    default: {
      View,
      Text,
      Image,
      createAnimatedComponent: (Component: unknown) => Component,
    },
    createAnimatedComponent: (Component: unknown) => Component,
    useSharedValue: (initialValue: unknown) => ({ value: initialValue }),
    useAnimatedStyle: (updater: () => object) => updater(),
    useAnimatedProps: (updater: () => object) => updater(),
    cancelAnimation: jest.fn(),
    withSpring: (value: unknown) => value,
    withTiming: (value: unknown) => value,
    withDelay: (_delay: number, value: unknown) => value,
    withRepeat: (value: unknown) => value,
    withSequence: (...values: unknown[]) => values[values.length - 1],
    interpolate: (_value: number, _input: number[], output: number[]) => output[0],
    interpolateColor: (_value: number, _input: number[], output: string[]) => output[0],
    Easing: {
      linear: jest.fn(),
      out: jest.fn((value) => value),
      inOut: jest.fn((value) => value),
      cubic: jest.fn(),
      sin: jest.fn(),
      quad: jest.fn(),
    },
    FadeInDown: {
      delay: () => ({
        duration: () => ({}),
      }),
    },
  };
});

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    LinearGradient: ({ children, ...props }: { children?: React.ReactNode }) => React.createElement(View, props, children),
  };
});

jest.mock('react-native-confetti-cannon', () => {
  const React = require('react');
  const { View } = require('react-native');

  return function ConfettiCannon(props: Record<string, unknown>) {
    return React.createElement(View, props);
  };
});

jest.mock('expo-blur', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    BlurView: ({ children, ...props }: { children: React.ReactNode }) => React.createElement(View, props, children),
  };
});

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: 'ExponentPushToken[test]' })),
  scheduleNotificationAsync: jest.fn(async () => 'notification-id'),
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
  SchedulableTriggerInputTypes: {
    DAILY: 'daily',
  },
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  const Icon = ({ name, testID }: { name?: string; testID?: string }) => React.createElement(Text, { testID }, name ?? 'icon');

  return {
    Ionicons: Icon,
  };
});

jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View').default;

  return {
    GestureHandlerRootView: View,
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');

  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

