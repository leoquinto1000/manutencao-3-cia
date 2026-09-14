import React, { useState, useMemo } from 'react';
import { NFInstance, MaterialUsado } from '../../types';
import { formatMoeda } from '../../utils';
import {
  Package,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Download,
  Printer,
  Layers,
  FileSpreadsheet,
  PlusCircle,
  Clock,
  Building2,
} from 'lucide-react';

interface EstoqueMateriaisTabProps {
  nfs: NFInstance[];
  materiaisUsados: MaterialUsado[];
  onLancarSaida: (materialNome: string, unidade: string) => void;
}

export interface ItemEstoqueConsolidado {
  chave: string;
  material: string;
  unidade: string;
  qtdComprada: number;
  qtdUsada: number;
  saldo: number;
  percentualConsumido: number;
  precoUnitario: number;
  valorTotalEstoque: number;
  nfsOrigem: { id: number; label: string; qtd: number }[];
  ultimaSaida?: { data: string; local: string; qtd: number };
}

export const EstoqueMateriaisTab: React.FC<EstoqueMateriaisTabProps> = ({
  nfs,
  materiaisUsados,
  onLancarSaida,
}) => {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'disponivel' | 'baixo' | 'zerado'>('todos');
  const [filtroNF, setFiltroNF] = useState<string>('todas');
  const [modoVisualizacao, setModoVisualizacao] = useState<'consolidado' | 'detalhado'>('consolidado');

  // Normalização de strings para casar materiais comprados e usados
  const normalizar = (texto: string) =>
    texto
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');

  // Mapeamento de consumo acumulado por material
  const consumoPorMaterial = useMemo(() => {
    const mapa = new Map<string, { qtd: number; ultima?: { data: string; local: string; qtd: number } }>();

    materiaisUsados.forEach((m) => {
      const chave = normalizar(m.material);
      const atual = mapa.get(chave) || { qtd: 0 };
      const novaQtd = atual.qtd + (Number(m.qtd) || 0);

      // Salva ou atualiza a saída mais recente
      const ultima = atual.ultima || { data: m.data, local: m.local, qtd: m.qtd };

      mapa.set(chave, {
        qtd: novaQtd,
        ultima,
      });
    });

    return mapa;
  }, [materiaisUsados]);

  // Itens de estoque consolidados a partir de todas as NFs / Planilhas de Composição
  const estoqueItens = useMemo<ItemEstoqueConsolidado[]>(() => {
    const mapaItens = new Map<string, ItemEstoqueConsolidado>();

    nfs.forEach((nf) => {
      nf.items.forEach((item) => {
        const descLimpa = item.desc.trim();
        if (!descLimpa) return;

        const chave = normalizar(descLimpa);
        const qtdItem = Number(item.qtd) || 0;
        const preco = Number(item.unitPrice) || 0;

        if (!mapaItens.has(chave)) {
          const dadosConsumo = consumoPorMaterial.get(chave);
          const qtdUsada = dadosConsumo ? dadosConsumo.qtd : 0;
          const saldo = qtdItem - qtdUsada;
          const percentual = qtdItem > 0 ? Math.min(100, Math.round((qtdUsada / qtdItem) * 100)) : 0;

          mapaItens.set(chave, {
            chave,
            material: descLimpa,
            unidade: (item.unid || 'UN').toUpperCase().trim(),
            qtdComprada: qtdItem,
            qtdUsada,
            saldo,
            percentualConsumido: percentual,
            precoUnitario: preco,
            valorTotalEstoque: Math.max(0, saldo) * preco,
            nfsOrigem: [{ id: nf.id, label: nf.label, qtd: qtdItem }],
            ultimaSaida: dadosConsumo?.ultima,
          });
        } else {
          const existente = mapaItens.get(chave)!;
          const novaQtdComprada = existente.qtdComprada + qtdItem;
          const saldo = novaQtdComprada - existente.qtdUsada;
          const percentual = novaQtdComprada > 0 ? Math.min(100, Math.round((existente.qtdUsada / novaQtdComprada) * 100)) : 0;

          // Adiciona ou acumula NF de origem
          const jaTemNF = existente.nfsOrigem.find((origem) => origem.id === nf.id);
          if (jaTemNF) {
            jaTemNF.qtd += qtdItem;
          } else {
            existente.nfsOrigem.push({ id: nf.id, label: nf.label, qtd: qtdItem });
          }

          existente.qtdComprada = novaQtdComprada;
          existente.saldo = saldo;
          existente.percentualConsumido = percentual;
          existente.valorTotalEstoque = Math.max(0, saldo) * (existente.precoUnitario || preco);
        }
      });
    });

    // Também inclui materiais que porventura foram registrados nas saídas mas não vieram das NFs atuais
    materiaisUsados.forEach((m) => {
      const descLimpa = m.material.trim();
      const chave = normalizar(descLimpa);
      if (!mapaItens.has(chave)) {
        const qtdUsada = consumoPorMaterial.get(chave)?.qtd || Number(m.qtd) || 0;
        mapaItens.set(chave, {
          chave,
          material: descLimpa,
          unidade: (m.unidade || 'UN').toUpperCase().trim(),
          qtdComprada: 0,
          qtdUsada,
          saldo: -qtdUsada,
          percentualConsumido: 100,
          precoUnitario: 0,
          valorTotalEstoque: 0,
          nfsOrigem: [{ id: 0, label: 'Lançamento Direto / Almoxarifado Anterior', qtd: 0 }],
          ultimaSaida: { data: m.data, local: m.local, qtd: m.qtd },
        });
      }
    });

    return Array.from(mapaItens.values());
  }, [nfs, consumoPorMaterial, materiaisUsados]);

  // Estatísticas do estoque
  const metricas = useMemo(() => {
    let totalItens = estoqueItens.length;
    let totalQtdComprada = 0;
    let totalQtdUsada = 0;
    let totalSaldoDisponivel = 0;
    let itensZerados = 0;
    let itensEstoqueBaixo = 0;
    let valorTotalEstoque = 0;

    estoqueItens.forEach((it) => {
      totalQtdComprada += it.qtdComprada;
      totalQtdUsada += it.qtdUsada;
      if (it.saldo > 0) {
        totalSaldoDisponivel += it.saldo;
        valorTotalEstoque += it.valorTotalEstoque;
      }
      if (it.saldo <= 0) {
        itensZerados++;
      } else if (it.saldo <= it.qtdComprada * 0.25) {
        itensEstoqueBaixo++;
      }
    });

    return {
      totalItens,
      totalQtdComprada,
      totalQtdUsada,
      totalSaldoDisponivel,
      itensZerados,
      itensEstoqueBaixo,
      valorTotalEstoque,
    };
  }, [estoqueItens]);

  // Filtros aplicados
  const itensFiltrados = useMemo(() => {
    return estoqueItens.filter((item) => {
      // Busca textual
      const termo = busca.toLowerCase();
      const bateTexto =
        !termo ||
        item.material.toLowerCase().includes(termo) ||
        item.unidade.toLowerCase().includes(termo) ||
        item.nfsOrigem.some((origem) => origem.label.toLowerCase().includes(termo));

      if (!bateTexto) return false;

      // Filtro de status
      if (filtroStatus === 'disponivel' && item.saldo <= 0) return false;
      if (filtroStatus === 'baixo' && (item.saldo <= 0 || item.saldo > item.qtdComprada * 0.25)) return false;
      if (filtroStatus === 'zerado' && item.saldo > 0) return false;

      // Filtro de NF
      if (filtroNF !== 'todas') {
        const nfNum = parseInt(filtroNF, 10);
        if (!item.nfsOrigem.some((origem) => origem.id === nfNum)) return false;
      }

      return true;
    });
  }, [estoqueItens, busca, filtroStatus, filtroNF]);

  // Exportar inventário para CSV
  const handleExportarCSV = () => {
    const headers = [
      'Material',
      'Unidade',
      'Qtd. Adquirida (Entrada)',
      'Qtd. Utilizada (Saída)',
      'Saldo em Estoque',
      'Status',
      'Notas Fiscais de Origem',
      'Valor Unitário (R$)',
      'Valor Total em Estoque (R$)',
    ];

    const rows = estoqueItens.map((it) => {
      let statusStr = 'Disponível';
      if (it.saldo <= 0) statusStr = 'Esgotado';
      else if (it.saldo <= it.qtdComprada * 0.25) statusStr = 'Estoque Baixo';

      const nfsStr = it.nfsOrigem.map((n) => `${n.label} (${n.qtd} ${it.unidade})`).join('; ');

      return [
        `"${it.material.replace(/"/g, '""')}"`,
        it.unidade,
        it.qtdComprada,
        it.qtdUsada,
        it.saldo,
        statusStr,
        `"${nfsStr.replace(/"/g, '""')}"`,
        it.precoUnitario.toFixed(2),
        it.valorTotalEstoque.toFixed(2),
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventario_estoque_3cia_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#1a2b4c] text-[#c9a84e] flex items-center justify-center font-bold">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1a2b4c]">
                Materiais em Estoque (Entradas & Saldos)
              </h2>
              <p className="text-xs text-slate-500">
                Almoxarifado da 3ª Cia Escola • Itens adicionados automaticamente via Notas Fiscais e Planilhas de Composição
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportarCSV}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-md border border-slate-300 shadow-2xs transition"
            title="Exportar inventário de estoque para arquivo CSV / Excel"
          >
            <Download size={14} className="text-emerald-600" />
            <span>Exportar Estoque (CSV)</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-md border border-slate-300 shadow-2xs transition"
            title="Imprimir relatório do inventário"
          >
            <Printer size={14} />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Buscar por material, unidade, NF..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c] focus:outline-none"
            />
          </div>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as any)}
            className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:ring-1 focus:ring-[#1a2b4c]"
          >
            <option value="todos">Todos os Status ({estoqueItens.length})</option>
            <option value="disponivel">Com Saldo Positivo ({estoqueItens.filter((i) => i.saldo > 0).length})</option>
            <option value="baixo">Estoque Baixo (≤25%) ({metricas.itensEstoqueBaixo})</option>
            <option value="zerado">Esgotados / Zerados ({metricas.itensZerados})</option>
          </select>

          {nfs.length > 1 && (
            <select
              value={filtroNF}
              onChange={(e) => setFiltroNF(e.target.value)}
              className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:ring-1 focus:ring-[#1a2b4c]"
            >
              <option value="todas">Todas as Notas Fiscais</option>
              {nfs.map((n) => (
                <option key={n.id} value={String(n.id)}>
                  {n.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Exibindo <strong>{itensFiltrados.length}</strong> de {estoqueItens.length} materiais
        </div>
      </div>

      {/* Materials Inventory Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs text-left">
            <thead className="bg-[#1a2b4c] text-white uppercase text-[10.5px] tracking-wider font-bold">
              <tr>
                <th className="p-3 w-12 text-center">#</th>
                <th className="p-3 min-w-[260px]">Descrição do Material</th>
                <th className="p-3 text-center w-16">Unid.</th>
                <th className="p-3 text-center w-28 bg-[#233863]">Entrada (NF)</th>
                <th className="p-3 text-center w-28 bg-[#2c457d]">Saída (Uso)</th>
                <th className="p-3 text-center w-32 bg-[#14223d]">Saldo Atual</th>
                <th className="p-3 min-w-[170px]">Origem / NF</th>
                <th className="p-3 text-center w-28">Status</th>
                <th className="no-print p-3 text-center w-32">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {itensFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-400">
                    <Package size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Nenhum material encontrado no estoque.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Adicione itens nas Notas Fiscais da aba Prestação de Contas para compor o estoque automaticamente.
                    </p>
                  </td>
                </tr>
              ) : (
                itensFiltrados.map((item, idx) => {
                  const esgotado = item.saldo <= 0;
                  const baixo = item.saldo > 0 && item.saldo <= item.qtdComprada * 0.25;

                  return (
                    <tr
                      key={item.chave}
                      className={`hover:bg-slate-50/80 transition ${
                        esgotado ? 'bg-red-50/20' : baixo ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="p-2.5 text-center font-mono font-bold text-slate-400">
                        {String(idx + 1).padStart(2, '0')}
                      </td>

                      <td className="p-2.5 font-semibold text-slate-900">
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-900">{item.material}</span>
                          {item.ultimaSaida && (
                            <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1 mt-0.5">
                              <Clock size={10} /> Última saída: {item.ultimaSaida.data} ({item.ultimaSaida.local})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-2.5 text-center font-mono font-bold text-slate-600 uppercase">
                        {item.unidade}
                      </td>

                      <td className="p-2.5 text-center font-mono font-bold text-emerald-800 bg-emerald-50/40">
                        {item.qtdComprada}
                      </td>

                      <td className="p-2.5 text-center font-mono font-bold text-amber-800 bg-amber-50/40">
                        {item.qtdUsada}
                      </td>

                      <td className="p-2.5 text-center bg-slate-50/70">
                        <div className="flex flex-col items-center">
                          <span
                            className={`font-mono text-sm font-black ${
                              esgotado
                                ? 'text-red-600'
                                : baixo
                                ? 'text-amber-600'
                                : 'text-[#1a2b4c]'
                            }`}
                          >
                            {item.saldo}
                          </span>
                          {/* Barra de progresso de consumo */}
                          {item.qtdComprada > 0 && (
                            <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                              <div
                                className={`h-full ${
                                  esgotado
                                    ? 'bg-red-500'
                                    : baixo
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, (item.saldo / item.qtdComprada) * 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-2.5">
                        <div className="flex flex-wrap gap-1">
                          {item.nfsOrigem.map((origem, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-slate-100 text-slate-700 border border-slate-300 px-1.5 py-0.5 rounded font-medium whitespace-nowrap"
                              title={`Entrada de ${origem.qtd} ${item.unidade} via ${origem.label}`}
                            >
                              {origem.label.split('-')[0].trim()} ({origem.qtd})
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-2.5 text-center">
                        {esgotado ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full">
                            <AlertTriangle size={11} />
                            <span>Esgotado</span>
                          </span>
                        ) : baixo ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                            <AlertTriangle size={11} />
                            <span>Baixo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={11} />
                            <span>Disponível</span>
                          </span>
                        )}
                      </td>

                      <td className="no-print p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => onLancarSaida(item.material, item.unidade)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#1a2b4c] hover:bg-[#2c4373] text-white px-2.5 py-1 rounded shadow-2xs transition whitespace-nowrap"
                          title="Lançar saída / aplicação deste material"
                        >
                          <PlusCircle size={12} />
                          <span>Lançar Saída</span>
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
