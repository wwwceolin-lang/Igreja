import React, { useState } from 'react';
import { CampaignConfig } from '../types';
import { ChurchRoofStage } from '../components/ChurchRoofStage';

interface AdminSettingsViewProps {
  config: CampaignConfig;
  onSaveConfig: (updated: Partial<CampaignConfig>) => Promise<void>;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({ config, onSaveConfig }) => {
  const [formData, setFormData] = useState<CampaignConfig>({ ...config });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleChange = (field: keyof CampaignConfig, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          handleChange('imagem_igreja', reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onSaveConfig(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      alert('Erro ao salvar configurações.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white space-y-8">
      {/* Header */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Configurações da Campanha</h1>
          <p className="text-xs text-slate-400">
            Ajuste os valores da meta, quantidade de painéis, estimativas de economia e calibração visual.
          </p>
        </div>

        {saveSuccess && (
          <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-2 rounded-xl text-xs font-bold animate-pulse">
            ✓ Configurações salvas e enviadas ao Telão!
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: FORM FIELDS (7 COLS) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
          <h2 className="text-lg font-extrabold text-amber-400 pb-3 border-b border-slate-800 flex items-center gap-2">
            <span>⚙️</span>
            <span>Parâmetros da Campanha</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Nome da Igreja *
              </label>
              <input
                type="text"
                value={formData.nome_igreja}
                onChange={(e) => handleChange('nome_igreja', e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Nome da Campanha *
              </label>
              <input
                type="text"
                value={formData.nome_campanha}
                onChange={(e) => handleChange('nome_campanha', e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Valor Total da Meta (R$) *
              </label>
              <input
                type="number"
                step="100"
                value={formData.meta_total}
                onChange={(e) => handleChange('meta_total', Number(e.target.value))}
                required
                className="w-full bg-slate-950 border border-slate-800 text-amber-300 font-bold rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Quantidade Total de Painéis *
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={formData.quantidade_paineis}
                onChange={(e) => handleChange('quantidade_paineis', Number(e.target.value))}
                required
                className="w-full bg-slate-950 border border-slate-800 text-white font-bold rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Potência de Cada Painel (Wp)
              </label>
              <input
                type="number"
                value={formData.potencia_painel}
                onChange={(e) => handleChange('potencia_painel', Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Economia Mensal Estimada (R$/mês)
              </label>
              <input
                type="number"
                value={formData.economia_mensal_total}
                onChange={(e) => handleChange('economia_mensal_total', Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Valor Estimado do kWh (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.valor_kwh}
                onChange={(e) => handleChange('valor_kwh', Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Estilo da Imagem da Igreja
              </label>
              <select
                value={formData.imagem_igreja.startsWith('http') || formData.imagem_igreja.startsWith('data:') ? 'custom' : 'default-vector'}
                onChange={(e) => {
                  if (e.target.value === 'default-vector') {
                    handleChange('imagem_igreja', 'default-vector');
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="default-vector">🎨 Ilustração Vetorial Padrão (Recomendado)</option>
                <option value="custom">📷 Foto Personalizada (URL ou Upload)</option>
              </select>
            </div>
          </div>

          {/* Custom Image Upload or URL */}
          {(formData.imagem_igreja !== 'default-vector' || true) && (
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <label className="block text-xs font-bold uppercase text-slate-300">
                Imagem da Igreja (URL ou Upload)
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={formData.imagem_igreja === 'default-vector' ? '' : formData.imagem_igreja}
                  onChange={(e) => handleChange('imagem_igreja', e.target.value || 'default-vector')}
                  placeholder="https://exemplo.com/fotografia-igreja.jpg"
                  className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-amber-500"
                />
                <label className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition-colors text-center self-stretch flex items-center justify-center">
                  <span>📁 Enviar Foto</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>
          )}

          {/* Visual Roof Grid Calibration Controls */}
          <div className="pt-6 border-t border-slate-800 space-y-4">
            <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
              📐 Calibração da Posição dos Painéis no Telhado
            </h3>
            <p className="text-[11px] text-slate-400">
              Ajuste a posição da grade de painéis solares para encaixar perfeitamente no telhado da imagem.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="flex justify-between text-slate-300 mb-1">
                  <span>Posição Vertical (Topo):</span>
                  <span className="font-mono text-amber-400">{formData.painel_roof_top_percent ?? 28}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={formData.painel_roof_top_percent ?? 28}
                  onChange={(e) => handleChange('painel_roof_top_percent', Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <label className="flex justify-between text-slate-300 mb-1">
                  <span>Posição Horizontal (Esquerda):</span>
                  <span className="font-mono text-amber-400">{formData.painel_roof_left_percent ?? 23}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={formData.painel_roof_left_percent ?? 23}
                  onChange={(e) => handleChange('painel_roof_left_percent', Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <label className="flex justify-between text-slate-300 mb-1">
                  <span>Largura do Telhado:</span>
                  <span className="font-mono text-amber-400">{formData.painel_roof_width_percent ?? 54}%</span>
                </label>
                <input
                  type="range"
                  min="20"
                  max="90"
                  value={formData.painel_roof_width_percent ?? 54}
                  onChange={(e) => handleChange('painel_roof_width_percent', Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <label className="flex justify-between text-slate-300 mb-1">
                  <span>Inclinação da Perspectiva:</span>
                  <span className="font-mono text-amber-400">{formData.painel_roof_perspective_tilt ?? 8}°</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="45"
                  value={formData.painel_roof_perspective_tilt ?? 8}
                  onChange={(e) => handleChange('painel_roof_perspective_tilt', Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-4 rounded-2xl text-base shadow-xl transition-colors disabled:opacity-50"
          >
            {isSaving ? 'SALVANDO...' : 'SALVAR CONFIGURAÇÕES DA CAMPANHA'}
          </button>
        </div>

        {/* RIGHT COLUMN: LIVE CALIBRATION PREVIEW (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
              <span>Pré-visualização em Tempo Real</span>
              <span className="text-slate-500 font-normal text-[10px]">Efeito no Telão</span>
            </div>

            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden">
              <ChurchRoofStage
                config={formData}
                paineisConquistados={15}
                totalPaineis={formData.quantidade_paineis || 40}
                interactiveMode
              />
            </div>

            <p className="text-[11px] text-slate-400 text-center italic">
              Simulação com 15 painéis solares para ajustar a simetria visual do telhado.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};
