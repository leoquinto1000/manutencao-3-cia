import React, { useState } from 'react';
import { MaterialUsado, NFInstance } from '../../types';
import { gerarId } from '../../utils';
import {
  Plus,
  Trash2,
  Search,
  Download,
  Printer,
  Calendar,
  Layers,
  MapPin,
  Wrench,
  UserCheck,
  AlertCircle,
} from 'lucide-react';

interface ControleSaidasTabProps {
  materiais: MaterialUsado[];
  onChangeMateriais: (materiais: MaterialUsado[]) => void;
  nfs: NFInstance[];
  materialPreSelecionado?: { nome: string; unidade: string } | null;
  onLimparPreSelecao?: () => void;
}

export const ControleSaidasTab: React.FC<ControleSaidasTabProps> = ({
  materiais,
  onChangeMateriais,
  nfs,
  materialPreSelecionado,
  onLimparPreSelecao,
}) => {
  const [filtro, setFiltro] = useState('');

  // Coleta materiais das NFs para calcular estoque disponível e autocompletar
  const estoqueMapa = React.useMemo(() => {
    const mapa = new Map<string, { desc: string; unid: string; qtdEntrada: number }>();
    nfs.forEach((nf) => {
      nf.items.forEach((it) => {
        const chave = it.desc.trim().toLowerCase();
        const atual = mapa.get(chave) || { desc: it.desc.trim(), unid: it.unid || 'UN', qtdEntrada: 0 };
        atual.qtdEntrada += Number(it.qtd) || 0;
        mapa.set(chave, atual);
      });
    });
    return mapa;
  }, [nfs]);

  // Consumo acumulado por material
  const consumoMapa = React.useMemo(() => {
    const mapa = new Map<string, number>();
    materiais.forEach((m) => {
      const chave = m.material.trim().toLowerCase();
      mapa.set(chave, (mapa.get(chave) || 0) + (Number(m.qtd) || 0));
    });
    return mapa;
  }, [materiais]);

  // Lista de materiais únicos para datalist / sugestões com saldo
  const opcoesMateriais = React.useMemo(() => {
    const lista: { nome: string; unid: string; saldo: number }[] = [];
    estoqueMapa.forEach((val, chave) => {
      const consumido = consumoMapa.get(chave) || 0;
      lista.push({
        nome: val.desc,
        unid: val.unid,
        saldo: val.qtdEntrada - consumido,
      });
    });
    return lista;
  }, [estoqueMapa, consumoMapa]);

  const handleAdd = (materialNome?: string, unid?: string) => {
    const defaultNome = materialNome || (opcoesMateriais[0]?.nome || 'Canaleta 20x10mm com Adesivo BR 2M');
    const defaultUnid = unid || (opcoesMateriais.find((o) => o.nome === defaultNome)?.unid || 'UN');

    const novo: MaterialUsado = {
      id: gerarId(),
      data: new Date().toLocaleDateString('pt-BR'),
      material: defaultNome,
      unidade: defaultUnid,
      qtd: 1,
      local: 'Alojamento da 3ª Cia',
      motivo: 'Manutenção corretiva',
      responsavel: 'Cb PM Ribeiro',
    };
    onChangeMateriais([novo, ...materiais]);
  };

  // Se veio pré-selecionado da aba de estoque, adiciona automaticamente ou foca
  React.useEffect(() => {
    if (materialPreSelecionado) {
      handleAdd(materialPreSelecionado.nome, materialPreSelecionado.unidade);
      if (onLimparPreSelecao) onLimparPreSelecao();
    }
  }, [materialPreSelecionado]);

  const handleUpdate = (id: string, field: keyof MaterialUsado, val: any) => {
    onChangeMateriais(
      materiais.map((m) => {
        if (m.id !== id) return m;
        const updated = { ...m, [field]: val };

        // Ao mudar o material, se bater com item do estoque, autoajusta a unidade
        if (field === 'material') {
          const itemEstoque = opcoesMateriais.find(
            (o) => o.nome.toLowerCase() === String(val).trim().toLowerCase()
          );
          if (itemEstoque && itemEstoque.unid) {
            updated.unidade = itemEstoque.unid;
          }
        }
        return updated;
      })
    );
  };

  const handleRemove = (id: string) => {
    onChangeMateriais(materiais.filter((m) => m.id !== id));
  };

  const filtrados = materiais.filter((m) => {
    const termo = filtro.toLowerCase();
    return (
      m.material.toLowerCase().includes(termo) ||
      m.local.toLowerCase().includes(termo) ||
      m.responsavel.toLowerCase().includes(termo) ||
      m.motivo.toLowerCase().includes(termo)
    );
  });

  const handleExportCSV = () => {
    const headers = [
      'Data',
      'Material Utilizado',
      'Unidade',
      'Quantidade Usada',
      'Local / Alojamento / Setor',
      'Aplicação / Motivo',
      'Responsável',
    ];
    const rows = materiais.map((m) => [
      m.data,
      `"${m.material.replace(/"/g, '""')}"`,
      m.unidade,
      m.qtd,
      `"${m.local.replace(/"/g, '""')}"`,
      `"${m.motivo.replace(/"/g, '""')}"`,
      `"${m.responsavel.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `controle_saidas_materiais_3cia_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sugestões rápidas frequentes de locais, motivos e responsáveis
  const locaisSugeridos = [
    'Alojamento da 3ª Cia',
    'Alojamento dos Cabos e Soldados - 3ª Cia',
    'Vestiário dos Cadetes - Bloco B',
    'Sanitários Coletivos - Piso 1',
    'Sanitários Coletivos - Piso 2',
    'Corredor Principal e Sala de Instrução',
    'Reserva de Armas - 3ª Cia',
    'Corpo de Guarda / Entrada Principal',
  ];

  const motivosSugeridos = [
    'Manutenção corretiva',
    'Manutenção preventiva',
    'Substituição de item danificado',
    'Adequação de rede elétrica e tomadas',
    'Reparo hidrossanitário em chuveiro/torneira',
    'Troca de assento sanitário avariado',
    'Pintura e conservação predial',
  ];

  const responsaveisSugeridos = [
    '1º Ten PM Froes',
    'Cb PM Ribeiro',
    'Sd PM Santana',
    'Cb PM Silva',
    'Cad PM Cristian',
    'Cad PM Diomazio',
  ];

  return (
    <div className="space-y-4">
      {/* Top Banner & Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1a2b4c] flex items-center gap-2">
            <Layers className="text-[#c9a84e]" size={22} />
            Controle de Saída & Aplicação de Materiais
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro diário de consumo e destinação dos materiais adquiridos na 3ª Cia Escola • APMBB
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Filtrar por material, local..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c] focus:outline-none w-52"
            />
          </div>

          <button
            onClick={() => handleAdd()}
            className="flex items-center gap-1.5 bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-xs font-semibold px-3.5 py-2 rounded-md transition shadow-sm"
          >
            <Plus size={14} />
            <span>Registrar Nova Saída</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-md border border-slate-300 transition"
            title="Exportar para planilha Excel / CSV"
          >
            <Download size={14} />
            <span>CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-md border border-slate-300 transition"
            title="Imprimir relatório das saídas"
          >
            <Printer size={14} />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Datalists compartilhados para digitação ágil */}
      <datalist id="lista-materiais-estoque">
        {opcoesMateriais.map((op, i) => (
          <option key={i} value={op.nome}>
            {op.nome} (Saldo disponível: {op.saldo} {op.unid})
          </option>
        ))}
      </datalist>

      <datalist id="lista-locais-sugeridos">
        {locaisSugeridos.map((loc, i) => (
          <option key={i} value={loc} />
        ))}
      </datalist>

      <datalist id="lista-motivos-sugeridos">
        {motivosSugeridos.map((mot, i) => (
          <option key={i} value={mot} />
        ))}
      </datalist>

      <datalist id="lista-responsaveis-sugeridos">
        {responsaveisSugeridos.map((resp, i) => (
          <option key={i} value={resp} />
        ))}
      </datalist>

      {/* Main Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs text-left">
            <thead className="bg-[#1a2b4c] text-white uppercase text-[10.5px] tracking-wider font-bold">
              <tr>
                <th className="no-print p-2.5 text-center w-10">Ação</th>
                <th className="p-2.5 text-center w-28">Data</th>
                <th className="p-2.5 min-w-[260px]">Material Utilizado</th>
                <th className="p-2.5 text-center w-16">Unid.</th>
                <th className="p-2.5 text-center w-24">Qtd Usada</th>
                <th className="p-2.5 min-w-[220px]">Local / Alojamento / Setor</th>
                <th className="p-2.5 min-w-[240px]">Aplicação / Motivo</th>
                <th className="p-2.5 w-40">Responsável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                    Nenhum registro de saída encontrado com os critérios pesquisados.
                  </td>
                </tr>
              ) : (
                filtrados.map((m) => {
                  const itemEstoque = estoqueMapa.get(m.material.trim().toLowerCase());
                  const saldoAtual = itemEstoque
                    ? itemEstoque.qtdEntrada - (consumoMapa.get(m.material.trim().toLowerCase()) || 0)
                    : null;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition">
                      <td className="no-print p-1.5 text-center">
                        <button
                          onClick={() => handleRemove(m.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                          title="Excluir saída"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>

                      <td className="p-1.5 text-center">
                        <input
                          type="text"
                          value={m.data}
                          onChange={(e) => handleUpdate(m.id, 'data', e.target.value)}
                          className="w-full text-center bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-white rounded text-xs font-mono font-medium px-1 py-1"
                        />
                      </td>

                      <td className="p-1.5">
                        <div className="relative">
                          <input
                            type="text"
                            list="lista-materiais-estoque"
                            value={m.material}
                            onChange={(e) => handleUpdate(m.id, 'material', e.target.value)}
                            placeholder="Selecione ou digite o material..."
                            className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-white rounded font-semibold text-slate-800 text-xs"
                          />
                          {saldoAtual !== null && (
                            <span
                              className={`text-[10px] font-mono px-1 rounded block ${
                                saldoAtual < 0
                                  ? 'text-red-600 font-bold'
                                  : saldoAtual === 0
                                  ? 'text-amber-700 font-bold'
                                  : 'text-slate-400'
                              }`}
                            >
                              Saldo restante em estoque: {saldoAtual} {m.unidade}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-1.5 text-center">
                        <input
                          type="text"
                          value={m.unidade}
                          onChange={(e) => handleUpdate(m.id, 'unidade', e.target.value)}
                          className="w-full text-center bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-white rounded uppercase font-mono text-xs px-1 py-1"
                        />
                      </td>

                      <td className="p-1.5 text-center">
                        <input
                          type="number"
                          step="any"
                          value={m.qtd}
                          onChange={(e) =>
                            handleUpdate(m.id, 'qtd', parseFloat(e.target.value) || 0)
                          }
                          className="w-full text-center bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-white rounded font-mono font-bold text-xs px-1 py-1"
                        />
                      </td>

                      <td className="p-1.5">
                        <input
                          type="text"
                          list="lista-locais-sugeridos"
                          value={m.local}
                          onChange={(e) => handleUpdate(m.id, 'local', e.target.value)}
                          placeholder="Ex: Alojamento da 3ª Cia..."
                          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-white rounded text-slate-700 text-xs"
                        />
                      </td>

                      <td className="p-1.5">
                        <input
                          type="text"
                          list="lista-motivos-sugeridos"
                          value={m.motivo}
                          onChange={(e) => handleUpdate(m.id, 'motivo', e.target.value)}
                          placeholder="Ex: Manutenção corretiva..."
                          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-white rounded text-slate-700 text-xs"
                        />
                      </td>

                      <td className="p-1.5">
                        <input
                          type="text"
                          list="lista-responsaveis-sugeridos"
                          value={m.responsavel}
                          onChange={(e) => handleUpdate(m.id, 'responsavel', e.target.value)}
                          placeholder="Ex: Cb PM Ribeiro..."
                          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-white rounded font-medium text-slate-800 text-xs"
                        />
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
