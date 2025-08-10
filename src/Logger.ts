/* eslint-disable no-console */
export class Logger {
  static log(str: string) {
    console.log(`turbopush-expo-plugin: ${str.replace(/\n|\t/g, '')}`)
  }

  static warn(str: string) {
    console.warn(`turbopush-expo-plugin: ${str.replace(/\n|\t/g, '')}`)
  }

  static error(str: string) {
    console.error(`turbopush-expo-plugin: ${str.replace(/\n|\t/g, '')}`)
  }
}
