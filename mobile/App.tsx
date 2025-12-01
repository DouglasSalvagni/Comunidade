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
import ProfileSelectionScreen from './src/screens/ProfileSelectionScreen'

function Screens() {
  const { user, accessToken, logout, activeProfileId } = useAuth()
  const [screen, setScreen] = useState<'login' | 'register' | 'verify' | 'verify_notice' | 'forgot' | 'profile_selection' | 'home'>('login')
  const [pendingEmail, setPendingEmail] = useState<string>('')

  return (
    <View style={styles.container}>
      {user && accessToken && activeProfileId && (
        <HomeScreen onLogout={() => { logout(); setScreen('login') }} />
      )}
      {user && accessToken && !activeProfileId && (
        <ProfileSelectionScreen onProfileSelected={() => setScreen('home')} />
      )}
      {!user && !accessToken && screen === 'login' && (
        <LoginScreen
          onRegister={() => setScreen('register')}
          onForgot={() => setScreen('forgot')}
          onLoggedIn={() => setScreen('profile_selection')}
          onVerificationNotice={(email) => { setPendingEmail(email); setScreen('verify_notice') }}
        />
      )}
      {!user && !accessToken && screen === 'register' && (
        <RegisterScreen
          onBackToLogin={() => setScreen('login')}
          onVerifyEmail={(email) => { setPendingEmail(email); setScreen('verify_notice') }}
        />
      )}
      {!user && !accessToken && screen === 'verify' && (
        <VerifyEmailScreen onVerified={() => setScreen('profile_selection')} onBack={() => setScreen('login')} />
      )}
      {!user && !accessToken && screen === 'verify_notice' && (
        <VerificationNoticeScreen
          email={pendingEmail}
          onBackToLogin={() => { setPendingEmail(''); setScreen('login') }}
        />
      )}
      {!user && !accessToken && screen === 'forgot' && (
        <ForgotPasswordScreen onBack={() => setScreen('login')} />
      )}
      <StatusBar style="light" />
    </View>
  )
}

import * as NavigationBar from 'expo-navigation-bar'
import { Platform } from 'react-native'

export default function App() {
  if (Platform.OS === 'android') {
    NavigationBar.setBackgroundColorAsync('#0b1023')
    NavigationBar.setButtonStyleAsync('light')
  }

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
