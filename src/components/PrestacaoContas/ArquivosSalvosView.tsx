import React, { useState } from 'react';
import { ProjetoSalvo, NFInstance, PesquisaPrecoItem } from '../../types';
import {
  FolderOpen,
  Edit3,
  Trash2,
  Download,
  Upload,
  X,
  AlertTriangle,
  Copy,
  PlusCircle,
  CheckCircle2,
  FileSpreadsheet,
  Search,
  Scale,
  FileText,
  Clock,
  Sparkles,
  Save,
} from 'lucide-react';

interface ArquivosSalvosViewProps {
  arquivos: ProjetoSalvo[];
  onSalvarProjetoAtual: (titulo?: string) => void;
  onCarregarProjeto: (
    projeto: ProjetoSalvo,
    modulos: { nf: boolean; pesquisas: boolean; balancete: boolean; textoParte: boolean }
  ) => void;
  onRenomearProjeto: (id_arquivo: number, novoTitulo: string) => void;
  onDuplicarProjeto?: (id_arquivo: number) => void;
  onCriarNovoProjetoEmBranco?: () => void;
  onExcluirProjeto: (id_arquivo: number) => void;
  onLimparHistorico: () => void;
  onImportarBackupJSON: (projetos: ProjetoSalvo[]) => void;
  nfsAtuais?: NFInstance[];
  pesquisasAtuais?: PesquisaPrecoItem[];
}

