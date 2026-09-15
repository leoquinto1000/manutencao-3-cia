import React, { useState } from 'react';
import { Supplier, EmpresaCadastrada } from '../../types';
import { Plus, Trash2, CheckCircle2, Building2, Download, Save, Check, Search } from 'lucide-react';
import { gerarId } from '../../utils';

interface CatalogoFornecedoresProps {
  suppliers: Supplier[];
  onChangeSuppliers: (suppliers: Supplier[]) => void;
  nfLabel: string;
  bancoFornecedores?: EmpresaCadastrada[];
  onAdicionarAoBanco?: (emp: EmpresaCadastrada) => void;
}

export const CatalogoFornecedores: React.FC<CatalogoFornecedoresProps> = ({
  suppliers,
  onChangeSuppliers,
  nfLabel,
  bancoFornecedores = [],
  onAdicionarAoBanco,
}) => {
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [modalBancoAberto, setModalBancoAberto] = useState(false);
  const [buscaBanco, setBuscaBanco] = useState('');

  const handleAddSupplier = () => {
    const nextNum = suppliers.length + 1;
    const newSupplier: Supplier = {
      id: gerarId(),
      num: nextNum,
      name: `Empresa ${nextNum}`,
      razaoSocial: `Empresa ${nextNum} Comercial Ltda`,
      cnpj: '',
      endereco: 'São Paulo - SP',
      contato: '-',
    };
    onChangeSuppliers([...suppliers, newSupplier]);
    setMensagem(`✅ Empresa ${nextNum} adicionada ao catálogo!`);
    setTimeout(() => setMensagem(null), 3000);
  };

  // Importar empresa do banco permanente para esta NF
  const handleImportarDoBanco = (emp: EmpresaCadastrada) => {
    // Verifica se já existe fornecedor com mesmo CNPJ ou mesmo Nome nesta NF
    const jaExiste = suppliers.some((s) => {
      const matchCnpj = emp.cnpj && s.cnpj && emp.cnpj.replace(/\D/g, '') === s.cnpj.replace(/\D/g, '');
      const matchNome = s.name.trim().toLowerCase() === emp.name.trim().toLowerCase();
      return matchCnpj || matchNome;
    });

    if (jaExiste) {
      setMensagem(`⚠️ A empresa "${emp.name}" já está presente nesta Nota Fiscal.`);
      setTimeout(() => setMensagem(null), 3500);
      return;
    }

    const nextNum = suppliers.length + 1;
    const novo: Supplier = {
      id: gerarId(),
      num: nextNum,
      name: emp.name,
      razaoSocial: emp.razaoSocial || emp.name,
      cnpj: emp.cnpj || '',
      endereco: emp.endereco || 'São Paulo - SP',
      contato: emp.contato || emp.telefone || '-',
    };

    onChangeSuppliers([...suppliers, novo]);
    setMensagem(`✅ Empresa "${emp.name}" importada do banco com sucesso para ${nfLabel}!`);
    setTimeout(() => setMensagem(null), 3500);
  };

  // Salvar uma empresa desta NF no banco permanente
  const handleSalvarNoBancoGeral = (sup: Supplier) => {
    if (!onAdicionarAoBanco) return;
    const novaEmpresaBanco: EmpresaCadastrada = {
      id: gerarId(),
      name: sup.name,
      razaoSocial: sup.razaoSocial || sup.name,
      cnpj: sup.cnpj || '',
      endereco: sup.endereco || 'São Paulo - SP',
      contato: sup.contato || '-',
      telefone: sup.contato?.match(/(\(?\d{2}\)?\s*[\d-]{8,10})/)?.[0] || '',
      segmento: 'Construção & Manutenção Geral',
      dataCadastro: new Date().toISOString().slice(0, 10),
    };
    onAdicionarAoBanco(novaEmpresaBanco);
    setMensagem(`💾 "${sup.name}" salva no Banco Geral de Fornecedores!`);
    setTimeout(() => setMensagem(null), 3500);
  };

  const handleUpdate = (id: string, field: keyof Supplier, value: string | number) => {
    onChangeSuppliers(
      suppliers.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, [field]: value };
        // Se alterou o Nome Fantasia e a Razão Social era vazia, igual ao nome anterior ou padrão "Empresa ", sincroniza
        if (field === 'name') {
          const strVal = String(value);
          if (!s.razaoSocial || s.razaoSocial === s.name || s.razaoSocial.startsWith('Empresa ')) {
            updated.razaoSocial = strVal;
          }
        }
        return updated;
      })
    );
  };

  const handleRemove = (id: string) => {
    const filtered = suppliers.filter((s) => s.id !== id);
    // Renumera ordenadamente
    const renumbered = filtered.map((s, idx) => ({ ...s, num: idx + 1 }));
    onChangeSuppliers(renumbered);
    setMensagem('🗑️ Fornecedor removido da NF.');
    setTimeout(() => setMensagem(null), 3000);
  };

  // Empresas do banco disponíveis para puxar
  const empresasDisponiveisBanco = bancoFornecedores.filter((emp) => {
    const termo = buscaBanco.toLowerCase().trim();
    if (termo && !emp.name.toLowerCase().includes(termo) && !emp.cnpj.toLowerCase().includes(termo)) {
      return false;
    }
    return true;
  });

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm max-w-5xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-[#1a2b4c] flex items-center gap-2">
            <Building2 size={20} className="text-[#1a2b4c]" />
            <span>Catálogo de Fornecedores • {nfLabel}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Empresas cotadas nesta nota. Dados atualizados aqui refletem automaticamente nas planilhas e pesquisas de preços.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {bancoFornecedores.length > 0 && (
            <button
              type="button"
              onClick={() => setModalBancoAberto(true)}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-bold px-3 py-2 rounded-md transition shadow-xs cursor-pointer"
              title="Puxar empresas do banco permanente de fornecedores cadastrados"
            >
              <Download size={14} />
              <span>Puxar do Banco ({bancoFornecedores.length})</span>
            </button>
          )}
          <button
            onClick={handleAddSupplier}
            className="flex items-center gap-1.5 bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-xs font-semibold px-3.5 py-2 rounded-md transition shadow-xs cursor-pointer"
          >
            <Plus size={14} />
            <span>Novo Fornecedor</span>
          </button>
        </div>
      </div>

      {mensagem && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs px-3.5 py-2 rounded-md flex items-center justify-between">
          <span className="font-medium">{mensagem}</span>
          <button onClick={() => setMensagem(null)} className="text-emerald-700 hover:text-emerald-950 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Dica de sincronização automática */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-md p-2.5 text-[11px] text-amber-900 flex items-center gap-2">
        <CheckCircle2 size={14} className="text-amber-700 shrink-0" />
        <span>
          <strong>Sincronização em tempo real:</strong> Ao alterar o nome, contato ou CNPJ de qualquer empresa, todos os cabeçalhos da planilha oficial e as folhas de cotação associadas são atualizados imediatamente.
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse border border-slate-300">
          <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px]">
            <tr>
              <th className="border border-slate-300 px-3 py-2 text-center w-24">Número</th>
              <th className="border border-slate-300 px-3 py-2 w-48">Nome Fantasia</th>
              <th className="border border-slate-300 px-3 py-2">Razão Social & CNPJ</th>
              <th className="border border-slate-300 px-3 py-2">Endereço Completo</th>
              <th className="border border-slate-300 px-3 py-2 w-40">Contato</th>
              <th className="no-print border border-slate-300 px-2 py-2 text-center w-12">Ação</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={6} className="border border-slate-300 p-8 text-center bg-slate-50">
                  <div className="max-w-md mx-auto space-y-2">
                    <Building2 size={32} className="mx-auto text-slate-400" />
                    <p className="text-sm font-bold text-slate-700">
                      Nenhum fornecedor cadastrado nesta nota
                    </p>
                    <p className="text-xs text-slate-500">
                      Não é obrigatório manter fornecedor cadastrado de antemão. Ele poderá ser inserido posteriormente ou importado diretamente do Banco Permanente.
                    </p>
                    <div className="pt-2 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddSupplier}
                        className="bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-xs font-semibold px-3 py-1.5 rounded transition"
                      >
                        + Inserir Fornecedor
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalBancoAberto(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-3 py-1.5 rounded transition"
                      >
                        📥 Puxar do Banco
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              suppliers.map((sup) => (
                <tr key={sup.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="border border-slate-300 px-3 py-2 text-center font-bold bg-slate-50 text-[#1a2b4c]">
                    Empresa {sup.num}
                  </td>
                  <td className="border border-slate-300 p-1.5">
                    <input
                      type="text"
                      value={sup.name}
                      onChange={(e) => handleUpdate(sup.id, 'name', e.target.value)}
                      placeholder="Nome Fantasia..."
                      className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-white rounded font-bold text-slate-900"
                    />
                  </td>
                  <td className="border border-slate-300 p-1.5">
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={sup.razaoSocial}
                        onChange={(e) => handleUpdate(sup.id, 'razaoSocial', e.target.value)}
                        className="w-full px-2 py-0.5 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-white rounded text-slate-800 font-medium"
                        placeholder="Razão Social..."
                      />
                      <input
                        type="text"
                        value={sup.cnpj || ''}
                        onChange={(e) => handleUpdate(sup.id, 'cnpj', e.target.value)}
                        className="w-full px-2 py-0.5 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-white rounded text-slate-600 font-mono text-[10.5px]"
                        placeholder="CNPJ: 00.000.000/0000-00"
                      />
                    </div>
                  </td>
                  <td className="border border-slate-300 p-1.5">
                    <input
                      type="text"
                      value={sup.endereco}
                      onChange={(e) => handleUpdate(sup.id, 'endereco', e.target.value)}
                      className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-white rounded text-slate-700"
                      placeholder="Endereço, Bairro, Cidade - UF"
                    />
                  </td>
                  <td className="border border-slate-300 p-1.5">
                    <input
                      type="text"
                      value={sup.contato}
                      onChange={(e) => handleUpdate(sup.id, 'contato', e.target.value)}
                      className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-white rounded text-slate-700 font-mono text-[11px]"
                      placeholder="Telefone / E-mail / Contato"
                    />
                  </td>
                  <td className="no-print border border-slate-300 p-1 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {onAdicionarAoBanco && !sup.name.startsWith('Empresa ') && (
                        <button
                          type="button"
                          onClick={() => handleSalvarNoBancoGeral(sup)}
                          className="text-amber-600 hover:text-amber-800 p-1 rounded hover:bg-amber-50 transition cursor-pointer"
                          title="Salvar esta empresa no Banco Geral permanente para usar em outras prestações"
                        >
                          <Save size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemove(sup.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition cursor-pointer"
                        title="Excluir fornecedor desta NF"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para Puxar Empresas do Banco */}
      {modalBancoAberto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-2xl w-full p-5 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-[#1a2b4c]" />
                <h3 className="font-bold text-sm text-[#1a2b4c]">
                  Importar Fornecedor do Banco Geral para {nfLabel}
                </h3>
              </div>
              <button
                onClick={() => setModalBancoAberto(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded font-bold"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={buscaBanco}
                onChange={(e) => setBuscaBanco(e.target.value)}
                placeholder="Filtrar por nome ou CNPJ..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1a2b4c]"
              />
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-md">
              {empresasDisponiveisBanco.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  Nenhuma empresa encontrada no banco permanente com esse termo.
                </div>
              ) : (
                empresasDisponiveisBanco.map((emp) => {
                  const jaNaNF = suppliers.some(
                    (s) =>
                      (emp.cnpj && s.cnpj && emp.cnpj.replace(/\D/g, '') === s.cnpj.replace(/\D/g, '')) ||
                      s.name.trim().toLowerCase() === emp.name.trim().toLowerCase()
                  );

                  return (
                    <div
                      key={emp.id}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#1a2b4c]">{emp.name}</span>
                          {emp.segmento && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                              {emp.segmento}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {emp.razaoSocial} • <span className="font-mono">{emp.cnpj || 'Sem CNPJ'}</span>
                        </div>
                        <div className="text-[10.5px] text-slate-400 truncate">
                          {emp.endereco} • {emp.telefone || emp.contato}
                        </div>
                      </div>

                      <div>
                        {jaNaNF ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                            <Check size={12} />
                            <span>Já Adicionada</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleImportarDoBanco(emp)}
                            className="inline-flex items-center gap-1 bg-[#1a2b4c] hover:bg-[#2c4373] text-white font-bold text-xs px-3 py-1.5 rounded transition shadow-2xs cursor-pointer"
                          >
                            <Download size={12} />
                            <span>Importar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setModalBancoAberto(false)}
                className="px-4 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
