import { View, Text, StyleSheet, Pressable, ActivityIndicator, Image, ScrollView, TextInput, Alert } from 'react-native'
import { useState, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { apiGetProfiles, apiCreateProfile } from '../services/api'
import { validateBirthDate } from '../utils/birthDate'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Props = {
    onProfileSelected: () => void
}

export default function ProfileSelectionScreen({ onProfileSelected }: Props) {
    const { accessToken, setActiveProfileId } = useAuth()
    const insets = useSafeAreaInsets()
    const [profiles, setProfiles] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [newProfileName, setNewProfileName] = useState('')
    const [newProfileBirthDate, setNewProfileBirthDate] = useState('')

    useEffect(() => {
        loadProfiles()
    }, [])

    const loadProfiles = async () => {
        if (!accessToken) return

        try {
            setLoading(true)
            const data = await apiGetProfiles(accessToken)
            setProfiles(Array.isArray(data) ? data : [])
        } catch (error) {
            setProfiles([])
        } finally {
            setLoading(false)
        }
    }

    const handleSelectProfile = (profileId: string) => {
        setActiveProfileId(profileId)
        onProfileSelected()
    }

    const handleBirthDateChange = (text: string) => {
        // Se o usuário está deletando (texto novo é menor que o anterior)
        // e termina com "/", remove a barra também
        if (text.length < newProfileBirthDate.length && text.endsWith('/')) {
            text = text.slice(0, -1)
        }

        // Remove tudo que não é número
        const numbers = text.replace(/\D/g, '').slice(0, 8)

        // Aplica a máscara DD/MM/AAAA
        let formatted = numbers
        if (numbers.length > 2 && numbers.length <= 4) {
            formatted = numbers.slice(0, 2) + '/' + numbers.slice(2)
        } else if (numbers.length > 4) {
            formatted = numbers.slice(0, 2) + '/' + numbers.slice(2, 4) + '/' + numbers.slice(4, 8)
        }

        setNewProfileBirthDate(formatted)
    }

    const handleCreateProfile = async () => {
        if (!accessToken) return
        if (!newProfileName.trim()) {
            Alert.alert('Nome obrigatório', 'Por favor, digite um nome para o perfil')
            return
        }
        if (!newProfileBirthDate.trim()) {
            Alert.alert('Data obrigatória', 'Por favor, digite a data de nascimento (DD/MM/AAAA)')
            return
        }

        const { iso, error } = validateBirthDate(newProfileBirthDate)

        if (error === 'future') {
            Alert.alert('Data inválida', 'A data de nascimento não pode ser maior que a data atual')
            return
        }

        if (!iso) {
            Alert.alert('Data inválida', 'Use uma data real no formato DD/MM/AAAA (ex: 15/03/2018)')
            return
        }

        try {
            setCreating(true)
            const profile = await apiCreateProfile(accessToken, {
                name: newProfileName.trim(),
                birthDate: iso
            })
            setActiveProfileId(profile.id)
            onProfileSelected()
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Não foi possível criar o perfil')
        } finally {
            setCreating(false)
        }
    }

    const getAvatarInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#A78BFA" />
                    <Text style={styles.loadingText}>Carregando perfis...</Text>
                </View>
            </View>
        )
    }

    // Empty state - no profiles
    if (profiles.length === 0) {
        return (
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Ionicons name="person-add" size={64} color="#A78BFA" />
                        <Text style={styles.title}>Crie seu primeiro perfil</Text>
                        <Text style={styles.subtitle}>
                            Personalize sua experiência criando um perfil
                        </Text>
                    </View>

                    <View style={styles.createForm}>
                        <Text style={styles.label}>Nome do perfil</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: João, Maria, Criança..."
                            placeholderTextColor="#8b92b8"
                            value={newProfileName}
                            onChangeText={setNewProfileName}
                            autoFocus
                            maxLength={50}
                        />

                        <Text style={styles.label}>Data de nascimento</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="DD/MM/AAAA"
                            placeholderTextColor="#8b92b8"
                            value={newProfileBirthDate}
                            onChangeText={handleBirthDateChange}
                            keyboardType="numeric"
                            maxLength={10}
                        />

                        <Pressable
                            style={({ pressed }) => [
                                styles.createButton,
                                pressed && styles.createButtonPressed,
                                creating && styles.createButtonDisabled
                            ]}
                            onPress={handleCreateProfile}
                            disabled={creating}
                        >
                            {creating ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
                                    <Text style={styles.createButtonText}>Criar Perfil</Text>
                                </>
                            )}
                        </Pressable>
                    </View>

                    <View style={styles.footerInline}>
                        <Text style={styles.footerText}>
                            Você poderá criar mais perfis depois nas configurações
                        </Text>
                    </View>
                </ScrollView>
            </View>
        )
    }

    // Profile selection
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Quem está ouvindo?</Text>
                <Text style={styles.subtitle}>Escolha um perfil para continuar</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.profilesContainer}
                showsVerticalScrollIndicator={false}
            >
                {profiles.map((profile) => (
                    <Pressable
                        key={profile.id}
                        style={({ pressed }) => [
                            styles.profileCard,
                            pressed && styles.profileCardPressed
                        ]}
                        onPress={() => handleSelectProfile(profile.id)}
                    >
                        {profile.avatarUrl ? (
                            <Image
                                source={{ uri: profile.avatarUrl }}
                                style={styles.avatar}
                            />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarInitials}>
                                    {getAvatarInitials(profile.name)}
                                </Text>
                            </View>
                        )}
                        <Text style={styles.profileName}>{profile.name}</Text>
                        <Ionicons name="chevron-forward" size={24} color="#8b92b8" />
                    </Pressable>
                ))}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }] }>
                <Text style={styles.footerText}>
                    Você pode trocar de perfil a qualquer momento nas configurações
                </Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0b1023',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#8b92b8',
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 32,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#e6e9ff',
        marginBottom: 8,
        marginTop: 16,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#8b92b8',
        textAlign: 'center',
    },
    createForm: {
        paddingHorizontal: 24,
        marginTop: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#e6e9ff',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#121632',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#e6e9ff',
        borderWidth: 2,
        borderColor: '#1d2340',
        marginBottom: 20,
    },
    createButton: {
        backgroundColor: '#A78BFA',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 8,
    },
    createButtonPressed: {
        backgroundColor: '#9333EA',
        transform: [{ scale: 0.98 }],
    },
    createButtonDisabled: {
        backgroundColor: '#6b7280',
    },
    createButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
    },
    footerInline: {
        paddingHorizontal: 24,
        paddingTop: 32,
    },
    profilesContainer: {
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#121632',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#1d2340',
    },
    profileCardPressed: {
        backgroundColor: '#1a1f3f',
        borderColor: '#A78BFA',
        transform: [{ scale: 0.98 }],
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        marginRight: 16,
    },
    avatarPlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#A78BFA',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarInitials: {
        fontSize: 24,
        fontWeight: '700',
        color: '#ffffff',
    },
    profileName: {
        flex: 1,
        fontSize: 20,
        fontWeight: '600',
        color: '#e6e9ff',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        backgroundColor: '#0b1023',
        borderTopWidth: 1,
        borderTopColor: '#1d2340',
    },
    footerText: {
        fontSize: 14,
        color: '#8b92b8',
        textAlign: 'center',
        lineHeight: 20,
    },
})
