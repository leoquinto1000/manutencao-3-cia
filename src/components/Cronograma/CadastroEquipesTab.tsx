import React, { useState, useMemo } from 'react';
import { EquipeManutencao, MembroEquipe } from '../../types';
import { gerarId } from '../../utils';
import {
  Users,
  UserPlus,
  Shield,
  Edit2,
  Trash2,
  Plus,
  Phone,
  CheckCircle2,
  Wrench,
  Sparkles,
  Tag,
  Briefcase,
  GraduationCap,
  MessageCircle,
  Search,
  Check,
  Filter,
  Handshake,
  ArrowRightLeft,
  Calendar,
  Clock,
  UserCheck,
  Undo2,
  AlertTriangle,
} from 'lucide-react';

const PELOTOES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const OPCOES_ANO_CURSO = [
  'Efetivo Permanente',
  '1°CFO',
  '2°CFO',
  '3°CFO',
  '4°CFO',
];

export const formatarAnoPelotao = (anoCurso?: string, pelotao?: string) => {
  if (!anoCurso && !pelotao) return '-';
  if (anoCurso && pelotao && pelotao.trim()) return `${anoCurso} ${pelotao.trim()}`;
  if (anoCurso) return anoCurso;
  return `Pelotão ${pelotao}`;
};

interface CadastroEquipesTabProps {
  equipes: EquipeManutencao[];
  onChangeEquipes: (equipes: EquipeManutencao[]) => void;
  membros: MembroEquipe[];
  onChangeMembros: (membros: MembroEquipe[]) => void;
}

