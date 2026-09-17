import React, { useState, useMemo, useRef } from 'react';
import {
  MissaoDiaria,
  EquipeManutencao,
  MembroEquipe,
  InformeMensal,
  PaginaFotoServico,
  FotoCard,
} from '../../types';
import { ModalNovaMissao } from './ModalNovaMissao';
import { ModalPreviaFolhaInforme } from './ModalPreviaFolhaInforme';
import { formatarAnoPelotao } from './CadastroEquipesTab';
import { imprimirEmNovaJanela } from '../../utils/pdfPrintHelper';
import {
  formatarDataISO,
  adicionarDiasISO,
  gerarId,
  baixarFoto,
  comprimirImagemParaArmazenamento,
  getImpedimentoMembroNoDia,
  temImpedimentoNoDia,
  MISSOES_OFICIAIS_HISTORICAS,
  DADOS_INICIAIS_MEMBROS,
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
  Camera,
  Upload,
  Eye,
  ExternalLink,
  Newspaper,
  Image as ImageIcon,
  Download,
  RotateCcw,
} from 'lucide-react';

interface MissoesDiariasTabProps {
  missoes: MissaoDiaria[];
  onChangeMissoes: (missoes: MissaoDiaria[]) => void;
  equipes: EquipeManutencao[];
  membros: MembroEquipe[];
  onChangeMembros?: (membros: MembroEquipe[]) => void;
  informeAtual?: InformeMensal;
  onChangeInformeAtual?: (informe: InformeMensal) => void;
  onNavegarParaInforme?: () => void;
  dataSelecionada?: string;
  onChangeDataSelecionada?: (data: string) => void;
}

