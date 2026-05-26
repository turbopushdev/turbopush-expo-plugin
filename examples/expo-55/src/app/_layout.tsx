import CodePush from "@turbopush/react-native-code-push";
import "../global.css";
import { Slot } from "expo-router";
import { ErrorBoundary } from "@/ErrorBoundary";

function RootLayout() {
  return (
    <ErrorBoundary>
      <Slot />
    </ErrorBoundary>
  );
}

export default CodePush({
  checkFrequency: CodePush.CheckFrequency.MANUAL,
  installMode: CodePush.InstallMode.ON_NEXT_RESTART,
  mandatoryInstallMode: CodePush.InstallMode.IMMEDIATE,
})(RootLayout);
