import { useState } from 'react'
import { TextInput, View, Text, StyleSheet } from 'react-native'

type Props = {
  label: string
  value: string
  onChangeText: (t: string) => void
  placeholder?: string
  secureTextEntry?: boolean
  keyboardType?: 'default' | 'email-address'
}

export default function Input({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType }: Props) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, focused && styles.inputFocused]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8a91b8"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="none"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { width: '100%', marginBottom: 12 },
  label: { fontSize: 14, color: '#cfd3ff', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#3a3f5a', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: '#121632', color: '#e6e9ff' },
  inputFocused: { borderColor: '#ffd66b' },
})