export const MissoesDiariasTab: React.FC<MissoesDiariasTabProps> = ({
  missoes,
  onChangeMissoes,
  equipes,
  membros,
  onChangeMembros,
  informeAtual,
  onChangeInformeAtual,
  onNavegarParaInforme,
  dataSelecionada: dataSelecionadaProp,
  onChangeDataSelecionada,
}) => {
  const hoje = formatarDataISO();
  const [dataInterna, setDataInterna] = useState<string>(hoje);
  const dataSelecionada = dataSelecionadaProp || dataInterna;

  const setDataSelecionada = (novaData: string | ((prev: string) => string)) => {
    const valor = typeof novaData === 'function' ? novaData(dataSelecionada) : novaData;
    if (onChangeDataSelecionada) {
      onChangeDataSelecionada(valor);
    } else {
      setDataInterna(valor);
    }
  };
  const [mostrarApenasPendentes, setMostrarApenasPendentes] = useState(false);
  const [filtroEquipe, setFiltroEquipe] = useState<string>('todas');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todas');
  const [modoVisualizacao, setModoVisualizacao] = useState<'tabela' | 'cards'>('tabela');

  // Controle de Modais
  const [modalAberta, setModalAberta] = useState(false);
  const [missaoEmEdicao, setMissaoEmEdicao] = useState<MissaoDiaria | null>(null);
  const [missaoPreviaFolha, setMissaoPreviaFolha] = useState<MissaoDiaria | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // Referência para impressão da folha oficial de ordem do dia
  const folhaOrdemDoDiaRef = useRef<HTMLDivElement>(null);

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

  // Militares com impedimento no efetivo fixo de manutenção (Militares da 3ª Cia) e policiais em apoio na data selecionada
  const cadetesComImpedimento = useMemo(() => {
    return membros
      .filter((m) => temImpedimentoNoDia(m, dataSelecionada))
      .map((m) => ({
        ...m,
        impedimento: getImpedimentoMembroNoDia(m, dataSelecionada),
      }));
  }, [membros, dataSelecionada]);

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

  // Restaurar missões e determinações oficiais dos dias 16/09 e 17/09 conforme os anexos
  const handleRestaurarPautasOficiais = () => {
    if (
      confirm(
        'Deseja restaurar as Missões e Determinações Oficiais dos dias 16/09 e 17/09 conforme os registros e anexos oficiais da 3ª Cia Escola?'
      )
    ) {
      // 1. Remove quaisquer dados corrompidos das datas 16 e 17 e reimplanta os oficiais
      const outrasMissoes = missoes.filter(
        (m) => m.data !== '2026-09-16' && m.data !== '2026-09-17'
      );

      // Preserva fotos caso o usuário já tenha anexado
      const restauradas = MISSOES_OFICIAIS_HISTORICAS.map((oficial) => {
        const existente = missoes.find(
          (m) =>
            m.id === oficial.id ||
            (m.data === oficial.data && m.titulo.toLowerCase() === oficial.titulo.toLowerCase())
        );
        if (existente) {
          return {
            ...oficial,
            fotoAntesUrl: existente.fotoAntesUrl || oficial.fotoAntesUrl,
            fotoDepoisUrl: existente.fotoDepoisUrl || oficial.fotoDepoisUrl,
          };
        }
        return oficial;
      });

      onChangeMissoes([...outrasMissoes, ...restauradas]);

      // 2. Restaura também os impedimentos do efetivo correspondentes aos dias 16 e 17
      if (onChangeMembros) {
        const membrosAtualizados = membros.map((m) => {
          const dadosOficiais = DADOS_INICIAIS_MEMBROS.find(
            (o) =>
              (o.re && m.re && o.re.replace(/\D/g, '') === o.re.replace(/\D/g, '')) ||
              o.nomeGuerra.toLowerCase() === m.nomeGuerra.toLowerCase()
          );
          if (dadosOficiais) {
            return {
              ...m,
              pelotao: dadosOficiais.pelotao || m.pelotao,
              tipoEfetivo: dadosOficiais.tipoEfetivo || m.tipoEfetivo || 'fixo',
              origemApoio: dadosOficiais.origemApoio || m.origemApoio,
              impedimentosPorData: {
                ...(m.impedimentosPorData || {}),
                ...(dadosOficiais.impedimentosPorData || {}),
              },
            };
          }
          return m;
        });

        for (const oficial of DADOS_INICIAIS_MEMBROS) {
          const existe = membrosAtualizados.some(
            (m) =>
              (m.re && oficial.re && m.re.replace(/\D/g, '') === oficial.re.replace(/\D/g, '')) ||
              m.nomeGuerra.toLowerCase() === oficial.nomeGuerra.toLowerCase()
          );
          if (!existe) {
            membrosAtualizados.push(oficial);
          }
        }

        onChangeMembros(membrosAtualizados);
      }

      setDataSelecionada('2026-09-17');
      setMensagemSucesso(
        'Missões, determinações e impedimentos dos dias 16 e 17 de setembro restaurados com êxito conforme o anexo oficial!'
      );
    }
  };

  // Sincronização automática da missão com o Informe Mensal (cria folha oficial)
  const sincronizarComInformeMensal = (
    missaoAtualizada: MissaoDiaria,
    fotoAntesParam?: string,
    fotoDepoisParam?: string
  ) => {
    if (!onChangeInformeAtual || !informeAtual) return;

    const antes = fotoAntesParam !== undefined ? fotoAntesParam : missaoAtualizada.fotoAntesUrl;
    const depois = fotoDepoisParam !== undefined ? fotoDepoisParam : missaoAtualizada.fotoDepoisUrl;
    const paginaId = missaoAtualizada.informePaginaId || `folha-missao-${missaoAtualizada.id}`;

    const fotosPagina: FotoCard[] = [];
    if (antes) {
      fotosPagina.push({
        id: `foto-antes-${missaoAtualizada.id}`,
        url: antes,
        legenda: 'SITUAÇÃO INICIAL (ANTES DO SERVIÇO)',
      });
    }
    if (depois) {
      fotosPagina.push({
        id: `foto-depois-${missaoAtualizada.id}`,
        url: depois,
        legenda: 'SERVIÇO CONCLUÍDO (DEPOIS DA INTERVENÇÃO)',
      });
    }

    // Se nenhuma foto estiver anexada, remove a folha vinculada se ela existia
    if (fotosPagina.length === 0) {
      if (missaoAtualizada.informePaginaId) {
        onChangeInformeAtual({
          ...informeAtual,
          paginas: informeAtual.paginas.filter((p) => p.id !== paginaId),
        });
      }
      return;
    }

    const paginaFormatada: PaginaFotoServico = {
      id: paginaId,
      tituloServico: (missaoAtualizada.titulo || 'SERVIÇO DE MANUTENÇÃO PREDIAL').toUpperCase(),
      dataServico: formatarDataCurta(missaoAtualizada.data),
      descricao: `${missaoAtualizada.local ? `${missaoAtualizada.local} — ` : ''}${
        missaoAtualizada.descricao || missaoAtualizada.titulo
      }. Executores: ${
        missaoAtualizada.membrosDesignados ||
        missaoAtualizada.equipeNome ||
        'Efetivo da 3ª Cia Escola'
      }.`,
      anotacao:
        missaoAtualizada.observacoes ||
        '✅ Manutenção predial finalizada com êxito conforme determinação da Seção.',
      tipoGrid: '2',
      fotos: fotosPagina,
    };

    const indexExiste = informeAtual.paginas.findIndex((p) => p.id === paginaId);
    let novasPaginas: PaginaFotoServico[];
    if (indexExiste >= 0) {
      novasPaginas = [...informeAtual.paginas];
      novasPaginas[indexExiste] = paginaFormatada;
    } else {
      novasPaginas = [...informeAtual.paginas, paginaFormatada];
    }

    onChangeInformeAtual({
      ...informeAtual,
      paginas: novasPaginas,
    });
  };

  // Upload/captura de foto pelo policial (Câmera ou Galeria) com compressão inteligente
  const handleUploadFoto = async (
    missaoId: string,
    tipo: 'antes' | 'depois',
    file: File
  ) => {
    try {
      const dataUrl = await comprimirImagemParaArmazenamento(file);
      const missaoAlvo = missoes.find((m) => m.id === missaoId);
      if (!missaoAlvo) return;

      const fotoAntes = tipo === 'antes' ? dataUrl : missaoAlvo.fotoAntesUrl;
      const fotoDepois = tipo === 'depois' ? dataUrl : missaoAlvo.fotoDepoisUrl;
      const paginaId = missaoAlvo.informePaginaId || `folha-missao-${missaoAlvo.id}`;

      const missaoAtualizada: MissaoDiaria = {
        ...missaoAlvo,
        fotoAntesUrl: fotoAntes,
        fotoDepoisUrl: fotoDepois,
        informePaginaId: paginaId,
      };

      onChangeMissoes(
        missoes.map((m) => (m.id === missaoId ? missaoAtualizada : m))
      );

      sincronizarComInformeMensal(missaoAtualizada, fotoAntes, fotoDepois);
      setMensagemSucesso(
        `📸 Foto do ${tipo.toUpperCase()} salva e preservada com sucesso!`
      );
      setTimeout(() => setMensagemSucesso(null), 4000);
    } catch (err) {
      console.error('Erro ao processar e salvar foto:', err);
    }
  };

  // Remover foto registrada
  const handleRemoverFoto = (missaoId: string, tipo: 'antes' | 'depois') => {
    const missaoAlvo = missoes.find((m) => m.id === missaoId);
    if (!missaoAlvo) return;

    const fotoAntes = tipo === 'antes' ? undefined : missaoAlvo.fotoAntesUrl;
    const fotoDepois = tipo === 'depois' ? undefined : missaoAlvo.fotoDepoisUrl;

    const missaoAtualizada: MissaoDiaria = {
      ...missaoAlvo,
      fotoAntesUrl: fotoAntes,
      fotoDepoisUrl: fotoDepois,
    };

    onChangeMissoes(
      missoes.map((m) => (m.id === missaoId ? missaoAtualizada : m))
    );

    sincronizarComInformeMensal(missaoAtualizada, fotoAntes, fotoDepois);
  };

  // Salvar do modal
  const handleSalvarMissaoModal = (missao: MissaoDiaria) => {
    let missaoFinal = { ...missao };
    if (missaoFinal.fotoAntesUrl || missaoFinal.fotoDepoisUrl) {
      if (!missaoFinal.informePaginaId) {
        missaoFinal.informePaginaId = `folha-missao-${missaoFinal.id}`;
      }
      sincronizarComInformeMensal(missaoFinal);
    }
    if (missaoEmEdicao) {
      onChangeMissoes(missoes.map((m) => (m.id === missaoFinal.id ? missaoFinal : m)));
    } else {
      onChangeMissoes([...missoes, missaoFinal]);
    }
  };

  // Impressão da Ordem do Dia (abre janela dedicada e imprime exatamente a pauta oficial)
  const handleImprimir = () => {
    if (folhaOrdemDoDiaRef.current) {
      imprimirEmNovaJanela(
        folhaOrdemDoDiaRef.current,
        `PAUTA DIÁRIA DE MISSÕES - ${formatarDataCurta(dataSelecionada)}`
      );
    } else {
      window.print();
    }
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
      {/* Notificação de sucesso / sincronização com informe */}
      {mensagemSucesso && (
        <div className="no-print bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-lg flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{mensagemSucesso}</span>
          </div>
          <button
            type="button"
            onClick={() => setMensagemSucesso(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

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

            {/* Atalhos Rápidos para as Pautas Oficiais dos Anexos */}
            <button
              type="button"
              onClick={() => {
                setDataSelecionada('2026-09-16');
                setMostrarApenasPendentes(false);
              }}
              title="Visualizar Ordem do Dia e Determinações de 16/09/2026"
              className={`px-2.5 py-1.5 text-xs font-bold rounded-md border transition ${
                dataSelecionada === '2026-09-16' && !mostrarApenasPendentes
                  ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                  : 'bg-white text-blue-950 border-blue-200 hover:bg-blue-50'
              }`}
            >
              16/09 (Quarta)
            </button>

            <button
              type="button"
              onClick={() => {
                setDataSelecionada('2026-09-17');
                setMostrarApenasPendentes(false);
              }}
              title="Visualizar Ordem do Dia e Determinações de 17/09/2026"
              className={`px-2.5 py-1.5 text-xs font-bold rounded-md border transition ${
                dataSelecionada === '2026-09-17' && !mostrarApenasPendentes
                  ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                  : 'bg-white text-blue-950 border-blue-200 hover:bg-blue-50'
              }`}
            >
              17/09 (Quinta)
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
            {/* Restaurar Pautas Oficiais dos dias 16 e 17 de setembro */}
            <button
              type="button"
              onClick={handleRestaurarPautasOficiais}
              title="Restaurar missões, determinações e impedimentos oficiais dos dias 16/09 e 17/09 conforme os anexos"
              className="px-3 py-1.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-md transition flex items-center gap-1.5 shadow-xs"
            >
              <RotateCcw size={13} className="text-amber-700 shrink-0" />
              <span>Restaurar 16 e 17/09</span>
            </button>

            <button
              type="button"
              onClick={handleMoverTodasPendentesParaAmanha}
              title="Postegar todas as missões pendentes não concluídas de hoje para amanhã"
              className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-md transition flex items-center gap-1.5"
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

          {/* Alternador de Modo de Visualização */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-slate-500 font-medium">Visualização:</span>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
              <button
                type="button"
                onClick={() => setModoVisualizacao('tabela')}
                className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1.5 transition ${
                  modoVisualizacao === 'tabela'
                    ? 'bg-[#1a2b4c] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Exibir Folha Oficial da Pauta Diária de Missões"
              >
                <FileSpreadsheet size={13} />
                <span>Pauta Oficial PMESP (Tabela)</span>
              </button>
              <button
                type="button"
                onClick={() => setModoVisualizacao('cards')}
                className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1.5 transition ${
                  modoVisualizacao === 'cards'
                    ? 'bg-[#1a2b4c] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Exibir como Cards Interativos"
              >
                <Layers size={13} />
                <span>Cards</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TABELA / FOLHA OFICIAL PMESP DE PAUTA DIÁRIA DE MISSÕES       */}
      {/* ============================================================ */}
      <div
        ref={folhaOrdemDoDiaRef}
        className={`pauta-diaria-page bg-white rounded-lg border border-slate-300 shadow-sm p-4 sm:p-8 text-black print:border-none print:shadow-none print:p-0 ${
          modoVisualizacao === 'tabela' ? 'block' : 'hidden print:block'
        }`}
      >
        {/* Cabeçalho Oficial PMESP / APMBB exatamente conforme modelo */}
        <div className="text-center select-text pb-1">
          <h2 className="text-sm sm:text-base font-extrabold tracking-wider text-black uppercase leading-tight">
            POLÍCIA MILITAR DO ESTADO DE SÃO PAULO
          </h2>
          <h3 className="text-xs sm:text-sm font-bold text-black uppercase leading-tight mt-0.5">
            ACADEMIA DE POLÍCIA MILITAR DO BARRO BRANCO
          </h3>
          <h4 className="text-xs sm:text-sm font-bold text-black uppercase leading-tight mt-0.5">
            3ª COMPANHIA ESCOLA • SEÇÃO DE MANUTENÇÃO PREDIAL
          </h4>
          <div className="mt-2.5 text-sm sm:text-base font-extrabold uppercase underline tracking-wide text-black">
            PAUTA DIÁRIA DE MISSÕES E DETERMINAÇÕES DE MANUTENÇÃO
          </div>
          <div className="text-xs sm:text-sm mt-1 text-black font-normal">
            Data de Execução: <strong>{formatarDataCurta(dataSelecionada)}</strong> • <span className="uppercase">{formatarDataCabecalho(dataSelecionada)}</span>
          </div>
        </div>

        {/* Linha divisória horizontal preta separando o cabeçalho da tabela */}
        <div className="border-t border-black my-3.5 w-full" />

        {/* Tabela de Missões e Determinações (6 colunas com dimensões proporcionais exatas para A4 e quebra estrita de linha) */}
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-xs border-collapse border border-black mb-4 table-fixed">
            <colgroup>
              <col style={{ width: '6%' }} />
              <col style={{ width: '36%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '23%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '8%' }} />
            </colgroup>
            <thead>
              <tr className="bg-[#dde5ee] print:bg-slate-200 text-black">
                <th className="border border-black px-1 py-1.5 text-center font-bold text-[11px] uppercase tracking-tight overflow-hidden break-words">
                  CHECK
                </th>
                <th className="border border-black px-2 py-1.5 text-left font-bold text-[11px] uppercase tracking-tight overflow-hidden break-words">
                  DETERMINAÇÃO / MISSÃO
                </th>
                <th className="border border-black px-2 py-1.5 text-left font-bold text-[11px] uppercase tracking-tight overflow-hidden break-words">
                  LOCAL / SETOR
                </th>
                <th className="border border-black px-2 py-1.5 text-left font-bold text-[11px] uppercase tracking-tight overflow-hidden break-words">
                  POLICIAIS EXECUTORES
                </th>
                <th className="border border-black px-1 py-1.5 text-center font-bold text-[11px] uppercase tracking-tight overflow-hidden break-words">
                  TURNO
                </th>
                <th className="border border-black px-1 py-1.5 text-center font-bold text-[11px] uppercase tracking-tight overflow-hidden break-words">
                  PRÓX. DIA?
                </th>
              </tr>
            </thead>
            <tbody>
              {missoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border border-black p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckSquare size={32} className="text-slate-400" />
                      <span className="font-bold text-slate-700 text-sm">
                        Nenhuma missão cadastrada para esta data ({formatarDataCurta(dataSelecionada)}).
                      </span>
                      <p className="text-xs text-slate-500 max-w-md">
                        Utilize o botão <strong>"+ Nova Determinação / Missão"</strong> acima para registrar serviços para as equipes e efetivo da 3ª Cia.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setMissaoEmEdicao(null);
                          setModalAberta(true);
                        }}
                        className="no-print mt-2 px-3 py-1.5 bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Cadastrar Missão Agora</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                missoesFiltradas.map((m, idx) => (
                  <tr
                    key={m.id}
                    className="hover:bg-slate-50/70 transition group relative"
                  >
                    {/* CHECK [ ] ou [X] - Sem desalinhamento, largura e altura perfeitamente rígidas */}
                    <td className="border border-black p-0 text-center align-middle h-9 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleConcluida(m.id)}
                        title={m.concluida ? 'Marcar como Pendente [ ]' : 'Marcar como Concluída [X]'}
                        className="w-full h-full min-h-[36px] flex items-center justify-center cursor-pointer text-black hover:bg-slate-100 transition-colors select-none focus:outline-hidden"
                      >
                        <span className="font-mono font-bold text-xs sm:text-sm tracking-wider inline-block text-center select-none leading-none">
                          {m.concluida ? '[X]' : '[ ]'}
                        </span>
                      </button>
                    </td>

                    {/* DETERMINAÇÃO / MISSÃO */}
                    <td className="border border-black px-2 py-1.5 align-top overflow-hidden break-words [overflow-wrap:anywhere]">
                      <div className="flex items-start justify-between gap-1.5 w-full min-w-0">
                        <div className="flex-1 min-w-0 break-words [overflow-wrap:anywhere]">
                          <div
                            onClick={() => {
                              setMissaoEmEdicao(m);
                              setModalAberta(true);
                            }}
                            className="font-bold text-black text-xs sm:text-[12.5px] leading-tight cursor-pointer hover:text-blue-800 break-words [overflow-wrap:anywhere]"
                            title="Clique para editar determinação"
                          >
                            {idx + 1}. {m.titulo}
                          </div>

                          {m.descricao && (
                            <div className="text-[11px] text-slate-800 mt-0.5 leading-snug break-words [overflow-wrap:anywhere]">
                              {m.descricao}
                            </div>
                          )}

                          {m.materiaisNecessarios && (
                            <div className="text-[10px] text-slate-700 italic mt-0.5 leading-tight break-words [overflow-wrap:anywhere]">
                              <strong>Materiais:</strong> {m.materiaisNecessarios}
                            </div>
                          )}

                          {m.observacoes && (
                            <div className="text-[10px] text-slate-600 mt-0.5 leading-tight break-words [overflow-wrap:anywhere]">
                              <strong>Obs:</strong> {m.observacoes}
                            </div>
                          )}

                          {/* Se tiver fotos anexadas, exibe tag de atalho para a Folha do Informe Mensal */}
                          {(m.fotoAntesUrl || m.fotoDepoisUrl) && (
                            <div className="mt-1 flex items-center gap-1.5 no-print">
                              <button
                                type="button"
                                onClick={() => setMissaoPreviaFolha(m)}
                                className="no-print inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 text-[9.5px] font-bold rounded cursor-pointer transition"
                                title="Ver folha gerada nos padrões do Informe Mensal"
                              >
                                <Camera size={11} className="text-blue-700" />
                                <span>Folha do Informe ({[m.fotoAntesUrl, m.fotoDepoisUrl].filter(Boolean).length} foto(s))</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Botões rápidos de ação no hover (ocultos na impressão) */}
                        <div className="opacity-0 group-hover:opacity-100 transition no-print flex items-center gap-1 shrink-0 bg-white/95 border border-slate-300 rounded px-1 py-0.5 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => {
                              setMissaoEmEdicao(m);
                              setModalAberta(true);
                            }}
                            title="Tirar foto ou editar missão"
                            className="p-1 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <Camera size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMissaoEmEdicao(m);
                              setModalAberta(true);
                            }}
                            title="Editar Missão"
                            className="p-1 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moverMissaoParaProximoDia(m.id)}
                            title="Avançar para amanhã"
                            className="p-1 text-slate-600 hover:text-amber-700 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            ⏩
                          </button>
                          <button
                            type="button"
                            onClick={() => excluirMissao(m.id)}
                            title="Excluir Missão"
                            className="p-1 text-slate-600 hover:text-red-700 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* LOCAL / SETOR */}
                    <td className="border border-black px-2 py-1.5 align-top text-xs text-black break-words [overflow-wrap:anywhere] overflow-hidden leading-tight">
                      {m.local}
                    </td>

                    {/* POLICIAIS EXECUTORES */}
                    <td className="border border-black px-2 py-1.5 align-top text-xs leading-tight break-words [overflow-wrap:anywhere] overflow-hidden">
                      <div className="font-bold text-black break-words [overflow-wrap:anywhere]">
                        {m.membrosDesignados || (!m.equipeNome ? 'A definir' : '')}
                      </div>
                      {m.equipeNome && (
                        <div className="text-[10.5px] text-slate-600 mt-0.5 leading-tight break-words [overflow-wrap:anywhere]">
                          Equipe: {m.equipeNome}
                        </div>
                      )}
                      {!m.membrosDesignados && !m.equipeNome && (
                        <div className="font-bold text-black">A definir</div>
                      )}
                    </td>

                    {/* TURNO */}
                    <td className="border border-black px-1 py-1.5 text-center align-middle text-xs font-semibold text-black break-words [overflow-wrap:anywhere] overflow-hidden leading-tight">
                      {m.turno}
                    </td>

                    {/* PRÓX. DIA? */}
                    <td className="border border-black px-1 py-1.5 text-center align-middle text-xs break-words [overflow-wrap:anywhere] overflow-hidden leading-tight">
                      <button
                        type="button"
                        onClick={() => toggleAdiadaParaProximoDia(m.id)}
                        title="Clique para alternar se vai para o próximo dia"
                        className="cursor-pointer text-black font-semibold hover:underline"
                      >
                        {m.adiadaParaProximoDia ? 'SIM' : '-'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ============================================================ */}
        {/* RODAPÉ DA PAUTA OFICIAL PMESP: CADETES COM IMPEDIMENTO       */}
        {/* ============================================================ */}
        <div className="mt-4 border border-black p-2.5 bg-white text-black break-inside-avoid print:mt-3">
          <div className="flex items-center justify-between border-b border-black pb-1 mb-1.5">
            <div className="font-extrabold text-[11px] sm:text-xs uppercase tracking-wider text-black flex items-center gap-1.5">
              <span>EFETIVO DE MANUTENÇÃO & POLICIAIS EM APOIO — IMPEDIMENTOS / AFASTAMENTOS</span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-black uppercase">
              {cadetesComImpedimento.length === 0
                ? 'SEM ALTERAÇÃO / TODOS APTOS'
                : `${cadetesComImpedimento.length} MILITAR(ES) COM IMPEDIMENTO`}
            </span>
          </div>

          {cadetesComImpedimento.length === 0 ? (
            <div className="text-xs text-slate-700 italic py-1">
              Todos os policiais militares do efetivo fixo da 3ª Cia e policiais que prestam apoio encontram-se aptos e disponíveis para as escalas e missões desta data.
            </div>
          ) : (
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-xs border-collapse border border-black table-fixed">
                <colgroup>
                  <col style={{ width: '38%' }} />
                  <col style={{ width: '24%' }} />
                  <col style={{ width: '38%' }} />
                </colgroup>
                <thead>
                  <tr className="bg-[#dde5ee] print:bg-slate-200 text-black">
                    <th className="border border-black px-2 py-1 text-left font-bold text-[11px] uppercase overflow-hidden break-words">
                      GRADUAÇÃO & NOME DE GUERRA
                    </th>
                    <th className="border border-black px-2 py-1 text-center font-bold text-[11px] uppercase overflow-hidden break-words">
                      CFO / PELOTÃO / ORIGEM
                    </th>
                    <th className="border border-black px-2 py-1 text-left font-bold text-[11px] uppercase overflow-hidden break-words">
                      MOTIVO DO IMPEDIMENTO
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cadetesComImpedimento.map((militar) => {
                    const ehApoio = militar.tipoEfetivo === 'apoio';
                    const anoPel = formatarAnoPelotao(militar.anoCurso, militar.pelotao);
                    return (
                      <tr key={militar.id} className="border-b border-black bg-white">
                        <td className="border border-black px-2 py-1.5 font-bold text-black align-middle overflow-hidden break-words [overflow-wrap:anywhere] leading-tight">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] px-1 py-0.2 border border-black text-black font-bold rounded shrink-0">
                              {militar.graduacao || 'PM'}
                            </span>
                            <span className="break-words">{militar.nomeGuerra}</span>
                            {militar.re && (
                              <span className="font-mono text-[10px] text-slate-700 font-normal shrink-0">
                                (RE {militar.re})
                              </span>
                            )}
                            <span
                              className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border border-black text-black shrink-0"
                            >
                              {ehApoio ? 'Apoio' : 'Fixo 3ª Cia'}
                            </span>
                          </div>
                        </td>
                        <td className="border border-black px-2 py-1.5 text-center font-bold text-black align-middle overflow-hidden break-words [overflow-wrap:anywhere] leading-tight">
                          <div className="break-words">
                            {anoPel !== '-' ? anoPel : (militar.pelotao ? `Pelotão ${militar.pelotao}` : '-')}
                            {ehApoio && militar.origemApoio && (
                              <div className="text-[10px] text-slate-600 font-normal mt-0.5 break-words">
                                Origem: {militar.origemApoio}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="border border-black px-2 py-1.5 text-black font-semibold align-middle text-xs overflow-hidden break-words [overflow-wrap:anywhere] leading-tight">
                          {militar.impedimento}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Rodapé / Subunidade */}
          <div className="mt-2 pt-1 border-t border-black text-[10px] text-right italic text-slate-700">
            3ª Cia Escola • Manutenção Predial • APMBB
          </div>
        </div>




      </div>

      {/* ============================================================ */}
      {/* LISTA DE CARDS INTERATIVOS (MODO ALTERNATIVO)                 */}
      {/* ============================================================ */}
      {modoVisualizacao === 'cards' && (
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

                {/* ============================================================ */}
                {/* SEÇÃO DE FOTOS: ANTES & DEPOIS (Padrão Oficial Informe Mensal) */}
                {/* ============================================================ */}
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="p-1 rounded bg-[#1a2b4c]/10 text-[#1a2b4c]">
                        <Camera size={15} />
                      </div>
                      <span className="text-xs font-bold text-[#1a2b4c]">
                        Registro Fotográfico (Antes & Depois do Serviço)
                      </span>
                      {(m.fotoAntesUrl || m.fotoDepoisUrl) && (
                        <span className="bg-blue-100 text-blue-900 border border-blue-200 text-[10.5px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 size={11} className="text-blue-700" />
                          Folha Gerada no Informe Mensal
                        </span>
                      )}
                    </div>

                    {(m.fotoAntesUrl || m.fotoDepoisUrl) && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            if (m.fotoAntesUrl) {
                              baixarFoto(m.fotoAntesUrl, `missao-${m.numeroOrdem || m.id}-ANTES.jpg`);
                            }
                            if (m.fotoDepoisUrl) {
                              setTimeout(() => {
                                baixarFoto(m.fotoDepoisUrl!, `missao-${m.numeroOrdem || m.id}-DEPOIS.jpg`);
                              }, 300);
                            }
                          }}
                          className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded border border-emerald-200 transition"
                          title="Baixar arquivo(s) de foto para o seu aparelho"
                        >
                          <Download size={13} />
                          <span>Baixar Foto(s)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMissaoPreviaFolha(m)}
                          className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded border border-blue-200 transition"
                          title="Visualizar a folha montada nos padrões oficiais do Informe Mensal"
                        >
                          <Eye size={13} />
                          <span>Ver Folha do Informe</span>
                        </button>
                        {onNavegarParaInforme && (
                          <button
                            type="button"
                            onClick={onNavegarParaInforme}
                            className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded border border-slate-300 transition"
                            title="Ir para o módulo do Informe Mensal completo"
                          >
                            <span>Ir p/ Informe ↗</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Bloco Foto ANTES */}
                    <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/70 flex flex-col justify-between">
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[11.5px] font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                          FOTO DO ANTES (Situação Inicial / Problema)
                        </span>
                        {m.fotoAntesUrl && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => baixarFoto(m.fotoAntesUrl!, `missao-${m.numeroOrdem || m.id}-ANTES.jpg`)}
                              className="text-blue-700 hover:text-blue-900 text-[10.5px] font-semibold flex items-center gap-0.5 cursor-pointer bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 transition"
                              title="Salvar foto do Antes (Download)"
                            >
                              <Download size={11} />
                              <span>Baixar Foto</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoverFoto(m.id, 'antes')}
                              className="text-red-600 hover:text-red-800 text-[10.5px] font-semibold flex items-center gap-0.5 cursor-pointer"
                              title="Remover foto do Antes"
                            >
                              <Trash2 size={11} />
                              <span>Remover</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {m.fotoAntesUrl ? (
                        <div className="relative rounded-md overflow-hidden h-36 border border-slate-300 bg-white group/foto">
                          <img
                            src={m.fotoAntesUrl}
                            alt="Antes do serviço"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/foto:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                            <button
                              type="button"
                              onClick={() => baixarFoto(m.fotoAntesUrl!, `missao-${m.numeroOrdem || m.id}-ANTES.jpg`)}
                              className="cursor-pointer px-2 py-1 bg-white/95 hover:bg-white text-slate-900 text-[11px] font-bold rounded shadow flex items-center gap-1"
                              title="Baixar esta foto"
                            >
                              <Download size={12} />
                              <span>Baixar</span>
                            </button>
                            <label className="cursor-pointer px-2 py-1 bg-white/95 hover:bg-white text-slate-900 text-[11px] font-bold rounded shadow flex items-center gap-1">
                              <Camera size={12} />
                              <span>Tirar Nova</span>
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadFoto(m.id, 'antes', file);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                            <label className="cursor-pointer px-2 py-1 bg-white/95 hover:bg-white text-slate-900 text-[11px] font-bold rounded shadow flex items-center gap-1">
                              <Upload size={12} />
                              <span>Arquivo</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadFoto(m.id, 'antes', file);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-dashed border-slate-300 rounded-md p-3 flex flex-col items-center justify-center gap-2 bg-white min-h-[110px]">
                          <span className="text-[11px] text-slate-500 font-medium text-center">
                            Policial, registre a foto do local antes da intervenção:
                          </span>
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <label className="cursor-pointer px-2.5 py-1.5 bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-2xs transition">
                              <Camera size={13} />
                              <span>Tirar Foto (Câmera)</span>
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadFoto(m.id, 'antes', file);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                            <label className="cursor-pointer px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded flex items-center gap-1.5 shadow-2xs transition">
                              <Upload size={13} />
                              <span>Galeria / Arquivo</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadFoto(m.id, 'antes', file);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bloco Foto DEPOIS */}
                    <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/70 flex flex-col justify-between">
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[11.5px] font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                          FOTO DO DEPOIS (Serviço Concluído / Feito)
                        </span>
                        {m.fotoDepoisUrl && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => baixarFoto(m.fotoDepoisUrl!, `missao-${m.numeroOrdem || m.id}-DEPOIS.jpg`)}
                              className="text-blue-700 hover:text-blue-900 text-[10.5px] font-semibold flex items-center gap-0.5 cursor-pointer bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 transition"
                              title="Salvar foto do Depois (Download)"
                            >
                              <Download size={11} />
                              <span>Baixar Foto</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoverFoto(m.id, 'depois')}
                              className="text-red-600 hover:text-red-800 text-[10.5px] font-semibold flex items-center gap-0.5 cursor-pointer"
                              title="Remover foto do Depois"
                            >
                              <Trash2 size={11} />
                              <span>Remover</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {m.fotoDepoisUrl ? (
                        <div className="relative rounded-md overflow-hidden h-36 border border-slate-300 bg-white group/foto">
                          <img
                            src={m.fotoDepoisUrl}
                            alt="Depois do serviço realizado"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/foto:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                            <button
                              type="button"
                              onClick={() => baixarFoto(m.fotoDepoisUrl!, `missao-${m.numeroOrdem || m.id}-DEPOIS.jpg`)}
                              className="cursor-pointer px-2 py-1 bg-white/95 hover:bg-white text-slate-900 text-[11px] font-bold rounded shadow flex items-center gap-1"
                              title="Baixar esta foto"
                            >
                              <Download size={12} />
                              <span>Baixar</span>
                            </button>
                            <label className="cursor-pointer px-2 py-1 bg-white/95 hover:bg-white text-slate-900 text-[11px] font-bold rounded shadow flex items-center gap-1">
                              <Camera size={12} />
                              <span>Tirar Nova</span>
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadFoto(m.id, 'depois', file);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                            <label className="cursor-pointer px-2 py-1 bg-white/95 hover:bg-white text-slate-900 text-[11px] font-bold rounded shadow flex items-center gap-1">
                              <Upload size={12} />
                              <span>Arquivo</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadFoto(m.id, 'depois', file);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-dashed border-slate-300 rounded-md p-3 flex flex-col items-center justify-center gap-2 bg-white min-h-[110px]">
                          <span className="text-[11px] text-slate-500 font-medium text-center">
                            Policial, tire a foto do serviço finalizado e restaurado:
                          </span>
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <label className="cursor-pointer px-2.5 py-1.5 bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-2xs transition">
                              <Camera size={13} />
                              <span>Tirar Foto (Câmera)</span>
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadFoto(m.id, 'depois', file);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                            <label className="cursor-pointer px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded flex items-center gap-1.5 shadow-2xs transition">
                              <Upload size={13} />
                              <span>Galeria / Arquivo</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadFoto(m.id, 'depois', file);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      )}

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

      {/* Modal de Prévia e Impressão da Folha no Padrão do Informe Mensal */}
      <ModalPreviaFolhaInforme
        missao={missaoPreviaFolha}
        onFechar={() => setMissaoPreviaFolha(null)}
        onNavegarParaInforme={onNavegarParaInforme}
      />
    </div>
  );
};
