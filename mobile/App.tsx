import { StatusBar } from 'expo-status-bar'
import { StyleSheet, View } from 'react-native'
import { useState } from 'react'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import LoginScreen from './src/screens/LoginScreen'
import RegisterScreen from './src/screens/RegisterScreen'
import VerifyEmailScreen from './src/screens/VerifyEmailScreen'
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen'
import HomeScreen from './src/screens/HomeScreen'
import VerificationNoticeScreen from './src/screens/VerificationNoticeScreen'

function Screens() {
  const { user, accessToken, logout } = useAuth()
  const [screen, setScreen] = useState<'login' | 'register' | 'verify' | 'verify_notice' | 'forgot' | 'home'>('login')

  if (user && accessToken) {
    return <HomeScreen onLogout={() => { logout(); setScreen('login') }} />
  }

  return (
    <View style={styles.container}>
      {screen === 'login' && (
        <LoginScreen
          onRegister={() => setScreen('register')}
          onForgot={() => setScreen('forgot')}
          onLoggedIn={() => setScreen('home')}
          onGoogle={() => setScreen('login')}
          onVerificationNotice={() => setScreen('verify_notice')}
        />
      )}
      {screen === 'register' && (
        <RegisterScreen onBackToLogin={() => setScreen('login')} onVerifyEmail={() => setScreen('verify_notice')} />
      )}
      {screen === 'verify' && (
        <VerifyEmailScreen onVerified={() => setScreen('home')} onBack={() => setScreen('login')} />
      )}
      {screen === 'verify_notice' && (
        <VerificationNoticeScreen onBackToLogin={() => setScreen('login')} />
      )}
      {screen === 'forgot' && (
        <ForgotPasswordScreen onBack={() => setScreen('login')} />
      )}
      <StatusBar style="light" />
    </View>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Screens />
    </AuthProvider>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1023' },
})
