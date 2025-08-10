import { Link } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Image, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCodepush } from "../useCodepush";
import CodePush from "@turbopush/react-native-code-push";

export default function Page() {
  return (
    <View className="flex flex-1">
      <Content />
    </View>
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
    const logs = args.map((arg) => {
      if (typeof arg === "object") {
        return JSON.stringify(arg);
      }
      return arg;
    });
    setLogs((prev) => [...prev, ...logs]);
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
    return <Text>{item}</Text>;
  }, []);

  return (
    <View className="bg-white gap-2">
      <Pressable
        className="flex h-9 items-center justify-center bg-red-500 rounded-md px-4 py-2"
        onPress={clearLogs}
      >
        <Text className="text-white">Clear Logs</Text>
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
    <View className="h-full bg-white">
      <View className="py-12 md:py-24 lg:py-32 xl:py-48">
        <View className="px-4 md:px-6 gap-4">
          <View className="flex flex-col items-center gap-4 text-center">
            <Image source={require("./logo-black.png")} className="w-10 h-10" />
            <Text
              role="heading"
              className="text-3xl text-center native:text-5xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl"
            >
              Update from codepush - 03/08 - 1.0.16
            </Text>
            <Text
              role="heading"
              className="text-3xl text-center native:text-5xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl"
            >
              {`Percentil: ${percentil}\nStatus: ${status}\nVersion: ${version}`}
            </Text>
            <View className="gap-4">
              <Pressable
                className="flex h-9 items-center justify-center bg-blue-500 rounded-md px-4 py-2"
                onPress={syncCodePush}
              >
                <Text className="text-white">Sync CodePush</Text>
              </Pressable>
              <Pressable
                className="flex h-9 items-center justify-center bg-blue-500 rounded-md px-4 py-2"
                onPress={() => {
                  console.log("Trying to restartApp");
                  CodePush.restartApp(true)
                }}
              >
                <Text className="text-white">Reload App</Text>
              </Pressable>
            </View>
          </View>
          <Logger />
        </View>
      </View>
    </View>
  );
}

