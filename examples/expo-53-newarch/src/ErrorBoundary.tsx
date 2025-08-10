/* eslint-disable @typescript-eslint/member-ordering */
import {Component, ErrorInfo, ReactNode} from 'react'
import { Pressable, Text, View } from 'react-native'

interface ErrorBoundaryState {
  error: Error | null
  errorId: string | null
}

interface ErrorBoundaryProps {
  children: ReactNode
}

export class ErrorBoundary extends Component<ErrorBoundaryProps> {
  state: ErrorBoundaryState = {error: null, errorId: null}

  static getDerivedStateFromError(error: Error) {
    // Updates state to show UI fallback
    return {error}
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
      console.error("ErrorBoundary", {
        error
      })
  }

  render() {
    const {children} = this.props
    const {error} = this.state


    if (error) {
      return (
        <View className="flex-1 items-center justify-center">
          <Pressable onPress={() => {
            this.setState({error: null})
          }}>
            <Text>Reload app</Text>
          </Pressable>
          <Text>
            {error?.message}
          </Text>
        </View>
      )
    }

    return children
  }
}
