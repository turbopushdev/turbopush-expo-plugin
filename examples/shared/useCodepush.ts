import { useCallback, useState } from "react";
import { Platform } from "react-native";
import CodePush from "@turbopush/react-native-code-push";

type CodepushStatus =
  | Extract<keyof typeof CodePush.SyncStatus, string>
  | "START"
  | "ERROR"
  | "UNKNOWN"
  | "RATE_LIMIT_ERROR"
  | "RATE_LIMIT_API_ERROR";

const CODEPUSH_STATUS_MESSAGE: Extract<keyof typeof CodePush.SyncStatus, string>[] = [
  "UP_TO_DATE",
  "UPDATE_INSTALLED",
  "UPDATE_IGNORED",
  "UNKNOWN_ERROR",
  "SYNC_IN_PROGRESS",
  "CHECKING_FOR_UPDATE",
  "AWAITING_USER_ACTION",
  "DOWNLOADING_PACKAGE",
  "INSTALLING_UPDATE",
];

const CodePushKey =
  Platform.OS === "ios"
    ? process.env.EXPO_PUBLIC_CODE_PUSH_KEY_IOS
    : process.env.EXPO_PUBLIC_CODE_PUSH_KEY_ANDROID;

export const useCodepush = () => {
  const [percentil, setPercentil] = useState<undefined | string>();
  const [version, setVersion] = useState("");
  const [status, setStatus] = useState<CodepushStatus>("UNKNOWN");

  const syncCodePush = useCallback(async () => {
    try {
      setStatus("START");

      const checkForUpdate = await CodePush.checkForUpdate(CodePushKey);

      console.log(`codepush_checkForUpdate`, {
        checkForUpdate,
      });

      if (checkForUpdate?.isPending)
        return console.log("codepush_checkForUpdate_pending");

      const updateMetadata = await CodePush.getUpdateMetadata();

      const codepushVersion = updateMetadata
        ? `${updateMetadata.appVersion}-${updateMetadata.label}`
        : "none";

      setVersion(codepushVersion);

      CodePush.sync(
        {
          deploymentKey: CodePushKey,
          installMode: CodePush.InstallMode.ON_NEXT_SUSPEND,
          mandatoryInstallMode: CodePush.InstallMode.IMMEDIATE,
          rollbackRetryOptions: {
            delayInHours: -1,
            maxRetryAttempts: 999,
          },
        },
        async (status) => {
          console.log(`codepush_status`, {
            status: CodePush.SyncStatus[status],
            statusMessage: CODEPUSH_STATUS_MESSAGE[status],
          });

          setStatus(CODEPUSH_STATUS_MESSAGE[status]);
        },
        ({ receivedBytes, totalBytes }) => {
          console.log(
            `codepush_downloading_package ${receivedBytes}/${totalBytes}`,
            {
              receivedBytes,
              totalBytes,
            }
          );
          const calcPercentage = (receivedBytes / totalBytes) * 100;
          const percentageFinal = Math.floor(calcPercentage);
          setPercentil(`${percentageFinal}%`);
        }
      );
    } catch (error) {
      if (/Rate limit is exceeded/.test((error as Error).message)) {
        setStatus("RATE_LIMIT_API_ERROR");
      } else {
        setStatus("ERROR");
      }
      console.log("codepush_error", {
        error,
        message: (error as Error).message,
      });
    }
  }, []);

  return {
    syncCodePush,
    percentil,
    version,
    status,
  };
};