export const CadastroEquipesTab: React.FC<CadastroEquipesTabProps> = ({
  equipes,
  onChangeEquipes,
  membros,
  onChangeMembros,
}) => {
  // Estado para modal / form de Equipe
  const [modalEquipeAberta, setModalEquipeAberta] = useState(false);
  const [equipeEmEdicao, setEquipeEmEdicao] = useState<EquipeManutencao | null>(null);
  const [nomeEquipe, setNomeEquipe] = useState('');
  const [encarregadoEquipe, setEncarregadoEquipe] = useState('');
  const [especialidadeEquipe, setEspecialidadeEquipe] = useState('');
  const [membrosEquipeSelecionados, setMembrosEquipeSelecionados] = useState<string[]>([]);
  const [corBadgeEquipe, setCorBadgeEquipe] = useState<string>('blue');
  const [buscaMilitarEquipe, setBuscaMilitarEquipe] = useState('');
  const [filtroPelotaoModal, setFiltroPelotaoModal] = useState('todos');

  // Estado para modal / form de Militar
  const [modalMilitarAberta, setModalMilitarAberta] = useState(false);
  const [militarEmEdicao, setMilitarEmEdicao] = useState<MembroEquipe | null>(null);
  const [tipoEfetivoMilitar, setTipoEfetivoMilitar] = useState<'fixo' | 'apoio'>('fixo');
  const [graduacaoMilitar, setGraduacaoMilitar] = useState('Cb PM');
  const [nomeGuerraMilitar, setNomeGuerraMilitar] = useState('');
  const [nomeCompletoMilitar, setNomeCompletoMilitar] = useState('');
  const [reMilitar, setReMilitar] = useState('');
  const [anoCursoMilitar, setAnoCursoMilitar] = useState('1°CFO');
  const [pelotaoMilitar, setPelotaoMilitar] = useState('A');
  const [especialidadeMilitar, setEspecialidadeMilitar] = useState('');
  const [telefoneMilitar, setTelefoneMilitar] = useState('');
  const [origemApoioMilitar, setOrigemApoioMilitar] = useState('');
  const [periodoApoioMilitar, setPeriodoApoioMilitar] = useState('');
  const [funcaoApoioMilitar, setFuncaoApoioMilitar] = useState('');
  const [observacoesApoioMilitar, setObservacoesApoioMilitar] = useState('');
  const [impedimentoMilitar, setImpedimentoMilitar] = useState('');

  // Sub-aba da Seção de Efetivo: 'fixo' = Efetivo Fixo da Manutenção | 'apoio' = Policiais que prestam apoio
  const [abaEfetivoAtiva, setAbaEfetivoAtiva] = useState<'fixo' | 'apoio'>('fixo');

  // Notificação de ação rápida no efetivo (transferência, salvar, etc.)
  const [notificacaoEfetivo, setNotificacaoEfetivo] = useState<{
    mensagem: string;
    tipo: 'sucesso' | 'info';
    militarNome?: string;
    acaoDesfazer?: () => void;
  } | null>(null);

  // Modal para confirmação de exclusão (In-app, 100% compatível com iframe)
  const [itemParaExcluir, setItemParaExcluir] = useState<{
    tipo: 'militar' | 'equipe';
    id: string;
    nome: string;
  } | null>(null);

  // Helper para formatar link do WhatsApp
  const obterLinkWhatsapp = (telefone: string) => {
    const apenasDigitos = telefone.replace(/\D/g, '');
    if (!apenasDigitos) return null;
    const numeroCompleto = apenasDigitos.startsWith('55')
      ? apenasDigitos
      : `55${apenasDigitos}`;
    return `https://wa.me/${numeroCompleto}`;
  };

  // Abrir form para nova equipe
  const abrirNovaEquipe = () => {
    setEquipeEmEdicao(null);
    setNomeEquipe('');
    setEncarregadoEquipe(membros[0]?.nomeGuerra || '');
    setEspecialidadeEquipe('');
    setMembrosEquipeSelecionados([]);
    setCorBadgeEquipe('blue');
    setBuscaMilitarEquipe('');
    setFiltroPelotaoModal('todos');
    setModalEquipeAberta(true);
  };

  // Abrir edição de equipe
  const abrirEditarEquipe = (eq: EquipeManutencao) => {
    setEquipeEmEdicao(eq);
    setNomeEquipe(eq.nome);
    setEncarregadoEquipe(eq.encarregado);
    setEspecialidadeEquipe(eq.especialidade);
    setMembrosEquipeSelecionados(eq.membros || []);
    setCorBadgeEquipe(eq.corBadge || 'blue');
    setBuscaMilitarEquipe('');
    setFiltroPelotaoModal('todos');
    setModalEquipeAberta(true);
  };

  // Salvar Equipe
  const handleSalvarEquipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeEquipe.trim()) return;

    if (equipeEmEdicao) {
      onChangeEquipes(
        equipes.map((eq) =>
          eq.id === equipeEmEdicao.id
            ? {
                ...eq,
                nome: nomeEquipe.trim(),
                encarregado: encarregadoEquipe.trim(),
                especialidade: especialidadeEquipe.trim(),
                membros: membrosEquipeSelecionados,
                corBadge: corBadgeEquipe,
              }
            : eq
        )
      );
    } else {
      const nova: EquipeManutencao = {
        id: gerarId(),
        nome: nomeEquipe.trim(),
        encarregado: encarregadoEquipe.trim(),
        especialidade: especialidadeEquipe.trim(),
        membros: membrosEquipeSelecionados,
        corBadge: corBadgeEquipe,
      };
      onChangeEquipes([...equipes, nova]);
    }

    setModalEquipeAberta(false);
  };

  // Excluir equipe com confirmação in-app
  const handleExcluirEquipe = (id: string) => {
    const eq = equipes.find((e) => e.id === id);
    setItemParaExcluir({
      tipo: 'equipe',
      id,
      nome: eq?.nome || id,
    });
  };

  // Toggle militar na equipe
  const toggleMembroNaEquipe = (nomeGuerra: string) => {
    if (membrosEquipeSelecionados.includes(nomeGuerra)) {
      setMembrosEquipeSelecionados(membrosEquipeSelecionados.filter((m) => m !== nomeGuerra));
    } else {
      setMembrosEquipeSelecionados([...membrosEquipeSelecionados, nomeGuerra]);
    }
  };

  // Helper para normalizar CFO / Quadro do militar
  const normalizarAnoCurso = (ano?: string) => {
    if (!ano) return '1°CFO';
    if (ano === '1°CFO' || ano === '2°CFO' || ano === '3°CFO' || ano === '4°CFO') return ano;
    if (
      ano.toLowerCase().includes('permanente') ||
      ano.toLowerCase().includes('efetivo') ||
      ano.toLowerCase().includes('oficiais')
    ) {
      return 'Efetivo Permanente';
    }
    if (ano.includes('1')) return '1°CFO';
    if (ano.includes('2')) return '2°CFO';
    if (ano.includes('3')) return '3°CFO';
    if (ano.includes('4')) return '4°CFO';
    return ano;
  };

  // Abrir form para novo militar (tipo fixo ou apoio)
  const abrirNovoMilitar = (tipo: 'fixo' | 'apoio' = abaEfetivoAtiva) => {
    setMilitarEmEdicao(null);
    setTipoEfetivoMilitar(tipo);
    setGraduacaoMilitar(tipo === 'apoio' ? 'Sd PM' : 'Cad PM');
    setNomeGuerraMilitar('');
    setNomeCompletoMilitar('');
    setReMilitar('');
    setAnoCursoMilitar(tipo === 'apoio' ? '2°CFO' : '2°CFO');
    setPelotaoMilitar('');
    setEspecialidadeMilitar('');
    setTelefoneMilitar('');
    setOrigemApoioMilitar(tipo === 'apoio' ? '1º Pelotão da 3ª Cia' : '');
    setPeriodoApoioMilitar(tipo === 'apoio' ? 'Setembro/2026' : '');
    setFuncaoApoioMilitar('');
    setObservacoesApoioMilitar('');
    setImpedimentoMilitar('');
    setModalMilitarAberta(true);
  };

  // Abrir edição militar
  const abrirEditarMilitar = (m: MembroEquipe) => {
    setMilitarEmEdicao(m);
    setTipoEfetivoMilitar(m.tipoEfetivo || (m.anoCurso?.includes('CFO') ? 'apoio' : 'fixo'));
    setGraduacaoMilitar(m.graduacao);
    setNomeGuerraMilitar(m.nomeGuerra);
    setNomeCompletoMilitar(m.nomeCompleto || '');
    setReMilitar(m.re || '');
    setAnoCursoMilitar(normalizarAnoCurso(m.anoCurso));
    setPelotaoMilitar(m.pelotao || '');
    setEspecialidadeMilitar(m.especialidade);
    setTelefoneMilitar(m.telefone || '');
    setOrigemApoioMilitar(m.origemApoio || '');
    setPeriodoApoioMilitar(m.periodoApoio || '');
    setFuncaoApoioMilitar(m.funcaoApoio || '');
    setObservacoesApoioMilitar(m.observacoesApoio || '');
    setImpedimentoMilitar(m.impedimento || '');
    setModalMilitarAberta(true);
  };

  // Mover militar diretamente para o Efetivo Fixo da Manutenção
  const handleMoverParaEfetivoFixo = (militar: MembroEquipe) => {
    onChangeMembros(
      membros.map((m) => {
        if (m.id === militar.id) {
          return {
            ...m,
            tipoEfetivo: 'fixo',
          };
        }
        return m;
      })
    );

    // Navega automaticamente para a aba de efetivo fixo para que o militar apareça imediatamente na tela
    setAbaEfetivoAtiva('fixo');
    setNotificacaoEfetivo({
      mensagem: `${militar.nomeGuerra} foi transferido(a) para o Efetivo Fixo da Manutenção com sucesso!`,
      tipo: 'sucesso',
      militarNome: militar.nomeGuerra,
      acaoDesfazer: () => {
        onChangeMembros(
          membros.map((m) => (m.id === militar.id ? { ...m, tipoEfetivo: 'apoio' } : m))
        );
        setAbaEfetivoAtiva('apoio');
        setNotificacaoEfetivo(null);
      },
    });
  };

  // Mover militar para Policiais que Prestam Apoio
  const handleMoverParaApoio = (militar: MembroEquipe) => {
    onChangeMembros(
      membros.map((m) => {
        if (m.id === militar.id) {
          return {
            ...m,
            tipoEfetivo: 'apoio',
            origemApoio: m.origemApoio || (m.pelotao ? `Pelotão ${m.pelotao} da 3ª Cia` : '3ª Cia Escola'),
            periodoApoio: m.periodoApoio || 'Escala Diária / Demanda',
            funcaoApoio: m.funcaoApoio || m.especialidade || 'Reforço de Manutenção',
          };
        }
        return m;
      })
    );

    setAbaEfetivoAtiva('apoio');
    setNotificacaoEfetivo({
      mensagem: `${militar.nomeGuerra} foi transferido(a) para Policiais que Prestam Apoio com sucesso!`,
      tipo: 'sucesso',
      militarNome: militar.nomeGuerra,
      acaoDesfazer: () => {
        onChangeMembros(
          membros.map((m) => (m.id === militar.id ? { ...m, tipoEfetivo: 'fixo' } : m))
        );
        setAbaEfetivoAtiva('fixo');
        setNotificacaoEfetivo(null);
      },
    });
  };

  // Salvar Militar
  const handleSalvarMilitar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeGuerraMilitar.trim()) return;

    const nomeFormatado = nomeGuerraMilitar.startsWith(graduacaoMilitar)
      ? nomeGuerraMilitar
      : `${graduacaoMilitar} ${nomeGuerraMilitar}`;

    if (militarEmEdicao) {
      onChangeMembros(
        membros.map((m) =>
          m.id === militarEmEdicao.id
            ? {
                ...m,
                graduacao: graduacaoMilitar,
                nomeGuerra: nomeFormatado,
                nomeCompleto: nomeCompletoMilitar.trim(),
                re: reMilitar.trim(),
                anoCurso: anoCursoMilitar.trim(),
                pelotao: pelotaoMilitar,
                especialidade: especialidadeMilitar.trim(),
                telefone: telefoneMilitar.trim(),
                tipoEfetivo: tipoEfetivoMilitar,
                origemApoio: tipoEfetivoMilitar === 'apoio' ? origemApoioMilitar.trim() : undefined,
                periodoApoio: tipoEfetivoMilitar === 'apoio' ? periodoApoioMilitar.trim() : undefined,
                funcaoApoio: tipoEfetivoMilitar === 'apoio' ? funcaoApoioMilitar.trim() : undefined,
                observacoesApoio: tipoEfetivoMilitar === 'apoio' ? observacoesApoioMilitar.trim() : undefined,
                impedimento: impedimentoMilitar.trim() || undefined,
              }
            : m
        )
      );
    } else {
      const novo: MembroEquipe = {
        id: gerarId(),
        graduacao: graduacaoMilitar,
        nomeGuerra: nomeFormatado,
        nomeCompleto: nomeCompletoMilitar.trim(),
        re: reMilitar.trim(),
        anoCurso: anoCursoMilitar.trim(),
        pelotao: pelotaoMilitar,
        especialidade: especialidadeMilitar.trim(),
        telefone: telefoneMilitar.trim(),
        ativo: true,
        tipoEfetivo: tipoEfetivoMilitar,
        origemApoio: tipoEfetivoMilitar === 'apoio' ? origemApoioMilitar.trim() : undefined,
        periodoApoio: tipoEfetivoMilitar === 'apoio' ? periodoApoioMilitar.trim() : undefined,
        funcaoApoio: tipoEfetivoMilitar === 'apoio' ? funcaoApoioMilitar.trim() : undefined,
        observacoesApoio: tipoEfetivoMilitar === 'apoio' ? observacoesApoioMilitar.trim() : undefined,
        impedimento: impedimentoMilitar.trim() || undefined,
      };
      onChangeMembros([...membros, novo]);
    }

    setAbaEfetivoAtiva(tipoEfetivoMilitar);
    setNotificacaoEfetivo({
      mensagem: `${nomeFormatado} foi salvo no ${
        tipoEfetivoMilitar === 'fixo' ? 'Efetivo Fixo da Manutenção' : 'Quadro de Apoio'
      } com sucesso!`,
      tipo: 'sucesso',
    });

    setModalMilitarAberta(false);
  };

  const handleExcluirMilitar = (id: string) => {
    const m = membros.find((item) => item.id === id);
    setItemParaExcluir({
      tipo: 'militar',
      id,
      nome: m?.nomeGuerra || 'Militar',
    });
  };

  const handleConfirmarExclusao = () => {
    if (!itemParaExcluir) return;
    if (itemParaExcluir.tipo === 'equipe') {
      onChangeEquipes(equipes.filter((e) => e.id !== itemParaExcluir.id));
      setNotificacaoEfetivo({
        mensagem: `Equipe "${itemParaExcluir.nome}" foi excluída com sucesso.`,
        tipo: 'info',
      });
    } else {
      onChangeMembros(membros.filter((m) => m.id !== itemParaExcluir.id));
      setNotificacaoEfetivo({
        mensagem: `${itemParaExcluir.nome} foi removido(a) do efetivo.`,
        tipo: 'info',
      });
    }
    setItemParaExcluir(null);
  };

  // Efetivo separado entre Fixo e Apoio
  const membrosFixos = useMemo(() => {
    return membros.filter((m) => m.tipoEfetivo !== 'apoio');
  }, [membros]);

  const membrosApoio = useMemo(() => {
    return membros.filter((m) => m.tipoEfetivo === 'apoio');
  }, [membros]);

  // Militares filtrados dentro do modal de equipe
  const militaresFiltradosParaEquipe = useMemo(() => {
    return membros.filter((m) => {
      if (filtroPelotaoModal !== 'todos' && m.pelotao !== filtroPelotaoModal) {
        return false;
      }
      if (buscaMilitarEquipe.trim()) {
        const termo = buscaMilitarEquipe.toLowerCase();
        const nomeG = (m.nomeGuerra || '').toLowerCase();
        const nomeC = (m.nomeCompleto || '').toLowerCase();
        const esp = (m.especialidade || '').toLowerCase();
        return nomeG.includes(termo) || nomeC.includes(termo) || esp.includes(termo);
      }
      return true;
    });
  }, [membros, filtroPelotaoModal, buscaMilitarEquipe]);

  // Militares na tabela de Efetivo Fixo
  const militaresFixosFiltrados = useMemo(() => {
    return membrosFixos;
  }, [membrosFixos]);

  // Militares na tabela de Apoio
  const militaresApoioFiltrados = useMemo(() => {
    return membrosApoio;
  }, [membrosApoio]);

  const getCorBadgeClass = (cor?: string) => {
    switch (cor) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'amber':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'purple':
        return 'bg-purple-50 text-purple-800 border-purple-300';
      case 'rose':
        return 'bg-rose-50 text-rose-800 border-rose-300';
      case 'blue':
      default:
        return 'bg-blue-50 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Seção 1: Equipes de Manutenção */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-[#1a2b4c] flex items-center gap-2">
              <Users size={18} className="text-[#c9a84e]" />
              Equipes de Manutenção da 3ª Cia
            </h3>
            <p className="text-xs text-slate-500">
              Grupos de trabalho escalados para execuções das ordens de serviço diárias (policiais do Efetivo de Manutenção da 3ª Cia)
            </p>
          </div>
          <button
            type="button"
            onClick={abrirNovaEquipe}
            className="px-3.5 py-2 text-xs font-bold bg-[#1a2b4c] hover:bg-[#2c4373] text-white rounded-md shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus size={15} />
            <span>Cadastrar Nova Equipe</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {equipes.map((eq) => (
            <div
              key={eq.id}
              className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs hover:shadow-sm transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getCorBadgeClass(
                      eq.corBadge
                    )}`}
                  >
                    {eq.nome}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => abrirEditarEquipe(eq)}
                      title="Editar Equipe"
                      className="px-2 py-1 text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 size={13} />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExcluirEquipe(eq.id)}
                      title="Excluir Equipe"
                      className="px-2 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-200 rounded text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Shield size={13} className="text-blue-600 shrink-0" />
                    <span className="font-semibold text-slate-900">Encarregado:</span>
                    <span className="font-bold text-[#1a2b4c]">{eq.encarregado || 'Não definido'}</span>
                  </div>

                  {eq.especialidade && (
                    <div className="flex items-start gap-1.5 text-slate-600">
                      <Wrench size={13} className="text-slate-400 shrink-0 mt-0.5" />
                      <span>{eq.especialidade}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Militares Componentes ({eq.membros?.length || 0}):
                    </span>
                    {(!eq.membros || eq.membros.length === 0) && (
                      <button
                        type="button"
                        onClick={() => abrirEditarEquipe(eq)}
                        className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                      >
                        + Vincular Policiais
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {eq.membros && eq.membros.length > 0 ? (
                      eq.membros.map((membroNome, idx) => {
                        const militar = membros.find(
                          (m) =>
                            m.nomeGuerra.toLowerCase() === membroNome.toLowerCase() ||
                            membroNome.toLowerCase().includes(m.nomeGuerra.toLowerCase())
                        );
                        const anoPelotao = formatarAnoPelotao(militar?.anoCurso, militar?.pelotao);
                        return (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-medium px-2 py-0.5 rounded shadow-2xs"
                          >
                            <span>{membroNome}</span>
                            {anoPelotao !== '-' && (
                              <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[9px] font-bold px-1.5 py-0.2 rounded">
                                {anoPelotao}
                              </span>
                            )}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-slate-400 text-xs italic">
                        Nenhum militar vinculado ainda.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {equipes.length === 0 && (
            <div className="col-span-full py-10 text-center bg-slate-50 rounded-lg border border-dashed border-slate-300">
              <Users size={32} className="mx-auto text-slate-400 mb-2" />
              <p className="font-bold text-slate-700 text-sm">Nenhuma equipe cadastrada no momento</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Crie equipes de manutenção e vincule os policiais militares da 3ª Cia cadastrados no efetivo.
              </p>
              <button
                type="button"
                onClick={abrirNovaEquipe}
                className="px-4 py-2 text-xs font-bold bg-[#1a2b4c] hover:bg-[#2c4373] text-white rounded-md transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={15} />
                <span>Cadastrar Nova Equipe</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Seção 2: Efetivo de Manutenção (Militares da 3ª Cia) - Abas: Efetivo Fixo e Policiais em Apoio */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-[#1a2b4c] flex items-center gap-2">
              <Shield size={18} className="text-[#c9a84e]" />
              <span>Efetivo de Manutenção (Militares da 3ª Cia)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestão separada do efetivo fixo da manutenção e dos policiais militares que prestam apoio à Subunidade
            </p>
          </div>
          <button
            type="button"
            onClick={() => abrirNovoMilitar(abaEfetivoAtiva)}
            className="px-3.5 py-2 text-xs font-bold bg-[#c9a84e] hover:bg-[#b5953e] text-[#1a2b4c] rounded-md shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            {abaEfetivoAtiva === 'fixo' ? (
              <>
                <UserPlus size={15} />
                <span>+ Cadastrar Militar Fixo</span>
              </>
            ) : (
              <>
                <UserCheck size={15} />
                <span>+ Cadastrar Policial em Apoio</span>
              </>
            )}
          </button>
        </div>

        {/* Banner de Notificação com Ação / Desfazer */}
        {notificacaoEfetivo && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{notificacaoEfetivo.mensagem}</span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {notificacaoEfetivo.acaoDesfazer && (
                <button
                  type="button"
                  onClick={notificacaoEfetivo.acaoDesfazer}
                  className="px-2.5 py-1 rounded bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                  title="Desfazer transferência"
                >
                  <Undo2 size={12} />
                  <span>Desfazer</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setNotificacaoEfetivo(null)}
                className="text-emerald-700 hover:text-emerald-900 font-bold px-1 cursor-pointer"
                title="Fechar notificação"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Abas Superiores: 1. Efetivo Fixo da Manutenção | 2. Policiais que Prestam Apoio */}
        <div className="flex items-center gap-2 pt-3 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setAbaEfetivoAtiva('fixo')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
              abaEfetivoAtiva === 'fixo'
                ? 'border-[#1a2b4c] text-[#1a2b4c]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield size={15} className={abaEfetivoAtiva === 'fixo' ? 'text-[#c9a84e]' : ''} />
            <span>1. Efetivo Fixo da Manutenção</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                abaEfetivoAtiva === 'fixo'
                  ? 'bg-[#1a2b4c] text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {membrosFixos.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAbaEfetivoAtiva('apoio')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
              abaEfetivoAtiva === 'apoio'
                ? 'border-[#1a2b4c] text-[#1a2b4c]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Handshake size={15} className={abaEfetivoAtiva === 'apoio' ? 'text-[#c9a84e]' : ''} />
            <span>2. Policiais que Prestam Apoio</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                abaEfetivoAtiva === 'apoio'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {membrosApoio.length}
            </span>
          </button>
        </div>

        {/* Conteúdo Aba 1: Efetivo Fixo da Manutenção */}
        {abaEfetivoAtiva === 'fixo' && (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">Graduação & Nome de Guerra</th>
                  <th className="px-3 py-2.5 text-center">CFO/Pelotão</th>
                  <th className="px-3 py-2.5">RE</th>
                  <th className="px-3 py-2.5">Especialidade / Foco Fixo</th>
                  <th className="px-3 py-2.5">Telefone / Contato (WhatsApp)</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  <th className="px-3 py-2.5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {militaresFixosFiltrados.map((m) => {
                  const linkWhats = m.telefone ? obterLinkWhatsapp(m.telefone) : null;
                  const anoPelotao = formatarAnoPelotao(m.anoCurso, m.pelotao);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-3 py-2 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#1a2b4c] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {m.graduacao}
                          </span>
                          <span>{m.nomeGuerra}</span>
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-blue-50 text-blue-800 border border-blue-200">
                            Fixo
                          </span>
                        </div>
                        {m.nomeCompleto && (
                          <div className="text-[11px] text-slate-500 font-normal pl-8">
                            {m.nomeCompleto}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        {anoPelotao !== '-' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs">
                            <GraduationCap size={12} className="text-amber-600 shrink-0" />
                            <span>{anoPelotao}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-600">
                        {m.re || '-'}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {m.especialidade || 'Manutenção Predial Geral'}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px]">{m.telefone || '-'}</span>
                          {linkWhats && (
                            <a
                              href={linkWhats}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-2xs transition"
                              title={`Conversar com ${m.nomeGuerra} no WhatsApp`}
                            >
                              <MessageCircle size={11} />
                              <span>WhatsApp</span>
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {m.impedimento &&
                        m.impedimento.trim().length > 0 &&
                        m.impedimento.toLowerCase() !== 'sem impedimento' &&
                        m.impedimento.toLowerCase() !== 'nenhum' &&
                        m.impedimento.toLowerCase() !== 'apto' ? (
                          <span
                            className="bg-red-100 text-red-800 border border-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs"
                            title={`Impedimento: ${m.impedimento}`}
                          >
                            <AlertTriangle size={10} className="text-red-700 shrink-0" />
                            <span className="max-w-[120px] truncate">{m.impedimento}</span>
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Ativo Fixo
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleMoverParaApoio(m)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 font-semibold text-[11px] shadow-2xs transition cursor-pointer"
                            title={`Mover ${m.nomeGuerra} para Policiais que Prestam Apoio`}
                          >
                            <Handshake size={12} className="text-amber-700" />
                            <span>Mover p/ Apoio</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => abrirEditarMilitar(m)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="Editar Militar"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExcluirMilitar(m.id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="Excluir Militar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {militaresFixosFiltrados.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400 bg-slate-50">
                Nenhum militar do efetivo fixo cadastrado para o filtro selecionado.
              </div>
            )}
          </div>
        )}

        {/* Conteúdo Aba 2: Policiais que Prestam Apoio */}
        {abaEfetivoAtiva === 'apoio' && (
          <div className="overflow-x-auto mt-3">
            <div className="mb-2 p-2 bg-amber-50/80 border border-amber-200 rounded text-xs text-amber-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <Handshake size={14} className="text-amber-700 shrink-0" />
                <span>Policiais Militares que ficam e prestam apoio à manutenção predial (3ª Cia).</span>
              </span>
              <span className="font-bold text-[11px] text-amber-800">
                {membrosApoio.length} policial(is) em apoio
              </span>
            </div>

            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-amber-50/60 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">Graduação & Nome de Guerra</th>
                  <th className="px-3 py-2.5 text-center">Origem / Pelotão</th>
                  <th className="px-3 py-2.5">Período / Escala de Apoio</th>
                  <th className="px-3 py-2.5">Função / Reforço Prestado</th>
                  <th className="px-3 py-2.5">Telefone / Contato</th>
                  <th className="px-3 py-2.5">Observações</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  <th className="px-3 py-2.5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {militaresApoioFiltrados.map((m) => {
                  const linkWhats = m.telefone ? obterLinkWhatsapp(m.telefone) : null;
                  const anoPelotao = formatarAnoPelotao(m.anoCurso, m.pelotao);
                  return (
                    <tr key={m.id} className="hover:bg-amber-50/30 transition">
                      <td className="px-3 py-2 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#1a2b4c] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {m.graduacao}
                          </span>
                          <span>{m.nomeGuerra}</span>
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                            Apoio
                          </span>
                        </div>
                        {m.nomeCompleto && (
                          <div className="text-[11px] text-slate-500 font-normal pl-8">
                            {m.nomeCompleto}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center">
                          {anoPelotao !== '-' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 mb-0.5">
                              <GraduationCap size={11} className="text-amber-600" />
                              <span>{anoPelotao}</span>
                            </span>
                          )}
                          <span className="text-[10px] text-slate-600 font-medium">
                            {m.origemApoio || `Pelotão ${m.pelotao || '-'}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        <span className="font-semibold text-slate-800">
                          {m.periodoApoio || 'Escala Diária / Demanda'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-700 font-medium">
                        {m.funcaoApoio || m.especialidade || 'Reforço Geral'}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px]">{m.telefone || '-'}</span>
                          {linkWhats && (
                            <a
                              href={linkWhats}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-2xs transition"
                              title={`Conversar com ${m.nomeGuerra} no WhatsApp`}
                            >
                              <MessageCircle size={11} />
                              <span>WhatsApp</span>
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-500 text-[11px]">
                        {m.observacoesApoio || '-'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {m.impedimento &&
                        m.impedimento.trim().length > 0 &&
                        m.impedimento.toLowerCase() !== 'sem impedimento' &&
                        m.impedimento.toLowerCase() !== 'nenhum' &&
                        m.impedimento.toLowerCase() !== 'apto' ? (
                          <span
                            className="bg-red-100 text-red-800 border border-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs"
                            title={`Impedimento: ${m.impedimento}`}
                          >
                            <AlertTriangle size={10} className="text-red-700 shrink-0" />
                            <span className="max-w-[120px] truncate">{m.impedimento}</span>
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                            Em Apoio
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleMoverParaEfetivoFixo(m)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1a2b4c] hover:bg-[#2c4373] text-white font-bold text-xs shadow-xs transition cursor-pointer"
                            title={`Mover ${m.nomeGuerra} para o Efetivo Fixo da Manutenção`}
                          >
                            <Shield size={13} className="text-[#c9a84e]" />
                            <span>Mover para Efetivo Fixo</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => abrirEditarMilitar(m)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="Editar Dados de Apoio"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExcluirMilitar(m.id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="Excluir Militar em Apoio"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {militaresApoioFiltrados.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400 bg-slate-50">
                <p>Nenhum policial que presta apoio cadastrado para o filtro selecionado.</p>
                <button
                  type="button"
                  onClick={() => abrirNovoMilitar('apoio')}
                  className="mt-2 px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded transition inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Cadastrar Policial em Apoio</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Equipe (Cadastrar Nova ou Editar) */}
      {modalEquipeAberta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
              <div>
                <h3 className="text-base font-bold text-[#1a2b4c] flex items-center gap-2">
                  <Users size={18} className="text-[#c9a84e]" />
                  {equipeEmEdicao ? 'Editar Equipe de Manutenção' : 'Cadastrar Nova Equipe de Manutenção'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Os policiais componentes são selecionados a partir do Efetivo de Manutenção (Militares da 3ª Cia).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalEquipeAberta(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarEquipe} className="space-y-3.5 text-xs overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nome da Equipe: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nomeEquipe}
                  onChange={(e) => setNomeEquipe(e.target.value)}
                  placeholder="Ex: Equipe Alfa - Elétrica & Rede"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c] font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Encarregado / Líder da Equipe:
                  </label>
                  <select
                    value={encarregadoEquipe}
                    onChange={(e) => setEncarregadoEquipe(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c] bg-white font-medium"
                  >
                    <option value="">-- Selecione o Encarregado (Militar da 3ª Cia) --</option>
                    {membros.map((m) => (
                      <option key={m.id} value={m.nomeGuerra}>
                        {m.nomeGuerra} {m.pelotao ? `(Pelotão ${m.pelotao})` : ''} - {m.especialidade}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Cor / Identificador Visual:
                  </label>
                  <select
                    value={corBadgeEquipe}
                    onChange={(e) => setCorBadgeEquipe(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c] bg-white font-medium"
                  >
                    <option value="blue">🔵 Azul (Elétrica / Rede)</option>
                    <option value="emerald">🟢 Verde (Hidráulica)</option>
                    <option value="amber">🟡 Âmbar (Pintura / Obras)</option>
                    <option value="purple">🟣 Roxo (Geral)</option>
                    <option value="rose">🔴 Vermelho (Urgências)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Especialidade / Foco de Atuação:
                </label>
                <input
                  type="text"
                  value={especialidadeEquipe}
                  onChange={(e) => setEspecialidadeEquipe(e.target.value)}
                  placeholder="Ex: Instalações elétricas, canaletas, tomadas e iluminação..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c]"
                />
              </div>

              {/* Seleção dos Policiais Componentes (Militares da 3ª Cia) */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Shield size={14} className="text-[#1a2b4c]" />
                    <span>Policiais Componentes (Efetivo da 3ª Cia):</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                      {membrosEquipeSelecionados.length} selecionado(s)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const nomesVisiveis = militaresFiltradosParaEquipe.map((m) => m.nomeGuerra);
                        const conjunto = Array.from(new Set([...membrosEquipeSelecionados, ...nomesVisiveis]));
                        setMembrosEquipeSelecionados(conjunto);
                      }}
                      className="text-[11px] text-blue-600 hover:underline font-bold cursor-pointer"
                    >
                      Marcar todos
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setMembrosEquipeSelecionados([])}
                      className="text-[11px] text-slate-500 hover:underline font-bold cursor-pointer"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                {/* Filtros de Pelotão e Busca dentro do modal */}
                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                  <div className="relative flex-1">
                    <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={buscaMilitarEquipe}
                      onChange={(e) => setBuscaMilitarEquipe(e.target.value)}
                      placeholder="Buscar policial por nome ou especialidade..."
                      className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#1a2b4c]"
                    />
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => setFiltroPelotaoModal('todos')}
                      className={`px-2 py-1 rounded text-[10px] font-bold shrink-0 cursor-pointer ${
                        filtroPelotaoModal === 'todos'
                          ? 'bg-[#1a2b4c] text-white'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Todos
                    </button>
                    {PELOTOES.map((pel) => (
                      <button
                        key={pel}
                        type="button"
                        onClick={() => setFiltroPelotaoModal(pel)}
                        className={`px-2 py-1 rounded text-[10px] font-bold shrink-0 cursor-pointer ${
                          filtroPelotaoModal === pel
                            ? 'bg-[#1a2b4c] text-white'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Pel. {pel}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lista de Militares para Seleção */}
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-md p-1.5 space-y-1 bg-white">
                  {militaresFiltradosParaEquipe.length > 0 ? (
                    militaresFiltradosParaEquipe.map((m) => {
                      const estaNaEquipe = membrosEquipeSelecionados.includes(m.nomeGuerra);
                      return (
                        <label
                          key={m.id}
                          className={`flex items-center justify-between p-1.5 rounded border cursor-pointer transition text-xs ${
                            estaNaEquipe
                              ? 'bg-blue-50/80 border-blue-300 text-blue-900'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={estaNaEquipe}
                              onChange={() => toggleMembroNaEquipe(m.nomeGuerra)}
                              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                            />
                            <div>
                              <div className="font-bold flex items-center gap-1.5">
                                <span className="bg-[#1a2b4c] text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                                  {m.graduacao}
                                </span>
                                <span>{m.nomeGuerra}</span>
                                <span
                                  className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${
                                    m.tipoEfetivo === 'apoio'
                                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                                      : 'bg-blue-50 text-blue-900 border-blue-200'
                                  }`}
                                >
                                  {m.tipoEfetivo === 'apoio' ? 'Apoio' : 'Fixo'}
                                </span>
                                {(m.anoCurso || m.pelotao) && (
                                  <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold px-1.5 py-0.2 rounded">
                                    {formatarAnoPelotao(m.anoCurso, m.pelotao)}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {m.tipoEfetivo === 'apoio' && m.funcaoApoio
                                  ? `Apoio: ${m.funcaoApoio} • ${m.origemApoio || '3ª Cia'}`
                                  : m.especialidade}
                              </div>
                            </div>
                          </div>
                          {estaNaEquipe && (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                              Componente
                            </span>
                          )}
                        </label>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-400">
                      Nenhum militar do efetivo encontrado com os filtros atuais.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalEquipeAberta(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#1a2b4c] hover:bg-[#2c4373] text-white rounded-md shadow-sm cursor-pointer"
                >
                  Salvar Equipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Militar (Cadastrar Novo ou Editar - Fixo ou Apoio) */}
      {modalMilitarAberta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
              <div>
                <h3 className="text-base font-bold text-[#1a2b4c] flex items-center gap-2">
                  {tipoEfetivoMilitar === 'apoio' ? (
                    <Handshake size={18} className="text-[#c9a84e]" />
                  ) : (
                    <Shield size={18} className="text-[#c9a84e]" />
                  )}
                  <span>
                    {militarEmEdicao
                      ? `Editar Militar (${tipoEfetivoMilitar === 'apoio' ? 'Apoio' : 'Efetivo Fixo'})`
                      : `Cadastrar Militar (${tipoEfetivoMilitar === 'apoio' ? 'Apoio' : 'Efetivo Fixo'})`}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  {tipoEfetivoMilitar === 'apoio'
                    ? 'Cadastro de policial militar que permanece e presta apoio aos serviços de manutenção'
                    : 'Cadastro do militar com designação orgânica no efetivo fixo da manutenção (3ª Cia)'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalMilitarAberta(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarMilitar} className="space-y-3 text-xs overflow-y-auto pr-1 flex-1">
              {/* Seleção do Tipo de Efetivo: Fixo ou Apoio */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Tipo de Cadastro no Efetivo da 3ª Cia: <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoEfetivoMilitar('fixo')}
                    className={`py-2 px-3 rounded-lg border text-left flex items-center gap-2 transition cursor-pointer ${
                      tipoEfetivoMilitar === 'fixo'
                        ? 'border-[#1a2b4c] bg-[#1a2b4c]/5 text-[#1a2b4c] font-bold ring-1 ring-[#1a2b4c]'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Shield size={16} className={tipoEfetivoMilitar === 'fixo' ? 'text-[#c9a84e]' : 'text-slate-400'} />
                    <div>
                      <div className="text-xs">Efetivo Fixo</div>
                      <div className="text-[10px] text-slate-500 font-normal">Manutenção Permanente</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoEfetivoMilitar('apoio')}
                    className={`py-2 px-3 rounded-lg border text-left flex items-center gap-2 transition cursor-pointer ${
                      tipoEfetivoMilitar === 'apoio'
                        ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold ring-1 ring-amber-500'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Handshake size={16} className={tipoEfetivoMilitar === 'apoio' ? 'text-amber-600' : 'text-slate-400'} />
                    <div>
                      <div className="text-xs">Prestando Apoio</div>
                      <div className="text-[10px] text-slate-500 font-normal">Reforço / Escala de Apoio</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Informações Específicas de Apoio se for tipo 'apoio' */}
              {tipoEfetivoMilitar === 'apoio' && (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg space-y-2.5">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                    <Handshake size={14} className="text-amber-700" />
                    <span>Dados do Apoio Prestado à Manutenção:</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-semibold text-amber-950 mb-1">
                        Origem do Policial / Pelotão:
                      </label>
                      <input
                        type="text"
                        value={origemApoioMilitar}
                        onChange={(e) => setOrigemApoioMilitar(e.target.value)}
                        placeholder="Ex: 2º Pelotão da 3ª Cia"
                        className="w-full px-2.5 py-1.5 border border-amber-300 rounded bg-white focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-amber-950 mb-1">
                        Período / Horário de Apoio:
                      </label>
                      <input
                        type="text"
                        value={periodoApoioMilitar}
                        onChange={(e) => setPeriodoApoioMilitar(e.target.value)}
                        placeholder="Ex: Setembro/2026 / 9º-10º tempos"
                        className="w-full px-2.5 py-1.5 border border-amber-300 rounded bg-white focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-amber-950 mb-1">
                      Função / Atividade Desempenhada no Apoio:
                    </label>
                    <input
                      type="text"
                      value={funcaoApoioMilitar}
                      onChange={(e) => setFuncaoApoioMilitar(e.target.value)}
                      placeholder="Ex: Pintura, Lixamento, Apoio Elétrico, Transporte de Materiais"
                      className="w-full px-2.5 py-1.5 border border-amber-300 rounded bg-white focus:ring-1 focus:ring-amber-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-amber-950 mb-1">
                      Observações Adicionais do Apoio:
                    </label>
                    <input
                      type="text"
                      value={observacoesApoioMilitar}
                      onChange={(e) => setObservacoesApoioMilitar(e.target.value)}
                      placeholder="Ex: Policial liberado da instrução após o almoço para apoiar reparos"
                      className="w-full px-2.5 py-1.5 border border-amber-300 rounded bg-white focus:ring-1 focus:ring-amber-500 text-slate-700"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Posto / Graduação:</label>
                  <select
                    value={graduacaoMilitar}
                    onChange={(e) => setGraduacaoMilitar(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c] bg-white font-medium"
                  >
                    <option value="Cap PM">Cap PM</option>
                    <option value="1º Ten PM">1º Ten PM</option>
                    <option value="2º Ten PM">2º Ten PM</option>
                    <option value="Cad PM">Cad PM</option>
                    <option value="Subten PM">Subten PM</option>
                    <option value="1º Sgt PM">1º Sgt PM</option>
                    <option value="2º Sgt PM">2º Sgt PM</option>
                    <option value="3º Sgt PM">3º Sgt PM</option>
                    <option value="Cb PM">Cb PM</option>
                    <option value="Sd PM">Sd PM</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nome de Guerra: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nomeGuerraMilitar}
                    onChange={(e) => setNomeGuerraMilitar(e.target.value)}
                    placeholder="Ex: Ribeiro ou Cb PM Ribeiro"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c] font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome Completo:</label>
                <input
                  type="text"
                  value={nomeCompletoMilitar}
                  onChange={(e) => setNomeCompletoMilitar(e.target.value)}
                  placeholder="Nome completo do militar..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">RE / Matrícula:</label>
                  <input
                    type="text"
                    value={reMilitar}
                    onChange={(e) => setReMilitar(e.target.value)}
                    placeholder="Ex: 154.321-4"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <GraduationCap size={13} className="text-amber-600" />
                    CFO / Quadro do Militar:
                  </label>
                  <select
                    value={anoCursoMilitar}
                    onChange={(e) => setAnoCursoMilitar(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c] bg-white font-semibold text-slate-900"
                  >
                    {OPCOES_ANO_CURSO.map((opcao) => (
                      <option key={opcao} value={opcao}>
                        {opcao}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Campo Pelotão (A, B, C, D, E, F, G, H) */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Shield size={14} className="text-[#1a2b4c]" />
                    <span>Pelotão do Militar (3ª Cia): <span className="text-slate-400 font-normal text-[11px]">(Opcional)</span></span>
                  </label>
                  <span className="font-bold text-xs text-[#1a2b4c] bg-white px-2 py-0.5 rounded border border-slate-300 shadow-2xs">
                    {pelotaoMilitar ? `Pelotão ${pelotaoMilitar}` : 'Sem pelotão (Em branco)'}
                  </span>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPelotaoMilitar('')}
                    className={`py-1.5 text-center font-bold text-xs rounded border transition cursor-pointer ${
                      !pelotaoMilitar
                        ? 'bg-[#1a2b4c] text-white border-[#1a2b4c] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Nenhum
                  </button>
                  {PELOTOES.map((pel) => (
                    <button
                      key={pel}
                      type="button"
                      onClick={() => setPelotaoMilitar(pel)}
                      className={`py-1.5 text-center font-bold text-xs rounded border transition cursor-pointer ${
                        pelotaoMilitar === pel
                          ? 'bg-[#1a2b4c] text-white border-[#1a2b4c] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {pel}
                    </button>
                  ))}
                </div>

                {/* Exibição conjunta CFO/Pelotão */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 font-medium">
                    Visualização conjunta (CFO/Pelotão):
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300 px-2.5 py-0.5 rounded shadow-2xs">
                    <GraduationCap size={12} className="text-amber-700" />
                    <span>{formatarAnoPelotao(anoCursoMilitar, pelotaoMilitar)}</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Phone size={13} className="text-slate-500" />
                    Telefone (WhatsApp):
                  </label>
                  <input
                    type="text"
                    value={telefoneMilitar}
                    onChange={(e) => setTelefoneMilitar(e.target.value)}
                    placeholder="Ex: (11) 98765-4321"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {tipoEfetivoMilitar === 'apoio' ? 'Função de Apoio / Foco:' : 'Especialidade Principal:'}
                  </label>
                  <input
                    type="text"
                    value={especialidadeMilitar}
                    onChange={(e) => setEspecialidadeMilitar(e.target.value)}
                    placeholder={tipoEfetivoMilitar === 'apoio' ? 'Ex: Pintura, Lixamento...' : 'Ex: Eletricista, Encanador...'}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c]"
                  />
                </div>
              </div>

              {/* Campo Impedimento / Afastamento */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5 text-xs">
                  <AlertTriangle size={13} className="text-amber-600" />
                  <span>Impedimento / Afastamento Temporário:</span>
                  <span className="text-[11px] text-slate-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  value={impedimentoMilitar}
                  onChange={(e) => setImpedimentoMilitar(e.target.value)}
                  placeholder="Ex: Dispensa Médica, Escala de Guarda, LTS (Deixe em branco se Apto)"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c] text-xs bg-white"
                />
                <p className="text-[10.5px] text-slate-500 mt-1">
                  💡 Cadetes com impedimento constam na subaba <strong>Resultado</strong> e no <strong>rodapé da Pauta Oficial PMESP (Tabela)</strong>.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalMilitarAberta(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#1a2b4c] hover:bg-[#2c4373] text-white rounded-md shadow-sm cursor-pointer"
                >
                  Salvar Militar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Confirmação de Exclusão (In-App, 100% compatível com iframe) */}
      {itemParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-3 text-red-600">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Confirmar Exclusão</h4>
                <p className="text-[11px] text-slate-500">Esta ação não poderá ser desfeita.</p>
              </div>
            </div>
            <p className="text-xs text-slate-700 mb-4">
              Deseja realmente remover{' '}
              <strong className="text-slate-900 font-bold">{itemParaExcluir.nome}</strong>{' '}
              {itemParaExcluir.tipo === 'equipe'
                ? 'das equipes de manutenção?'
                : 'do cadastro de efetivo da 3ª Cia?'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setItemParaExcluir(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExclusao}
                className="px-4 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded shadow-xs cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
