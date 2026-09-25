import React from 'react';
import { TipoBadgeFoto } from '../../types';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Info,
  Sparkles,
  Tag,
  Wrench,
} from 'lucide-react';

interface BadgeFotoColoridoProps {
  tipoBadge?: TipoBadgeFoto;
  badgeTexto?: string;
  badgeCor?: 'vermelho' | 'verde' | 'amarelo' | 'azul' | 'roxo' | 'cinza';
  tamanho?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BadgeFotoColorido: React.FC<BadgeFotoColoridoProps> = ({
  tipoBadge,
  badgeTexto,
  badgeCor,
  tamanho = 'md',
  className = '',
}) => {
  if (!tipoBadge || tipoBadge === 'nenhum') {
    return null;
  }

  // Define a cor base dependendo do tipo ou da cor explicitamente passada
  const corFinal =
    badgeCor ||
    (tipoBadge === 'antes'
      ? 'vermelho'
      : tipoBadge === 'depois'
      ? 'verde'
      : tipoBadge === 'durante'
      ? 'amarelo'
      : tipoBadge === 'detalhe'
      ? 'azul'
      : 'cinza');

  // Texto padrão se não especificado
  const textoFinal =
    badgeTexto && badgeTexto.trim() !== ''
      ? badgeTexto
      : tipoBadge === 'antes'
      ? 'ANTES • ESTADO INICIAL'
      : tipoBadge === 'depois'
      ? 'DEPOIS • CONCLUÍDO'
      : tipoBadge === 'durante'
      ? 'EM ANDAMENTO'
      : tipoBadge === 'detalhe'
      ? 'DETALHE TÉCNICO'
      : 'REGISTRO';

  // Configurações de cores vibrantes e contrastantes
  const coresConfig = {
    vermelho: {
      bg: 'bg-red-600',
      border: 'border-red-700/80',
      text: 'text-white',
      glow: 'shadow-red-600/30',
      icon: AlertCircle,
    },
    verde: {
      bg: 'bg-emerald-600',
      border: 'border-emerald-700/80',
      text: 'text-white',
      glow: 'shadow-emerald-600/30',
      icon: CheckCircle2,
    },
    amarelo: {
      bg: 'bg-amber-500',
      border: 'border-amber-600/80',
      text: 'text-slate-950 font-black',
      glow: 'shadow-amber-500/30',
      icon: Clock,
    },
    azul: {
      bg: 'bg-blue-600',
      border: 'border-blue-700/80',
      text: 'text-white',
      glow: 'shadow-blue-600/30',
      icon: Info,
    },
    roxo: {
      bg: 'bg-purple-600',
      border: 'border-purple-700/80',
      text: 'text-white',
      glow: 'shadow-purple-600/30',
      icon: Sparkles,
    },
    cinza: {
      bg: 'bg-slate-700',
      border: 'border-slate-800/80',
      text: 'text-white',
      glow: 'shadow-slate-700/30',
      icon: Tag,
    },
  }[corFinal];

  const Icone = coresConfig.icon;

  const tamanhosConfig = {
    sm: 'text-[9.5px] px-2 py-0.5 gap-1',
    md: 'text-[11px] px-2.5 py-1 gap-1.5',
    lg: 'text-xs px-3.5 py-1.5 gap-2 font-black tracking-wider',
  }[tamanho];

  const iconeTamanho = tamanho === 'sm' ? 11 : tamanho === 'lg' ? 14 : 12;

  return (
    <div
      className={`inline-flex items-center font-heading font-extrabold uppercase rounded-md shadow-md border tracking-wide select-none ${coresConfig.bg} ${coresConfig.border} ${coresConfig.text} ${coresConfig.glow} ${tamanhosConfig} ${className}`}
      style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
    >
      <Icone size={iconeTamanho} className="shrink-0" />
      <span className="truncate">{textoFinal}</span>
    </div>
  );
};
