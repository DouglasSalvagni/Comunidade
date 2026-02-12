import { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Image, Pressable, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Input from '../components/Input'
import PrimaryButton from '../components/PrimaryButton'
import { useAuth } from '../context/AuthContext'
import { apiGetWorks, apiGetWork } from '../services/api'
import { usePlayer } from '../context/PlayerContext'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Work = {
  id: string
  title: string
  type: 'music' | 'audiobook' | 'series'
  coverUrl?: string
  coverThumbUrl?: string
  recommendedMinMonths?: number
  recommendedMaxMonths?: number
  recommendedAgeLabel?: string
  tags?: { id: string; name: string }[]
  devThemes?: { id: string; name: string }[]
  tracks?: { id: string; title?: string; workId: string }[]
  isFavorite?: boolean
  isPremium?: boolean
}

export default function CatalogScreen() {
  const { accessToken, activeProfileId } = useAuth()
  const player = usePlayer()
  const insets = useSafeAreaInsets()
  const [works, setWorks] = useState<Work[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'music' | 'audiobook'>('all')
  const [ageUnit, setAgeUnit] = useState<'years' | 'months'>('years')
  const [minAge, setMinAge] = useState('')
  const [maxAge, setMaxAge] = useState('')
  const [tagFilters, setTagFilters] = useState<string[]>([])
  const [devThemeFilters, setDevThemeFilters] = useState<string[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [limit] = useState(5)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)

  const computedTags = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>()
    works.forEach((w) => (w.tags || []).forEach((t) => { if (!map.has(t.id)) map.set(t.id, t) }))
    return Array.from(map.values())
  }, [works])

  const computedThemes = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>()
    works.forEach((w) => (w.devThemes || []).forEach((t) => { if (!map.has(t.id)) map.set(t.id, t) }))
    return Array.from(map.values())
  }, [works])

  useEffect(() => {
    let mounted = true
    async function loadInitial() {
      if (!accessToken) return
      setLoading(true)
      try {
        const selectedTagNames = tagFilters
          .map((id) => computedTags.find((t) => t.id === id)?.name)
          .filter((n): n is string => !!n)
        const selectedThemeNames = devThemeFilters
          .map((id) => computedThemes.find((t) => t.id === id)?.name)
          .filter((n): n is string => !!n)
        const params: any = { page: 1, limit }
        if (activeProfileId) params.profileId = activeProfileId
        if (searchTerm.trim().length > 0) params.search = searchTerm.trim()
        if (typeFilter !== 'all') params.type = typeFilter
        const minNum = parseFloat(minAge)
        const maxNum = parseFloat(maxAge)
        const hasMin = !Number.isNaN(minNum)
        const hasMax = !Number.isNaN(maxNum)
        const toMonths = (v: number) => (ageUnit === 'years' ? Math.round(v * 12) : Math.round(v))
        if (hasMin && hasMax) {
          params.minMonths = toMonths(minNum)
          params.maxMonths = toMonths(maxNum)
        }
        if (selectedTagNames.length > 0) params.tags = selectedTagNames.join(',')
        if (selectedThemeNames.length > 0) params.devThemes = selectedThemeNames.join(',')
        const r = await apiGetWorks(accessToken, params)
        const list = Array.isArray(r?.data) ? r.data : []
        if (!mounted) return
        setWorks(() => {
          const map = new Map<string, Work>()
            ; (list as any).forEach((w: Work) => { map.set(w.id, w) })
          return Array.from(map.values()) as any
        })
        setPage(1)
        const meta = (r as any)?.meta
        if (meta && typeof meta.totalPages === 'number') setTotalPages(meta.totalPages)
        else setTotalPages(list.length >= limit ? 2 : 1)
      } catch (e) { }
      setLoading(false)
    }
    // reset and load first page on filter changes
    setPage(1)
    setTotalPages(1)
    setWorks([])
    loadInitial()
    return () => { mounted = false }
  }, [accessToken, activeProfileId, searchTerm, typeFilter, minAge, maxAge, ageUnit, tagFilters, devThemeFilters])

  async function loadMoreIfNeeded() {
    if (loading || loadingMore) return
    if (page >= totalPages) return
    if (!accessToken) return
    setLoadingMore(true)
    try {
      const selectedTagNames = tagFilters
        .map((id) => computedTags.find((t) => t.id === id)?.name)
        .filter((n): n is string => !!n)
      const selectedThemeNames = devThemeFilters
        .map((id) => computedThemes.find((t) => t.id === id)?.name)
        .filter((n): n is string => !!n)
      const nextPage = page + 1
      const params: any = { page: nextPage, limit }
      if (activeProfileId) params.profileId = activeProfileId
      if (searchTerm.trim().length > 0) params.search = searchTerm.trim()
      if (typeFilter !== 'all') params.type = typeFilter
      const minNum = parseFloat(minAge)
      const maxNum = parseFloat(maxAge)
      const hasMin = !Number.isNaN(minNum)
      const hasMax = !Number.isNaN(maxNum)
      const toMonths = (v: number) => (ageUnit === 'years' ? Math.round(v * 12) : Math.round(v))
      if (hasMin && hasMax) {
        params.minMonths = toMonths(minNum)
        params.maxMonths = toMonths(maxNum)
      }
      if (selectedTagNames.length > 0) params.tags = selectedTagNames.join(',')
      if (selectedThemeNames.length > 0) params.devThemes = selectedThemeNames.join(',')
      const r = await apiGetWorks(accessToken, params)
      const list = Array.isArray(r?.data) ? r.data : []
      setWorks((prev) => {
        const map = new Map<string, Work>()
        prev.forEach((w) => map.set(w.id, w))
          ; (list as any).forEach((w: Work) => { map.set(w.id, w) })
        return Array.from(map.values()) as any
      })
      setPage(nextPage)
      const meta = (r as any)?.meta
      if (meta && typeof meta.totalPages === 'number') setTotalPages(meta.totalPages)
      else if (list.length < limit) setTotalPages(nextPage) // reached end
    } catch (e) { }
    setLoadingMore(false)
  }

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
    const threshold = 160
    const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold
    if (isNearBottom) {
      loadMoreIfNeeded()
    }
  }

  function toggleTag(tagId: string) {
    setTagFilters((prev) => prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId])
  }

  function toggleTheme(themeId: string) {
    setDevThemeFilters((prev) => prev.includes(themeId) ? prev.filter((id) => id !== themeId) : [...prev, themeId])
  }

  function AgeLabel(w: Work) {
    const label = w.recommendedAgeLabel || ((typeof w.recommendedMinMonths === 'number' && typeof w.recommendedMaxMonths === 'number') ? `${w.recommendedMinMonths}-${w.recommendedMaxMonths}m` : '-')
    return <Text style={styles.age}>Idade: {label}</Text>
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <ScrollView contentContainerStyle={styles.content} onScroll={onScroll} scrollEventThrottle={16}>
        <Text style={styles.title}>Catálogo</Text>
        <Text style={styles.subtitle}>Explore músicas e audiobooks.</Text>

        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <Input label={'Buscar por título'} labelHidden value={searchTerm} onChangeText={setSearchTerm} placeholder={'ex.: Aventura'} />
          </View>
          <Pressable style={styles.iconButton} onPress={() => setFiltersOpen((v) => !v)}>
            <Ionicons name={filtersOpen ? 'filter' : 'filter-outline'} size={20} color={filtersOpen ? '#A78BFA' : '#cfd3ff'} />
          </Pressable>
        </View>

        {filtersOpen && (
          <View style={styles.filters}>
            <Text style={styles.filterLabel}>Tipo</Text>
            <View style={styles.segmentedRow}>
              {(['all', 'music', 'audiobook'] as const).map((t) => (
                <Pressable key={t} style={[styles.segmentedItem, typeFilter === t && styles.segmentedItemActive]} onPress={() => setTypeFilter(t)}>
                  <Text style={[styles.segmentedText, typeFilter === t && styles.segmentedTextActive]}>{t === 'all' ? 'Todos' : t === 'music' ? 'Música' : 'Audiobook'}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.filterLabel}>Intervalo de idade</Text>
            <View style={styles.segmentedRow}>
              {(['years', 'months'] as const).map((u) => (
                <Pressable key={u} style={[styles.segmentedItem, ageUnit === u && styles.segmentedItemActive]} onPress={() => setAgeUnit(u)}>
                  <Text style={[styles.segmentedText, ageUnit === u && styles.segmentedTextActive]}>{u === 'years' ? 'anos' : 'meses'}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.ageRow}>
              <View style={{ flex: 1 }}>
                <Input label={'mín'} value={minAge} onChangeText={setMinAge} placeholder={'mín'} />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Input label={'máx'} value={maxAge} onChangeText={setMaxAge} placeholder={'máx'} />
              </View>
            </View>

            <Text style={styles.filterLabel}>Tags</Text>
            <View style={styles.tagsWrap}>
              {computedTags.map((tag) => {
                const active = tagFilters.includes(tag.id)
                return (
                  <Pressable key={tag.id} style={[styles.tagItem, active && styles.tagItemActive]} onPress={() => toggleTag(tag.id)}>
                    <Text style={[styles.tagText, active && styles.tagTextActive]}>{tag.name}</Text>
                  </Pressable>
                )
              })}
            </View>

            <Text style={styles.filterLabel}>Temas de Desenvolvimento</Text>
            <View style={[styles.tagsWrap, styles.tagsSpacing]}>
              {computedThemes.map((theme) => {
                const active = devThemeFilters.includes(theme.id)
                return (
                  <Pressable key={theme.id} style={[styles.tagItem, active && styles.tagItemActive]} onPress={() => toggleTheme(theme.id)}>
                    <Text style={[styles.tagText, active && styles.tagTextActive]}>{theme.name}</Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        )}

        <View style={styles.list}>
          {loading ? (
            Array.from({ length: 8 }).map((_, idx) => (
              <View key={`skeleton-${idx}`} style={styles.card}>
                <View style={styles.skelCover} />
                <View style={styles.cardBody}>
                  <View style={[styles.skelLine, { width: 60 }]} />
                  <View style={[styles.skelLine, { width: '80%', height: 16 }]} />
                  <View style={[styles.skelLine, { width: 100 }]} />
                  <View style={styles.tagsRow}>
                    <View style={styles.skelTag} />
                    <View style={styles.skelTag} />
                    <View style={styles.skelTag} />
                  </View>
                </View>
              </View>
            ))
          ) : (
            <>
              {works.map((w) => (
                <Pressable key={w.id} style={styles.card} onPress={async () => {
                  if (!accessToken) return
                  const hasTracks = Array.isArray(w.tracks) && w.tracks.length > 0
                  if (hasTracks) {
                    await player.playWork({ ...w } as any)
                  } else {
                    try {
                      const full = await apiGetWork(accessToken, w.id)
                      await player.playWork({ ...(full || w) } as any)
                    } catch { }
                  }
                }}>
                  <View style={{ width: 90, alignSelf: 'stretch' }}>
                    {(w.coverThumbUrl || w.coverUrl) ? (
                      <Image source={{ uri: w.coverThumbUrl || w.coverUrl! }} style={[styles.cover, { flex: 1 }]} />
                    ) : (
                      <View style={[styles.cover, styles.coverPlaceholder, { flex: 1 }]} />
                    )}
                    {w.isPremium && (
                      <View style={styles.premiumBadge}>
                        <Text style={styles.premiumBadgeText}>★ Premium</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.workType}>
                      {w.type === 'music' ? 'Música' :
                        w.type === 'audiobook' ? 'Audiobook' :
                          w.type === 'series' ? 'Série' : w.type}
                    </Text>
                    <Text style={styles.workTitle}>{w.title}</Text>
                    <AgeLabel {...w} />
                    <View style={styles.tagsRow}>
                      {(w.tags || []).slice(0, 3).map((t) => (
                        <Text key={t.id} style={styles.workTag}>{t.name}</Text>
                      ))}
                    </View>
                  </View>
                </Pressable>
              ))}
              {loadingMore && (
                Array.from({ length: 3 }).map((_, idx) => (
                  <View key={`more-skeleton-${idx}`} style={styles.card}>
                    <View style={styles.skelCover} />
                    <View style={styles.cardBody}>
                      <View style={[styles.skelLine, { width: 60 }]} />
                      <View style={[styles.skelLine, { width: '80%', height: 16 }]} />
                      <View style={[styles.skelLine, { width: 100 }]} />
                      <View style={styles.tagsRow}>
                        <View style={styles.skelTag} />
                        <View style={styles.skelTag} />
                      </View>
                    </View>
                  </View>
                ))
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1023' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4, color: '#e6e9ff' },
  subtitle: { fontSize: 14, color: '#cfd3ff', marginBottom: 16 },
  filters: { marginBottom: 16 },
  filterLabel: { fontSize: 14, color: '#e6e9ff', marginBottom: 8, marginTop: 16 },
  segmentedRow: { flexDirection: 'row', gap: 8 },
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 8 },
  iconButton: { width: 44, height: 50, borderWidth: 1, borderColor: '#2b3448', borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' },
  segmentedItem: { flex: 1, borderWidth: 1, borderColor: '#2b3448', borderRadius: 10, paddingVertical: 10, backgroundColor: '#111827', alignItems: 'center' },
  segmentedItemActive: { borderColor: '#7C3AED', backgroundColor: '#121632' },
  segmentedText: { color: '#cfd3ff', fontSize: 14 },
  segmentedTextActive: { color: '#A78BFA', fontWeight: '600' },
  ageRow: { flexDirection: 'row', gap: 8 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagsSpacing: { marginTop: 8 },
  tagItem: { borderWidth: 1, borderColor: '#2b3448', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#111827' },
  tagItemActive: { borderColor: '#ffd66b', backgroundColor: '#0e1430' },
  tagText: { color: '#cfd3ff', fontSize: 12 },
  tagTextActive: { color: '#ffd66b', fontWeight: '600' },
  list: { gap: 12 },
  loading: { color: '#cfd3ff' },
  card: { flexDirection: 'row', borderWidth: 1, borderColor: '#1d2340', borderRadius: 12, overflow: 'hidden', backgroundColor: '#0e1430' },
  cover: { width: 90, alignSelf: 'stretch', backgroundColor: '#1d223b' },
  coverPlaceholder: { backgroundColor: '#171a2f', alignSelf: 'stretch' },
  skelCover: { width: 90, height: 90, backgroundColor: '#171a2f' },
  cardBody: { flex: 1, padding: 10 },
  workType: { color: '#cfd3ff', fontSize: 12, marginBottom: 2 },
  workTitle: { color: '#e6e9ff', fontSize: 16, fontWeight: '600' },
  age: { color: '#cfd3ff', fontSize: 12, marginTop: 4 },
  tagsRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  workTag: { color: '#cfd3ff', fontSize: 12, opacity: 0.8 },
  skelLine: { height: 12, backgroundColor: '#171a2f', borderRadius: 6, marginTop: 6 },
  skelTag: { width: 50, height: 12, backgroundColor: '#171a2f', borderRadius: 6 },
  premiumBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(180, 130, 20, 0.88)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  premiumBadgeText: { color: '#fff8e1', fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
})
