import React, { useState } from 'react';
import { Ferramenta } from '../../types';
import { gerarId } from '../../utils';
import {
  Wrench,
  Plus,
  Trash2,
  Search,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  UserCheck,
  ShieldCheck,
  Tag,
  MapPin,
} from 'lucide-react';

interface ControleFerramentasTabProps {
  ferramentas: Ferramenta[];
  onChangeFerramentas: (ferramentas: Ferramenta[]) => void;
}

export const ControleFerramentasTab: React.FC<ControleFerramentasTabProps> = ({
  ferramentas,
  onChangeFerramentas,
}) => {
  const [busca, setBusca] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState<'todos' | 'Disponível' | 'Cautelada' | 'Manutenção'>('todos');
  const [modalCautela, setModalCautela] = useState<{
    aberto: boolean;
    ferramentaId: string;
    responsavel: string;
    previsao: string;
  }>({
    aberto: false,
    ferramentaId: '',
    responsavel: '',
    previsao: '',
  });

  const handleAdd = () => {
    const nova: Ferramenta = {
      id: gerarId(),
      nome: 'Nova Ferramenta',
      categoria: 'Manual',
      patrimonio: `3ªCIA-FERR-${String(ferramentas.length + 1).padStart(3, '0')}`,
      estado: 'Bom',
      situacao: 'Disponível',
      localizacao: 'Armário de Ferramentas - 3ª Cia',
      responsavel: '',
      dataCautela: '',
      previsaoDevolucao: '',
    };
    onChangeFerramentas([nova, ...ferramentas]);
  };

  const handleUpdate = (id: string, field: keyof Ferramenta, val: any) => {
    onChangeFerramentas(
      ferramentas.map((f) => {
        if (f.id !== id) return f;
        const updated = { ...f, [field]: val };
        // Se mudou para disponível, limpa responsável e datas de cautela
        if (field === 'situacao' && val === 'Disponível') {
          updated.responsavel = '';
          updated.dataCautela = '';
          updated.previsaoDevolucao = '';
        }
        return updated;
      })
    );
  };

  const handleRemove = (id: string) => {
    onChangeFerramentas(ferramentas.filter((f) => f.id !== id));
  };

  const abrirModalCautela = (ferramenta: Ferramenta) => {
    setModalCautela({
      aberto: true,
      ferramentaId: ferramenta.id,
      responsavel: ferramenta.responsavel || 'Cb PM Ribeiro',
      previsao: ferramenta.previsaoDevolucao || new Date(Date.now() + 86400000).toLocaleDateString('pt-BR'),
    });
  };

  const confirmarCautela = () => {
    if (!modalCautela.ferramentaId) return;
    onChangeFerramentas(
      ferramentas.map((f) => {
        if (f.id !== modalCautela.ferramentaId) return f;
        return {
          ...f,
          situacao: 'Cautelada',
          responsavel: modalCautela.responsavel.trim() || 'Militar da 3ª Cia',
          dataCautela: new Date().toLocaleDateString('pt-BR'),
          previsaoDevolucao: modalCautela.previsao.trim() || 'A definir',
        };
      })
    );
    setModalCautela({ aberto: false, ferramentaId: '', responsavel: '', previsao: '' });
  };

  const devolverFerramenta = (id: string) => {
    onChangeFerramentas(
      ferramentas.map((f) => {
        if (f.id !== id) return f;
        return {
          ...f,
          situacao: 'Disponível',
          responsavel: '',
          dataCautela: '',
          previsaoDevolucao: '',
        };
      })
    );
  };

  const filtradas = ferramentas.filter((f) => {
    const termo = busca.toLowerCase();
    const bateTexto =
      !termo ||
      f.nome.toLowerCase().includes(termo) ||
      f.patrimonio.toLowerCase().includes(termo) ||
      f.categoria.toLowerCase().includes(termo) ||
      (f.responsavel && f.responsavel.toLowerCase().includes(termo)) ||
      f.localizacao.toLowerCase().includes(termo);

    if (!bateTexto) return false;
    if (filtroSituacao !== 'todos' && f.situacao !== filtroSituacao) return false;

    return true;
  });

  const handleExportCSV = () => {
    const headers = [
      'Patrimônio',
      'Ferramenta / Equipamento',
      'Categoria',
      'Estado',
      'Situação',
      'Responsável (Cautela)',
      'Data Cautela',
      'Previsão Devolução',
      'Localização',
    ];
    const rows = ferramentas.map((f) => [
      `"${f.patrimonio}"`,
      `"${f.nome.replace(/"/g, '""')}"`,
      f.categoria,
      f.estado,
      f.situacao,
      `"${(f.responsavel || '-').replace(/"/g, '""')}"`,
      f.dataCautela || '-',
      f.previsaoDevolucao || '-',
      `"${f.localizacao.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `controle_ferramentas_3cia_${Date.now()}.csv`);
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
            <Wrench className="text-[#c9a84e]" size={22} />
            Controle de Ferramentas & Equipamentos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão patrimonial, estado de conservação e cautela de ferramentas da 3ª Cia Escola • APMBB
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-xs font-semibold px-3.5 py-2 rounded-md transition shadow-sm"
          >
            <Plus size={14} />
            <span>Cadastrar Ferramenta</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-md border border-slate-300 transition"
            title="Exportar inventário de ferramentas para CSV"
          >
            <Download size={14} />
            <span>CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-md border border-slate-300 transition"
            title="Imprimir relação de ferramentas"
          >
            <Printer size={14} />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Buscar por ferramenta, patrimônio, militar..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c] focus:outline-none"
            />
          </div>

          <select
            value={filtroSituacao}
            onChange={(e) => setFiltroSituacao(e.target.value as any)}
            className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:ring-1 focus:ring-[#1a2b4c]"
          >
            <option value="todos">Todas as Situações ({ferramentas.length})</option>
            <option value="Disponível">Disponíveis no Armário ({ferramentas.filter((f) => f.situacao === 'Disponível').length})</option>
            <option value="Cautelada">Cauteladas / Em Uso ({ferramentas.filter((f) => f.situacao === 'Cautelada').length})</option>
            <option value="Manutenção">Em Manutenção ({ferramentas.filter((f) => f.situacao === 'Manutenção').length})</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Exibindo <strong>{filtradas.length}</strong> de {ferramentas.length} ferramentas
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs text-left">
            <thead className="bg-[#1a2b4c] text-white uppercase text-[10.5px] tracking-wider font-bold">
              <tr>
                <th className="no-print p-2.5 text-center w-10">Ação</th>
                <th className="p-2.5 w-28">Patrimônio</th>
                <th className="p-2.5 min-w-[240px]">Ferramenta / Equipamento</th>
                <th className="p-2.5 w-28">Categoria</th>
                <th className="p-2.5 w-28 text-center">Estado</th>
                <th className="p-2.5 w-32 text-center">Situação</th>
                <th className="p-2.5 min-w-[180px]">Cautela / Responsável</th>
                <th className="p-2.5 min-w-[180px]">Local de Guarda</th>
                <th className="no-print p-2.5 text-center w-28">Ação Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                    Nenhuma ferramenta encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtradas.map((f) => {
                  const isDisponivel = f.situacao === 'Disponível';
                  const isCautelada = f.situacao === 'Cautelada';
                  const isManutencao = f.situacao === 'Manutenção';

                  return (
                    <tr
                      key={f.id}
                      className={`hover:bg-slate-50 transition ${
                        isCautelada ? 'bg-amber-50/20' : isManutencao ? 'bg-red-50/20' : ''
                      }`}
                    >
                      <td className="no-print p-1.5 text-center">
                        <button
                          onClick={() => handleRemove(f.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                          title="Excluir ferramenta"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>

                      <td className="p-1.5">
                        <input
                          type="text"
                          value={f.patrimonio}
                          onChange={(e) => handleUpdate(f.id, 'patrimonio', e.target.value)}
                          className="w-full px-1.5 py-1 text-xs font-mono font-bold text-slate-700 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-white rounded"
                        />
                      </td>

                      <td className="p-1.5">
                        <input
                          type="text"
                          value={f.nome}
                          onChange={(e) => handleUpdate(f.id, 'nome', e.target.value)}
                          className="w-full px-2 py-1 text-xs font-bold text-slate-900 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-white rounded"
                        />
                      </td>

                      <td className="p-1.5">
                        <select
                          value={f.categoria}
                          onChange={(e) => handleUpdate(f.id, 'categoria', e.target.value)}
                          className="w-full text-xs py-1 px-1.5 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-white rounded text-slate-700 font-medium"
                        >
                          <option value="Manual">Manual</option>
                          <option value="Elétrica">Elétrica</option>
                          <option value="Hidráulica">Hidráulica</option>
                          <option value="Medição">Medição</option>
                          <option value="Acesso/Escada">Acesso/Escada</option>
                          <option value="Pintura">Pintura</option>
                          <option value="Segurança (EPI)">Segurança (EPI)</option>
                        </select>
                      </td>

                      <td className="p-1.5 text-center">
                        <select
                          value={f.estado}
                          onChange={(e) => handleUpdate(f.id, 'estado', e.target.value as any)}
                          className="text-xs py-1 px-1.5 rounded font-semibold border-0 bg-transparent hover:bg-slate-100 focus:ring-1 focus:ring-[#1a2b4c]"
                        >
                          <option value="Excelente">🟢 Excelente</option>
                          <option value="Bom">🔵 Bom</option>
                          <option value="Regular">🟡 Regular</option>
                          <option value="Danificado">🔴 Danificado</option>
                        </select>
                      </td>

                      <td className="p-1.5 text-center">
                        <select
                          value={f.situacao}
                          onChange={(e) => handleUpdate(f.id, 'situacao', e.target.value as any)}
                          className={`text-xs font-bold px-2 py-1 rounded-full border-0 ${
                            isDisponivel
                              ? 'bg-emerald-100 text-emerald-800'
                              : isCautelada
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          <option value="Disponível">Disponível</option>
                          <option value="Cautelada">Cautelada</option>
                          <option value="Manutenção">Em Manutenção</option>
                        </select>
                      </td>

                      <td className="p-1.5">
                        {isCautelada ? (
                          <div className="flex flex-col text-[11px]">
                            <span className="font-bold text-slate-900 flex items-center gap-1">
                              <UserCheck size={12} className="text-amber-600" />
                              {f.responsavel || 'Não informado'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Desde: {f.dataCautela || '-'} • Prev: {f.previsaoDevolucao || '-'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">No armário</span>
                        )}
                      </td>

                      <td className="p-1.5">
                        <input
                          type="text"
                          value={f.localizacao}
                          onChange={(e) => handleUpdate(f.id, 'localizacao', e.target.value)}
                          placeholder="Local de armazenamento..."
                          className="w-full px-1.5 py-1 text-xs text-slate-700 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-white rounded"
                        />
                      </td>

                      <td className="no-print p-1.5 text-center">
                        {isDisponivel ? (
                          <button
                            type="button"
                            onClick={() => abrirModalCautela(f)}
                            className="inline-flex items-center gap-1 text-[10.5px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-2 py-1 rounded shadow-2xs transition"
                            title="Cautelar esta ferramenta para um policial"
                          >
                            <ShieldCheck size={12} />
                            <span>Cautelar</span>
                          </button>
                        ) : isCautelada ? (
                          <button
                            type="button"
                            onClick={() => devolverFerramenta(f.id)}
                            className="inline-flex items-center gap-1 text-[10.5px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-1 rounded shadow-2xs transition"
                            title="Registrar devolução da ferramenta ao armário"
                          >
                            <RotateCcw size={12} />
                            <span>Devolver</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cautela Rápida */}
      {modalCautela.aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-5 shadow-xl space-y-4 border border-slate-200">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="text-amber-600" size={20} />
              <h3 className="font-bold text-slate-900 text-sm">
                Registrar Cautela de Ferramenta
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Militar Responsável (Nome / Posto ou Graduação):
                </label>
                <input
                  type="text"
                  value={modalCautela.responsavel}
                  onChange={(e) =>
                    setModalCautela({ ...modalCautela, responsavel: e.target.value })
                  }
                  placeholder="Ex: Cb PM Ribeiro, Sd PM Santana..."
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#1a2b4c]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Previsão de Devolução:
                </label>
                <input
                  type="text"
                  value={modalCautela.previsao}
                  onChange={(e) =>
                    setModalCautela({ ...modalCautela, previsao: e.target.value })
                  }
                  placeholder="Ex: 29/08/2026 ou Fim do serviço"
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#1a2b4c]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() =>
                  setModalCautela({ aberto: false, ferramentaId: '', responsavel: '', previsao: '' })
                }
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarCautela}
                className="px-3 py-1.5 text-xs font-bold bg-[#1a2b4c] hover:bg-[#2c4373] text-white rounded shadow-sm"
              >
                Confirmar Cautela
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
