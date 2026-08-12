import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_CAMPAIGN_CONFIG, INITIAL_DEMO_DONATIONS } from '../data/defaultData';
import { CampaignConfig, Donation, NewDonationEvent } from '../types';

function cleanSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let cleaned = rawUrl.trim();
  // Strip trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');
  // Strip subpaths if user appended /auth/v1, /rest/v1, etc.
  cleaned = cleaned.replace(/\/(auth|rest)\/v\d+.*$/i, '');
  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned;
}

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseUrl = cleanSupabaseUrl(rawSupabaseUrl);
export const supabaseAnonKey = rawSupabaseAnonKey.trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-supabase-project') &&
  (supabaseUrl.startsWith('https://') || supabaseUrl.startsWith('http://'))
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Local BroadcastChannel & EventTarget for local Realtime fallback
const BROADCAST_CHANNEL_NAME = 'paineis_luz_realtime';
const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel(BROADCAST_CHANNEL_NAME)
  : null;

const localEventEmitter = new EventTarget();

export const DEFAULT_ADMIN_EMAIL = 'www.ceolin@gmail.com';

// LocalStorage Keys
const STORAGE_DONATIONS_KEY = 'paineis_luz_doacoes_v2';
const STORAGE_CONFIG_KEY = 'paineis_luz_config_v2';

// Helper to clear local test/demo donations
export function clearLocalDemoDonations(): void {
  localStorage.setItem(STORAGE_DONATIONS_KEY, JSON.stringify([]));
  notifyLocalUpdate('donation', { cleared: true });
}

// Helper to notify local listeners
function notifyLocalUpdate(eventType: 'donation' | 'config', data?: unknown) {
  const detail = { type: eventType, data, timestamp: Date.now() };
  localEventEmitter.dispatchEvent(new CustomEvent('update', { detail }));
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(detail);
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }
  }
}

// Listen to broadcast messages from other tabs
if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    if (event.data) {
      localEventEmitter.dispatchEvent(new CustomEvent('update', { detail: event.data }));
    }
  };
}

// ================= DONATIONS API =================

export async function fetchDonations(): Promise<Donation[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('doacoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as Donation[];
      }
      console.warn('Supabase fetch donations error, using local fallback:', error);
    } catch (err) {
      console.warn('Supabase fetch exception:', err);
    }
  }

  // Fallback to LocalStorage
  const stored = localStorage.getItem(STORAGE_DONATIONS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing stored donations', e);
    }
  }
  // Initialize with initial demo donations
  localStorage.setItem(STORAGE_DONATIONS_KEY, JSON.stringify(INITIAL_DEMO_DONATIONS));
  return INITIAL_DEMO_DONATIONS;
}

