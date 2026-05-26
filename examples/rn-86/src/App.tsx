import './global.css';
import CodePush from '@turbopush/react-native-code-push';
import { ErrorBoundary } from '@repo/shared/ErrorBoundary';
import Page from '@repo/shared/Page';
import React from 'react';

function App() {
  return (
    <ErrorBoundary>
      <Page />
    </ErrorBoundary>
  );
}

export default CodePush({
  checkFrequency: CodePush.CheckFrequency.MANUAL,
  installMode: CodePush.InstallMode.ON_NEXT_RESTART,
  mandatoryInstallMode: CodePush.InstallMode.IMMEDIATE,
})(App);
