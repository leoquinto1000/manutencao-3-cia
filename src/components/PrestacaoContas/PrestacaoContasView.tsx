import React, { useState } from 'react';
import { NFInstance, PesquisaPrecoItem, BalanceteState, TextoParteState, ProjetoSalvo, MaterialItem, Supplier } from '../../types';
import { TabelaComposicao } from './TabelaComposicao';
import { ExtratorNF } from './ExtratorNF';
import { CatalogoFornecedores } from './CatalogoFornecedores';
import { PesquisasPrecosView } from './PesquisasPrecosView';
import { BalanceteGlobalView } from './BalanceteGlobalView';
import { TextoParteView } from './TextoParteView';
import { ArquivosSalvosView } from './ArquivosSalvosView';
import { FileText, Search, Scale, FileSignature, FolderArchive, Plus, Edit2, Trash2, Save, Check, X, AlertTriangle } from 'lucide-react';
import { gerarId, DADOS_INICIAIS_NF1 } from '../../utils';

interface PrestacaoContasViewProps {
  nfs: NFInstance[];
  onChangeNFs: (nfs: NFInstance[]) => void;
  pesquisas: PesquisaPrecoItem[];
  onChangePesquisas: (pesquisas: PesquisaPrecoItem[]) => void;
  balancete: BalanceteState;
  onChangeBalancete: (balancete: BalanceteState) => void;
  textoParte: TextoParteState;
  onChangeTextoParte: (textoParte: TextoParteState) => void;
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
}

