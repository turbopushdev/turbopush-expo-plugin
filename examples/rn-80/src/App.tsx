/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { useCodepush } from "./useCodepush";
import CodePush from "@turbopush/react-native-code-push";
import { ErrorBoundary } from "./ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <View style={{ flex: 1 }}>
        <Content /> 
      </View>
    </ErrorBoundary>
  );
}

const originalConsoleLog = console.log;
const originalConsoleError = console.error;
export const Logger = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const ref = useRef<FlatList<any>>(null);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const logToState = useCallback((...args: any[]) => {
    originalConsoleLog(...args);
    const formattedLogs = args.map((arg) => {
      if (typeof arg === "object") {
        return JSON.stringify(arg);
      }
      return arg;
    });
    setLogs((prev) => [...prev, ...formattedLogs]);
    ref.current?.scrollToEnd()
  }, []);

  useEffect(() => {
    console.log = logToState;
    console.error = logToState;

    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    };
  }, [logToState]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    return <Text style={{ color: '#000000' }}>{item}</Text>;
  }, []);

  return (
    <View style={{ backgroundColor: '#ffffff', gap: 8 }}>
      <Pressable
        style={{
          height: 36,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ef4444',
          borderRadius: 6,
          paddingHorizontal: 16,
          paddingVertical: 8
        }}
        onPress={clearLogs}
      >
        <Text style={{ color: '#ffffff' }}>Clear Logs</Text>
      </Pressable>
      <FlatList
        ref={ref}
        data={logs}
        renderItem={renderItem}
        style={{ height: 350 }}
        inverted
      />
    </View>
  );
};

function Content() {
  const { syncCodePush, percentil, status, version } = useCodepush();

  return (
    <View style={{ height: '100%', backgroundColor: '#ffffff' }}>
      <View style={{ paddingVertical: 48 }}>
        <View style={{ paddingHorizontal: 16, gap: 16 }}>
          <View style={{ alignItems: 'center', gap: 16 }}>
            <Image 
              source={require("./logo-black.png")} 
              style={{ width: 40, height: 40 }}
            />
            <Text
              style={{
                color: '#000000',
                fontSize: 30,
                textAlign: 'center',
                fontWeight: 'bold',
                letterSpacing: -0.5
              }}
            >
              Update from codepush - 03/08 - 1.0.26
            </Text>
            <Text
              style={{
                color: '#000000',
                fontSize: 30,
                textAlign: 'center',
                fontWeight: 'bold',
                letterSpacing: -0.5
              }}
            >
              {`Percentil: ${percentil}\nStatus: ${status}\nVersion: ${version}`}
            </Text>
            <View style={{ gap: 16 }}>
              <Pressable
                style={{
                  height: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#3b82f6',
                  borderRadius: 6,
                  paddingHorizontal: 16,
                  paddingVertical: 8
                }}
                onPress={syncCodePush}
              >
                <Text style={{ color: '#ffffff' }}>Sync CodePush</Text>
              </Pressable>
              <Pressable
                style={{
                  height: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#3b82f6',
                  borderRadius: 6,
                  paddingHorizontal: 16,
                  paddingVertical: 8
                }}
                onPress={() => {
                  console.log("Trying to restartApp");
                  CodePush.restartApp(true)
                }}
              >
                <Text style={{ color: '#ffffff' }}>Reload App</Text>
              </Pressable>
            </View>
          </View>
          <Logger />
        </View>
      </View>
    </View>
  );
}

export default CodePush({
  checkFrequency: CodePush.CheckFrequency.MANUAL,
  installMode: CodePush.InstallMode.ON_NEXT_RESTART,
  mandatoryInstallMode: CodePush.InstallMode.IMMEDIATE,
})(App);
