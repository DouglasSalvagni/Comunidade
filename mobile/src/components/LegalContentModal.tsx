import { useEffect, useState } from 'react'
import { Modal, View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { WebView } from 'react-native-webview'

type Props = {
  visible: boolean
  title: string
  html?: string | null
  onClose: () => void
}

export default function LegalContentModal({ visible, title, html, onClose }: Props) {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(!html)
  }, [html])

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.centeredView}>
        <View style={styles.backdrop} onTouchEnd={onClose} />
        <View style={styles.modalView}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.contentWrapper}>
            {loading ? (
              <View style={styles.loading}><ActivityIndicator size="large" color="#A78BFA" /></View>
            ) : html ? (
              <WebView
                originWhitelist={["*"]}
                source={{ html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" /><style>body{font-family:Arial,sans-serif;color:#e6e9ff;background:#0e1430;padding:12px} a{color:#93c5fd} h1,h2,h3{color:#fff} p{line-height:1.6}</style></head><body>${html}</body></html>` }}
                style={{ flex: 1, backgroundColor: '#0e1430' }}
              />
            ) : (
              <Text style={styles.empty}>Conteúdo não disponível.</Text>
            )}
          </View>
          <View style={{ height: 12 }} />
          <Pressable onPress={onClose} style={styles.closeButton}><Text style={styles.closeText}>Fechar</Text></Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' },
  modalView: { width: '90%', maxHeight: '80%', backgroundColor: '#0e1430', borderRadius: 12, borderWidth: 1, borderColor: '#1d2340', padding: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#e6e9ff', marginBottom: 8, textAlign: 'center' },
  contentWrapper: { flex: 1, borderWidth: 1, borderColor: '#1d2340', borderRadius: 8, overflow: 'hidden' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: '#8b92b8', textAlign: 'center', padding: 16 },
  closeButton: { paddingVertical: 10, alignItems: 'center' },
  closeText: { color: '#e6e9ff', fontWeight: '600' },
})

