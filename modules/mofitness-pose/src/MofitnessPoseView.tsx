import { requireNativeView } from 'expo';
import * as React from 'react';

import { MofitnessPoseViewProps } from './MofitnessPose.types';

const NativeView: React.ComponentType<MofitnessPoseViewProps> =
  requireNativeView('MofitnessPose');

export default function MofitnessPoseView(props: MofitnessPoseViewProps) {
  return <NativeView {...props} />;
}
