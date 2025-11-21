import { Pressable, Text, StyleSheet } from 'react-native'

type Props = {
  title: string
  onPress: () => void
  disabled?: boolean
  variant?: 'solid' | 'outline'
}

export default function PrimaryButton({ title, onPress, disabled, variant = 'solid' }: Props) {
  return (
    <Pressable
      style={[variant === 'solid' ? styles.button : styles.buttonOutline, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={variant === 'solid' ? styles.text : styles.textOutline}>{title}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: { backgroundColor: '#ffd66b', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  buttonOutline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#ffd66b', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  text: { color: '#0b1023', fontSize: 16, fontWeight: '600' },
  textOutline: { color: '#ffd66b', fontSize: 16, fontWeight: '600' },
})