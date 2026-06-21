export {};

declare module "react-native" {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface ImagePropsBase {
    className?: string;
  }
  interface PressableProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface SwitchProps {
    className?: string;
  }
}
