import React from 'react'
import { View, Text, StyleSheet, Modal, Pressable, Linking, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import PrimaryButton from './PrimaryButton'

type Props = {
    visible: boolean
    url: string
    onClose: () => void
}

const BENEFITS = [
    { icon: 'musical-notes' as const, text: 'Acesso completo a obras premium' },
    { icon: 'people' as const, text: 'Perfis ilimitados para suas crianças' },
    { icon: 'star' as const, text: 'Favoritos e playlist' },
    { icon: 'settings' as const, text: 'Opções avançadas' },
]

export default function UpgradeModal({ visible, url, onClose }: Props) {
    const isIOS = Platform.OS === 'ios'

    const handleConfirm = () => {
        Linking.openURL(url)
        onClose()
    }

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.backdrop} onTouchEnd={onClose} />
                <View style={styles.modalView}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="diamond" size={32} color="#d4a017" />
                    </View>
                    <Text style={styles.title}>{isIOS ? 'Conteúdo Premium' : 'Faça upgrade!'}</Text>
                    <Text style={styles.message}>
                        {isIOS
                            ? 'Este conteúdo é exclusivo para assinantes. Se você já possui uma assinatura ativa, o acesso será liberado automaticamente.'
                            : 'Aproveite tudo o que o app oferece com um plano completo:'}
                    </Text>

                    <View style={styles.benefitsList}>
                        {BENEFITS.map((b, i) => (
                            <View key={i} style={styles.benefitRow}>
                                <Ionicons name={b.icon} size={18} color="#A78BFA" />
                                <Text style={styles.benefitText}>{b.text}</Text>
                            </View>
                        ))}
                    </View>

                    {!isIOS && (
                        <Text style={styles.redirectNote}>
                            Você será redirecionado para o site para concluir a assinatura.
                        </Text>
                    )}

                    <View style={styles.buttonContainer}>
                        {isIOS ? (
                            <View style={styles.confirmButtonWrapper}>
                                <PrimaryButton title="Entendi" onPress={onClose} />
                            </View>
                        ) : (
                            <>
                                <Pressable style={styles.cancelButton} onPress={onClose}>
                                    <Text style={styles.cancelButtonText}>Agora não</Text>
                                </Pressable>
                                <View style={styles.confirmButtonWrapper}>
                                    <PrimaryButton title="Ver planos" onPress={handleConfirm} />
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalView: {
        margin: 20,
        backgroundColor: '#0e1430',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '88%',
        borderWidth: 1,
        borderColor: '#1d2340',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(212, 160, 23, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#e6e9ff',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        color: '#8b92b8',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 20,
    },
    benefitsList: {
        width: '100%',
        marginBottom: 16,
        gap: 10,
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 4,
    },
    benefitText: {
        fontSize: 14,
        color: '#e6e9ff',
        flex: 1,
    },
    redirectNote: {
        fontSize: 11,
        color: '#4f5b7a',
        textAlign: 'center',
        marginBottom: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        color: '#8b92b8',
        fontSize: 16,
        fontWeight: '600',
    },
    confirmButtonWrapper: {
        flex: 1,
    },
})
