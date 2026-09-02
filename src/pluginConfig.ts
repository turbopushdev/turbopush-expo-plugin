/**
 * Configuration for `react-native-code-push`
 */
export interface PluginConfigType {
  ios: {
    CodePushDeploymentKey: string
    CodePushPublicKey?: string
  }
  android: {
    CodePushDeploymentKey: string
    CodePushPublicKey?: string
  }
}
