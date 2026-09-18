import React, { useState, useMemo } from 'react';
import { MissaoDiaria, EquipeManutencao, MembroEquipe, InformeMensal, UserRole } from '../../types';
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
}) => {
  const isAuxiliar = usuarioRole === 'auxiliar' || usuarioRole === 'visualizador';
  const [subAbaAtiva, setSubAbaAtiva] = useState<'missoes' | 'equipes' | 'resultado'>('missoes');
  const hoje = formatarDataISO();
  const [dataSelecionada, setDataSelecionada] = useState<string>(hoje);
  const [mensagemRestauracao, setMensagemRestauracao] = useState<string | null>(null);

  // Restaurar TODOS os dados da aba Cronograma (Missões de todas as datas, Equipes e Efetivo/Impedimentos)
  const handleRestaurarTudoCronograma = () => {
    const confirmou = window.confirm(
      'ATENÇÃO: Deseja restaurar TODOS os dados da aba Cronograma?\n\n' +
      'Esta ação irá redefinir e restabelecer a base de dados oficial completa da 3ª Cia Escola:\n' +
      '• Todas as Missões e Determinações Diárias (16/09, 17/09, Missões de Hoje e Próximos Dias);\n' +
      '• Todas as Equipes de Manutenção (Equipe Alfa, Equipe Bravo e Equipe Charlie);\n' +
      '• Todo o Efetivo e Apoios (todos os 11 policiais fixos + policiais em apoio, pelotões e impedimentos).\n\n' +
      'Deseja prosseguir com a restauração completa de todo o cronograma?'
    );

    if (!confirmou) return;

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
      localStorage.setItem('cronograma_missoes_pmesp_v1', JSON.stringify(restauradas));
    } catch (e) {
      console.error(e);
    }

    // 2. Restaurar Equipes Oficiais
    onChangeEquipes(DADOS_INICIAIS_EQUIPES);
    try {
      localStorage.setItem('cronograma_equipes_pmesp_v1', JSON.stringify(DADOS_INICIAIS_EQUIPES));
    } catch (e) {
      console.error(e);
    }

    // 3. Restaurar Efetivo e Apoios com todos os impedimentos
    onChangeMembros(DADOS_INICIAIS_MEMBROS);
    try {
      localStorage.setItem('cronograma_membros_pmesp_v1', JSON.stringify(DADOS_INICIAIS_MEMBROS));
    } catch (e) {
      console.error(e);
    }

    setMensagemRestauracao(
      'Todos os dados da aba Cronograma (Missões, Equipes e Efetivo/Impedimentos) foram restaurados com sucesso!'
    );
    setTimeout(() => setMensagemRestauracao(null), 6000);
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

          {/* Subaba Equipes (apenas para Admin, UGE e Operacional) */}
          {!isAuxiliar && (
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
          {!isAuxiliar && (
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
          {/* Botão de restauração global de todos os dados do Cronograma (Apenas Admin/Operacional/UGE) */}
          {!isAuxiliar && (
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
            <span>{isAuxiliar ? 'Visualização de Missões' : 'Ordem Diária de Serviço'}</span>
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
            modoAuxiliar={isAuxiliar}
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
    </div>
  );
};
