import React, { useState, useRef } from 'react';
import { InformeMensal, StatusInformeMensal } from '../../types';
import {
  Archive,
  Search,
  Eye,
  Plus,
  Trash2,
  Download,
  Upload,
  Copy,
  Printer,
  FileText,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface DashboardGestaoArquivoProps {
  informesArquivados: InformeMensal[];
  onCarregarInforme: (inf: InformeMensal) => void;
  onVisualizarInforme: (inf: InformeMensal) => void;
  onExcluirInforme: (inf: InformeMensal) => void;
  onLimparHistorico: () => void;
  onDuplicarParaNovoMes: (inf: InformeMensal) => void;
  onImportarBackup?: (informes: InformeMensal[]) => void;
  onAbrirImpressaoDireta: (inf: InformeMensal) => void;
}

export const DashboardGestaoArquivo: React.FC<DashboardGestaoArquivoProps> = ({
  informesArquivados,
  onCarregarInforme,
  onVisualizarInforme,
  onExcluirInforme,
  onLimparHistorico,
  onDuplicarParaNovoMes,
  onImportarBackup,
  onAbrirImpressaoDireta,
}) => {
  const [filtroPesquisa, setFiltroPesquisa] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [feedback, setFeedback] = useState<string | null>(null);
  const inputImportarRef = useRef<HTMLInputElement>(null);

  // Métricas do Acervo
  const totalInformes = informesArquivados.length;
  const totalPaginas = informesArquivados.reduce((acc, inf) => acc + (inf.paginas?.length || 0) + 1, 0);
  const totalAntesDepois = informesArquivados.reduce((acc, inf) => {
    const pagsAntesDepois = (inf.paginas || []).filter(
      (p) => p.tipoGrid === 'antes_depois' || p.layoutDedicado === 'antes_depois'
    ).length;
    return acc + pagsAntesDepois;
  }, 0);
  const totalFotos = informesArquivados.reduce((acc, inf) => {
    const fotos = (inf.paginas || []).reduce((fAcc, p) => fAcc + (p.fotos?.filter((f) => f.url)?.length || 0), 0);
    return acc + fotos;
  }, 0);

  const informesFiltrados = informesArquivados.filter((inf) => {
    // Filtro de Status
    if (filtroStatus !== 'todos') {
      const statusInf = inf.status || 'Aprovado';
      if (statusInf !== filtroStatus) return false;
    }
    // Filtro de Texto
    if (!filtroPesquisa.trim()) return true;
    const termo = filtroPesquisa.toLowerCase();
    return (
      inf.titulo?.toLowerCase().includes(termo) ||
      inf.mesAno?.toLowerCase().includes(termo) ||
      inf.subtitulo?.toLowerCase().includes(termo) ||
      inf.equipeTexto?.toLowerCase().includes(termo)
    );
  });

  // Exportar Backup de Todos os Informes em JSON
  const handleExportarTodos = () => {
    if (informesArquivados.length === 0) return;
    const dataStr = new Date().toISOString().split('T')[0];
    const dataUri =
      'data:application/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(informesArquivados, null, 2));
    const nomeArquivo = `Backup_Informes_Mensais_APMBB_${dataStr}.json`;
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', nomeArquivo);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setFeedback('📥 Backup de todos os informes exportado com sucesso!');
    setTimeout(() => setFeedback(null), 3500);
  };

  // Exportar Relatório Individual em JSON
  const handleExportarIndividual = (inf: InformeMensal) => {
    const nomeLimpo = (inf.mesAno || 'mensal').replace(/[\s/]+/g, '_');
    const dataUri =
      'data:application/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(inf, null, 2));
    const nomeArquivo = `Informe_APMBB_${nomeLimpo}.json`;
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', nomeArquivo);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setFeedback(`💾 Informe "${inf.mesAno}" exportado em formato JSON!`);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Importar Backup JSON
  const handleImportarJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const conteudo = event.target?.result as string;
        const parsed = JSON.parse(conteudo);
        const lista: InformeMensal[] = Array.isArray(parsed) ? parsed : [parsed];
        if (lista.length > 0 && onImportarBackup) {
          onImportarBackup(lista);
          setFeedback(`📤 ${lista.length} informe(s) importado(s) e mesclado(s) com sucesso!`);
          setTimeout(() => setFeedback(null), 4000);
        } else {
          setFeedback('⚠️ Arquivo não contém um formato válido de informes.');
          setTimeout(() => setFeedback(null), 4000);
        }
      } catch (err) {
        console.error('Erro ao ler JSON de backup:', err);
        setFeedback('⚠️ Não foi possível processar o arquivo selecionado.');
        setTimeout(() => setFeedback(null), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const renderStatusBadge = (status?: StatusInformeMensal) => {
    switch (status) {
      case 'Aprovado':
        return (
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10.5px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <CheckCircle2 size={11} /> Aprovado Oficial
          </span>
        );
      case 'Em Revisão':
        return (
          <span className="bg-blue-100 text-blue-800 border border-blue-300 font-bold text-[10.5px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <Clock size={11} /> Em Revisão
          </span>
        );
      case 'Arquivado':
        return (
          <span className="bg-purple-100 text-purple-800 border border-purple-300 font-bold text-[10.5px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <ShieldCheck size={11} /> Arquivado
          </span>
        );
      case 'Rascunho':
      default:
        return (
          <span className="bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[10.5px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <AlertCircle size={11} /> Rascunho
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {feedback && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-between shadow-2xs animate-in fade-in duration-150">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 font-bold">✕</button>
        </div>
      )}

      {/* Painel de Gestão e Métricas do Acervo */}
      <div className="bg-gradient-to-r from-[#1a2b4c] via-[#243a66] to-[#1a2b4c] rounded-xl p-5 text-white shadow-md border border-[#c9a84e]/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
          <div>
            <h2 className="text-base font-extrabold flex items-center gap-2">
              <Archive className="text-[#c9a84e]" size={20} />
              <span>Gestão do Acervo Histórico de Informes Mensais</span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Custódia permanente, auditoria e consultas de relatórios de manutenção predial da APMBB
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={inputImportarRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportarJSON}
            />
            <button
              type="button"
              onClick={() => inputImportarRef.current?.click()}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition border border-white/20 cursor-pointer"
              title="Importar relatórios de um arquivo de backup JSON"
            >
              <Upload size={13} className="text-[#c9a84e]" />
              <span>Importar Backup</span>
            </button>
            {totalInformes > 0 && (
              <button
                type="button"
                onClick={handleExportarTodos}
                className="flex items-center gap-1.5 bg-[#c9a84e] hover:bg-[#b89535] text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
                title="Exportar todos os relatórios arquivados em arquivo JSON seguro"
              >
                <Download size={13} />
                <span>Exportar Acervo</span>
              </button>
            )}
          </div>
        </div>

        {/* Métricas Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/10 rounded-lg p-3 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-[#c9a84e]">
              <FileText size={20} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-300 block">
                Total de Informes
              </span>
              <span className="text-lg font-black text-white">{totalInformes}</span>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-3 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-300">
              <Layers size={20} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-300 block">
                Páginas Documentadas
              </span>
              <span className="text-lg font-black text-white">{totalPaginas}</span>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-3 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-300">
              <Sparkles size={20} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-300 block">
                Antes e Depois
              </span>
              <span className="text-lg font-black text-white">{totalAntesDepois}</span>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-3 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-300">
              <Calendar size={20} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-300 block">
                Fotos no Acervo
              </span>
              <span className="text-lg font-black text-white">{totalFotos}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
          <input
            type="text"
            value={filtroPesquisa}
            onChange={(e) => setFiltroPesquisa(e.target.value)}
            placeholder="Pesquisar por mês, título ou integrante..."
            className="w-full pl-9 pr-7 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#1a2b4c] focus:border-[#1a2b4c]"
          />
          {filtroPesquisa && (
            <button
              type="button"
              onClick={() => setFiltroPesquisa('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Status:</span>
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'Aprovado', label: 'Aprovados' },
            { id: 'Em Revisão', label: 'Em Revisão' },
            { id: 'Rascunho', label: 'Rascunhos' },
            { id: 'Arquivado', label: 'Arquivados' },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setFiltroStatus(st.id)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                filtroStatus === st.id
                  ? 'bg-[#1a2b4c] text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}

          {totalInformes > 0 && (
            <button
              type="button"
              onClick={onLimparHistorico}
              className="text-red-600 hover:text-red-800 text-xs font-semibold px-2.5 py-1 rounded hover:bg-red-50 transition cursor-pointer ml-auto sm:ml-2"
            >
              Limpar Histórico
            </button>
          )}
        </div>
      </div>

      {/* Lista de Relatórios Arquivados */}
      <div className="space-y-3">
        {totalInformes === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
            <Archive className="mx-auto mb-2 text-slate-300" size={48} />
            <h3 className="text-base font-bold text-slate-700">Nenhum informe arquivado ainda</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Ao concluir ou revisar o informe na aba "Edição do Informe do Mês", clique em "📦 Arquivar" para guardá-lo permanentemente no histórico seguro da subunidade.
            </p>
          </div>
        ) : informesFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            <p className="text-sm font-semibold">Nenhum informe encontrado com os filtros atuais.</p>
            <button
              type="button"
              onClick={() => {
                setFiltroPesquisa('');
                setFiltroStatus('todos');
              }}
              className="mt-2 text-xs text-[#1a2b4c] underline font-bold"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          informesFiltrados.map((inf) => {
            const qtdAntesDepois = (inf.paginas || []).filter(
              (p) => p.tipoGrid === 'antes_depois' || p.layoutDedicado === 'antes_depois'
            ).length;
            const qtdFotos = (inf.paginas || []).reduce(
              (fAcc, p) => fAcc + (p.fotos?.filter((f) => f.url)?.length || 0),
              0
            );

            return (
              <div
                key={inf.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-[#1a2b4c] transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  {inf.capaUrl ? (
                    <img
                      src={inf.capaUrl}
                      alt="Capa"
                      className="w-16 h-16 object-cover rounded-lg border border-slate-300 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                      <FileText size={24} />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-extrabold text-[#1a2b4c]">
                        {inf.titulo} • {inf.mesAno}
                      </h3>
                      {renderStatusBadge(inf.status)}
                      <span className="bg-[#c9a84e]/20 text-[#1a2b4c] font-black text-[10px] px-2 py-0.5 rounded">
                        {inf.paginas.length + 1} páginas
                      </span>
                      {qtdAntesDepois > 0 && (
                        <span className="bg-rose-100 text-rose-800 font-black text-[10px] px-2 py-0.5 rounded inline-flex items-center gap-1">
                          <Sparkles size={10} /> {qtdAntesDepois} Antes e Depois
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-1 font-medium">
                      Subtítulo: {inf.subtitulo}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                      <span>📅 Arquivado em: {inf.criadoEm || 'Agosto 2026'}</span>
                      {inf.ultimaAtualizacao && (
                        <span>• Atualizado: {inf.ultimaAtualizacao}</span>
                      )}
                      {inf.autorUltimaAtualizacao && (
                        <span>• Por: {inf.autorUltimaAtualizacao}</span>
                      )}
                      <span>• {qtdFotos} fotos registradas</span>
                    </div>
                  </div>
                </div>

                {/* Ações do Relatório */}
                <div className="flex flex-wrap items-center gap-1.5 self-end lg:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => onVisualizarInforme(inf)}
                    className="flex items-center gap-1 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition shadow-2xs cursor-pointer"
                    title="Consultar e pré-visualizar este informe arquivado"
                  >
                    <Eye size={13} />
                    <span>Consultar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onCarregarInforme(inf)}
                    className="flex items-center gap-1 bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition shadow-2xs cursor-pointer"
                    title="Carregar este relatório na aba de edição"
                  >
                    <Plus size={13} className="rotate-45" />
                    <span>Carregar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDuplicarParaNovoMes(inf)}
                    className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition shadow-2xs cursor-pointer"
                    title="Criar novo relatório para o mês seguinte com base neste modelo (mantém equipe, capa e cabeçalhos)"
                  >
                    <Copy size={13} />
                    <span>Novo Mês</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAbrirImpressaoDireta(inf)}
                    className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    title="Imprimir ou exportar PDF"
                  >
                    <Printer size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportarIndividual(inf)}
                    className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    title="Baixar arquivo JSON deste informe"
                  >
                    <Download size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onExcluirInforme(inf)}
                    className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 transition cursor-pointer"
                    title="Excluir este relatório do acervo"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
