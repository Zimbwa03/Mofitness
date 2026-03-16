import "react-native-reanimated";
import "react-native-gesture-handler";

import { registerRootComponent } from 'expo';
import { ReanimatedLogLevel, configureReanimatedLogger } from "react-native-reanimated";

// WHY: Some Expo Go + Reanimated combinations can miss this global,
// which causes a startup crash loop before the app mounts.
const globalAny = globalThis as { _getAnimationTimestamp?: () => number };
if (typeof globalAny._getAnimationTimestamp !== "function") {
  globalAny._getAnimationTimestamp = () => Date.now();
}

// WHY: Reanimated strict warnings are noisy in Expo Go and can flood logs
// when opening animation-heavy screens. Keep real errors, suppress strict
// non-fatal shareable mutation warnings.
configureReanimatedLogger({
  level: ReanimatedLogLevel.error,
  strict: false,
});

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
