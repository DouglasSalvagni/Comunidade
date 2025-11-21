import { Pressable, Text, StyleSheet } from 'react-native'

type Props = {
  title: string
  onPress: () => void
  disabled?: boolean
}

export default function PrimaryButton({ title, onPress, disabled }: Props) {
  return (
    <Pressable style={[styles.button, disabled && styles.buttonDisabled]} onPress={onPress} disabled={disabled}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: { backgroundColor: '#ffd66b', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  text: { color: '#0b1023', fontSize: 16, fontWeight: '600' },
})