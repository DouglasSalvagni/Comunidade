import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from './AuthContext'
import { apiGetCurrentSubscription } from '../services/api'

const STORAGE_KEY = 'subscriptionPlanSlug'
const FREE_SLUG = 'plano-gratuito'

type SubscriptionContextValue = {
    planSlug: string | null
    isFree: boolean
    isPremium: boolean
    isLoaded: boolean
    syncSubscription: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: any }) {
    const { accessToken } = useAuth()
    const [planSlug, setPlanSlug] = useState<string | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)
    const tokenRef = useRef(accessToken)
    tokenRef.current = accessToken

    const isFree = !planSlug || planSlug === FREE_SLUG
    const isPremium = !isFree

    // Carregar do cache local ao iniciar
    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY)
            .then((slug) => {
                if (slug) setPlanSlug(slug)
            })
            .catch(() => { })
            .finally(() => setIsLoaded(true))
    }, [])

    const syncSubscription = useCallback(async () => {
        const token = tokenRef.current
        if (!token) return
        try {
            const res = await apiGetCurrentSubscription(token)
            const slug = res?.subscription?.plan?.slug || FREE_SLUG
            setPlanSlug(slug)
            await AsyncStorage.setItem(STORAGE_KEY, slug)
        } catch (e) {
            console.warn('[Subscription] sync failed', e)
        }
    }, [])

    // Sincronizar quando token muda (login/logout)
    useEffect(() => {
        if (accessToken) {
            syncSubscription()
        } else {
            setPlanSlug(null)
            AsyncStorage.removeItem(STORAGE_KEY).catch(() => { })
        }
    }, [accessToken, syncSubscription])

    // Sincronizar quando app volta do background
    useEffect(() => {
        const handleAppState = (state: AppStateStatus) => {
            if (state === 'active' && tokenRef.current) {
                syncSubscription()
            }
        }
        const sub = AppState.addEventListener('change', handleAppState)
        return () => sub.remove()
    }, [syncSubscription])

    return (
        <SubscriptionContext.Provider value={{ planSlug, isFree, isPremium, isLoaded, syncSubscription }}>
            {children}
        </SubscriptionContext.Provider>
    )
}

export function useSubscription() {
    const ctx = useContext(SubscriptionContext)
    if (!ctx) throw new Error('SubscriptionContext not found')
    return ctx
}
