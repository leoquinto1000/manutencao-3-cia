import React, { useState, useMemo } from 'react';
import { EmpresaCadastrada, NFInstance, Supplier } from '../../types';
import {
  Building2,
  Plus,
  Search,
  Send,
  Edit2,
  Trash2,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Tag,
  Download,
  Upload,
  MessageCircle,
  FileSpreadsheet,
  ArrowRight,
  Filter,
  Check,
  X,
  Building,
} from 'lucide-react';
import { gerarId } from '../../utils';

interface BancoFornecedoresViewProps {
  bancoFornecedores: EmpresaCadastrada[];
  onChangeBancoFornecedores: (empresas: EmpresaCadastrada[]) => void;
  nfs: NFInstance[];
  onChangeNFs: (nfs: NFInstance[]) => void;
  nfAtivaId?: number;
  onNavegarParaAbaFornecedores?: (nfId: number) => void;
}

export const BancoFornecedoresView: React.FC<BancoFornecedoresViewProps> = ({
  bancoFornecedores,
  onChangeBancoFornecedores,
  nfs,
  onChangeNFs,
  nfAtivaId,
  onNavegarParaAbaFornecedores,
}) => {
  // Busca e Filtros
  const [busca, setBusca] = useState('');
  const [filtroSegmento, setFiltroSegmento] = useState('todos');

  // Seleção múltipla para envio em lote
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [nfDestinoLote, setNfDestinoLote] = useState<number>(nfAtivaId || nfs[0]?.id || 1);

  // Modal de Criação / Edição
  const [modalAberto, setModalAberto] = useState(false);
  const [empresaEmEdicao, setEmpresaEmEdicao] = useState<EmpresaCadastrada | null>(null);
  const [empresaParaExcluir, setEmpresaParaExcluir] = useState<{ id: string; nome: string } | null>(null);

  // Formulário
  const [formNome, setFormNome] = useState('');
  const [formRazaoSocial, setFormRazaoSocial] = useState('');
  const [formCnpj, setFormCnpj] = useState('');
  const [formEndereco, setFormEndereco] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formSegmento, setFormSegmento] = useState('');
  const [formObservacoes, setFormObservacoes] = useState('');

  // Notificações de feedback
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'info'; texto: string; nfId?: number } | null>(null);

  // Segmentos disponíveis para filtro
  const segmentos = useMemo(() => {
    const segs = new Set<string>();
    bancoFornecedores.forEach((emp) => {
      if (emp.segmento && emp.segmento.trim()) {
        segs.add(emp.segmento.trim());
      }
    });
    return Array.from(segs);
  }, [bancoFornecedores]);

  // Lista filtrada
  const empresasFiltradas = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return bancoFornecedores.filter((emp) => {
      const matchBusca =
        !termo ||
        emp.name.toLowerCase().includes(termo) ||
        emp.razaoSocial.toLowerCase().includes(termo) ||
        emp.cnpj.toLowerCase().includes(termo) ||
        emp.endereco.toLowerCase().includes(termo) ||
        (emp.segmento && emp.segmento.toLowerCase().includes(termo)) ||
        (emp.contato && emp.contato.toLowerCase().includes(termo));

      const matchSegmento =
        filtroSegmento === 'todos' || emp.segmento === filtroSegmento;

      return matchBusca && matchSegmento;
    });
  }, [bancoFornecedores, busca, filtroSegmento]);

  // Helper para link WhatsApp
  const obterLinkWhatsapp = (telefone?: string) => {
    if (!telefone) return null;
    const apenasDigitos = telefone.replace(/\D/g, '');
    if (!apenasDigitos || apenasDigitos.length < 8) return null;
    const numeroCompleto = apenasDigitos.startsWith('55')
      ? apenasDigitos
      : `55${apenasDigitos}`;
    return `https://wa.me/${numeroCompleto}`;
  };

  // Abrir modal para novo
  const handleAbrirNovo = () => {
    setEmpresaEmEdicao(null);
    setFormNome('');
    setFormRazaoSocial('');
    setFormCnpj('');
    setFormEndereco('São Paulo - SP');
    setFormTelefone('');
    setFormEmail('');
    setFormSegmento('Materiais Elétricos');
    setFormObservacoes('');
    setModalAberto(true);
  };

  // Abrir modal para edição
  const handleAbrirEditar = (emp: EmpresaCadastrada) => {
    setEmpresaEmEdicao(emp);
    setFormNome(emp.name);
    setFormRazaoSocial(emp.razaoSocial || emp.name);
    setFormCnpj(emp.cnpj || '');
    setFormEndereco(emp.endereco || '');
    setFormTelefone(emp.telefone || '');
    setFormEmail(emp.email || '');
    setFormSegmento(emp.segmento || 'Construção Geral');
    setFormObservacoes(emp.observacoes || '');
    setModalAberto(true);
  };

  // Salvar cadastro ou edição
  const handleSalvarEmpresa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) return;

    const contatoCompleto = [formTelefone.trim(), formEmail.trim()]
      .filter(Boolean)
      .join(' / ') || formTelefone.trim() || '-';

    if (empresaEmEdicao) {
      // Atualiza existente
      const atualizadas = bancoFornecedores.map((emp) =>
        emp.id === empresaEmEdicao.id
          ? {
              ...emp,
              name: formNome.trim(),
              razaoSocial: formRazaoSocial.trim() || formNome.trim(),
              cnpj: formCnpj.trim(),
              endereco: formEndereco.trim(),
              telefone: formTelefone.trim(),
              email: formEmail.trim(),
              contato: contatoCompleto,
              segmento: formSegmento.trim(),
              observacoes: formObservacoes.trim(),
            }
          : emp
      );
      onChangeBancoFornecedores(atualizadas);
      setFeedback({ tipo: 'sucesso', texto: `Empresa "${formNome.trim()}" atualizada no banco!` });
    } else {
      // Adiciona novo
      const novaEmpresa: EmpresaCadastrada = {
        id: gerarId(),
        name: formNome.trim(),
        razaoSocial: formRazaoSocial.trim() || formNome.trim(),
        cnpj: formCnpj.trim(),
        endereco: formEndereco.trim(),
        telefone: formTelefone.trim(),
        email: formEmail.trim(),
        contato: contatoCompleto,
        segmento: formSegmento.trim(),
        observacoes: formObservacoes.trim(),
        dataCadastro: new Date().toISOString().slice(0, 10),
      };
      onChangeBancoFornecedores([novaEmpresa, ...bancoFornecedores]);
      setFeedback({ tipo: 'sucesso', texto: `Nova empresa "${formNome.trim()}" cadastrada no banco!` });
    }

    setModalAberto(false);
    setTimeout(() => setFeedback(null), 4000);
  };

  // Excluir empresa do banco
  const handleExcluir = (id: string, nome: string) => {
    setEmpresaParaExcluir({ id, nome });
  };

  const confirmarExclusaoEmpresa = () => {
    if (!empresaParaExcluir) return;
    const { id, nome } = empresaParaExcluir;
    onChangeBancoFornecedores(bancoFornecedores.filter((e) => e.id !== id));
    setSelecionados((prev) => prev.filter((sId) => sId !== id));
    setEmpresaParaExcluir(null);
    setFeedback({ tipo: 'info', texto: `Empresa "${nome}" removida do banco permanente.` });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Enviar uma ou múltiplas empresas para a aba Fornecedores de uma NF específica
  const handleEnviarParaNF = (empresasParaEnviar: EmpresaCadastrada[], targetNfId: number) => {
    if (empresasParaEnviar.length === 0) return;

    const targetNF = nfs.find((n) => n.id === targetNfId) || nfs[0];
    if (!targetNF) return;

    const currentSuppliers: Supplier[] = targetNF.suppliers ? [...targetNF.suppliers] : [];
    let adicionadasCount = 0;
    let atualizadasCount = 0;

    empresasParaEnviar.forEach((emp) => {
      // Verifica se já existe fornecedor com mesmo CNPJ ou mesmo Nome na NF
      const existingIdx = currentSuppliers.findIndex((s) => {
        const matchCnpj = emp.cnpj && s.cnpj && emp.cnpj.replace(/\D/g, '') === s.cnpj.replace(/\D/g, '');
        const matchNome = s.name.trim().toLowerCase() === emp.name.trim().toLowerCase();
        return matchCnpj || matchNome;
      });

      if (existingIdx >= 0) {
        // Atualiza dados mantendo o mesmo número
        currentSuppliers[existingIdx] = {
          ...currentSuppliers[existingIdx],
          name: emp.name,
          razaoSocial: emp.razaoSocial || emp.name,
          cnpj: emp.cnpj,
          endereco: emp.endereco,
          contato: emp.contato || emp.telefone || '-',
        };
        atualizadasCount++;
      } else {
        // Adiciona novo fornecedor na NF
        const nextNum = currentSuppliers.length + 1;
        currentSuppliers.push({
          id: gerarId(),
          num: nextNum,
          name: emp.name,
          razaoSocial: emp.razaoSocial || emp.name,
          cnpj: emp.cnpj,
          endereco: emp.endereco,
          contato: emp.contato || emp.telefone || '-',
        });
        adicionadasCount++;
      }
    });

    // Atualiza as NFs
    const newTotalEmpresas = Math.max(targetNF.totalEmpresas || 3, currentSuppliers.length);
    const updatedNFs = nfs.map((n) =>
      n.id === targetNfId
        ? {
            ...n,
            totalEmpresas: newTotalEmpresas,
            suppliers: currentSuppliers,
          }
        : n
    );

    onChangeNFs(updatedNFs);

    // Mensagem de sucesso
    const partes = [];
    if (adicionadasCount > 0) partes.push(`${adicionadasCount} nova(s) empresa(s) adicionada(s)`);
    if (atualizadasCount > 0) partes.push(`${atualizadasCount} empresa(s) atualizada(s)`);
    const textoMsg = `✅ ${partes.join(' e ')} enviada(s) com sucesso para a aba Fornecedores de "${targetNF.label}"!`;

    setFeedback({
      tipo: 'sucesso',
      texto: textoMsg,
      nfId: targetNF.id,
    });

    // Limpa seleção se foi envio em lote
    setSelecionados([]);
  };

  // Importar fornecedores das NFs atuais que ainda não estejam no banco permanente
  const handleImportarDasNFs = () => {
    let importadas = 0;
    const novosCadastros: EmpresaCadastrada[] = [...bancoFornecedores];

    nfs.forEach((nf) => {
      (nf.suppliers || []).forEach((sup) => {
        // Ignora fornecedores genéricos vazios (ex: "Empresa 1")
        if (sup.name.startsWith('Empresa ') && !sup.cnpj) return;

        const jaExiste = novosCadastros.some((b) => {
          const matchCnpj = sup.cnpj && b.cnpj && sup.cnpj.replace(/\D/g, '') === b.cnpj.replace(/\D/g, '');
          const matchNome = b.name.trim().toLowerCase() === sup.name.trim().toLowerCase();
          return matchCnpj || matchNome;
        });

        if (!jaExiste) {
          novosCadastros.push({
            id: gerarId(),
            name: sup.name,
            razaoSocial: sup.razaoSocial || sup.name,
            cnpj: sup.cnpj || '',
            endereco: sup.endereco || 'São Paulo - SP',
            contato: sup.contato || '-',
            telefone: sup.contato?.match(/(\(?\d{2}\)?\s*[\d-]{8,10})/)?.[0] || '',
            segmento: 'Construção & Manutenção Geral',
            observacoes: `Importada da ${nf.label}`,
            dataCadastro: new Date().toISOString().slice(0, 10),
          });
          importadas++;
        }
      });
    });

    if (importadas > 0) {
      onChangeBancoFornecedores(novosCadastros);
      setFeedback({
        tipo: 'sucesso',
        texto: `✅ ${importadas} empresa(s) importada(s) com sucesso da prestação atual para o Banco de Fornecedores!`,
      });
    } else {
      setFeedback({
        tipo: 'info',
        texto: `Todas as empresas das NFs já se encontram salvas no banco permanente.`,
      });
    }
    setTimeout(() => setFeedback(null), 4500);
  };

  // Toggle seleção individual
  const toggleSelecao = (id: string) => {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Toggle selecionar todas
  const toggleSelecionarTodas = () => {
    if (selecionados.length === empresasFiltradas.length) {
      setSelecionados([]);
    } else {
      setSelecionados(empresasFiltradas.map((e) => e.id));
    }
  };

  return (
    <div className="space-y-4">
      {/* Banner Principal de Boas-Vindas e Explicação */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-[#1a2b4c] text-white">
                <Building2 size={20} />
              </span>
              <div>
                <h2 className="text-base font-bold text-[#1a2b4c] flex items-center gap-2">
                  <span>Banco de Fornecedores Cadastrados</span>
                  <span className="text-xs bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-full">
                    {bancoFornecedores.length} empresas no catálogo permanente
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Banco unificado de empresas da PMESP. Ficam salvas permanentemente para uso em qualquer prestação de contas, sem precisar digitar tudo novamente.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleImportarDasNFs}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
              title="Importar para este banco as empresas que já foram digitadas nas NFs desta prestação"
            >
              <Download size={13} />
              <span>Importar das NFs Atuais</span>
            </button>

            <button
              onClick={handleAbrirNovo}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-md bg-[#1a2b4c] hover:bg-[#2c4373] text-white transition shadow-sm"
            >
              <Plus size={14} />
              <span>+ Cadastrar Nova Empresa</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert com link rápido para ir à aba fornecedores */}
        {feedback && (
          <div
            className={`mt-4 p-3 rounded-md text-xs flex items-center justify-between transition border ${
              feedback.tipo === 'sucesso'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : 'bg-blue-50 text-blue-900 border-blue-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className={feedback.tipo === 'sucesso' ? 'text-emerald-700' : 'text-blue-700'} />
              <span className="font-semibold">{feedback.texto}</span>
            </div>
            <div className="flex items-center gap-3">
              {feedback.nfId && onNavegarParaAbaFornecedores && (
                <button
                  type="button"
                  onClick={() => onNavegarParaAbaFornecedores(feedback.nfId!)}
                  className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-2.5 py-1 rounded text-[11px] transition shadow-xs cursor-pointer"
                >
                  <span>Ver na Aba Fornecedores</span>
                  <ArrowRight size={12} />
                </button>
              )}
              <button
                onClick={() => setFeedback(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por Nome Fantasia, Razão Social, CNPJ, Endereço ou Contato..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1a2b4c]"
            />
            {busca && (
              <button
                onClick={() => setBusca('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Filter size={13} className="text-slate-500" />
            <select
              value={filtroSegmento}
              onChange={(e) => setFiltroSegmento(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1a2b4c]"
            >
              <option value="todos">Todos os Segmentos</option>
              {segmentos.map((seg) => (
                <option key={seg} value={seg}>
                  {seg}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Barra de Ação em Lote (se houver itens selecionados) */}
        {selecionados.length > 0 && (
          <div className="flex items-center gap-2 w-full md:w-auto bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-md text-xs">
            <span className="font-bold text-amber-900">
              {selecionados.length} selecionada(s)
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600 font-medium">Enviar para:</span>
            <select
              value={nfDestinoLote}
              onChange={(e) => setNfDestinoLote(Number(e.target.value))}
              className="text-xs bg-white border border-amber-400 rounded px-2 py-1 font-semibold text-[#1a2b4c] focus:outline-none"
            >
              {nfs.map((nf) => (
                <option key={nf.id} value={nf.id}>
                  {nf.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                const empresas = bancoFornecedores.filter((e) => selecionados.includes(e.id));
                handleEnviarParaNF(empresas, nfDestinoLote);
              }}
              className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-2.5 py-1 rounded text-xs transition shadow-2xs cursor-pointer"
            >
              <Send size={12} />
              <span>Enviar para a Aba Fornecedores</span>
            </button>
            <button
              onClick={() => setSelecionados([])}
              className="text-slate-400 hover:text-slate-600 ml-1 text-xs"
              title="Limpar seleção"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Tabela de Empresas do Banco */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={empresasFiltradas.length > 0 && selecionados.length === empresasFiltradas.length}
                    onChange={toggleSelecionarTodas}
                    className="rounded text-[#1a2b4c] focus:ring-1 focus:ring-[#1a2b4c] cursor-pointer"
                    title="Selecionar todas"
                  />
                </th>
                <th className="p-3">Empresa / Razão Social</th>
                <th className="p-3">CNPJ</th>
                <th className="p-3">Segmento / Categoria</th>
                <th className="p-3">Endereço & Local</th>
                <th className="p-3">Telefone & WhatsApp</th>
                <th className="p-3 text-center w-52">Enviar p/ Planilha Oficial</th>
                <th className="p-3 text-center w-20">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {empresasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <Building size={36} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Nenhuma empresa encontrada</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {busca || filtroSegmento !== 'todos'
                        ? 'Tente ajustar os termos da pesquisa ou o filtro de categoria.'
                        : 'Clique em "+ Cadastrar Nova Empresa" para adicionar o primeiro fornecedor ao banco.'}
                    </p>
                  </td>
                </tr>
              ) : (
                empresasFiltradas.map((emp) => {
                  const isSelected = selecionados.includes(emp.id);
                  const linkWhats = obterLinkWhatsapp(emp.telefone);

                  return (
                    <tr
                      key={emp.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-amber-50/60' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelecao(emp.id)}
                          className="rounded text-[#1a2b4c] focus:ring-1 focus:ring-[#1a2b4c] cursor-pointer"
                        />
                      </td>

                      {/* Nome & Razão Social */}
                      <td className="p-3 font-semibold text-slate-900">
                        <div className="font-bold text-[#1a2b4c] text-xs">
                          {emp.name}
                        </div>
                        {emp.razaoSocial && emp.razaoSocial !== emp.name && (
                          <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                            {emp.razaoSocial}
                          </div>
                        )}
                        {emp.observacoes && (
                          <div className="text-[10px] text-amber-800 italic mt-0.5">
                            💡 {emp.observacoes}
                          </div>
                        )}
                      </td>

                      {/* CNPJ */}
                      <td className="p-3 font-mono text-slate-800 font-semibold whitespace-nowrap">
                        {emp.cnpj || <span className="text-slate-400 font-normal">Não informado</span>}
                      </td>

                      {/* Segmento */}
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                          <Tag size={10} className="text-slate-500" />
                          {emp.segmento || 'Geral'}
                        </span>
                      </td>

                      {/* Endereço */}
                      <td className="p-3 text-slate-600 max-w-xs truncate" title={emp.endereco}>
                        <div className="flex items-center gap-1">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{emp.endereco || '-'}</span>
                        </div>
                      </td>

                      {/* Contato & WhatsApp */}
                      <td className="p-3 text-slate-700">
                        <div className="space-y-1">
                          {emp.telefone && (
                            <div className="flex items-center gap-1.5 font-mono text-[11px]">
                              <span>{emp.telefone}</span>
                              {linkWhats && (
                                <a
                                  href={linkWhats}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9.5px] transition shadow-2xs"
                                  title="Iniciar conversa no WhatsApp"
                                >
                                  <MessageCircle size={10} />
                                  <span>Whats</span>
                                </a>
                              )}
                            </div>
                          )}
                          {emp.email && (
                            <div className="flex items-center gap-1 text-[10.5px] text-slate-500 truncate" title={emp.email}>
                              <Mail size={10} className="shrink-0" />
                              <span className="truncate">{emp.email}</span>
                            </div>
                          )}
                          {!emp.telefone && !emp.email && (
                            <span className="text-slate-400 font-mono text-[11px]">{emp.contato || '-'}</span>
                          )}
                        </div>
                      </td>

                      {/* Envio direto para uma NF específica */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <select
                            defaultValue={nfAtivaId || nfs[0]?.id || 1}
                            id={`select-nf-${emp.id}`}
                            className="text-[11px] bg-slate-50 border border-slate-300 rounded px-2 py-1 font-semibold text-[#1a2b4c] focus:outline-none focus:ring-1 focus:ring-[#1a2b4c] max-w-[110px] truncate"
                          >
                            {nfs.map((nf) => (
                              <option key={nf.id} value={nf.id}>
                                {nf.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              const sel = document.getElementById(`select-nf-${emp.id}`) as HTMLSelectElement;
                              const targetId = sel ? Number(sel.value) : (nfAtivaId || nfs[0]?.id || 1);
                              handleEnviarParaNF([emp], targetId);
                            }}
                            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded transition shadow-2xs whitespace-nowrap cursor-pointer"
                            title="Enviar esta empresa diretamente para a aba de fornecedores da NF selecionada"
                          >
                            <Send size={11} />
                            <span>Enviar</span>
                          </button>
                        </div>
                      </td>

                      {/* Ações (Editar / Excluir) */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleAbrirEditar(emp)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                            title="Editar dados da empresa no banco"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleExcluir(emp.id, emp.name)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                            title="Remover do banco de fornecedores"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação / Edição de Empresa */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-xl w-full p-6 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-[#1a2b4c] flex items-center gap-2">
                <Building2 size={18} className="text-[#1a2b4c]" />
                <span>{empresaEmEdicao ? 'Editar Empresa no Banco' : 'Cadastrar Nova Empresa no Banco'}</span>
              </h3>
              <button
                onClick={() => setModalAberto(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarEmpresa} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Nome Fantasia / Nome Comercial: *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    placeholder="Ex: Comercial Barro Branco, EletroNorte, etc."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c] font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Razão Social:</label>
                  <input
                    type="text"
                    value={formRazaoSocial}
                    onChange={(e) => setFormRazaoSocial(e.target.value)}
                    placeholder="Ex: Comercial Barro Branco Mat. Constr. Ltda"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">CNPJ:</label>
                  <input
                    type="text"
                    value={formCnpj}
                    onChange={(e) => setFormCnpj(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c] font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Segmento / Categoria:</label>
                  <input
                    type="text"
                    value={formSegmento}
                    onChange={(e) => setFormSegmento(e.target.value)}
                    placeholder="Ex: Materiais Elétricos, Hidráulica, Tintas, Ferramentas..."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone / WhatsApp:</label>
                  <input
                    type="text"
                    value={formTelefone}
                    onChange={(e) => setFormTelefone(e.target.value)}
                    placeholder="(11) 99999-9999 ou (11) 2222-3333"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c] font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Endereço Completo:</label>
                  <input
                    type="text"
                    value={formEndereco}
                    onChange={(e) => setFormEndereco(e.target.value)}
                    placeholder="Rua, Número, Bairro, Cidade - UF, CEP"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">E-mail de Cotação / Contato:</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="vendas@empresa.com.br"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Observações / Vendedor:</label>
                  <input
                    type="text"
                    value={formObservacoes}
                    onChange={(e) => setFormObservacoes(e.target.value)}
                    placeholder="Nome do vendedor, condições de entrega..."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-[#1a2b4c] hover:bg-[#2c4373] text-white font-bold transition shadow-xs"
                >
                  {empresaEmEdicao ? 'Salvar Alterações' : 'Cadastrar no Banco'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Estilizado de Confirmação de Exclusão de Empresa */}
      {empresaParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-800 text-center">
              Remover Empresa
            </h3>
            <p className="text-xs text-slate-600 mt-2.5 text-center leading-relaxed">
              Deseja realmente remover a empresa <strong>"{empresaParaExcluir.nome}"</strong> do banco permanente de fornecedores?
            </p>
            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setEmpresaParaExcluir(null)}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarExclusaoEmpresa}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
