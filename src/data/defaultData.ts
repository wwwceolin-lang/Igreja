import { CampaignConfig, Donation } from '../types';

export const DEFAULT_CAMPAIGN_CONFIG: CampaignConfig = {
  id: 'default',
  nome_campanha: 'Campanha Luz e Esperança',
  nome_igreja: 'Igreja Matriz de São José',
  meta_total: 100000,
  quantidade_paineis: 40,
  potencia_painel: 550, // 550 Wp
  economia_mensal_total: 2500, // R$ 2.500/mês
  valor_kwh: 0.95, // R$ 0.95/kWh
  imagem_igreja: 'default-vector',
  painel_grid_cols: 10,
  painel_grid_rows: 4,
  painel_roof_top_percent: 28,
  painel_roof_left_percent: 23,
  painel_roof_width_percent: 54,
  painel_roof_height_percent: 22,
  painel_roof_perspective_tilt: 8,
};

export const INITIAL_DEMO_DONATIONS: Donation[] = [
  {
    id: 'demo-1',
    valor: 10000,
    doador: 'Comunidade Paroquial',
    descricao: 'Coleta especial de abertura do leilão',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'demo-2',
    valor: 15000,
    doador: 'Grupo da Terceira Idade & Amigos',
    descricao: 'Arrematação da Cesta Especial de Doces e Artesanatos',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'demo-3',
    valor: 7500,
    doador: 'Mercado São José',
    descricao: 'Arrematação do Lote 08 - Novilha Nelore',
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'demo-4',
    valor: 5000,
    doador: 'Família Oliveira',
    descricao: 'Doação para 2 painéis solares em memória de D. Maria',
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
];