export const ArquivosSalvosView: React.FC<ArquivosSalvosViewProps> = ({
  arquivos,
  onSalvarProjetoAtual,
  onCarregarProjeto,
  onRenomearProjeto,
  onDuplicarProjeto,
  onCriarNovoProjetoEmBranco,
  onExcluirProjeto,
  onLimparHistorico,
  onImportarBackupJSON,
  nfsAtuais = [],
  pesquisasAtuais = [],
}) => {
  // Estados para Modais de Controle
  const [modalSalvarAberto, setModalSalvarAberto] = useState(false);
  const [tituloNovoSalvar, setTituloNovoSalvar] = useState('');

  const [projetoSelecionadoParaCarga, setProjetoSelecionadoParaCarga] = useState<ProjetoSalvo | null>(null);
  const [projetoParaRenomear, setProjetoParaRenomear] = useState<ProjetoSalvo | null>(null);
  const [novoTituloRenomear, setNovoTituloRenomear] = useState('');

  const [projetoParaExcluir, setProjetoParaExcluir] = useState<ProjetoSalvo | null>(null);
  const [modalLimparAberto, setModalLimparAberto] = useState(false);
  const [modalNovoEmBrancoAberto, setModalNovoEmBrancoAberto] = useState(false);

  // Módulos para carga seletiva
  const [chkNF, setChkNF] = useState(true);
  const [chkPesquisas, setChkPesquisas] = useState(true);
  const [chkBalancete, setChkBalancete] = useState(true);
  const [chkTextoParte, setChkTextoParte] = useState(true);

  // Mensagem Toast em tempo real
  const [toastMsg, setToastMsg] = useState<{ tipo: 'sucesso' | 'info' | 'erro'; texto: string } | null>(null);

  const exibirToast = (texto: string, tipo: 'sucesso' | 'info' | 'erro' = 'sucesso') => {
    setToastMsg({ tipo, texto });
    setTimeout(() => {
      setToastMsg(null);
    }, 3800);
  };

  // Cálculos do estado atual para exibição prévia no salvar
  const totalItensAtuais = nfsAtuais.reduce((acc, nf) => acc + (nf.items?.length || 0), 0);
  const valorTotalAtual = nfsAtuais.reduce((accNF, nf) => {
    const soma = (nf.items || []).reduce((accIt, it) => accIt + (Number(it.total) || 0), 0);
    return accNF + Math.max(0, soma - (Number(nf.descontoAplicado) || 0));
  }, 0);

  // 1. Abertura do Modal de Salvar
  const abrirModalSalvar = () => {
    const dataHoraStr = new Date().toLocaleDateString('pt-BR');
    const horaStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const nomeSugerido = `Prestação: ${nfsAtuais[0]?.label || 'NF 1'} • ${dataHoraStr} ${horaStr}`;
    setTituloNovoSalvar(nomeSugerido);
    setModalSalvarAberto(true);
  };

  const handleConfirmarSalvar = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const tituloFinal = tituloNovoSalvar.trim() || `Prestação Salva • ${new Date().toLocaleDateString('pt-BR')}`;
    onSalvarProjetoAtual(tituloFinal);
    setModalSalvarAberto(false);
    exibirToast(`Projeto "${tituloFinal}" salvo com sucesso no histórico local!`, 'sucesso');
  };

  // 2. Renomear Projeto
  const abrirModalRenomear = (proj: ProjetoSalvo) => {
    setProjetoParaRenomear(proj);
    setNovoTituloRenomear(proj.titulo);
  };

  const handleConfirmarRenomear = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!projetoParaRenomear) return;
    const trimmed = novoTituloRenomear.trim();
    if (trimmed) {
      onRenomearProjeto(projetoParaRenomear.id_arquivo, trimmed);
      exibirToast(`Projeto renomeado para "${trimmed}" com sucesso!`, 'sucesso');
    }
    setProjetoParaRenomear(null);
  };

  // 3. Carga Total ou Seletiva
  const handleCarregarTudo = (proj: ProjetoSalvo) => {
    onCarregarProjeto(proj, {
      nf: true,
      pesquisas: true,
      balancete: true,
      textoParte: true,
    });
    exibirToast(`Todos os módulos de "${proj.titulo}" foram carregados na tela!`, 'sucesso');
  };

  const abrirModalCargaSeletiva = (proj: ProjetoSalvo) => {
    setProjetoSelecionadoParaCarga(proj);
    setChkNF(true);
    setChkPesquisas(true);
    setChkBalancete(true);
    setChkTextoParte(true);
  };

  const handleConfirmarCargaSeletiva = () => {
    if (!projetoSelecionadoParaCarga) return;
    if (!chkNF && !chkPesquisas && !chkBalancete && !chkTextoParte) {
      exibirToast('Selecione pelo menos um módulo para carregar.', 'erro');
      return;
    }

    onCarregarProjeto(projetoSelecionadoParaCarga, {
      nf: chkNF,
      pesquisas: chkPesquisas,
      balancete: chkBalancete,
      textoParte: chkTextoParte,
    });
    const nome = projetoSelecionadoParaCarga.titulo;
    setProjetoSelecionadoParaCarga(null);
    exibirToast(`Módulos selecionados de "${nome}" carregados na tela com sucesso!`, 'sucesso');
  };

  // 4. Duplicar
  const handleDuplicar = (id: number) => {
    if (onDuplicarProjeto) {
      onDuplicarProjeto(id);
      exibirToast('Cópia do projeto criada no histórico local!', 'sucesso');
    }
  };

  // 5. Baixar Projeto Individual JSON
  const handleDownloadProjetoIndividual = (proj: ProjetoSalvo) => {
    const cleanTitle = proj.titulo.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(proj, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `projeto_${cleanTitle}_${proj.id_arquivo}.json`);
    dlAnchorElem.click();
    exibirToast(`Arquivo do projeto "${proj.titulo}" exportado para download.`, 'info');
  };

  // 6. Exportar Backup Completo
  const handleExportBackupCompleto = () => {
    if (arquivos.length === 0) {
      exibirToast('Não há projetos salvos no histórico para exportar.', 'info');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(arquivos, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `backup_prestacoes_3cia_${Date.now()}.json`);
    dlAnchorElem.click();
    exibirToast(`Backup completo de ${arquivos.length} projeto(s) exportado com sucesso!`, 'sucesso');
  };

  // 7. Importar Backup JSON (aceita array ou objeto individual)
  const handleImportJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportarBackupJSON(parsed);
          exibirToast(`Backup de ${parsed.length} projeto(s) importado com sucesso!`, 'sucesso');
        } else if (parsed && typeof parsed === 'object' && parsed.titulo) {
          // Arquivo de projeto individual
          const individual: ProjetoSalvo = {
            ...parsed,
            id_arquivo: Date.now(),
            titulo: `${parsed.titulo} (Importado)`,
          };
          onImportarBackupJSON([individual]);
          exibirToast(`Projeto individual "${individual.titulo}" importado com sucesso!`, 'sucesso');
        } else {
          exibirToast('Arquivo JSON com estrutura incompatível ou inválida.', 'erro');
        }
      } catch (err) {
        exibirToast('Erro ao processar o arquivo JSON.', 'erro');
      }
    };
    reader.readAsText(file);
  };

  // 8. Iniciar Novo Projeto em Branco
  const handleConfirmarNovoEmBranco = () => {
    if (onCriarNovoProjetoEmBranco) {
      onCriarNovoProjetoEmBranco();
      setModalNovoEmBrancoAberto(false);
      exibirToast('Novo projeto em branco iniciado! A tela foi limpa para uma nova prestação.', 'sucesso');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl text-xs font-semibold border transition-all animate-in fade-in slide-in-from-bottom-3 ${
            toastMsg.tipo === 'sucesso'
              ? 'bg-emerald-800 text-white border-emerald-600'
              : toastMsg.tipo === 'erro'
              ? 'bg-red-800 text-white border-red-600'
              : 'bg-[#1a2b4c] text-white border-[#2c4373]'
          }`}
        >
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{toastMsg.texto}</span>
          <button
            onClick={() => setToastMsg(null)}
            className="ml-2 text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#1a2b4c] flex items-center gap-2">
            <FolderOpen size={20} className="text-[#1a2b4c]" />
            <span>Gerenciador de Arquivos & Histórico de Prestações</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Grave, recupere, duplique e exporte todo o trabalho com segurança local.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botão Principal: Salvar Projeto Atual */}
          <button
            type="button"
            onClick={abrirModalSalvar}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-md shadow-sm transition hover:scale-[1.02] cursor-pointer"
            title="Grava o estado atual das NFs, cotações e balancete neste navegador"
          >
            <Save size={15} />
            <span>Salvar Projeto Atual</span>
          </button>

          {/* Botão Novo em Branco */}
          {onCriarNovoProjetoEmBranco && (
            <button
              type="button"
              onClick={() => setModalNovoEmBrancoAberto(true)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-md border border-slate-300 transition cursor-pointer"
              title="Iniciar uma nova prestação em branco (limpa a tela)"
            >
              <PlusCircle size={14} className="text-slate-600" />
              <span>Novo em Branco</span>
            </button>
          )}

          {/* Botão Exportar Backup */}
          <button
            type="button"
            onClick={handleExportBackupCompleto}
            disabled={arquivos.length === 0}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 text-xs font-semibold px-3 py-2 rounded-md border border-slate-300 transition cursor-pointer"
            title="Exportar todos os projetos salvos em um único arquivo de backup .JSON"
          >
            <Download size={14} />
            <span>Backup Geral</span>
          </button>

          {/* Botão Importar Backup */}
          <label className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-md border border-slate-300 transition cursor-pointer">
            <Upload size={14} />
            <span>Importar JSON</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleImportJSON(e.target.files[0]);
                  e.target.value = '';
                }
              }}
            />
          </label>

          {/* Limpar Todos */}
          {arquivos.length > 0 && (
            <button
              type="button"
              onClick={() => setModalLimparAberto(true)}
              className="text-red-600 hover:text-red-800 hover:bg-red-50 text-xs font-semibold px-2.5 py-2 rounded-md transition cursor-pointer"
              title="Apagar todo o histórico de projetos salvos localmente"
            >
              Limpar Tudo
            </button>
          )}
        </div>
      </div>

      {/* Dica Informativa */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-start gap-2.5">
        <Sparkles size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-800">Dica de Produtividade:</strong> Cada salvamento armazena o estado completo de todas as <strong>Notas Fiscais</strong>, <strong>Pesquisas de Preços</strong> com imagens coladas, <strong>Balancete</strong> e <strong>Texto Parte</strong>. Você pode alternar entre prestações antigas e a atual a qualquer momento.
        </div>
      </div>

      {/* Lista de Projetos Salvos */}
      <div className="space-y-3">
        {arquivos.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm text-slate-500">
            <FolderOpen className="mx-auto text-slate-300 mb-3" size={48} />
            <h3 className="text-sm font-bold text-slate-800">
              Nenhum projeto salvo no histórico local
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Clique em <strong>"Salvar Projeto Atual"</strong> no topo para guardar todo o progresso da prestação de contas que você está preenchendo agora.
            </p>
            <button
              type="button"
              onClick={abrirModalSalvar}
              className="mt-4 inline-flex items-center gap-1.5 bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-xs font-semibold px-4 py-2 rounded-md shadow-sm transition"
            >
              <Save size={14} />
              <span>Salvar Agora</span>
            </button>
          </div>
        ) : (
          arquivos.map((proj) => {
            // Calcular métricas do projeto salvo
            const totalNFs = proj.nfs?.length || 1;
            const totalItens = (proj.nfs || []).reduce(
              (acc, nf) => acc + (nf.items?.length || 0),
              0
            );
            const totalValor = (proj.nfs || []).reduce((accNF, nf) => {
              const somaItens = (nf.items || []).reduce(
                (accIt, it) => accIt + (Number(it.total) || 0),
                0
              );
              return accNF + Math.max(0, somaItens - (Number(nf.descontoAplicado) || 0));
            }, 0);
            const totalPesquisas = proj.pesquisas?.length || 0;

            return (
              <div
                key={proj.id_arquivo}
                className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm hover:border-[#1a2b4c]/50 hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                {/* Informações do Projeto */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-[#1a2b4c] truncate">
                      {proj.titulo}
                    </h3>
                    <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[10.5px] font-bold px-2 py-0.5 rounded-full">
                      {totalNFs} {totalNFs === 1 ? 'Nota Fiscal' : 'Notas Fiscais'}
                    </span>
                    {totalItens > 0 && (
                      <span className="bg-slate-100 text-slate-700 text-[10.5px] font-medium px-2 py-0.5 rounded-full">
                        {totalItens} {totalItens === 1 ? 'item' : 'itens'}
                      </span>
                    )}
                    {totalPesquisas > 0 && (
                      <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10.5px] font-medium px-2 py-0.5 rounded-full">
                        {totalPesquisas} cotações
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock size={12} className="text-slate-400" />
                      <span>Salvo em: {proj.dataHora}</span>
                    </div>
                    {totalValor > 0 && (
                      <div className="font-semibold text-emerald-700">
                        Valor Total: R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Barra de Ações Rápidas */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* Botão Carga Rápida Completa */}
                  <button
                    type="button"
                    onClick={() => handleCarregarTudo(proj)}
                    className="flex items-center gap-1.5 bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-xs transition cursor-pointer"
                    title="Carregar todos os dados deste projeto na tela"
                  >
                    <span>⚡ Carregar Tudo</span>
                  </button>

                  {/* Botão Carga Seletiva */}
                  <button
                    type="button"
                    onClick={() => abrirModalCargaSeletiva(proj)}
                    className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-md border border-slate-300 transition cursor-pointer"
                    title="Escolher módulos específicos para carregar (ex: apenas Pesquisas ou apenas Balancete)"
                  >
                    <span>Módulos...</span>
                  </button>

                  {/* Renomear */}
                  <button
                    type="button"
                    onClick={() => abrirModalRenomear(proj)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition cursor-pointer"
                    title="Renomear este projeto"
                  >
                    <Edit3 size={15} />
                  </button>

                  {/* Duplicar */}
                  {onDuplicarProjeto && (
                    <button
                      type="button"
                      onClick={() => handleDuplicar(proj.id_arquivo)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition cursor-pointer"
                      title="Criar uma cópia deste projeto no histórico"
                    >
                      <Copy size={15} />
                    </button>
                  )}

                  {/* Baixar JSON Individual */}
                  <button
                    type="button"
                    onClick={() => handleDownloadProjetoIndividual(proj)}
                    className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition cursor-pointer"
                    title="Exportar arquivo .JSON individual deste projeto"
                  >
                    <Download size={15} />
                  </button>

                  {/* Excluir */}
                  <button
                    type="button"
                    onClick={() => setProjetoParaExcluir(proj)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition cursor-pointer"
                    title="Excluir este projeto do histórico"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Salvar Projeto Atual                                             */}
      {/* ========================================================================= */}
      {modalSalvarAberto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 text-emerald-700">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Save size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Salvar Projeto Atual</h3>
                  <p className="text-xs text-slate-500">Gravação no histórico local</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalSalvarAberto(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmarSalvar} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome / Identificação da Prestação:
                </label>
                <input
                  type="text"
                  autoFocus
                  value={tituloNovoSalvar}
                  onChange={(e) => setTituloNovoSalvar(e.target.value)}
                  placeholder="Ex: Prestação NF 01 - Julho 2026..."
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2b4c]"
                  required
                />
              </div>

              {/* Resumo do que será gravado */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5">
                <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wide">
                  Resumo do conteúdo atual:
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Notas Fiscais Cadastradas:</span>
                  <strong className="text-slate-800">{nfsAtuais.length} NF(s)</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total de Materiais/Itens:</span>
                  <strong className="text-slate-800">{totalItensAtuais} item(ns)</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Folhas de Pesquisa de Preço:</span>
                  <strong className="text-slate-800">{pesquisasAtuais.length} folha(s)</strong>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200">
                  <span>Valor Total da Prestação:</span>
                  <span>R$ {valorTotalAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalSalvarAberto(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
                >
                  Gravar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Renomear Projeto                                                 */}
      {/* ========================================================================= */}
      {projetoParaRenomear && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 text-blue-700">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Renomear Projeto</h3>
                  <p className="text-xs text-slate-500">Altere o título de identificação</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProjetoParaRenomear(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmarRenomear} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Novo Título do Projeto:
                </label>
                <input
                  type="text"
                  autoFocus
                  value={novoTituloRenomear}
                  onChange={(e) => setNovoTituloRenomear(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a2b4c]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProjetoParaRenomear(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#1a2b4c] hover:bg-[#2c4373] rounded-lg shadow-sm transition"
                >
                  Salvar Título
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Carga Seletiva de Módulos                                        */}
      {/* ========================================================================= */}
      {projetoSelecionadoParaCarga && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative border border-slate-200">
            <button
              onClick={() => setProjetoSelecionadoParaCarga(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-[#1a2b4c] mb-1">
              📥 Carregar Projeto do Arquivo
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Selecione quais módulos do salvamento <strong>"{projetoSelecionadoParaCarga.titulo}"</strong> você deseja trazer para a tela atual:
            </p>

            <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
              <label className="flex items-center gap-3 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={chkNF}
                  onChange={(e) => setChkNF(e.target.checked)}
                  className="w-4 h-4 text-[#1a2b4c] rounded focus:ring-[#1a2b4c]"
                />
                <FileSpreadsheet size={15} className="text-slate-600" />
                <span>Planilhas Oficiais e Notas Fiscais ({projetoSelecionadoParaCarga.nfs?.length || 1})</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={chkPesquisas}
                  onChange={(e) => setChkPesquisas(e.target.checked)}
                  className="w-4 h-4 text-[#1a2b4c] rounded focus:ring-[#1a2b4c]"
                />
                <Search size={15} className="text-slate-600" />
                <span>Pesquisas de Preços & Cotações ({projetoSelecionadoParaCarga.pesquisas?.length || 0})</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={chkBalancete}
                  onChange={(e) => setChkBalancete(e.target.checked)}
                  className="w-4 h-4 text-[#1a2b4c] rounded focus:ring-[#1a2b4c]"
                />
                <Scale size={15} className="text-slate-600" />
                <span>Balancete Global de Prestação</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={chkTextoParte}
                  onChange={(e) => setChkTextoParte(e.target.checked)}
                  className="w-4 h-4 text-[#1a2b4c] rounded focus:ring-[#1a2b4c]"
                />
                <FileText size={15} className="text-slate-600" />
                <span>Documento Oficial Texto Parte</span>
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setProjetoSelecionadoParaCarga(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarCargaSeletiva}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
              >
                📂 Carregar Selecionados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Confirmar Novo Projeto em Branco                                */}
      {/* ========================================================================= */}
      {modalNovoEmBrancoAberto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-amber-600">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <PlusCircle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Iniciar Novo Projeto em Branco</h3>
                  <p className="text-xs text-slate-500">Reinicia a tela de prestação</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNovoEmBrancoAberto(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-slate-700 mb-5 leading-relaxed">
              Deseja iniciar um novo projeto em branco? A tela atual será resetada com uma NF 01 limpa para começar uma nova prestação.
              <br /><br />
              <em>Recomendação: certifique-se de ter salvo o projeto atual antes de prosseguir.</em>
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModalNovoEmBrancoAberto(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarNovoEmBranco}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#1a2b4c] hover:bg-[#2c4373] rounded-lg transition shadow-sm"
              >
                Confirmar e Iniciar Novo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: Excluir Projeto Individual                                      */}
      {/* ========================================================================= */}
      {projetoParaExcluir && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Excluir Projeto Salvo</h3>
                  <p className="text-xs text-slate-500">ID: #{projetoParaExcluir.id_arquivo}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProjetoParaExcluir(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-slate-700 mb-5 leading-relaxed">
              Tem certeza de que deseja excluir permanentemente o projeto salvo{' '}
              <strong>"{projetoParaExcluir.titulo}"</strong>? Esta ação removerá os dados do histórico local.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setProjetoParaExcluir(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const titulo = projetoParaExcluir.titulo;
                  onExcluirProjeto(projetoParaExcluir.id_arquivo);
                  setProjetoParaExcluir(null);
                  exibirToast(`Projeto "${titulo}" excluído do histórico.`, 'info');
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: Limpar Todo o Histórico                                         */}
      {/* ========================================================================= */}
      {modalLimparAberto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Limpar Todos os Projetos</h3>
                  <p className="text-xs text-slate-500">Total: {arquivos.length} projeto(s)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalLimparAberto(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-slate-700 mb-5 leading-relaxed">
              Deseja realmente apagar todos os projetos salvos no histórico local? Esta ação é irreversível.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModalLimparAberto(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onLimparHistorico();
                  setModalLimparAberto(false);
                  exibirToast('Histórico de projetos limpo com sucesso.', 'info');
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm"
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
