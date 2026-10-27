-- ==============================================================================
-- MEMORIAL DIGITAL INTERACTIVO - SCHEMA SUPABASE
-- Diseñado para escalabilidad multi-tenant, consultas sub-10ms y alta seguridad (RLS)
-- ==============================================================================

-- 1. Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE FAMILIAS (Multi-tenant)
CREATE TABLE IF NOT EXISTS public.families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. TABLA DE MEMORIALES
CREATE TABLE IF NOT EXISTS public.memorials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    slug VARCHAR(120) UNIQUE NOT NULL, -- Para URL permanente del QR: tudominio.com/m/nombre-abuelito
    full_name VARCHAR(255) NOT NULL,
    birth_date DATE,
    death_date DATE,
    birth_place VARCHAR(150),
    epitaph TEXT,
    biography TEXT,
    cover_image_url TEXT,
    avatar_image_url TEXT,
    is_public BOOLEAN DEFAULT true NOT NULL,
    theme_color VARCHAR(50) DEFAULT 'gold',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índice único en slug para búsqueda inmediata (< 5ms) al escanear QR
CREATE INDEX IF NOT EXISTS idx_memorials_slug ON public.memorials(slug);
CREATE INDEX IF NOT EXISTS idx_memorials_family_id ON public.memorials(family_id);

-- 4. TABLA DE RECUERDOS (Fotografías, audios, anécdotas, historias)
CREATE TABLE IF NOT EXISTS public.memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    memorial_id UUID NOT NULL REFERENCES public.memorials(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    story TEXT NOT NULL,
    media_url TEXT NOT NULL,
    media_type VARCHAR(20) DEFAULT 'image' NOT NULL, -- 'image', 'audio', 'video'
    blur_placeholder TEXT, -- Data URL o miniatura LQIP para carga instantánea 0ms
    life_stage VARCHAR(50) DEFAULT 'general', -- 'infancia', 'juventud', 'familia', 'legado', 'general'
    approximate_year INTEGER,
    location VARCHAR(150),
    author_name VARCHAR(150),
    is_highlighted BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    times_shown INTEGER DEFAULT 0 NOT NULL,
    last_shown_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices compuestos para algoritmo de Descubrimiento Inteligente
CREATE INDEX IF NOT EXISTS idx_memories_memorial_public ON public.memories(memorial_id, is_public);
CREATE INDEX IF NOT EXISTS idx_memories_discovery ON public.memories(memorial_id, is_public, times_shown, last_shown_at);
CREATE INDEX IF NOT EXISTS idx_memories_life_stage ON public.memories(memorial_id, life_stage);

-- 5. TABLA DE CONTRIBUCIONES (Aportaciones de visitantes para moderación de la familia)
CREATE TABLE IF NOT EXISTS public.contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    memorial_id UUID NOT NULL REFERENCES public.memorials(id) ON DELETE CASCADE,
    author_name VARCHAR(150) NOT NULL,
    author_relationship VARCHAR(100), -- 'Hijo/a', 'Nieto/a', 'Amigo de juventud', etc.
    author_email VARCHAR(255),
    message TEXT NOT NULL,
    photo_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL, -- 'pending', 'approved', 'rejected'
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contributions_memorial_status ON public.contributions(memorial_id, status);

-- 6. SEGURIDAD: POLÍTICAS DE ACCESO (ROW LEVEL SECURITY)
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- Memoriales: Lectura pública si is_public es true (para visitantes del QR)
CREATE POLICY "Memoriales públicos son visibles para todos"
ON public.memorials FOR SELECT
USING (is_public = true);

-- Recuerdos: Lectura pública de recuerdos aprobados y públicos
CREATE POLICY "Recuerdos públicos son visibles para todos"
ON public.memories FOR SELECT
USING (is_public = true);

-- Contribuciones: Cualquiera puede enviar un mensaje/recuerdo (entra como pending)
CREATE POLICY "Cualquiera puede enviar una contribución"
ON public.contributions FOR INSERT
WITH CHECK (status = 'pending');

-- Contribuciones: Solo se leen públicamente las aprobadas por la familia
CREATE POLICY "Solo contribuciones aprobadas son públicas"
ON public.contributions FOR SELECT
USING (status = 'approved');

-- 7. CONFIGURACIÓN DEL STORAGE BUCKET (Supabase Storage)
-- Insertar bucket público para optimización y CDN de fotos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('memorial-media', 'memorial-media', true)
ON CONFLICT (id) DO NOTHING;

-- Política de lectura pública para el bucket
CREATE POLICY "Acceso público al CDN de fotos del memorial"
ON storage.objects FOR SELECT
USING (bucket_id = 'memorial-media');
