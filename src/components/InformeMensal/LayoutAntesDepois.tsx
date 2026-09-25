import React, { useState } from 'react';
import { PaginaFotoServico, FotoCard, TipoBadgeFoto } from '../../types';
import { BadgeFotoColorido } from './BadgeFotoColorido';
import {
  Upload,
  ArrowLeftRight,
  Download,
  Loader2,
  Trash2,
  Palette,
  Edit3,
  X,
  Plus,
} from 'lucide-react';

interface LayoutAntesDepoisProps {
  pagina: PaginaFotoServico;
  onUpdatePagina: (field: keyof PaginaFotoServico, val: any) => void;
  onUploadFoto: (fotoId: string, file: File) => void;
  uploadingFotoKey: string | null;
  dragOverFotoKey: string | null;
  setDragOverFotoKey: (key: string | null) => void;
  onBaixarFoto: (url: string, nomeArquivo: string) => void;
  modoEdicao?: boolean;
}

export const LayoutAntesDepois: React.FC<LayoutAntesDepoisProps> = ({
  pagina,
  onUpdatePagina,
  onUploadFoto,
  uploadingFotoKey,
  dragOverFotoKey,
  setDragOverFotoKey,
  onBaixarFoto,
  modoEdicao = true,
}) => {
  const [modalBadgeAbertoFotoId, setModalBadgeAbertoFotoId] = useState<string | null>(null);

  // Garante que existam pelo menos 2 fotos para o comparativo
  const fotos = [...(pagina.fotos || [])];
  while (fotos.length < 2) {
    fotos.push({
      id: `foto-${Date.now()}-${fotos.length}`,
      url: '',
      legenda: fotos.length === 0 ? 'Registro do estado inicial com avarias' : 'Serviço finalizado com revitalização completa',
      tipoBadge: fotos.length === 0 ? 'antes' : 'depois',
      badgeTexto: fotos.length === 0 ? 'ANTES • ESTADO INICIAL' : 'DEPOIS • REVITALIZADO',
      badgeCor: fotos.length === 0 ? 'vermelho' : 'verde',
    });
  }

  const fotoAntes = fotos[0];
  const fotoDepois = fotos[1];

  const handleUpdateFotoEspecifica = (idx: 0 | 1, mudancas: Partial<FotoCard>) => {
    const novasFotos = [...fotos];
    novasFotos[idx] = { ...novasFotos[idx], ...mudancas };
    onUpdatePagina('fotos', novasFotos);
  };

  const handleInverterAntesDepois = () => {
    const fotoA = { ...fotos[0] };
    const fotoB = { ...fotos[1] };

    // Inverte os conteúdos de imagem e legenda, mas mantém ou adapta os badges de Antes e Depois
    novasFotosInvertidas();

    function novasFotosInvertidas() {
      const novas = [
        {
          ...fotoB,
          id: fotoA.id,
          tipoBadge: 'antes' as TipoBadgeFoto,
          badgeTexto: 'ANTES • ESTADO INICIAL',
          badgeCor: 'vermelho' as const,
        },
        {
          ...fotoA,
          id: fotoB.id,
          tipoBadge: 'depois' as TipoBadgeFoto,
          badgeTexto: 'DEPOIS • REVITALIZADO',
          badgeCor: 'verde' as const,
        },
      ];
      onUpdatePagina('fotos', novas);
    }
  };

  const renderCardComparativo = (
    foto: FotoCard,
    idx: 0 | 1,
    tipoPadrao: 'antes' | 'depois'
  ) => {
    const isAntes = idx === 0;
    const fotoKey = `${pagina.id}-${foto.id}`;
    const isUploading = uploadingFotoKey === fotoKey;
    const isDragging = dragOverFotoKey === fotoKey;
    const inputId = `input-antesdepois-${pagina.id}-${foto.id}`;
    const temFoto = Boolean(foto.url && foto.url.trim() !== '');

    const estiloTema = isAntes
      ? {
          cardBg: 'bg-red-50/20',
          border: 'border-red-200 hover:border-red-400',
          headerBg: 'bg-gradient-to-r from-red-600 to-rose-700',
          accentText: 'text-red-700',
          glowRing: 'ring-red-400',
          tituloSlot: 'ESTADO INICIAL / AVARIAS',
          placeholderUpload: 'Inserir Foto do Antes (Estado Inicial)',
        }
      : {
          cardBg: 'bg-emerald-50/20',
          border: 'border-emerald-200 hover:border-emerald-400',
          headerBg: 'bg-gradient-to-r from-emerald-600 to-teal-700',
          accentText: 'text-emerald-700',
          glowRing: 'ring-emerald-400',
          tituloSlot: 'SERVIÇO CONCLUÍDO / REVITALIZADO',
          placeholderUpload: 'Inserir Foto do Depois (Concluído)',
        };

    return (
      <div
        className={`flex-1 flex flex-col rounded-xl overflow-hidden border-2 shadow-sm transition-all ${
          estiloTema.border
        } ${isDragging ? `ring-3 ${estiloTema.glowRing} bg-blue-50/30` : estiloTema.cardBg}`}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOverFotoKey(fotoKey);
        }}
        onDragLeave={() => setDragOverFotoKey(null)}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOverFotoKey(null);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onUploadFoto(foto.id, e.dataTransfer.files[0]);
          }
        }}
      >
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onUploadFoto(foto.id, e.target.files[0]);
              e.target.value = '';
            }
          }}
        />

        {/* Cabeçalho do Card com Badge Colorido em Destaque */}
        <div className="bg-slate-900 text-white px-3 py-2 flex items-center justify-between border-b border-white/10 gap-2">
          <div className="flex items-center gap-2">
            <BadgeFotoColorido
              tipoBadge={foto.tipoBadge || tipoPadrao}
              badgeTexto={foto.badgeTexto}
              badgeCor={foto.badgeCor}
              tamanho="md"
            />
            {modoEdicao && (
              <button
                type="button"
                onClick={() =>
                  setModalBadgeAbertoFotoId(modalBadgeAbertoFotoId === foto.id ? null : foto.id)
                }
                className="no-print p-1 text-slate-300 hover:text-[#c9a84e] hover:bg-white/10 rounded transition cursor-pointer"
                title="Configurar badge, texto e cores"
              >
                <Palette size={13} />
              </button>
            )}
          </div>

          <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider hidden sm:block">
            {isAntes ? '🔴 Registro Inicial' : '🟢 Pós-Intervenção'}
          </div>
        </div>

        {/* Modal Popover de Configuração do Badge */}
        {modalBadgeAbertoFotoId === foto.id && modoEdicao && (
          <div className="no-print bg-slate-900 border-b border-white/20 p-2.5 text-white animate-in slide-in-from-top-2 duration-150 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-[#c9a84e] flex items-center gap-1">
                <Palette size={13} />
                <span>Configurar Badge Colorido:</span>
              </span>
              <button
                type="button"
                onClick={() => setModalBadgeAbertoFotoId(null)}
                className="text-slate-400 hover:text-white p-0.5"
              >
                <X size={14} />
              </button>
            </div>

            {/* Presets Rápidos */}
            <div className="mb-2">
              <span className="text-[10px] text-slate-400 block mb-1">Modelos rápidos:</span>
              <div className="flex flex-wrap gap-1">
                {(isAntes
                  ? [
                      { t: 'ANTES', c: 'vermelho' as const, b: 'antes' as TipoBadgeFoto },
                      { t: 'ESTADO INICIAL', c: 'vermelho' as const, b: 'antes' as TipoBadgeFoto },
                      { t: 'AVARIA IDENTIFICADA', c: 'vermelho' as const, b: 'antes' as TipoBadgeFoto },
                      { t: 'DANIFICADO', c: 'amarelo' as const, b: 'antes' as TipoBadgeFoto },
                    ]
                  : [
                      { t: 'DEPOIS', c: 'verde' as const, b: 'depois' as TipoBadgeFoto },
                      { t: 'REVITALIZADO', c: 'verde' as const, b: 'depois' as TipoBadgeFoto },
                      { t: 'SERVIÇO CONCLUÍDO', c: 'verde' as const, b: 'depois' as TipoBadgeFoto },
                      { t: '100% REPARADO', c: 'verde' as const, b: 'depois' as TipoBadgeFoto },
                    ]
                ).map((preset) => (
                  <button
                    key={preset.t}
                    type="button"
                    onClick={() => {
                      handleUpdateFotoEspecifica(idx, {
                        badgeTexto: preset.t,
                        badgeCor: preset.c,
                        tipoBadge: preset.b,
                      });
                    }}
                    className="px-2 py-0.5 text-[10px] font-bold rounded bg-white/10 hover:bg-white/20 text-slate-200 transition"
                  >
                    {preset.t}
                  </button>
                ))}
              </div>
            </div>

            {/* Texto livre e Cor */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
              <div>
                <label className="text-[9.5px] text-slate-400 block mb-0.5">Texto do Badge:</label>
                <input
                  type="text"
                  value={foto.badgeTexto ?? (isAntes ? 'ANTES' : 'DEPOIS')}
                  onChange={(e) =>
                    handleUpdateFotoEspecifica(idx, { badgeTexto: e.target.value.toUpperCase() })
                  }
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded px-2 py-1 text-[11px] font-bold focus:ring-1 focus:ring-[#c9a84e] outline-none"
                />
              </div>

              <div>
                <label className="text-[9.5px] text-slate-400 block mb-0.5">Cor do Badge:</label>
                <div className="flex items-center gap-1.5 pt-1">
                  {[
                    { id: 'vermelho', bg: 'bg-red-600' },
                    { id: 'verde', bg: 'bg-emerald-600' },
                    { id: 'amarelo', bg: 'bg-amber-500' },
                    { id: 'azul', bg: 'bg-blue-600' },
                    { id: 'roxo', bg: 'bg-purple-600' },
                    { id: 'cinza', bg: 'bg-slate-700' },
                  ].map((corItem) => (
                    <button
                      key={corItem.id}
                      type="button"
                      onClick={() =>
                        handleUpdateFotoEspecifica(idx, { badgeCor: corItem.id as any })
                      }
                      className={`w-5 h-5 rounded-full ${corItem.bg} border-2 transition ${
                        foto.badgeCor === corItem.id
                          ? 'border-white ring-2 ring-[#c9a84e] scale-110'
                          : 'border-transparent hover:scale-105'
                      }`}
                      title={corItem.id}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Área Visual da Imagem */}
        <div className="relative w-full overflow-hidden bg-slate-100 flex-1 min-h-[260px] flex items-center justify-center">
          {temFoto ? (
            <div className="w-full h-full relative group/fotoContainer">
              <img
                src={foto.url}
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                alt={foto.legenda || (isAntes ? 'Foto do Antes' : 'Foto do Depois')}
                className="w-full h-64 object-cover block"
              />

              {/* Botão flutuante de substituição rápida no hover */}
              {modoEdicao && !isUploading && (
                <div className="no-print absolute bottom-2 right-2 opacity-90 group-hover/fotoContainer:opacity-100 transition-opacity">
                  <label
                    htmlFor={inputId}
                    className="bg-slate-900/85 hover:bg-[#1a2b4c] text-white text-[10.5px] font-bold px-2.5 py-1 rounded-md shadow-md flex items-center gap-1.5 cursor-pointer backdrop-blur-xs transition"
                    title="Substituir por outra foto do seu computador"
                  >
                    <Upload size={11} className="pointer-events-none text-[#c9a84e]" />
                    <span className="pointer-events-none">Substituir Foto</span>
                  </label>
                </div>
              )}

              {/* Toolbar superior flutuante */}
              <div className="no-print absolute top-2 right-2 flex items-center gap-1 bg-slate-900/85 backdrop-blur-xs p-1 rounded-md shadow-md z-10">
                <button
                  type="button"
                  onClick={() =>
                    onBaixarFoto(
                      foto.url,
                      `${isAntes ? 'antes' : 'depois'}-${pagina.tituloServico.slice(0, 20).replace(/\s+/g, '_')}.jpg`
                    )
                  }
                  className="text-white hover:text-emerald-300 p-1 hover:bg-white/20 rounded transition cursor-pointer"
                  title="Salvar foto no dispositivo"
                >
                  <Download size={12} />
                </button>
                {modoEdicao && (
                  <>
                    <label
                      htmlFor={inputId}
                      className="text-white hover:text-blue-300 p-1 hover:bg-white/20 rounded transition cursor-pointer flex items-center"
                      title="Escolher arquivo do computador"
                    >
                      <Upload size={12} className="pointer-events-none" />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleUpdateFotoEspecifica(idx, { url: '' })}
                      className="text-red-400 hover:text-red-200 p-1 hover:bg-red-900/50 rounded transition cursor-pointer"
                      title="Limpar foto deste slot"
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Dropzone quando vazio */
            <div
              onClick={() => {
                if (!modoEdicao) return;
                const el = document.getElementById(inputId) as HTMLInputElement;
                el?.click();
              }}
              className={`w-full h-64 bg-white/70 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2.5 p-6 text-center transition ${
                modoEdicao ? 'hover:bg-blue-50/40 hover:border-[#1a2b4c] cursor-pointer' : 'cursor-default'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md ${
                  isAntes ? 'bg-red-600' : 'bg-emerald-600'
                }`}
              >
                <Upload size={20} />
              </div>
              <div>
                <span className="font-heading font-extrabold text-xs text-slate-800 block">
                  {estiloTema.placeholderUpload}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  {modoEdicao ? 'Clique para selecionar arquivo ou arraste a imagem para cá' : 'Nenhuma imagem inserida'}
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  isAntes ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isAntes ? '🔴 Registro de Avarias' : '🟢 Revitalização'}
              </span>
            </div>
          )}

          {/* Overlay de carregamento */}
          {isUploading && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20 text-white">
              <Loader2 className="animate-spin text-[#c9a84e]" size={30} />
              <span className="text-xs font-bold">Processando foto...</span>
            </div>
          )}

          {/* Overlay de Drag & Drop */}
          {isDragging && (
            <div
              className={`absolute inset-0 border-2 border-dashed flex flex-col items-center justify-center gap-2 z-20 text-white pointer-events-none ${
                isAntes ? 'bg-red-900/85 border-red-300' : 'bg-emerald-900/85 border-emerald-300'
              }`}
            >
              <Upload className="animate-bounce" size={34} />
              <span className="text-xs font-black uppercase tracking-wide">
                Solte a foto para aplicar neste card!
              </span>
            </div>
          )}
        </div>

        {/* Rodapé do Card com Legenda Técnica */}
        <div className="p-2.5 bg-white border-t border-slate-200">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
            Legenda Técnica ({isAntes ? 'Antes' : 'Depois'}):
          </span>
          {modoEdicao ? (
            <input
              type="text"
              value={foto.legenda}
              onChange={(e) => handleUpdateFotoEspecifica(idx, { legenda: e.target.value })}
              placeholder={
                isAntes
                  ? 'Descreva a avaria ou condição inicial...'
                  : 'Descreva a solução e intervenção executada...'
              }
              className="w-full font-heading text-xs font-bold text-slate-900 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-blue-50/20 rounded px-1.5 py-1 outline-none transition"
            />
          ) : (
            <p className="font-heading text-xs font-bold text-slate-900 leading-snug">
              {foto.legenda || (isAntes ? 'Registro da avaria e condição inicial.' : 'Serviço finalizado com revitalização.')}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 my-2">
      {/* Barra de Ferramentas Dedicada ao Antes e Depois (com botão de inversão) */}
      {modoEdicao && (
        <div className="no-print bg-slate-100 p-2 rounded-lg border border-slate-300 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-[#1a2b4c] flex items-center gap-1.5 uppercase tracking-wide">
              <span>⚖️ Layout Comparativo Dedicado:</span>
              <span className="bg-[#1a2b4c] text-[#c9a84e] text-[10px] font-bold px-2 py-0.5 rounded">
                Antes e Depois
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInverterAntesDepois}
              className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded border border-slate-300 shadow-2xs transition cursor-pointer hover:border-[#1a2b4c]"
              title="Trocar fotos e posições de Antes e Depois instantaneamente"
            >
              <ArrowLeftRight size={13} className="text-[#1a2b4c]" />
              <span>Inverter (Antes ⇄ Depois)</span>
            </button>
          </div>
        </div>
      )}

      {/* Grid Comparativo Lado a Lado Estritamente A4 */}
      <div className="grid grid-cols-2 gap-4 relative">
        {/* Card ANTES */}
        {renderCardComparativo(fotoAntes, 0, 'antes')}

        {/* Divisor Central Estilizado de Transformação */}
        <div className="flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <div className="w-8 h-8 rounded-full bg-[#1a2b4c] text-[#c9a84e] border-2 border-white shadow-lg flex items-center justify-center font-heading font-black text-[10px] tracking-tighter">
            VS
          </div>
        </div>

        {/* Card DEPOIS */}
        {renderCardComparativo(fotoDepois, 1, 'depois')}
      </div>
    </div>
  );
};
