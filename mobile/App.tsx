import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StyleSheet, View } from 'react-native'
import { useState } from 'react'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import { PlayerProvider } from './src/context/PlayerContext'
import LoginScreen from './src/screens/LoginScreen'
import RegisterScreen from './src/screens/RegisterScreen'
import VerifyEmailScreen from './src/screens/VerifyEmailScreen'
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen'
import HomeScreen from './src/screens/HomeScreen'
import VerificationNoticeScreen from './src/screens/VerificationNoticeScreen'

function Screens() {
  const { user, accessToken, logout } = useAuth()
  const [screen, setScreen] = useState<'login' | 'register' | 'verify' | 'verify_notice' | 'forgot' | 'home'>('login')

  return (
    <View style={styles.container}>
      {user && accessToken && (
        <HomeScreen onLogout={() => { logout(); setScreen('login') }} />
      )}
      {!user && !accessToken && screen === 'login' && (
        <LoginScreen
          onRegister={() => setScreen('register')}
          onForgot={() => setScreen('forgot')}
          onLoggedIn={() => setScreen('home')}
          onVerificationNotice={() => setScreen('verify_notice')}
        />
      )}
      {!user && !accessToken && screen === 'register' && (
        <RegisterScreen onBackToLogin={() => setScreen('login')} onVerifyEmail={() => setScreen('verify_notice')} />
      )}
      {!user && !accessToken && screen === 'verify' && (
        <VerifyEmailScreen onVerified={() => setScreen('home')} onBack={() => setScreen('login')} />
      )}
      {!user && !accessToken && screen === 'verify_notice' && (
        <VerificationNoticeScreen onBackToLogin={() => setScreen('login')} />
      )}
      {!user && !accessToken && screen === 'forgot' && (
        <ForgotPasswordScreen onBack={() => setScreen('login')} />
      )}
      <StatusBar style="light" />
    </View>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PlayerProvider>
          <Screens />
        </PlayerProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1023' },
})
