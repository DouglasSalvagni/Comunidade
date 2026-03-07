import { Pressable, Text, StyleSheet, View } from 'react-native'
import { ReactNode } from 'react'

type Props = {
  title: string
  onPress: () => void
  disabled?: boolean
  variant?: 'solid' | 'outline'
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export default function PrimaryButton({ title, onPress, disabled, variant = 'solid', leftIcon, rightIcon }: Props) {
  return (
    <Pressable
      style={[variant === 'solid' ? styles.button : styles.buttonOutline, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.content}>
        {leftIcon}
        <Text style={variant === 'solid' ? styles.text : styles.textOutline}>{title}</Text>
        {rightIcon}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: { backgroundColor: '#7C3AED', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, alignItems: 'center' },
  buttonOutline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#ffd66b', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  text: { color: '#F8FAFC', fontSize: 16, fontWeight: '600' },
  textOutline: { color: '#ffd66b', fontSize: 16, fontWeight: '600' },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
})
