import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useCodepush } from "./useCodepush";
import { Logger } from "./Logger";
import CodePush from "@turbopush/react-native-code-push";
import constants from "./constants.json";

export default function Page() {
  return (
    <View className="flex flex-1">
      <Content />
    </View>
  );
}

function Content() {
  const { syncCodePush, percentil, status, version } = useCodepush();

  return (
    <View className="h-full bg-white">
      <View className="py-12 md:py-24 lg:py-32 xl:py-48">
        <View className="px-4 md:px-6 gap-4">
          <View className="flex flex-col items-center gap-4 text-center">
            <Image source={require("./assets/logo-black.png")} className="w-10 h-10" />
            <Text
              role="heading"
              className="text-black text-xl text-center native:text-5xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl"
            >
              Turbopush Demo - {constants.APP_VERSION}
            </Text>
            <Text
              role="heading"
              className="text-black text-xl text-center native:text-5xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl"
            >
              {`Status: ${String(status)}`}
            </Text>
            <Text
              role="heading"
              className="text-black text-xl text-center native:text-5xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl"
            >
              {`Progress: ${percentil}\nVersion: ${version}`}
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
                  CodePush.restartApp(true);
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