export const PrestacaoContasView: React.FC<PrestacaoContasViewProps> = ({
  nfs,
  onChangeNFs,
  pesquisas,
  onChangePesquisas,
  balancete,
  onChangeBalancete,
  textoParte,
  onChangeTextoParte,
  arquivos,
  onSalvarProjetoAtual,
  onCarregarProjeto,
  onRenomearProjeto,
  onDuplicarProjeto,
  onCriarNovoProjetoEmBranco,
  onExcluirProjeto,
  onLimparHistorico,
  onImportarBackupJSON,
}) => {
  const [moduloAtivo, setModuloAtivo] = useState<'planilhas' | 'pesquisas' | 'balancete' | 'textoparte' | 'arquivos'>('planilhas');
  const [nfAtivaId, setNfAtivaId] = useState<number>(nfs[0]?.id || 1);
  const [subAbaInterna, setSubAbaInterna] = useState<'planilha' | 'leitor' | 'fornecedores'>('planilha');

  // Estado para renomear NF inline
  const [editingNfId, setEditingNfId] = useState<number | null>(null);
  const [tempLabel, setTempLabel] = useState<string>('');

  // Estado para confirmação modal de exclusão
  const [nfParaExcluir, setNfParaExcluir] = useState<NFInstance | null>(null);

  const nfAtiva = nfs.find((n) => n.id === nfAtivaId) || nfs[0] || DADOS_INICIAIS_NF1;

  const handleUpdateNF = (updated: NFInstance) => {
    onChangeNFs(nfs.map((n) => (n.id === updated.id ? updated : n)));
  };

  // Atualização de fornecedores com propagação automática para toda a aplicação
  const handleUpdateSuppliers = (updatedSuppliers: Supplier[]) => {
    const oldSuppliers = nfAtiva.suppliers || [];

    // Garante que o total de empresas comporte todos os fornecedores
    const newTotal = Math.max(nfAtiva.totalEmpresas || 3, updatedSuppliers.length);
    const updatedNF: NFInstance = {
      ...nfAtiva,
      totalEmpresas: newTotal,
      suppliers: updatedSuppliers,
    };

    let found = false;
    let updatedNFs = nfs.map((n) => {
      if (String(n.id) === String(nfAtiva.id)) {
        found = true;
        return updatedNF;
      }
      return n;
    });
    if (!found) {
      if (updatedNFs.length > 0) {
        updatedNFs[0] = updatedNF;
      } else {
        updatedNFs = [updatedNF];
      }
    }
    onChangeNFs(updatedNFs);

    // Atualiza automaticamente onde a empresa constar nas pesquisas de preços
    if (pesquisas && onChangePesquisas) {
      const updatedPesquisas = pesquisas.map((p) => {
        let matchedSup: Supplier | undefined;

        if (p.nfId === nfAtiva.id) {
          if (p.supplierId) {
            matchedSup = updatedSuppliers.find((s) => s.id === p.supplierId);
          }
          if (!matchedSup && p.empresaNum) {
            matchedSup = updatedSuppliers.find((s) => s.num === p.empresaNum);
          }
          if (!matchedSup && p.pesquisaIndice) {
            matchedSup = updatedSuppliers[p.pesquisaIndice - 1];
          }
          if (!matchedSup && p.empresaNome) {
            const oldMatch = oldSuppliers.find(
              (os) => os.name.trim().toLowerCase() === p.empresaNome.trim().toLowerCase()
            );
            if (oldMatch) {
              matchedSup = updatedSuppliers.find(
                (s) => s.id === oldMatch.id || s.num === oldMatch.num
              );
            }
          }
        } else if (p.supplierId) {
          matchedSup = updatedSuppliers.find((s) => s.id === p.supplierId);
        }

        if (matchedSup) {
          return {
            ...p,
            supplierId: matchedSup.id,
            empresaNum: matchedSup.num,
            empresaNome: matchedSup.name,
            contato:
              matchedSup.contato && matchedSup.contato !== '-'
                ? matchedSup.contato
                : p.contato,
          };
        }

        return p;
      });

      onChangePesquisas(updatedPesquisas);
    }
  };

  const handleNovaNF = () => {
    const nextId = nfs.length > 0 ? Math.max(...nfs.map((n) => n.id)) + 1 : 1;
    const nova: NFInstance = {
      id: nextId,
      label: `NF ${nextId}`,
      totalEmpresas: 3,
      cidadeData: 'SÃO PAULO, 27 DE AGOSTO DE 2026',
      responsavelNome: 'ANDRÉ EMÍDIO FROES',
      responsavelCargo: '1º Ten PM 3ª Cia/Ex',
      descontoAplicado: 0,
      labelDesconto: 'Desconto Aplicado',
      items: [],
      suppliers: [
        {
          id: gerarId(),
          num: 1,
          name: `Empresa 1 (NF ${nextId})`,
          razaoSocial: `Empresa 1 Comercial Ltda`,
          cnpj: '',
          endereco: 'São Paulo - SP',
          contato: '-',
        },
      ],
    };
    onChangeNFs([...nfs, nova]);
    setNfAtivaId(nextId);
    setSubAbaInterna('planilha');
  };

  const iniciarEdicaoNF = (nf: NFInstance) => {
    setEditingNfId(nf.id);
    setTempLabel(nf.label);
  };

  const salvarEdicaoNF = (id: number) => {
    const trimmed = tempLabel.trim();
    if (trimmed) {
      const target = nfs.find((n) => n.id === id);
      if (target) {
        handleUpdateNF({ ...target, label: trimmed });
      }
    }
    setEditingNfId(null);
  };

  const cancelarEdicaoNF = () => {
    setEditingNfId(null);
  };

  const solicitarExcluirNF = (nf: NFInstance) => {
    setNfParaExcluir(nf);
  };

  const confirmarExcluirNF = () => {
    if (!nfParaExcluir) return;
    const id = nfParaExcluir.id;

    if (nfs.length <= 1) {
      // Limpa os itens da NF única ao invés de deixar a lista zerada
      const nfLimpa: NFInstance = {
        ...nfParaExcluir,
        label: 'NF 01',
        items: [],
        descontoAplicado: 0,
      };
      onChangeNFs([nfLimpa]);
      setNfAtivaId(nfLimpa.id);
    } else {
      const remaining = nfs.filter((n) => n.id !== id);
      onChangeNFs(remaining);
      if (nfAtivaId === id) {
        setNfAtivaId(remaining[0].id);
      }
    }

    // Limpa pesquisas de preço relacionadas a essa NF
    if (pesquisas && onChangePesquisas) {
      onChangePesquisas(pesquisas.filter((p) => p.nfId !== id));
    }

    setNfParaExcluir(null);
  };

  const handleExportarItensLeitor = (
    novosItens: MaterialItem[],
    novoFornecedor?: Partial<Supplier>,
    modoSubstituir: boolean = false
  ) => {
    if (!nfAtiva) return;

    let updatedSuppliers = [...(nfAtiva.suppliers || [])];
    if (novoFornecedor && updatedSuppliers.length > 0) {
      updatedSuppliers[0] = {
        ...updatedSuppliers[0],
        name: novoFornecedor.name || updatedSuppliers[0].name,
        razaoSocial: novoFornecedor.razaoSocial || updatedSuppliers[0].razaoSocial,
        cnpj: novoFornecedor.cnpj || updatedSuppliers[0].cnpj,
        endereco: novoFornecedor.endereco || updatedSuppliers[0].endereco,
        contato: novoFornecedor.contato || updatedSuppliers[0].contato,
      };
    }

    const itemsFinais = modoSubstituir ? novosItens : [...nfAtiva.items, ...novosItens];

    handleUpdateNF({
      ...nfAtiva,
      items: itemsFinais,
      suppliers: updatedSuppliers,
    });
    setSubAbaInterna('planilha');
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      {/* Sidebar Navigation */}
      <aside className="no-print w-full md:w-64 bg-white rounded-lg border border-slate-200 p-3 shadow-sm shrink-0 md:sticky md:top-24">
        <div className="text-[11px] font-extrabold text-[#1a2b4c] uppercase tracking-wider px-2 py-1 mb-2 border-l-2 border-[#c9a84e]">
          Módulos da Prestação
        </div>

        <div className="space-y-1">
          <button
            onClick={() => setModuloAtivo('planilhas')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition text-left ${
              moduloAtivo === 'planilhas'
                ? 'bg-[#1a2b4c] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText size={15} />
            <span>📑 Planilhas Oficiais & NFs</span>
          </button>

          <button
            onClick={() => setModuloAtivo('pesquisas')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition text-left ${
              moduloAtivo === 'pesquisas'
                ? 'bg-[#1a2b4c] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Search size={15} />
            <span>🔎 Pesquisa de Preços</span>
          </button>

          <button
            onClick={() => setModuloAtivo('balancete')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition text-left ${
              moduloAtivo === 'balancete'
                ? 'bg-[#1a2b4c] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Scale size={15} />
            <span>⚖️ Balancete Global</span>
          </button>

          <button
            onClick={() => setModuloAtivo('textoparte')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition text-left ${
              moduloAtivo === 'textoparte'
                ? 'bg-[#1a2b4c] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileSignature size={15} />
            <span>📝 Texto Parte</span>
          </button>

          <hr className="my-2 border-slate-200" />

          <button
            onClick={() => setModuloAtivo('arquivos')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition text-left ${
              moduloAtivo === 'arquivos'
                ? 'bg-[#1a2b4c] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FolderArchive size={15} />
            <span>📁 Arquivos Salvos</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full min-w-0">
        {moduloAtivo === 'planilhas' && (
          <div className="space-y-4">
            {/* NF Switcher Bar */}
            <div className="no-print bg-slate-200/80 p-2 rounded-lg flex items-center gap-2 overflow-x-auto shadow-inner">
              <span className="text-xs font-bold text-[#1a2b4c] px-2 whitespace-nowrap">
                📋 NFs Lançadas:
              </span>

              {nfs.map((nf) => {
                const isEditing = editingNfId === nf.id;
                const isActive = nfAtivaId === nf.id;

                if (isEditing) {
                  return (
                    <div
                      key={nf.id}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-white text-slate-800 border-2 border-[#1a2b4c] shadow-sm whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        autoFocus
                        value={tempLabel}
                        onChange={(e) => setTempLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') salvarEdicaoNF(nf.id);
                          if (e.key === 'Escape') cancelarEdicaoNF();
                        }}
                        className="w-28 text-xs font-bold text-[#1a2b4c] px-1.5 py-0.5 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1a2b4c]"
                        placeholder="Nome da NF"
                      />
                      <button
                        type="button"
                        onClick={() => salvarEdicaoNF(nf.id)}
                        className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition"
                        title="Salvar nome"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={cancelarEdicaoNF}
                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition"
                        title="Cancelar"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={nf.id}
                    onClick={() => setNfAtivaId(nf.id)}
                    className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition whitespace-nowrap border ${
                      isActive
                        ? 'bg-[#1a2b4c] text-white border-[#1a2b4c] shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <span>{nf.label}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        iniciarEdicaoNF(nf);
                      }}
                      className={`p-0.5 rounded transition ${
                        isActive
                          ? 'hover:text-[#e5cd8a]'
                          : 'text-slate-400 hover:text-slate-800'
                      }`}
                      title="Renomear identificação da NF"
                    >
                      <Edit2 size={12} />
                    </button>
                    {nfs.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          solicitarExcluirNF(nf);
                        }}
                        className={`p-0.5 rounded transition ${
                          isActive
                            ? 'text-red-300 hover:text-red-100'
                            : 'text-slate-300 hover:text-red-600'
                        }`}
                        title="Excluir esta NF"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })}

              <div className="ml-auto flex items-center gap-2 shrink-0">
                {nfAtiva && (
                  <button
                    type="button"
                    onClick={() => solicitarExcluirNF(nfAtiva)}
                    className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md transition shadow-sm whitespace-nowrap"
                    title={nfs.length > 1 ? "Excluir esta Nota Fiscal do projeto" : "Limpar itens desta Nota Fiscal"}
                  >
                    <Trash2 size={13} />
                    <span>{nfs.length > 1 ? 'Excluir NF' : 'Limpar NF'}</span>
                  </button>
                )}
                <button
                  onClick={handleNovaNF}
                  className="flex items-center gap-1 bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-xs font-semibold px-3 py-1.5 rounded-md transition shadow-sm whitespace-nowrap"
                >
                  <Plus size={13} />
                  <span>Adicionar Outra NF</span>
                </button>
              </div>
            </div>

            {/* Sub-tabs for the active NF */}
            {nfAtiva && (
              <div>
                <div className="no-print flex items-center justify-between gap-3 bg-slate-100 p-1.5 rounded-lg border border-slate-200 mb-4 overflow-x-auto">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setSubAbaInterna('planilha')}
                      className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                        subAbaInterna === 'planilha'
                          ? 'bg-white text-[#1a2b4c] shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      📑 Planilha de Composição
                    </button>
                    <button
                      onClick={() => setSubAbaInterna('leitor')}
                      className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                        subAbaInterna === 'leitor'
                          ? 'bg-white text-[#1a2b4c] shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      📸 Extrair NF (XML/PDF/OCR)
                    </button>
                    <button
                      onClick={() => setSubAbaInterna('fornecedores')}
                      className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                        subAbaInterna === 'fornecedores'
                          ? 'bg-white text-[#1a2b4c] shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🏢 Fornecedores ({nfAtiva.suppliers?.length || 0})
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onSalvarProjetoAtual}
                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded transition shadow-sm"
                    >
                      <Save size={13} />
                      <span>Salvar Projeto</span>
                    </button>
                  </div>
                </div>

                {/* Sub-tab view */}
                {subAbaInterna === 'planilha' && (
                  <TabelaComposicao
                    nf={nfAtiva}
                    onUpdateNF={handleUpdateNF}
                    pesquisas={pesquisas}
                    onChangePesquisas={onChangePesquisas}
                  />
                )}

                {subAbaInterna === 'leitor' && (
                  <ExtratorNF
                    onExportarParaPlanilha={handleExportarItensLeitor}
                    nfLabel={nfAtiva.label}
                  />
                )}

                {subAbaInterna === 'fornecedores' && (
                  <CatalogoFornecedores
                    suppliers={nfAtiva.suppliers || []}
                    onChangeSuppliers={handleUpdateSuppliers}
                    nfLabel={nfAtiva.label}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {moduloAtivo === 'pesquisas' && (
          <PesquisasPrecosView
            pesquisas={pesquisas}
            onChangePesquisas={onChangePesquisas}
            nfs={nfs}
            onChangeNFs={onChangeNFs}
          />
        )}

        {moduloAtivo === 'balancete' && (
          <BalanceteGlobalView
            balancete={balancete}
            onChangeBalancete={onChangeBalancete}
            nfs={nfs}
          />
        )}

        {moduloAtivo === 'textoparte' && (
          <TextoParteView
            textoParte={textoParte}
            onChangeTextoParte={onChangeTextoParte}
            nfs={nfs}
          />
        )}

        {moduloAtivo === 'arquivos' && (
          <ArquivosSalvosView
            arquivos={arquivos}
            onSalvarProjetoAtual={onSalvarProjetoAtual}
            onCarregarProjeto={onCarregarProjeto}
            onRenomearProjeto={onRenomearProjeto}
            onDuplicarProjeto={onDuplicarProjeto}
            onCriarNovoProjetoEmBranco={onCriarNovoProjetoEmBranco}
            onExcluirProjeto={onExcluirProjeto}
            onLimparHistorico={onLimparHistorico}
            onImportarBackupJSON={onImportarBackupJSON}
            nfsAtuais={nfs}
            pesquisasAtuais={pesquisas}
          />
        )}
      </main>

      {/* Modal de Confirmação de Exclusão de NF */}
      {nfParaExcluir && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {nfs.length > 1 ? 'Excluir Nota Fiscal' : 'Limpar Nota Fiscal'}
                </h3>
                <p className="text-xs text-slate-500">
                  Identificador: <strong>{nfParaExcluir.label}</strong>
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-700 mb-5 leading-relaxed">
              {nfs.length > 1 ? (
                <>
                  Tem certeza de que deseja excluir a nota fiscal <strong>"{nfParaExcluir.label}"</strong> e remover todos os seus itens da prestação de contas?
                </>
              ) : (
                <>
                  Como esta é a única nota fiscal do projeto, a confirmação irá <strong>limpar todos os itens lançados</strong> e reiniciar a planilha para novos lançamentos.
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setNfParaExcluir(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarExcluirNF}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition shadow-sm"
              >
                {nfs.length > 1 ? 'Sim, Excluir NF' : 'Sim, Limpar NF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
