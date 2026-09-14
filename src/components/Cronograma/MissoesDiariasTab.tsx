import React, { useState, useMemo } from 'react';
import { MissaoDiaria, EquipeManutencao, MembroEquipe } from '../../types';
import { ModalNovaMissao } from './ModalNovaMissao';
import {
  formatarDataISO,
  adicionarDiasISO,
  gerarId,
} from '../../utils';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckSquare,
  Square,
  ArrowRight,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  Edit2,
  Trash2,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Clock3,
  CalendarDays,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

interface MissoesDiariasTabProps {
  missoes: MissaoDiaria[];
  onChangeMissoes: (missoes: MissaoDiaria[]) => void;
  equipes: EquipeManutencao[];
  membros: MembroEquipe[];
}

export const MissoesDiariasTab: React.FC<MissoesDiariasTabProps> = ({
  missoes,
  onChangeMissoes,
  equipes,
  membros,
}) => {
  const hoje = formatarDataISO();
  const [dataSelecionada, setDataSelecionada] = useState<string>(hoje);
  const [mostrarApenasPendentes, setMostrarApenasPendentes] = useState(false);
  const [filtroEquipe, setFiltroEquipe] = useState<string>('todas');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todas');

  // Controle de Modal
  const [modalAberta, setModalAberta] = useState(false);
  const [missaoEmEdicao, setMissaoEmEdicao] = useState<MissaoDiaria | null>(null);

  // Formatação amigável da data selecionada
  const formatarDataCabecalho = (dataISO: string) => {
    try {
      const [ano, mes, dia] = dataISO.split('-').map(Number);
      const dataObj = new Date(ano, mes - 1, dia);
      const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'long' });
      const diaFormatado = String(dia).padStart(2, '0');
      const mesNome = dataObj.toLocaleDateString('pt-BR', { month: 'long' });
      return `${diaSemana.toUpperCase()}, ${diaFormatado} de ${mesNome.toUpperCase()} de ${ano}`;
    } catch {
      return dataISO;
    }
  };

  const formatarDataCurta = (dataISO: string) => {
    try {
      const [ano, mes, dia] = dataISO.split('-');
      return `${dia}/${mes}/${ano}`;
    } catch {
      return dataISO;
    }
  };

  // Navegar dias
  const mudarDia = (delta: number) => {
    setDataSelecionada((prev) => adicionarDiasISO(prev, delta));
  };

  const irParaHoje = () => {
    setDataSelecionada(hoje);
    setMostrarApenasPendentes(false);
  };

  // Filtragem das missões
  const missoesFiltradas = useMemo(() => {
    return missoes.filter((m) => {
      // Filtro de data ou todas pendentes
      if (mostrarApenasPendentes) {
        if (m.concluida) return false;
      } else {
        if (m.data !== dataSelecionada) return false;
      }

      // Filtro de equipe
      if (filtroEquipe !== 'todas') {
        if (m.equipeId !== filtroEquipe && m.equipeNome !== filtroEquipe) return false;
      }

      // Filtro de prioridade
      if (filtroPrioridade !== 'todas' && m.prioridade !== filtroPrioridade) {
        return false;
      }

      return true;
    });
  }, [missoes, dataSelecionada, mostrarApenasPendentes, filtroEquipe, filtroPrioridade]);

  // Estatísticas do dia selecionado
  const statsDia = useMemo(() => {
    const missoesDoDia = missoes.filter((m) => m.data === dataSelecionada);
    const total = missoesDoDia.length;
    const concluidas = missoesDoDia.filter((m) => m.concluida).length;
    const pendentes = total - concluidas;
    const paraProximoDia = missoesDoDia.filter((m) => m.adiadaParaProximoDia && !m.concluida).length;
    const percentual = total > 0 ? Math.round((concluidas / total) * 100) : 0;

    return { total, concluidas, pendentes, paraProximoDia, percentual };
  }, [missoes, dataSelecionada]);

  // Checkbox de conclusão
  const toggleConcluida = (id: string) => {
    onChangeMissoes(
      missoes.map((m) => {
        if (m.id === id) {
          const novoStatus = !m.concluida;
          return {
            ...m,
            concluida: novoStatus,
            dataConclusao: novoStatus ? formatarDataISO() : undefined,
            // Se concluída, desmarca que vai para o próximo dia
            adiadaParaProximoDia: novoStatus ? false : m.adiadaParaProximoDia,
          };
        }
        return m;
      })
    );
  };

  // Toggle de "Ir para o próximo dia"
  const toggleAdiadaParaProximoDia = (id: string) => {
    const amanha = adicionarDiasISO(dataSelecionada, 1);
    onChangeMissoes(
      missoes.map((m) => {
        if (m.id === id) {
          const novoValor = !m.adiadaParaProximoDia;
          return {
            ...m,
            adiadaParaProximoDia: novoValor,
            proximaData: novoValor ? amanha : undefined,
            // Se marcado para o próximo dia, remove concluída se estiver marcado
            concluida: novoValor ? false : m.concluida,
          };
        }
        return m;
      })
    );
  };

  // Mover missão efetivamente para o próximo dia
  const moverMissaoParaProximoDia = (id: string) => {
    const missao = missoes.find((m) => m.id === id);
    if (!missao) return;

    const dataDestino = adicionarDiasISO(missao.data, 1);
    if (
      confirm(
        `Deseja transferir a missão "${missao.titulo}" para o próximo dia (${formatarDataCurta(
          dataDestino
        )})?`
      )
    ) {
      onChangeMissoes(
        missoes.map((m) => {
          if (m.id === id) {
            return {
              ...m,
              data: dataDestino,
              adiadaParaProximoDia: false,
              concluida: false,
              observacoes: m.observacoes
                ? `${m.observacoes} | Transferida de ${formatarDataCurta(missao.data)}`
                : `Transferida de ${formatarDataCurta(missao.data)}`,
            };
          }
          return m;
        })
      );
    }
  };

  // Mover todas as pendentes não concluídas do dia para o dia seguinte
  const handleMoverTodasPendentesParaAmanha = () => {
    const pendentes = missoes.filter((m) => m.data === dataSelecionada && !m.concluida);
    if (pendentes.length === 0) {
      alert('Não há missões pendentes nesta data.');
      return;
    }

    const dataDestino = adicionarDiasISO(dataSelecionada, 1);
    if (
      confirm(
        `Confirma transferir ${pendentes.length} missão(ões) pendente(s) do dia ${formatarDataCurta(
          dataSelecionada
        )} para o próximo dia (${formatarDataCurta(dataDestino)})?`
      )
    ) {
      onChangeMissoes(
        missoes.map((m) => {
          if (m.data === dataSelecionada && !m.concluida) {
            return {
              ...m,
              data: dataDestino,
              adiadaParaProximoDia: false,
              observacoes: m.observacoes
                ? `${m.observacoes} | Postergrada de ${formatarDataCurta(dataSelecionada)}`
                : `Postergada de ${formatarDataCurta(dataSelecionada)}`,
            };
          }
          return m;
        })
      );
      setDataSelecionada(dataDestino);
    }
  };

  // Duplicar missão
  const duplicarMissao = (m: MissaoDiaria) => {
    const nova: MissaoDiaria = {
      ...m,
      id: gerarId(),
      titulo: `${m.titulo} (Continuação)`,
      concluida: false,
      adiadaParaProximoDia: false,
      dataConclusao: undefined,
    };
    onChangeMissoes([...missoes, nova]);
  };

  // Excluir missão
  const excluirMissao = (id: string) => {
    if (confirm('Deseja realmente remover esta missão do cronograma?')) {
      onChangeMissoes(missoes.filter((m) => m.id !== id));
    }
  };

  // Salvar do modal
  const handleSalvarMissaoModal = (missao: MissaoDiaria) => {
    if (missaoEmEdicao) {
      onChangeMissoes(missoes.map((m) => (m.id === missao.id ? missao : m)));
    } else {
      onChangeMissoes([...missoes, missao]);
    }
  };

  // Impressão da Ordem do Dia
  const handleImprimir = () => {
    window.print();
  };

  // Exportar CSV do dia
  const exportarCSV = () => {
    const cabecalho = [
      'Data',
      'Turno',
      'Prioridade',
      'Título da Missão',
      'Local/Setor',
      'Equipe',
      'Militares Escalados',
      'Determinações',
      'Materiais Necessários',
      'Concluída',
      'Irá para Próximo Dia',
      'Observações',
    ];

    const linhas = missoesFiltradas.map((m) => [
      `"${formatarDataCurta(m.data)}"`,
      `"${m.turno}"`,
      `"${m.prioridade}"`,
      `"${m.titulo.replace(/"/g, '""')}"`,
      `"${m.local.replace(/"/g, '""')}"`,
      `"${m.equipeNome || ''}"`,
      `"${(m.membrosDesignados || '').replace(/"/g, '""')}"`,
      `"${(m.descricao || '').replace(/"/g, '""')}"`,
      `"${(m.materiaisNecessarios || '').replace(/"/g, '""')}"`,
      `"${m.concluida ? 'SIM' : 'NÃO'}"`,
      `"${m.adiadaParaProximoDia ? 'SIM' : 'NÃO'}"`,
      `"${(m.observacoes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [cabecalho.join(';'), ...linhas.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Cronograma_Manutencao_${dataSelecionada}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBadgePrioridade = (prioridade: string) => {
    switch (prioridade) {
      case 'Urgente':
        return 'bg-red-100 text-red-800 border-red-300 font-bold';
      case 'Alta':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
      case 'Média':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Baixa':
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra Superior de Navegação por Data & Ações */}
      <div className="no-print bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Seletor de Data com Botões de Navegação */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => mudarDia(-1)}
                title="Dia Anterior"
                className="p-1.5 rounded hover:bg-white text-slate-700 hover:text-[#1a2b4c] transition"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-2 px-2">
                <Calendar size={15} className="text-[#c9a84e]" />
                <input
                  type="date"
                  value={dataSelecionada}
                  onChange={(e) => {
                    setDataSelecionada(e.target.value);
                    setMostrarApenasPendentes(false);
                  }}
                  className="bg-transparent font-bold text-xs sm:text-sm text-[#1a2b4c] focus:outline-none cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={() => mudarDia(1)}
                title="Próximo Dia"
                className="p-1.5 rounded hover:bg-white text-slate-700 hover:text-[#1a2b4c] transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Atalho Hoje */}
            <button
              type="button"
              onClick={irParaHoje}
              className={`px-3 py-1.5 text-xs font-bold rounded-md border transition ${
                dataSelecionada === hoje && !mostrarApenasPendentes
                  ? 'bg-[#1a2b4c] text-white border-[#1a2b4c]'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Hoje
            </button>

            {/* Alternar Ver Todas as Pendentes */}
            <button
              type="button"
              onClick={() => setMostrarApenasPendentes(!mostrarApenasPendentes)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md border transition flex items-center gap-1.5 ${
                mostrarApenasPendentes
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Clock3 size={14} />
              <span>Ver Todas as Pendentes</span>
            </button>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
            <button
              type="button"
              onClick={handleMoverTodasPendentesParaAmanha}
              title="Postegar todas as missões pendentes não concluídas de hoje para amanhã"
              className="px-3 py-1.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-md transition flex items-center gap-1.5"
            >
              <ArrowRight size={14} />
              <span>Mover Pendentes para Amanhã</span>
            </button>

            <button
              type="button"
              onClick={exportarCSV}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-md transition flex items-center gap-1.5"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" />
              <span>Exportar</span>
            </button>

            <button
              type="button"
              onClick={handleImprimir}
              className="px-3 py-1.5 text-xs font-bold bg-[#c9a84e] hover:bg-[#b5953e] text-[#1a2b4c] rounded-md transition flex items-center gap-1.5 shadow-xs"
            >
              <Printer size={14} />
              <span>Imprimir Ordem do Dia</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMissaoEmEdicao(null);
                setModalAberta(true);
              }}
              className="px-3.5 py-1.5 text-xs font-bold bg-[#1a2b4c] hover:bg-[#2c4373] text-white rounded-md shadow-xs transition flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Nova Determinação / Missão</span>
            </button>
          </div>
        </div>

        {/* Linha Informativa do Dia & Barra de Progresso */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-slate-800">
              {mostrarApenasPendentes
                ? '📋 Exibindo todas as missões pendentes acumuladas'
                : `📅 Ordem de Serviço para: ${formatarDataCabecalho(dataSelecionada)}`}
            </span>
            <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-3">
              <span>
                Total: <strong className="text-slate-800">{statsDia.total}</strong>
              </span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">
                Concluídas: {statsDia.concluidas}
              </span>
              <span>•</span>
              <span className="text-amber-700 font-semibold">
                Pendentes: {statsDia.pendentes}
              </span>
              {statsDia.paraProximoDia > 0 && (
                <>
                  <span>•</span>
                  <span className="text-blue-700 font-semibold">
                    Irão para amanhã: {statsDia.paraProximoDia}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Barra de Progresso do Dia */}
          {!mostrarApenasPendentes && statsDia.total > 0 && (
            <div className="w-full sm:w-60 flex flex-col gap-1">
              <div className="flex justify-between text-[11px] font-bold text-slate-600">
                <span>Progresso Diário</span>
                <span className={statsDia.percentual === 100 ? 'text-emerald-600' : 'text-slate-700'}>
                  {statsDia.concluidas}/{statsDia.total} ({statsDia.percentual}%)
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    statsDia.percentual === 100 ? 'bg-emerald-600' : 'bg-[#1a2b4c]'
                  }`}
                  style={{ width: `${statsDia.percentual}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Filtros Secundários */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Filtrar Equipe:</span>
            <select
              value={filtroEquipe}
              onChange={(e) => setFiltroEquipe(e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded text-slate-800 bg-white"
            >
              <option value="todas">Todas as Equipes</option>
              {equipes.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Prioridade:</span>
            <select
              value={filtroPrioridade}
              onChange={(e) => setFiltroPrioridade(e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded text-slate-800 bg-white"
            >
              <option value="todas">Todas</option>
              <option value="Urgente">🚨 Urgente</option>
              <option value="Alta">🔴 Alta</option>
              <option value="Média">🔵 Média</option>
              <option value="Baixa">🟢 Baixa</option>
            </select>
          </div>
        </div>
      </div>

      {/* ÁREA DE IMPRESSÃO EXCLUSIVA (OFICIAL PMESP) */}
      <div className="only-print p-6 text-black bg-white">
        <div className="border-b-2 border-black pb-3 mb-4 text-center">
          <h2 className="text-sm font-bold tracking-wider">POLÍCIA MILITAR DO ESTADO DE SÃO PAULO</h2>
          <h3 className="text-xs font-semibold">ACADEMIA DE POLÍCIA MILITAR DO BARRO BRANCO</h3>
          <h4 className="text-xs font-bold text-slate-900 mt-0.5">3ª COMPANHIA ESCOLA • SEÇÃO DE MANUTENÇÃO PREDIAL</h4>
          <div className="mt-2 text-sm font-bold uppercase underline">
            PAUTA DIÁRIA DE MISSÕES E DETERMINAÇÕES DE MANUTENÇÃO
          </div>
          <div className="text-xs font-medium mt-1">
            Data de Execução: <strong>{formatarDataCurta(dataSelecionada)}</strong>
          </div>
        </div>

        <table className="w-full text-xs border-collapse border border-black mb-6">
          <thead>
            <tr className="bg-slate-200">
              <th className="border border-black p-1.5 text-center w-12">CHECK</th>
              <th className="border border-black p-1.5 text-left">DETERMINAÇÃO / MISSÃO</th>
              <th className="border border-black p-1.5 text-left w-36">LOCAL / SETOR</th>
              <th className="border border-black p-1.5 text-left w-44">POLICIAIS EXECUTORES</th>
              <th className="border border-black p-1.5 text-center w-24">TURNO</th>
              <th className="border border-black p-1.5 text-center w-24">PRÓX. DIA?</th>
            </tr>
          </thead>
          <tbody>
            {missoesFiltradas.map((m, idx) => (
              <tr key={m.id}>
                <td className="border border-black p-2 text-center font-bold text-base">
                  {m.concluida ? '[ X ]' : '[   ]'}
                </td>
                <td className="border border-black p-1.5">
                  <div className="font-bold">{idx + 1}. {m.titulo}</div>
                  {m.descricao && <div className="text-[10px] text-slate-700">{m.descricao}</div>}
                  {m.materiaisNecessarios && (
                    <div className="text-[10px] italic">Mat: {m.materiaisNecessarios}</div>
                  )}
                </td>
                <td className="border border-black p-1.5">{m.local}</td>
                <td className="border border-black p-1.5">
                  <div className="font-bold text-slate-900">{m.membrosDesignados || m.equipeNome || 'A definir'}</div>
                  {m.equipeNome && m.membrosDesignados && (
                    <div className="text-[10px] text-slate-600">Equipe: {m.equipeNome}</div>
                  )}
                </td>
                <td className="border border-black p-1.5 text-center">{m.turno}</td>
                <td className="border border-black p-1.5 text-center">
                  {m.adiadaParaProximoDia ? 'SIM (Amanhã)' : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lista Interativa de Missões (Cards / Tabela Responsiva) */}
      <div className="no-print space-y-3">
        {missoesFiltradas.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-500">
            <CheckSquare size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-700">Nenhuma missão cadastrada para esta data.</p>
            <p className="text-xs text-slate-400 mt-1">
              Utilize o botão "+ Nova Determinação / Missão" acima para registrar os serviços das equipes.
            </p>
          </div>
        ) : (
          missoesFiltradas.map((m) => {
            return (
              <div
                key={m.id}
                className={`bg-white rounded-lg border transition shadow-2xs hover:shadow-sm p-4 ${
                  m.concluida
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : m.adiadaParaProximoDia
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Lado Esquerdo: Checkbox Concluída + Título + Detalhes */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Botão Checkbox Interativo Concluída */}
                    <button
                      type="button"
                      onClick={() => toggleConcluida(m.id)}
                      title={m.concluida ? 'Marcar como Pendente' : 'Marcar como Concluída'}
                      className="mt-0.5 text-slate-400 hover:text-emerald-600 transition shrink-0"
                    >
                      {m.concluida ? (
                        <CheckCircle2 size={24} className="text-emerald-600 fill-emerald-100" />
                      ) : (
                        <div className="w-6 h-6 rounded border-2 border-slate-400 hover:border-emerald-600 flex items-center justify-center bg-white transition" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {/* Status Badge */}
                        {m.concluida ? (
                          <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckSquare size={11} />
                            CONCLUÍDA
                          </span>
                        ) : m.adiadaParaProximoDia ? (
                          <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ArrowRight size={11} />
                            IRÁ PARA PRÓXIMO DIA
                          </span>
                        ) : (
                          <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock size={11} />
                            EM ANDAMENTO
                          </span>
                        )}

                        {/* Prioridade */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getBadgePrioridade(
                            m.prioridade
                          )}`}
                        >
                          {m.prioridade}
                        </span>

                        {/* Turno */}
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200">
                          {m.turno}
                        </span>

                        {/* Data (visível se estiver no modo pendentes acumuladas) */}
                        {mostrarApenasPendentes && (
                          <span className="bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
                            Data: {formatarDataCurta(m.data)}
                          </span>
                        )}
                      </div>

                      {/* Título da Missão */}
                      <h4
                        className={`text-sm font-bold text-slate-900 ${
                          m.concluida ? 'line-through text-slate-500' : ''
                        }`}
                      >
                        {m.titulo}
                      </h4>

                      {/* Descrição / Determinações */}
                      {m.descricao && (
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {m.descricao}
                        </p>
                      )}

                      {/* Informações de Local e Policiais que Realizarão */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600 mt-2.5">
                        <div className="flex items-center gap-1 text-slate-700">
                          <MapPin size={13} className="text-[#c9a84e]" />
                          <span className="font-semibold">{m.local}</span>
                        </div>

                        {/* Campo dos Policiais que realizarão (com edição rápida em linha) */}
                        <div className="flex items-center gap-1.5 bg-amber-50/80 border border-amber-200/90 rounded-md px-2.5 py-1 text-slate-800">
                          <Shield size={13} className="text-[#1a2b4c] shrink-0" />
                          <span className="font-bold text-[#1a2b4c]">Policiais Executores:</span>
                          <input
                            type="text"
                            value={m.membrosDesignados || ''}
                            onChange={(e) => {
                              const valor = e.target.value;
                              onChangeMissoes(
                                missoes.map((item) =>
                                  item.id === m.id ? { ...item, membrosDesignados: valor } : item
                                )
                              );
                            }}
                            placeholder="Ex: Cb PM Ribeiro, Sd PM Santana..."
                            title="Clique para alterar diretamente os policiais que realizarão esta missão"
                            className="bg-white border border-amber-300 rounded px-2 py-0.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#1a2b4c] min-w-[220px]"
                          />
                        </div>

                        {m.equipeNome && (
                          <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                            <Users size={12} className="text-slate-400" />
                            <span>Equipe: {m.equipeNome}</span>
                          </div>
                        )}

                        {m.materiaisNecessarios && (
                          <div className="flex items-center gap-1 text-slate-600 italic text-[11px]">
                            <span>📦 Materiais: {m.materiaisNecessarios}</span>
                          </div>
                        )}
                      </div>

                      {/* Observações / Notas do Encarregado */}
                      {m.observacoes && (
                        <div className="mt-2 text-[11px] bg-slate-50 border border-slate-200 rounded p-1.5 text-slate-600">
                          <strong className="text-slate-700">Obs:</strong> {m.observacoes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lado Direito: Ações rápidas (Ir para Próximo Dia, Mover, Editar, Excluir) */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 justify-end">
                    {/* Botão/Toggle "Ir para o Próximo Dia" */}
                    <button
                      type="button"
                      onClick={() => toggleAdiadaParaProximoDia(m.id)}
                      title={
                        m.adiadaParaProximoDia
                          ? 'Desmarcar envio para o próximo dia'
                          : 'Marcar para que esta missão vá para o próximo dia'
                      }
                      className={`px-2.5 py-1.5 text-xs font-bold rounded-md border transition flex items-center gap-1.5 ${
                        m.adiadaParaProximoDia
                          ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300'
                      }`}
                    >
                      <ArrowRight size={13} />
                      <span>{m.adiadaParaProximoDia ? 'Irá p/ Próx. Dia' : 'Ir p/ Próx. Dia'}</span>
                    </button>

                    {/* Botão para efetivamente avançar a data da missão para amanhã */}
                    {!m.concluida && (
                      <button
                        type="button"
                        onClick={() => moverMissaoParaProximoDia(m.id)}
                        title="Transferir esta missão diretamente para a data de amanhã"
                        className="px-2 py-1.5 text-xs text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-md transition"
                      >
                        Avançar Data ⏩
                      </button>
                    )}

                    {/* Editar */}
                    <button
                      type="button"
                      onClick={() => {
                        setMissaoEmEdicao(m);
                        setModalAberta(true);
                      }}
                      title="Editar Missão"
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition"
                    >
                      <Edit2 size={15} />
                    </button>

                    {/* Excluir */}
                    <button
                      type="button"
                      onClick={() => excluirMissao(m.id)}
                      title="Excluir Missão"
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-md transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Criação / Edição de Missão */}
      <ModalNovaMissao
        aberto={modalAberta}
        onFechar={() => {
          setModalAberta(false);
          setMissaoEmEdicao(null);
        }}
        onSalvar={handleSalvarMissaoModal}
        missaoEmEdicao={missaoEmEdicao}
        dataSugerida={dataSelecionada}
        equipes={equipes}
        membros={membros}
      />
    </div>
  );
};
