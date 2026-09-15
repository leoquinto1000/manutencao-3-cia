import React, { useState, useMemo } from 'react';
import { MissaoDiaria, EquipeManutencao, MembroEquipe, InformeMensal } from '../../types';
import { MissoesDiariasTab } from './MissoesDiariasTab';
import { CadastroEquipesTab } from './CadastroEquipesTab';
import { formatarDataISO } from '../../utils';
import {
  CalendarDays,
  Users,
  CheckSquare,
  Clock,
  ArrowRight,
  Shield,
  Layers,
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
}) => {
  const [subAbaAtiva, setSubAbaAtiva] = useState<'missoes' | 'equipes'>('missoes');

  const hoje = formatarDataISO();

  // Contadores para os badges das abas
  const contadores = useMemo(() => {
    const missoesHoje = missoes.filter((m) => m.data === hoje);
    const pendentesHoje = missoesHoje.filter((m) => !m.concluida).length;
    const concluidasHoje = missoesHoje.filter((m) => m.concluida).length;
    const totalEquipes = equipes.length;
    const totalMilitares = membros.length;

    return {
      totalHoje: missoesHoje.length,
      pendentesHoje,
      concluidasHoje,
      totalEquipes,
      totalMilitares,
    };
  }, [missoes, hoje, equipes, membros]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Sub-navegação do Cronograma */}
      <div className="no-print bg-white rounded-lg border border-slate-200 shadow-sm p-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSubAbaAtiva('missoes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition ${
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

          <button
            type="button"
            onClick={() => setSubAbaAtiva('equipes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition ${
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
        </div>

        <div className="hidden sm:flex items-center gap-2 pr-3 text-xs text-slate-500">
          <Shield size={14} className="text-[#c9a84e]" />
          <span className="font-semibold text-[#1a2b4c]">3ª Cia Escola</span>
          <span>•</span>
          <span>Ordem Diária de Serviço</span>
        </div>
      </div>

      {/* Conteúdo da Sub-Aba Ativa */}
      <div>
        {subAbaAtiva === 'missoes' && (
          <MissoesDiariasTab
            missoes={missoes}
            onChangeMissoes={onChangeMissoes}
            equipes={equipes}
            membros={membros}
            informeAtual={informeAtual}
            onChangeInformeAtual={onChangeInformeAtual}
            onNavegarParaInforme={onNavegarParaInforme}
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
      </div>
    </div>
  );
};
