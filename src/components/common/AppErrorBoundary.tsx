import { Component, type ErrorInfo, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { MoButton } from "./MoButton";
import { colors, theme, typography } from "../../theme";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    // WHY: Prevents hard app crash loops; telemetry can be added here later.
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.body}>Please retry. If this keeps happening, restart the app.</Text>
        <MoButton onPress={this.handleRetry} size="small">
          Try again
        </MoButton>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg_primary,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  title: {
    ...typography.display_sm,
    color: colors.text_primary,
    textAlign: "center",
  },
  body: {
    ...typography.body_md,
    color: colors.text_secondary,
    textAlign: "center",
  },
});

