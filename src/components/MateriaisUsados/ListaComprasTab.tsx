import React, { useState } from 'react';
import { ItemListaCompras } from '../../types';
import { gerarId, formatMoeda } from '../../utils';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Search,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  Tag,
  DollarSign,
  Clock,
  CheckCheck,
} from 'lucide-react';

interface ListaComprasTabProps {
  itensCompras: ItemListaCompras[];
  onChangeItensCompras: (itens: ItemListaCompras[]) => void;
}

export const ListaComprasTab: React.FC<ListaComprasTabProps> = ({
  itensCompras,
  onChangeItensCompras,
}) => {
  const [busca, setBusca] = useState('');
  const [filtroPrioridade, setFiltroPrioridade] = useState<'todos' | 'Alta' | 'Média' | 'Baixa'>('todos');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'Pendente' | 'Em Cotação' | 'Aprovado' | 'Comprado'>('todos');

  const handleAdd = () => {
    const novo: ItemListaCompras = {
      id: gerarId(),
      descricao: 'Novo Material Solicitado',
      unidade: 'UN',
      qtd: 1,
      prioridade: 'Alta',
      justificativa: 'Substituição / Manutenção predial da 3ª Cia',
      localAplicacao: 'Alojamento da 3ª Cia',
      precoEstimadoUnitario: 0,
      status: 'Pendente',
      dataRegistro: new Date().toLocaleDateString('pt-BR'),
    };
    onChangeItensCompras([novo, ...itensCompras]);
  };

  const handleUpdate = (id: string, field: keyof ItemListaCompras, val: any) => {
    onChangeItensCompras(
      itensCompras.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  const handleRemove = (id: string) => {
    onChangeItensCompras(itensCompras.filter((it) => it.id !== id));
  };

  const alternarComprado = (id: string) => {
    onChangeItensCompras(
      itensCompras.map((it) => {
        if (it.id !== id) return it;
        return {
          ...it,
          status: it.status === 'Comprado' ? 'Pendente' : 'Comprado',
        };
      })
    );
  };

  // Estatísticas da lista
  const metricas = React.useMemo(() => {
    let valorTotal = 0;
    let pendentes = 0;
    let urgentes = 0;
    itensCompras.forEach((it) => {
      const subtotal = (Number(it.qtd) || 0) * (Number(it.precoEstimadoUnitario) || 0);
      valorTotal += subtotal;
      if (it.status !== 'Comprado') pendentes++;
      if (it.prioridade === 'Alta' && it.status !== 'Comprado') urgentes++;
    });
    return { valorTotal, pendentes, urgentes };
  }, [itensCompras]);

  const filtrados = itensCompras.filter((it) => {
    const termo = busca.toLowerCase();
    const bateTexto =
      !termo ||
      it.descricao.toLowerCase().includes(termo) ||
      it.localAplicacao.toLowerCase().includes(termo) ||
      it.justificativa.toLowerCase().includes(termo);

    if (!bateTexto) return false;
    if (filtroPrioridade !== 'todos' && it.prioridade !== filtroPrioridade) return false;
    if (filtroStatus !== 'todos' && it.status !== filtroStatus) return false;

    return true;
  });

  const handleExportCSV = () => {
    const headers = [
      'Data Solicitação',
      'Descrição do Item',
      'Unidade',
      'Qtd',
      'Preço Estimado Unitário (R$)',
      'Preço Estimado Total (R$)',
      'Prioridade',
      'Local de Aplicação',
      'Justificativa',
      'Status',
    ];
    const rows = itensCompras.map((it) => [
      it.dataRegistro,
      `"${it.descricao.replace(/"/g, '""')}"`,
      it.unidade,
      it.qtd,
      (it.precoEstimadoUnitario || 0).toFixed(2),
      ((it.qtd || 0) * (it.precoEstimadoUnitario || 0)).toFixed(2),
      it.prioridade,
      `"${it.localAplicacao.replace(/"/g, '""')}"`,
      `"${it.justificativa.replace(/"/g, '""')}"`,
      it.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lista_compras_necessidades_3cia_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1a2b4c] flex items-center gap-2">
            <ShoppingCart className="text-[#c9a84e]" size={22} />
            Lista de Compras & Necessidades Futuras
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Planejamento de materiais e orçamentos para os próximos adiantamentos da 3ª Cia Escola • APMBB
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-xs font-semibold px-3.5 py-2 rounded-md transition shadow-sm"
          >
            <Plus size={14} />
            <span>Adicionar Necessidade</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-md border border-slate-300 transition"
            title="Exportar lista de compras para CSV"
          >
            <Download size={14} />
            <span>CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-md border border-slate-300 transition"
            title="Imprimir pedido / relação de compras"
          >
            <Printer size={14} />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Filters & Totals Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Buscar material, local, justificativa..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c] focus:outline-none"
            />
          </div>

          <select
            value={filtroPrioridade}
            onChange={(e) => setFiltroPrioridade(e.target.value as any)}
            className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:ring-1 focus:ring-[#1a2b4c]"
          >
            <option value="todos">Todas Prioridades</option>
            <option value="Alta">🔴 Alta Prioridade</option>
            <option value="Média">🟡 Média</option>
            <option value="Baixa">🟢 Baixa</option>
          </select>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as any)}
            className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:ring-1 focus:ring-[#1a2b4c]"
          >
            <option value="todos">Todos os Status</option>
            <option value="Pendente">Pendentes ({itensCompras.filter((i) => i.status === 'Pendente').length})</option>
            <option value="Em Cotação">Em Cotação</option>
            <option value="Aprovado">Aprovado</option>
            <option value="Comprado">Comprado</option>
          </select>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500">
            Estimativa Orçamentária: <strong className="text-slate-900 font-mono text-sm">{formatMoeda(metricas.valorTotal)}</strong>
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-medium">
            <strong>{filtrados.length}</strong> de {itensCompras.length} itens
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs text-left">
            <thead className="bg-[#1a2b4c] text-white uppercase text-[10.5px] tracking-wider font-bold">
              <tr>
                <th className="no-print p-2.5 text-center w-10">Ação</th>
                <th className="p-2.5 min-w-[260px]">Material / Item Solicitado</th>
                <th className="p-2.5 text-center w-16">Unid.</th>
                <th className="p-2.5 text-center w-20">Qtd</th>
                <th className="p-2.5 text-right w-28">Est. Unit. (R$)</th>
                <th className="p-2.5 text-right w-28">Subtotal (R$)</th>
                <th className="p-2.5 text-center w-28">Prioridade</th>
                <th className="p-2.5 min-w-[190px]">Destino / Local</th>
                <th className="p-2.5 min-w-[220px]">Justificativa</th>
                <th className="p-2.5 text-center w-28">Status</th>
                <th className="no-print p-2.5 text-center w-24">Atalho</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400 italic">
                    Nenhum item na lista de compras com os critérios selecionados.
                  </td>
                </tr>
              ) : (
                filtrados.map((it) => {
                  const subtotal = (Number(it.qtd) || 0) * (Number(it.precoEstimadoUnitario) || 0);
                  const isComprado = it.status === 'Comprado';

                  return (
                    <tr
                      key={it.id}
                      className={`hover:bg-slate-50 transition ${
                        isComprado ? 'bg-slate-100/50 opacity-75' : ''
                      }`}
                    >
                      <td className="no-print p-1.5 text-center">
                        <button
                          onClick={() => handleRemove(it.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                          title="Excluir item da lista"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>

                      <td className="p-1.5">
                        <input
                          type="text"
                          value={it.descricao}
                          onChange={(e) => handleUpdate(it.id, 'descricao', e.target.value)}
                          placeholder="Descrição do material..."
                          className={`w-full px-2 py-1 text-xs font-bold text-slate-900 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-white rounded ${
                            isComprado ? 'line-through text-slate-400' : ''
                          }`}
                        />
                      </td>

                      <td className="p-1.5 text-center">
                        <input
                          type="text"
                          value={it.unidade}
                          onChange={(e) => handleUpdate(it.id, 'unidade', e.target.value)}
                          className="w-full text-center uppercase font-mono text-xs px-1 py-1 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-white rounded"
                        />
                      </td>

                      <td className="p-1.5 text-center">
                        <input
                          type="number"
                          step="any"
                          value={it.qtd}
                          onChange={(e) =>
                            handleUpdate(it.id, 'qtd', parseFloat(e.target.value) || 0)
                          }
                          className="w-full text-center font-mono font-bold text-xs px-1 py-1 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-white rounded"
                        />
                      </td>

                      <td className="p-1.5 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={it.precoEstimadoUnitario}
                          onChange={(e) =>
                            handleUpdate(
                              it.id,
                              'precoEstimadoUnitario',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full text-right font-mono text-xs px-1 py-1 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-white rounded"
                        />
                      </td>

                      <td className="p-1.5 text-right font-mono font-bold text-slate-900">
                        {formatMoeda(subtotal)}
                      </td>

                      <td className="p-1.5 text-center">
                        <select
                          value={it.prioridade}
                          onChange={(e) => handleUpdate(it.id, 'prioridade', e.target.value as any)}
                          className="text-xs py-1 px-1.5 rounded font-bold border-0 bg-transparent hover:bg-slate-100 focus:ring-1 focus:ring-[#1a2b4c]"
                        >
                          <option value="Alta">🔴 Alta</option>
                          <option value="Média">🟡 Média</option>
                          <option value="Baixa">🟢 Baixa</option>
                        </select>
                      </td>

                      <td className="p-1.5">
                        <input
                          type="text"
                          value={it.localAplicacao}
                          onChange={(e) => handleUpdate(it.id, 'localAplicacao', e.target.value)}
                          placeholder="Alojamento, vestiário, etc..."
                          className="w-full px-1.5 py-1 text-xs text-slate-700 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-white rounded"
                        />
                      </td>

                      <td className="p-1.5">
                        <input
                          type="text"
                          value={it.justificativa}
                          onChange={(e) => handleUpdate(it.id, 'justificativa', e.target.value)}
                          placeholder="Motivo da compra..."
                          className="w-full px-1.5 py-1 text-xs text-slate-700 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-white rounded"
                        />
                      </td>

                      <td className="p-1.5 text-center">
                        <select
                          value={it.status}
                          onChange={(e) => handleUpdate(it.id, 'status', e.target.value as any)}
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full border-0 ${
                            isComprado
                              ? 'bg-emerald-100 text-emerald-800'
                              : it.status === 'Em Cotação'
                              ? 'bg-blue-100 text-blue-800'
                              : it.status === 'Aprovado'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <option value="Pendente">Pendente</option>
                          <option value="Em Cotação">Em Cotação</option>
                          <option value="Aprovado">Aprovado</option>
                          <option value="Comprado">Comprado</option>
                        </select>
                      </td>

                      <td className="no-print p-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => alternarComprado(it.id)}
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border transition shadow-2xs ${
                            isComprado
                              ? 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          }`}
                          title={isComprado ? 'Reabrir item como pendente' : 'Marcar como comprado'}
                        >
                          <CheckCheck size={11} />
                          <span>{isComprado ? 'Reabrir' : 'Comprado'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
