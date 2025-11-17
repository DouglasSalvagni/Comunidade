import { Work, Tag, Track, Chapter, Series, Profile } from './types';

export const tags: Tag[] = [
  { id: '1', name: 'Aventura' },
  { id: '2', name: 'Educativo' },
  { id: '3', name: 'Fantasia' },
  { id: '4', name: 'Amizade' },
  { id: '5', name: 'Animais' },
];

export const works: Work[] = [
  {
    id: '1',
    title: 'As Aventuras de Kiko, o Canguru',
    type: 'audiobook',
    recommendedAge: 6,
    tags: [tags[0], tags[3]],
    coverUrl: '/placeholder.svg',
    isFavorite: true,
    chapters: [
      { id: 'c1', title: 'O Pulo do Gato', duration: 300 },
      { id: 'c2', title: 'A Descoberta da Lagoa', duration: 450 },
    ],
  },
  {
    id: '2',
    title: 'Canções da Fazenda',
    type: 'music',
    recommendedAge: 2,
    tags: [tags[1], tags[4]],
    coverUrl: '/placeholder.svg',
    isFavorite: false,
    tracks: [
      { id: 't1', title: 'O Galo Amanheceu', duration: 180 },
      { id: 't2', title: 'A Vaca Mimosa', duration: 210 },
    ],
  },
  {
    id: '3',
    title: 'O Mistério da Floresta Encantada',
    type: 'series',
    seriesId: 's1',
    recommendedAge: 8,
    tags: [tags[0], tags[2]],
    coverUrl: '/placeholder.svg',
    isFavorite: true,
  },
];

export const series: Series[] = [
  {
    id: 's1',
    title: 'Mistérios da Natureza',
    works: [works[2]],
  },
];

export const profiles: Profile[] = [
  {
    id: 'p1',
    name: 'Pai',
    email: 'pai@example.com',
    avatarUrl: '/placeholder.svg',
    subscriptionDate: '2023-01-15',
    status: 'active',
  },
  {
    id: 'p2',
    name: 'Filha',
    email: 'filha@example.com',
    avatarUrl: '/placeholder.svg',
    subscriptionDate: '2023-01-15',
    status: 'active',
  },
  {
    id: 'p3',
    name: 'Filho',
    email: 'filho@example.com',
    avatarUrl: '/placeholder.svg',
    subscriptionDate: '2023-01-15',
    status: 'inactive',
  },
];