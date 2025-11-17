export type Tag = {
  id: string;
  name: string;
};

export type Track = {
  id: string;
  title: string;
  duration: number; // in seconds
};

export type Chapter = {
  id: string;
  title: string;
  duration: number; // in seconds
};

export type Work = {
  id: string;
  title: string;
  type: 'music' | 'audiobook' | 'series';
  seriesId?: string;
  recommendedAge: number;
  tags: Tag[];
  coverUrl: string;
  isFavorite?: boolean;
  tracks?: Track[];
  chapters?: Chapter[];
};

export type Series = {
  id: string;
  title: string;
  works: Work[];
};

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  subscriptionDate: string;
  status: 'active' | 'inactive';
};