import React, { useState } from 'react';
import { InformeMensal, PaginaFotoServico, FotoCard } from '../../types';
import { gerarId, baixarFoto, comprimirImagemParaArmazenamento } from '../../utils';
import { Plus, Trash2, Printer, Archive, Upload, Image as ImageIcon, CheckCircle, Grid, LayoutGrid, AlertTriangle, X, Download } from 'lucide-react';

interface InformeMensalViewProps {
  informeAtual: InformeMensal;
  onChangeInformeAtual: (informe: InformeMensal) => void;
  informesArquivados: InformeMensal[];
  onArquivarInforme: (informe: InformeMensal) => void;
  onCarregarInformeArquivado: (informe: InformeMensal) => void;
  onExcluirInformeArquivado: (id: string) => void;
  onLimparHistoricoInformes: () => void;
}

export const InformeMensalView: React.FC<InformeMensalViewProps> = ({
  informeAtual,
  onChangeInformeAtual,
  informesArquivados,
  onArquivarInforme,
  onCarregarInformeArquivado,
  onExcluirInformeArquivado,
  onLimparHistoricoInformes,
}) => {
  const [subAba, setSubAba] = useState<'edicao' | 'arquivo'>('edicao');
  const [informeParaExcluir, setInformeParaExcluir] = useState<InformeMensal | null>(null);
  const [modalLimparAberto, setModalLimparAberto] = useState<boolean>(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  const handleUpdateField = (field: keyof InformeMensal, val: any) => {
    onChangeInformeAtual({ ...informeAtual, [field]: val });
  };

  const handleUploadCapa = async (file: File) => {
    try {
      const dataUrl = await comprimirImagemParaArmazenamento(file, 1200, 0.75);
      handleUpdateField('capaUrl', dataUrl);
    } catch (err) {
      console.error('Erro ao processar capa:', err);
    }
  };

  const handleAddPaginaFotos = () => {
    const novaPagina: PaginaFotoServico = {
      id: gerarId(),
      tituloServico: 'NOVO SERVIÇO DE MANUTENÇÃO PREDIAL',
      dataServico: informeAtual.mesAno || 'AGOSTO 2026',
      descricao: 'Descrição detalhada dos reparos executados pelos Cadetes e Efetivo da 3ª Companhia.',
      anotacao: '✅ Intervenção concluída garantindo a segurança e funcionalidade das instalações.',
      tipoGrid: '2',
      fotos: [
        {
          id: gerarId(),
          url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=60',
          legenda: 'ANTES: Registro do estado inicial com avarias',
        },
        {
          id: gerarId(),
          url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600&auto=format&fit=crop&q=60',
          legenda: 'DEPOIS: Serviço finalizado com revitalização completa',
        },
      ],
    };

    handleUpdateField('paginas', [...informeAtual.paginas, novaPagina]);
  };

  const handleUpdatePagina = (pagId: string, field: keyof PaginaFotoServico, val: any) => {
    const updated = informeAtual.paginas.map((p) => (p.id === pagId ? { ...p, [field]: val } : p));
    handleUpdateField('paginas', updated);
  };

  const handleRemovePagina = (pagId: string) => {
    handleUpdateField(
      'paginas',
      informeAtual.paginas.filter((p) => p.id !== pagId)
    );
  };

  const handleUploadFotoPagina = async (pagId: string, fotoId: string, file: File) => {
    try {
      const dataUrl = await comprimirImagemParaArmazenamento(file, 1024, 0.72);
      const updated = informeAtual.paginas.map((p) => {
        if (p.id !== pagId) return p;
        const updatedFotos = p.fotos.map((f) => (f.id === fotoId ? { ...f, url: dataUrl } : f));
        return { ...p, fotos: updatedFotos };
      });
      handleUpdateField('paginas', updated);
    } catch (err) {
      console.error('Erro ao processar foto da página:', err);
    }
  };

  const handleUpdateLegendaFoto = (pagId: string, fotoId: string, legenda: string) => {
    const updated = informeAtual.paginas.map((p) => {
      if (p.id !== pagId) return p;
      const updatedFotos = p.fotos.map((f) => (f.id === fotoId ? { ...f, legenda } : f));
      return { ...p, fotos: updatedFotos };
    });
    handleUpdateField('paginas', updated);
  };

  const handleAddFotoToPagina = (pagId: string) => {
    const updated = informeAtual.paginas.map((p) => {
      if (p.id !== pagId) return p;
      const newFoto: FotoCard = {
        id: gerarId(),
        url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600&auto=format&fit=crop&q=60',
        legenda: 'Novo registro fotográfico do serviço',
      };
      return { ...p, fotos: [...p.fotos, newFoto] };
    });
    handleUpdateField('paginas', updated);
  };

  const handleRemoveFotoFromPagina = (pagId: string, fotoId: string) => {
    const updated = informeAtual.paginas.map((p) => {
      if (p.id !== pagId) return p;
      return { ...p, fotos: p.fotos.filter((f) => f.id !== fotoId) };
    });
    handleUpdateField('paginas', updated);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Sub tabs */}
      <div className="no-print flex justify-center gap-2 mb-2">
        <button
          onClick={() => setSubAba('edicao')}
          className={`px-4 py-2 text-xs font-bold rounded-md transition ${
            subAba === 'edicao'
              ? 'bg-[#1a2b4c] text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          📝 1. Edição do Informe do Mês
        </button>
        <button
          onClick={() => setSubAba('arquivo')}
          className={`px-4 py-2 text-xs font-bold rounded-md transition ${
            subAba === 'arquivo'
              ? 'bg-[#1a2b4c] text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          📁 2. Arquivo de Informes ({informesArquivados.length})
        </button>
      </div>

      {subAba === 'edicao' && (
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="no-print bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 max-w-[820px] mx-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1a2b4c]">Mês Referência:</span>
              <input
                type="text"
                value={informeAtual.mesAno}
                onChange={(e) => handleUpdateField('mesAno', e.target.value.toUpperCase())}
                className="w-36 px-2 py-1 font-bold text-xs uppercase border border-slate-300 rounded focus:ring-1 focus:ring-[#1a2b4c]"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddPaginaFotos}
                className="flex items-center gap-1.5 bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-xs font-semibold px-3 py-2 rounded-md transition shadow-sm"
              >
                <Plus size={14} />
                <span>Adicionar Página de Fotos</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 bg-[#b89535] hover:bg-[#a48228] text-white text-xs font-semibold px-3 py-2 rounded-md transition shadow-sm"
              >
                <Printer size={14} />
                <span>Imprimir (PDF)</span>
              </button>
              <button
                onClick={() => {
                  onArquivarInforme(informeAtual);
                  setMensagemSucesso('📦 Informe arquivado com sucesso no histórico!');
                  setTimeout(() => setMensagemSucesso(null), 4000);
                }}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-md transition shadow-sm cursor-pointer"
              >
                <Archive size={14} />
                <span>Arquivar</span>
              </button>
            </div>
          </div>

          {/* Document Cover Page (A4) */}
          <div className="apmbb-page bg-white">
            <div>
              {/* Header */}
              <div className="flex justify-between items-center border-b-2 border-black pb-1.5 mb-5 font-heading">
                <div className="text-[11px] font-black text-black tracking-wide uppercase">
                  ACADEMIA DE POLÍCIA MILITAR DO BARRO BRANCO - O003
                </div>
                <div className="text-[11px] font-black text-black tracking-wide text-right uppercase leading-tight">
                  MANUTENÇÃO 3ª CIA<br />CIA ES
                </div>
              </div>

              {/* Cover photo banner */}
              <div className="relative mb-5 group">
                <div className="rounded-xl overflow-hidden border border-slate-300 shadow-sm bg-black">
                  <img
                    src={informeAtual.capaUrl}
                    alt="Banner Capa"
                    className="w-full h-64 object-cover"
                  />
                </div>
                <div className="no-print absolute bottom-2 right-2 flex items-center gap-1.5">
                  {informeAtual.capaUrl && (
                    <button
                      type="button"
                      onClick={() => baixarFoto(informeAtual.capaUrl, 'capa-informe-mensal.jpg')}
                      className="bg-white/90 hover:bg-white text-slate-800 text-[10px] font-bold px-2 py-1 rounded shadow cursor-pointer transition flex items-center gap-1"
                      title="Baixar imagem da capa"
                    >
                      <Download size={11} />
                      <span>Baixar</span>
                    </button>
                  )}
                  <label className="bg-white/90 hover:bg-white text-slate-800 text-[10px] font-bold px-2 py-1 rounded shadow cursor-pointer transition flex items-center gap-1">
                    <Upload size={11} />
                    <span>Alterar Imagem</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleUploadCapa(e.target.files[0]);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Titles */}
              <div className="text-center mb-6">
                <input
                  type="text"
                  value={informeAtual.titulo}
                  onChange={(e) => handleUpdateField('titulo', e.target.value)}
                  className="font-heading text-xl font-extrabold text-[#1a2b4c] text-center w-full uppercase tracking-wide bg-transparent border-0 focus:ring-1 focus:ring-black rounded"
                />
                <input
                  type="text"
                  value={informeAtual.subtitulo}
                  onChange={(e) => handleUpdateField('subtitulo', e.target.value)}
                  className="font-heading text-xs font-black text-[#b89535] text-center w-full uppercase tracking-wider bg-transparent border-0 focus:ring-1 focus:ring-black rounded mt-1"
                />
              </div>

              {/* Editorial Grid: Team and Text */}
              <div className="grid grid-cols-[220px_1fr] gap-6 mt-4">
                {/* Team roster */}
                <div className="border-r border-slate-300 pr-4 font-mono text-[10.5px] font-bold leading-relaxed text-slate-900">
                  <textarea
                    rows={16}
                    value={informeAtual.equipeTexto}
                    onChange={(e) => handleUpdateField('equipeTexto', e.target.value)}
                    className="w-full bg-transparent border-0 focus:ring-1 focus:ring-black rounded resize-none font-bold"
                  />
                </div>

                {/* Editorial text */}
                <div className="text-xs leading-relaxed text-slate-900 text-justify space-y-3 font-sans">
                  <textarea
                    rows={6}
                    value={informeAtual.resumoTexto}
                    onChange={(e) => handleUpdateField('resumoTexto', e.target.value)}
                    className="w-full bg-transparent border-0 focus:ring-1 focus:ring-black rounded resize-y"
                  />

                  <p className="font-bold text-[#1a2b4c] pt-2">
                    Dentre as principais atividades executadas, destacam-se:
                  </p>

                  <div className="space-y-2 text-xs">
                    {informeAtual.destaques.map((dest, i) => (
                      <div key={dest.id} className="flex items-start gap-1">
                        <span className="font-bold">•</span>
                        <div className="flex-1">
                          <span className="font-bold text-slate-900 mr-1">{dest.titulo}:</span>
                          <span>{dest.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-black pt-2 text-center font-heading text-[11px] font-black tracking-widest text-black uppercase">
              BERÇO DO OFICIALATO PAULISTA
            </div>
          </div>

          {/* Dynamic Photo Pages */}
          {informeAtual.paginas.map((pagina, pagIdx) => (
            <div key={pagina.id} className="relative group max-w-[820px] mx-auto">
              {/* Toolbar on page hover */}
              <div className="no-print absolute top-2 right-2 z-10 flex items-center gap-1.5 bg-white/90 p-1 rounded-md shadow border border-slate-200 opacity-90 group-hover:opacity-100 transition">
                {pagina.fotos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      pagina.fotos.forEach((foto, fIdx) => {
                        setTimeout(() => {
                          baixarFoto(foto.url, `pagina-${pagIdx + 1}-foto-${fIdx + 1}.jpg`);
                        }, fIdx * 300);
                      });
                    }}
                    className="px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 rounded flex items-center gap-1 cursor-pointer transition"
                    title="Baixar todas as fotos desta página"
                  >
                    <Download size={13} />
                    <span>Baixar Fotos</span>
                  </button>
                )}
                <button
                  onClick={() =>
                    handleUpdatePagina(
                      pagina.id,
                      'tipoGrid',
                      pagina.tipoGrid === '2' ? '3' : '2'
                    )
                  }
                  className="px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 rounded flex items-center gap-1"
                  title="Alternar entre 2 ou 3 fotos por linha"
                >
                  <LayoutGrid size={13} />
                  <span>Grid ({pagina.tipoGrid})</span>
                </button>
                <button
                  onClick={() => handleAddFotoToPagina(pagina.id)}
                  className="px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50 rounded flex items-center gap-1"
                >
                  <Plus size={13} />
                  <span>Foto</span>
                </button>
                <button
                  onClick={() => handleRemovePagina(pagina.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  title="Excluir esta página de fotos"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="apmbb-page bg-white">
                <div>
                  {/* Top Header */}
                  <div className="flex justify-between items-center border-b-2 border-black pb-1.5 mb-5 font-heading">
                    <div className="text-[11px] font-black text-black tracking-wide uppercase">
                      ACADEMIA DE POLÍCIA MILITAR DO BARRO BRANCO - O003
                    </div>
                    <div className="text-[11px] font-black text-black tracking-wide text-right uppercase leading-tight">
                      MANUTENÇÃO 3ª CIA<br />CIA ES
                    </div>
                  </div>

                  {/* Service titles */}
                  <div className="text-center mb-6">
                    <input
                      type="text"
                      value={pagina.tituloServico}
                      onChange={(e) =>
                        handleUpdatePagina(pagina.id, 'tituloServico', e.target.value.toUpperCase())
                      }
                      className="font-heading text-lg font-extrabold text-[#1a2b4c] text-center w-full uppercase tracking-wide bg-transparent border-0 focus:ring-1 focus:ring-black rounded"
                    />
                    <div className="font-heading text-xs font-bold text-[#b89535] text-center uppercase tracking-wider mt-0.5">
                      <span>{pagina.dataServico}</span>
                    </div>
                    <textarea
                      rows={2}
                      value={pagina.descricao}
                      onChange={(e) =>
                        handleUpdatePagina(pagina.id, 'descricao', e.target.value)
                      }
                      className="text-xs text-slate-700 text-center w-full max-w-xl mx-auto block mt-1 bg-transparent border-0 focus:ring-1 focus:ring-black rounded resize-none"
                    />
                  </div>

                  {/* Photos Grid */}
                  <div
                    className={`grid gap-4 my-4 ${
                      pagina.tipoGrid === '3' ? 'grid-cols-3' : 'grid-cols-2'
                    }`}
                  >
                    {pagina.fotos.map((foto) => (
                      <div
                        key={foto.id}
                        className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 flex flex-col items-center relative group/foto"
                      >
                        <div className="relative w-full">
                          <img
                            src={foto.url}
                            alt="Registro"
                            className={`w-full object-cover block bg-slate-100 ${
                              pagina.tipoGrid === '3' ? 'h-44' : 'h-64'
                            }`}
                          />
                          <div className="no-print absolute top-1.5 right-1.5 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => baixarFoto(foto.url, `pagina-${pagIdx + 1}-${foto.legenda ? foto.legenda.slice(0, 20).replace(/\s+/g, '_') : 'foto'}.jpg`)}
                              className="bg-white/90 hover:bg-white text-slate-800 text-[10px] font-bold px-1.5 py-0.5 rounded shadow cursor-pointer transition flex items-center gap-0.5"
                              title="Salvar foto no computador/celular"
                            >
                              <Download size={10} />
                              <span>Baixar</span>
                            </button>
                            <label className="bg-white/90 hover:bg-white text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded shadow cursor-pointer transition">
                              Substituir
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleUploadFotoPagina(pagina.id, foto.id, e.target.files[0]);
                                    e.target.value = '';
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                        <div className="w-full bg-slate-50 border-t border-slate-200 p-2 text-center">
                          <input
                            type="text"
                            value={foto.legenda}
                            onChange={(e) =>
                              handleUpdateLegendaFoto(pagina.id, foto.id, e.target.value)
                            }
                            className="w-full text-center font-heading text-[11.5px] font-bold text-slate-800 bg-transparent border-0 focus:ring-1 focus:ring-black rounded"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Annotation Box */}
                  <div className="mt-6 flex justify-center">
                    <div className="border-2 border-black rounded-lg px-4 py-2.5 bg-white text-xs font-semibold text-black inline-flex items-center gap-2 max-w-2xl w-full">
                      <input
                        type="text"
                        value={pagina.anotacao}
                        onChange={(e) =>
                          handleUpdatePagina(pagina.id, 'anotacao', e.target.value)
                        }
                        className="w-full font-semibold text-xs bg-transparent border-0 focus:ring-1 focus:ring-black rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t-2 border-black pt-2 text-center font-heading text-[11px] font-black tracking-widest text-black uppercase">
                  BERÇO DO OFICIALATO PAULISTA
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {subAba === 'arquivo' && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          {mensagemSucesso && (
            <div className="mb-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-between shadow-2xs animate-in fade-in duration-150">
              <span>{mensagemSucesso}</span>
              <button onClick={() => setMensagemSucesso(null)} className="text-emerald-600 hover:text-emerald-900 font-bold ml-2">✕</button>
            </div>
          )}

          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-[#1a2b4c]">
                Arquivo Histórico de Informes Mensais
              </h2>
              <p className="text-xs text-slate-500">
                Informes arquivados para auditoria, histórico da APMBB e relatórios ao Comando.
              </p>
            </div>
            {informesArquivados.length > 0 && (
              <button
                type="button"
                onClick={() => setModalLimparAberto(true)}
                className="text-red-600 hover:text-red-800 text-xs font-semibold px-2 py-1 rounded hover:bg-red-50 transition cursor-pointer"
              >
                Limpar Histórico
              </button>
            )}
          </div>

          <div className="space-y-3">
            {informesArquivados.length === 0 ? (
              <div className="text-center p-12 text-slate-400">
                <Archive className="mx-auto mb-2 text-slate-300" size={42} />
                <p className="text-sm font-semibold text-slate-700">Nenhum informe arquivado ainda.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Na aba "Edição do Informe do Mês", clique em "📦 Arquivar" para salvar uma edição permanente.
                </p>
              </div>
            ) : (
              informesArquivados.map((inf) => (
                <div
                  key={inf.id}
                  className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#1a2b4c] transition"
                >
                  <div>
                    <h3 className="text-sm font-bold text-[#1a2b4c] flex items-center gap-2">
                      <span>📰 {inf.titulo} - {inf.mesAno}</span>
                      <span className="bg-[#c9a84e]/20 text-[#1a2b4c] font-bold text-[10px] px-2 py-0.5 rounded">
                        {inf.paginas.length + 1} páginas
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Arquivado em: {inf.criadoEm || 'Agosto 2026'} • Subtítulo: {inf.subtitulo}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onCarregarInformeArquivado(inf);
                        setSubAba('edicao');
                      }}
                      className="bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-xs font-semibold px-3 py-1.5 rounded transition shadow-sm cursor-pointer"
                    >
                      Carregar na Edição
                    </button>
                    <button
                      type="button"
                      onClick={() => setInformeParaExcluir(inf)}
                      className="p-1.5 text-red-500 hover:text-red-700 rounded hover:bg-red-100/70 transition cursor-pointer"
                      title="Excluir do arquivo"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Informe */}
      {informeParaExcluir && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Excluir Informe Arquivado
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mês de Referência: <strong>{informeParaExcluir.mesAno}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInformeParaExcluir(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-slate-700 mb-5 leading-relaxed">
              Tem certeza de que deseja excluir permanentemente o informe{' '}
              <strong>"{informeParaExcluir.titulo} - {informeParaExcluir.mesAno}"</strong> do arquivo histórico?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setInformeParaExcluir(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onExcluirInformeArquivado(informeParaExcluir.id);
                  setInformeParaExcluir(null);
                  setMensagemSucesso('🗑️ Informe excluído do arquivo com sucesso!');
                  setTimeout(() => setMensagemSucesso(null), 4000);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Limpar Histórico de Informes */}
      {modalLimparAberto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Limpar Histórico de Informes
                  </h3>
                  <p className="text-xs text-slate-500">
                    Total arquivado: <strong>{informesArquivados.length} informe(s)</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalLimparAberto(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-slate-700 mb-5 leading-relaxed">
              Deseja realmente apagar todos os informes mensais arquivados? Esta ação não poderá ser revertida.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModalLimparAberto(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onLimparHistoricoInformes();
                  setModalLimparAberto(false);
                  setMensagemSucesso('🗑️ Histórico de informes limpo com sucesso!');
                  setTimeout(() => setMensagemSucesso(null), 4000);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm cursor-pointer"
              >
                Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
