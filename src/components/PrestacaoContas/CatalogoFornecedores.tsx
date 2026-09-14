import React, { useState } from 'react';
import { Supplier } from '../../types';
import { Plus, Trash2, CheckCircle2, Building2 } from 'lucide-react';
import { gerarId } from '../../utils';

interface CatalogoFornecedoresProps {
  suppliers: Supplier[];
  onChangeSuppliers: (suppliers: Supplier[]) => void;
  nfLabel: string;
}

export const CatalogoFornecedores: React.FC<CatalogoFornecedoresProps> = ({
  suppliers,
  onChangeSuppliers,
  nfLabel,
}) => {
  const [mensagem, setMensagem] = useState<string | null>(null);

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
    if (suppliers.length <= 1) {
      setMensagem('⚠️ É necessário manter pelo menos 1 fornecedor cadastrado.');
      setTimeout(() => setMensagem(null), 3000);
      return;
    }
    const filtered = suppliers.filter((s) => s.id !== id);
    // Renumera ordenadamente
    const renumbered = filtered.map((s, idx) => ({ ...s, num: idx + 1 }));
    onChangeSuppliers(renumbered);
    setMensagem('🗑️ Fornecedor removido e numeração atualizada.');
    setTimeout(() => setMensagem(null), 3000);
  };

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
        <button
          onClick={handleAddSupplier}
          className="flex items-center gap-1.5 bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-xs font-semibold px-3.5 py-2 rounded-md transition shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus size={14} />
          <span>Novo Fornecedor</span>
        </button>
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
            {suppliers.map((sup) => (
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
                  <button
                    onClick={() => handleRemove(sup.id)}
                    disabled={suppliers.length <= 1}
                    className="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed p-1 rounded hover:bg-red-50 transition"
                    title={suppliers.length <= 1 ? "Mínimo de 1 fornecedor obrigatório" : "Excluir fornecedor"}
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
