import React, { useState, useMemo, useEffect } from 'react';
import { MissaoDiaria, EquipeManutencao, MembroEquipe, InformeMensal, UserRole, PermissoesAcesso, NivelAcessoDef } from '../../types';
import { MissoesDiariasTab } from './MissoesDiariasTab';
import { CadastroEquipesTab } from './CadastroEquipesTab';
import { ResultadoEfetivoTab } from './ResultadoEfetivoTab';
import {
  formatarDataISO,
  temImpedimentoNoDia,
  DADOS_INICIAIS_MISSOES,
  DADOS_INICIAIS_EQUIPES,
  DADOS_INICIAIS_MEMBROS,
} from '../../utils';
import { obterPermissoesRole } from '../../utils/permissoes';
import {
  CalendarDays,
  Users,
  CheckSquare,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  ClipboardCheck,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

interface CronogramaViewProps {
  missoes: MissaoDiaria[];
  onChangeMissoes: (missoes: MissaoDiaria[]) => void;
  equipes: EquipeManutencao[];
  onChangeEquipes: (equipes: EquipeManutencao[]) => void;
  membros: MembroEquipe[];
  onChangeMembros: (membros: MembroEquipe[]) => void;
  informeAtual?: InformeMensal;
  onChangeInformeAtual?: (informe: InformeMensal) => void;
  onNavegarParaInforme?: () => void;
  usuarioRole?: UserRole;
  permissoes?: PermissoesAcesso;
  niveisAcesso?: NivelAcessoDef[];
}

export const CronogramaView: React.FC<CronogramaViewProps> = ({
  missoes,
  onChangeMissoes,
  equipes,
  onChangeEquipes,
  membros,
  onChangeMembros,
  informeAtual,
  onChangeInformeAtual,
  onNavegarParaInforme,
  usuarioRole,
  permissoes,
  niveisAcesso,
}) => {
  const perms = useMemo(() => {
    return permissoes || obterPermissoesRole(usuarioRole, niveisAcesso);
  }, [permissoes, usuarioRole, niveisAcesso]);

  const canVerMissoes = perms.cronogramaMissoes;
  const canVerEquipes = perms.cronogramaEquipes;
  const canVerResultado = perms.cronogramaResultado;
  const canRestaurar = perms.cronogramaRestaurar;
  const modoAuxiliar = !perms.cronogramaEquipes;

  const [subAbaAtiva, setSubAbaAtiva] = useState<'missoes' | 'equipes' | 'resultado'>(() => {
    if (canVerMissoes) return 'missoes';
    if (canVerResultado) return 'resultado';
    if (canVerEquipes) return 'equipes';
    return 'missoes';
  });
  const hoje = formatarDataISO();
  const [dataSelecionada, setDataSelecionada] = useState<string>(hoje);
  const [mensagemRestauracao, setMensagemRestauracao] = useState<string | null>(null);
  const [modalConfirmarRestaurar, setModalConfirmarRestaurar] = useState<boolean>(false);

  // Redireciona caso a sub-aba ativa não seja permitida
  useEffect(() => {
    if (subAbaAtiva === 'equipes' && !canVerEquipes) {
      setSubAbaAtiva('missoes');
    }
    if (subAbaAtiva === 'resultado' && !canVerResultado) {
      setSubAbaAtiva('missoes');
    }
  }, [subAbaAtiva, canVerEquipes, canVerResultado]);

  // Executa a restauração completa dos dados oficiais da 3ª Cia
  const executarRestauracaoCompleta = () => {
    setModalConfirmarRestaurar(false);

    // 1. Restaurar Missões completas (preservando fotos anexadas caso existam)
    const restauradas = DADOS_INICIAIS_MISSOES.map((oficial) => {
      const existente = missoes.find(
        (m) =>
          m.id === oficial.id ||
          (m.data === oficial.data && m.titulo.toLowerCase() === oficial.titulo.toLowerCase())
      );
      if (existente && (existente.fotoAntesUrl || existente.fotoDepoisUrl)) {
        return {
          ...oficial,
          fotoAntesUrl: existente.fotoAntesUrl || oficial.fotoAntesUrl,
          fotoDepoisUrl: existente.fotoDepoisUrl || oficial.fotoDepoisUrl,
        };
      }
      return oficial;
    });

    onChangeMissoes(restauradas);
    try {
      localStorage.setItem('pmesp_missoes', JSON.stringify(restauradas));
    } catch (e) {
      console.error(e);
    }

    // 2. Restaurar Equipes Oficiais
    onChangeEquipes(DADOS_INICIAIS_EQUIPES);
    try {
      localStorage.setItem('pmesp_equipes', JSON.stringify(DADOS_INICIAIS_EQUIPES));
    } catch (e) {
      console.error(e);
    }

    // 3. Restaurar Efetivo e Apoios com todos os impedimentos
    onChangeMembros(DADOS_INICIAIS_MEMBROS);
    try {
      localStorage.setItem('pmesp_membros', JSON.stringify(DADOS_INICIAIS_MEMBROS));
    } catch (e) {
      console.error(e);
    }

    setMensagemRestauracao(
      'Todos os dados da aba Cronograma (Missões, Equipes e Efetivo/Impedimentos) foram restaurados com sucesso!'
    );
    setTimeout(() => setMensagemRestauracao(null), 6000);
  };

  const handleRestaurarTudoCronograma = () => {
    setModalConfirmarRestaurar(true);
  };

  // Contadores para os badges das abas
  const contadores = useMemo(() => {
    const missoesDia = missoes.filter((m) => m.data === dataSelecionada);
    const pendentesDia = missoesDia.filter((m) => !m.concluida).length;
    const concluidasDia = missoesDia.filter((m) => m.concluida).length;
    const totalEquipes = equipes.length;
    const totalMilitares = membros.length;

    const impedidosEfetivo = membros.filter((m) =>
      temImpedimentoNoDia(m, dataSelecionada)
    ).length;

    return {
      totalHoje: missoesDia.length,
      pendentesHoje: pendentesDia,
      concluidasHoje: concluidasDia,
      totalEquipes,
      totalMilitares,
      totalEfetivoResultado: membros.length,
      impedidosEfetivo,
    };
  }, [missoes, dataSelecionada, equipes, membros]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Sub-navegação do Cronograma */}
      <div className="no-print bg-white rounded-lg border border-slate-200 shadow-sm p-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSubAbaAtiva('missoes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition cursor-pointer ${
              subAbaAtiva === 'missoes'
                ? 'bg-[#1a2b4c] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-[#1a2b4c]'
            }`}
          >
            <CheckSquare
              size={16}
              className={subAbaAtiva === 'missoes' ? 'text-[#c9a84e]' : 'text-slate-400'}
            />
            <span>Missões & Determinações Diárias</span>
            {contadores.pendentesHoje > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  subAbaAtiva === 'missoes'
                    ? 'bg-[#c9a84e] text-[#1a2b4c]'
                    : 'bg-amber-100 text-amber-800'
                }`}
                title={`${contadores.pendentesHoje} missões pendentes hoje`}
              >
                {contadores.pendentesHoje} hoje
              </span>
            )}
          </button>

          {/* Subaba Equipes (conforme permissões do perfil) */}
          {canVerEquipes && (
            <button
              type="button"
              onClick={() => setSubAbaAtiva('equipes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition cursor-pointer ${
                subAbaAtiva === 'equipes'
                  ? 'bg-[#1a2b4c] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-[#1a2b4c]'
              }`}
            >
              <Users
                size={16}
                className={subAbaAtiva === 'equipes' ? 'text-[#c9a84e]' : 'text-slate-400'}
              />
              <span>Equipes & Efetivo da Manutenção</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  subAbaAtiva === 'equipes'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {contadores.totalEquipes} equipes ({contadores.totalMilitares} militares)
              </span>
            </button>
          )}

          {/* Subaba Resultado ao lado de Equipes e Efetivo da Manutenção */}
          {canVerResultado && (
            <button
              type="button"
              onClick={() => setSubAbaAtiva('resultado')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition cursor-pointer ${
                subAbaAtiva === 'resultado'
                  ? 'bg-[#1a2b4c] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-[#1a2b4c]'
              }`}
            >
              <ClipboardCheck
                size={16}
                className={subAbaAtiva === 'resultado' ? 'text-[#c9a84e]' : 'text-slate-400'}
              />
              <span>Resultado</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  subAbaAtiva === 'resultado'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {contadores.totalEfetivoResultado} militares
                {contadores.impedidosEfetivo > 0 && (
                  <span className="text-red-400 font-extrabold ml-1">
                    • {contadores.impedidosEfetivo} impedido(s)
                  </span>
                )}
              </span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 pr-1">
          {/* Botão de restauração global de todos os dados do Cronograma */}
          {canRestaurar && (
            <button
              type="button"
              onClick={handleRestaurarTudoCronograma}
              title="Restaurar todos os dados da aba Cronograma (Missões de todas as datas, Equipes e Efetivo completo da 3ª Cia)"
              className="px-2.5 py-1.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-md transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <RotateCcw size={13} className="text-amber-700 shrink-0" />
              <span className="hidden sm:inline">Restaurar Cronograma Completo</span>
              <span className="sm:hidden">Restaurar Tudo</span>
            </button>
          )}

          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200 text-xs text-slate-500">
            <Shield size={14} className="text-[#c9a84e]" />
            <span className="font-semibold text-[#1a2b4c]">3ª Cia Escola</span>
            <span>•</span>
            <span>{modoAuxiliar ? 'Missões & Resultado' : 'Ordem Diária de Serviço'}</span>
          </div>
        </div>
      </div>

      {/* Banner de Feedback de Restauração */}
      {mensagemRestauracao && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-lg flex items-center justify-between text-xs sm:text-sm font-semibold shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{mensagemRestauracao}</span>
          </div>
          <button
            type="button"
            onClick={() => setMensagemRestauracao(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4 text-base leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Conteúdo da Sub-Aba Ativa */}
      <div>
        {subAbaAtiva === 'missoes' && (
          <MissoesDiariasTab
            missoes={missoes}
            onChangeMissoes={onChangeMissoes}
            equipes={equipes}
            onChangeEquipes={onChangeEquipes}
            membros={membros}
            onChangeMembros={onChangeMembros}
            informeAtual={informeAtual}
            onChangeInformeAtual={onChangeInformeAtual}
            onNavegarParaInforme={onNavegarParaInforme}
            dataSelecionada={dataSelecionada}
            onChangeDataSelecionada={setDataSelecionada}
            modoAuxiliar={modoAuxiliar}
          />
        )}

        {subAbaAtiva === 'equipes' && (
          <CadastroEquipesTab
            equipes={equipes}
            onChangeEquipes={onChangeEquipes}
            membros={membros}
            onChangeMembros={onChangeMembros}
          />
        )}

        {subAbaAtiva === 'resultado' && (
          <ResultadoEfetivoTab
            membros={membros}
            onChangeMembros={onChangeMembros}
            dataSelecionada={dataSelecionada}
            onChangeDataSelecionada={setDataSelecionada}
            onNavegarParaPauta={() => setSubAbaAtiva('missoes')}
          />
        )}
      </div>

      {/* Modal Estilizado de Confirmação de Restauração */}
      {modalConfirmarRestaurar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-4">
              <RotateCcw size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-800 text-center">
              Restaurar Cronograma Oficial
            </h3>
            <p className="text-xs text-slate-600 mt-2 text-center leading-relaxed">
              Esta ação irá redefinir e restabelecer a base de dados oficial completa da 3ª Cia Escola:
            </p>
            <ul className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg mt-3 space-y-1.5 border border-slate-200">
              <li>• <strong>Missões e Determinações:</strong> Restaura todas as missões históricas e de hoje;</li>
              <li>• <strong>Equipes de Manutenção:</strong> Alfa, Bravo e Charlie;</li>
              <li>• <strong>Efetivo Oficial:</strong> Todos os 11 policiais fixos + apoios e impedimentos.</li>
            </ul>
            <p className="text-[11px] text-slate-400 text-center mt-3">
              Fotos anexadas a missões existentes serão preservadas.
            </p>
            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setModalConfirmarRestaurar(false)}
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executarRestauracaoCompleta}
                className="flex-1 py-2.5 px-3 bg-[#1a2b4c] hover:bg-[#2c4373] text-[#c9a84e] font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={14} />
                Restaurar Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
