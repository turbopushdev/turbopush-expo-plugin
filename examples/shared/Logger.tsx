import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

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
    ref.current?.scrollToEnd();
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
    return <Text className="text-black">{item}</Text>;
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
