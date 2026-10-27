export type LifeStage = 'infancia' | 'juventud' | 'familia' | 'legado' | 'general';

export interface Family {
  id: string;
  name: string;
  created_at: string;
}

export interface Memorial {
  id: string;
  family_id: string;
  slug: string;
  full_name: string;
  birth_date: string;
  death_date: string;
  birth_place?: string;
  epitaph: string;
  biography?: string;
  cover_image_url: string;
  avatar_image_url: string;
  avatar_image_position?: string;
  is_public: boolean;
  theme_color: string;
  created_at: string;
  updated_at: string;
}

export interface Memory {
  id: string;
  memorial_id: string;
  title: string;
  story: string;
  people?: string;
  media_url: string;
  media_type: 'image' | 'audio' | 'video';
  blur_placeholder?: string;
  life_stage: LifeStage;
  approximate_year?: number;
  location?: string;
  author_name?: string;
  is_highlighted?: boolean;
  is_public?: boolean;
  times_shown?: number;
  last_shown_at?: string;
  created_at: string;
}

export interface Contribution {
  id: string;
  memorial_id: string;
  author_name: string;
  author_relationship?: string;
  author_email?: string;
  message: string;
  photo_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}