export async function insertDonation(donation: Omit<Donation, 'id' | 'created_at'>): Promise<Donation> {
  const newDonation: Donation = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `don-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    valor: Number(donation.valor),
    doador: donation.doador.trim(),
    descricao: donation.descricao?.trim() || '',
    status: donation.status || 'pago',
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('doacoes')
        .insert([
          {
            valor: newDonation.valor,
            doador: newDonation.doador,
            descricao: newDonation.descricao,
            status: newDonation.status,
            created_at: newDonation.created_at,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        notifyLocalUpdate('donation', data);
        return data as Donation;
      }
      console.error('Supabase insert error:', error);
    } catch (err) {
      console.error('Supabase insert exception:', err);
    }
  }

  // LocalStorage Fallback
  const existing = await fetchDonations();
  const updated = [newDonation, ...existing];
  localStorage.setItem(STORAGE_DONATIONS_KEY, JSON.stringify(updated));
  notifyLocalUpdate('donation', newDonation);
  return newDonation;
}

export async function updateDonation(id: string, updates: Partial<Omit<Donation, 'id'>>): Promise<Donation | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('doacoes')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        notifyLocalUpdate('donation', data);
        return data as Donation;
      }
      console.error('Supabase update error:', error);
    } catch (err) {
      console.error('Supabase update exception:', err);
    }
  }

  // LocalStorage Fallback
  const existing = await fetchDonations();
  const index = existing.findIndex((d) => d.id === id);
  if (index === -1) return null;

  const updatedItem: Donation = {
    ...existing[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };

  existing[index] = updatedItem;
  localStorage.setItem(STORAGE_DONATIONS_KEY, JSON.stringify(existing));
  notifyLocalUpdate('donation', updatedItem);
  return updatedItem;
}

export async function deleteDonation(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('doacoes')
        .delete()
        .eq('id', id);

      if (!error) {
        notifyLocalUpdate('donation', { id, deleted: true });
        return true;
      }
      console.error('Supabase delete error:', error);
    } catch (err) {
      console.error('Supabase delete exception:', err);
    }
  }

  // LocalStorage Fallback
  const existing = await fetchDonations();
  const filtered = existing.filter((d) => d.id !== id);
  localStorage.setItem(STORAGE_DONATIONS_KEY, JSON.stringify(filtered));
  notifyLocalUpdate('donation', { id, deleted: true });
  return true;
}

// ================= CAMPAIGN CONFIG API =================

export async function fetchCampaignConfig(): Promise<CampaignConfig> {
  // 1. Always load local storage copy first
  let localConfig: CampaignConfig = DEFAULT_CAMPAIGN_CONFIG;
  let hasLocal = false;
  const stored = localStorage.getItem(STORAGE_CONFIG_KEY);
  if (stored) {
    try {
      localConfig = { ...DEFAULT_CAMPAIGN_CONFIG, ...JSON.parse(stored) };
      hasLocal = true;
    } catch (e) {
      console.error('Error parsing stored config', e);
    }
  }

  // 2. Query Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const sbConfig = { ...DEFAULT_CAMPAIGN_CONFIG, ...data } as CampaignConfig;

        // If local storage has a newer updated_at timestamp than Supabase, prefer localConfig!
        if (hasLocal && localConfig.updated_at && sbConfig.updated_at) {
          const localTime = new Date(localConfig.updated_at).getTime();
          const sbTime = new Date(sbConfig.updated_at).getTime();

          if (localTime > sbTime) {
            // Background sync localConfig to Supabase so Supabase gets updated
            (async () => {
              try {
                const { error: syncErr } = await supabase
                  .from('configuracoes')
                  .upsert([{ id: data.id || 'default', ...localConfig }], { onConflict: 'id' });
                if (syncErr) console.warn('Background Supabase config sync note:', syncErr);
              } catch (e) {
                console.warn('Background sync exception:', e);
              }
            })();
            return localConfig;
          }
        } else if (hasLocal && localConfig.updated_at && !sbConfig.updated_at) {
          return localConfig;
        }

        // Supabase is equal or newer
        localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(sbConfig));
        return sbConfig;
      } else {
        console.warn('Supabase config fetch fallback:', error);
      }
    } catch (err) {
      console.warn('Supabase config exception:', err);
    }
  }

  // 3. Fallback to LocalStorage or Default
  if (hasLocal) {
    return localConfig;
  }

  localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(DEFAULT_CAMPAIGN_CONFIG));
  return DEFAULT_CAMPAIGN_CONFIG;
}

export async function saveCampaignConfig(config: Partial<CampaignConfig>): Promise<CampaignConfig> {
  const currentConfig = await fetchCampaignConfig();
  const updatedConfig: CampaignConfig = {
    ...currentConfig,
    ...config,
    updated_at: new Date().toISOString(),
  };

  // 1. ALWAYS persist to LocalStorage immediately
  localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(updatedConfig));

  // 2. Attempt to save to Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      // Find existing row ID if any
      const { data: existingRow } = await supabase
        .from('configuracoes')
        .select('id')
        .limit(1)
        .maybeSingle();

      const targetId = existingRow?.id || 'default';

      const payload = {
        id: targetId,
        ...updatedConfig,
      };

      const { data, error } = await supabase
        .from('configuracoes')
        .upsert([payload], { onConflict: 'id' })
        .select()
        .single();

      if (!error && data) {
        const finalConfig = { ...DEFAULT_CAMPAIGN_CONFIG, ...updatedConfig, ...data } as CampaignConfig;
        localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(finalConfig));
        notifyLocalUpdate('config', finalConfig);
        return finalConfig;
      } else {
        console.warn('Supabase config update error (saved locally):', error);
      }
    } catch (err) {
      console.warn('Supabase config update exception (saved locally):', err);
    }
  }

  notifyLocalUpdate('config', updatedConfig);
  return updatedConfig;
}

// ================= REALTIME SUBSCRIPTION =================

export function subscribeToRealtimeChanges(
  onDonationChange: () => void,
  onConfigChange: () => void
): () => void {
  const unsubscribers: Array<() => void> = [];

  // 1. Supabase Realtime Channel if configured
  if (isSupabaseConfigured && supabase) {
    const channel = supabase
      .channel('public_realtime_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doacoes' }, () => {
        onDonationChange();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'configuracoes' }, () => {
        onConfigChange();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime connected to Supabase');
        }
      });

    unsubscribers.push(() => {
      supabase.removeChannel(channel);
    });
  }

  // 2. Local fallback listener (BroadcastChannel / Local Events)
  const handleLocalEvent = (e: Event) => {
    const customEv = e as CustomEvent<{ type: string }>;
    if (customEv.detail?.type === 'donation') {
      onDonationChange();
    } else if (customEv.detail?.type === 'config') {
      onConfigChange();
    }
  };

  localEventEmitter.addEventListener('update', handleLocalEvent);
  unsubscribers.push(() => {
    localEventEmitter.removeEventListener('update', handleLocalEvent);
  });

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}

// ================= SUPABASE AUTHENTICATION =================

export async function signInWithSupabase(email: string, password: string) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Supabase não configurado') };
  }
  try {
    return await supabase.auth.signInWithPassword({ email, password });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: new Error(`Erro no Supabase Auth: ${message}`) };
  }
}

export async function signUpWithSupabase(email: string, password: string) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Supabase não configurado') };
  }
  try {
    return await supabase.auth.signUp({ email, password });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: new Error(`Erro no Supabase Auth: ${message}`) };
  }
}

export async function signOutSupabase() {
  if (!isSupabaseConfigured || !supabase) return;
  return await supabase.auth.signOut();
}

export async function getSupabaseUser() {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

// Helper SQL Schema Generator string for Admin Modal & SQL Editor
export const SUPABASE_SQL_SCHEMA = `-- ============================================================
-- SCRIPT SQL PARA O SUPABASE (COPIAR E COLAR NO SQL EDITOR DO SUPABASE)
-- Campanha Solar Leilão Beneficente
-- Administrador Oficial: www.ceolin@gmail.com
-- ============================================================

-- 1. Limpa doações de teste/fictícias caso existam
DROP TABLE IF EXISTS public.doacoes CASCADE;

-- 2. Cria a tabela oficial de doações reais do leilão
CREATE TABLE public.doacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  valor NUMERIC(12, 2) NOT NULL CHECK (valor > 0),
  doador TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  status TEXT DEFAULT 'pago',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Cria a tabela de configurações da campanha solar
CREATE TABLE IF NOT EXISTS public.configuracoes (
  id TEXT PRIMARY KEY DEFAULT 'default',
  nome_campanha TEXT NOT NULL DEFAULT 'Campanha Luz e Esperança',
  nome_igreja TEXT NOT NULL DEFAULT 'Igreja Matriz de São José',
  meta_total NUMERIC(12, 2) NOT NULL DEFAULT 100000.00,
  quantidade_paineis INT NOT NULL DEFAULT 40,
  potencia_painel NUMERIC(8, 2) NOT NULL DEFAULT 550.00,
  economia_mensal_total NUMERIC(12, 2) NOT NULL DEFAULT 2500.00,
  valor_kwh NUMERIC(8, 2) NOT NULL DEFAULT 0.95,
  imagem_igreja TEXT DEFAULT 'default-vector',
  painel_grid_cols INT DEFAULT 10,
  painel_grid_rows INT DEFAULT 4,
  painel_roof_top_percent NUMERIC(5, 2) DEFAULT 28.00,
  painel_roof_left_percent NUMERIC(5, 2) DEFAULT 23.00,
  painel_roof_width_percent NUMERIC(5, 2) DEFAULT 54.00,
  painel_roof_height_percent NUMERIC(5, 2) DEFAULT 22.00,
  painel_roof_perspective_tilt NUMERIC(5, 2) DEFAULT 8.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Inserir configuração padrão inicial (caso não exista)
INSERT INTO public.configuracoes (id, nome_campanha, nome_igreja, meta_total, quantidade_paineis)
VALUES ('default', 'Campanha Luz e Esperança', 'Igreja Matriz de São José', 100000.00, 40)
ON CONFLICT (id) DO NOTHING;

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE public.doacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- 6. Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir leitura publica de doacoes" ON public.doacoes;
DROP POLICY IF EXISTS "Permitir escrita de doacoes" ON public.doacoes;
DROP POLICY IF EXISTS "Permitir leitura publica de configuracoes" ON public.configuracoes;
DROP POLICY IF EXISTS "Permitir escrita de configuracoes" ON public.configuracoes;

-- 7. Criar Políticas de Acesso Público e Transmissão do Leilão
CREATE POLICY "Permitir leitura publica de doacoes" ON public.doacoes FOR SELECT USING (true);
CREATE POLICY "Permitir escrita de doacoes" ON public.doacoes FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir leitura publica de configuracoes" ON public.configuracoes FOR SELECT USING (true);
CREATE POLICY "Permitir escrita de configuracoes" ON public.configuracoes FOR ALL USING (true) WITH CHECK (true);

-- 8. Habilitar Supabase Realtime para sincronização instantânea no Telão
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'doacoes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.doacoes;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'configuracoes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.configuracoes;
  END IF;
END $$;

-- ============================================================
-- SCRIPT CONCLUÍDO! O banco está pronto para receber doações reais do leilão.
-- Administrador: www.ceolin@gmail.com
-- ============================================================
`;
