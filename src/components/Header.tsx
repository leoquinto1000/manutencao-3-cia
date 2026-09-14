import React from 'react';
import { Shield, FileText, Package, Newspaper, CalendarDays } from 'lucide-react';

interface HeaderProps {
  abaAtiva: 'prestacao' | 'materiais' | 'informe' | 'cronograma';
  onTrocarAba: (aba: 'prestacao' | 'materiais' | 'informe' | 'cronograma') => void;
}

export const Header: React.FC<HeaderProps> = ({ abaAtiva, onTrocarAba }) => {
  return (
    <header className="no-print sticky top-0 z-50 bg-[#1a2b4c] text-white shadow-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#c9a84e] text-[#1a2b4c] rounded-lg flex items-center justify-center font-black text-lg border-2 border-white shadow-inner">
            3ª
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-lg font-bold tracking-tight flex items-center gap-2">
                Manutenção 3ª Cia
              </h1>
              <span className="bg-[#c9a84e]/20 text-[#e5cd8a] border border-[#c9a84e] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                PMESP • UGE
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Sistema Integrado de Gestão, Compras e Manutenção Predial • APMBB
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Top header status / info */}
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-2 overflow-x-auto">
          <button
            onClick={() => onTrocarAba('prestacao')}
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
              abaAtiva === 'prestacao'
                ? 'border-[#c9a84e] text-[#1a2b4c] bg-slate-50'
                : 'border-transparent text-slate-600 hover:text-[#1a2b4c] hover:bg-slate-50'
            }`}
          >
            <FileText size={16} className={abaAtiva === 'prestacao' ? 'text-[#c9a84e]' : ''} />
            <span>💰 1. Prestação de Contas</span>
          </button>

          <button
            onClick={() => onTrocarAba('materiais')}
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
              abaAtiva === 'materiais'
                ? 'border-[#c9a84e] text-[#1a2b4c] bg-slate-50'
                : 'border-transparent text-slate-600 hover:text-[#1a2b4c] hover:bg-slate-50'
            }`}
          >
            <Package size={16} className={abaAtiva === 'materiais' ? 'text-[#c9a84e]' : ''} />
            <span>📦 2. Controle de Materiais</span>
          </button>

          <button
            onClick={() => onTrocarAba('informe')}
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
              abaAtiva === 'informe'
                ? 'border-[#c9a84e] text-[#1a2b4c] bg-slate-50'
                : 'border-transparent text-slate-600 hover:text-[#1a2b4c] hover:bg-slate-50'
            }`}
          >
            <Newspaper size={16} className={abaAtiva === 'informe' ? 'text-[#c9a84e]' : ''} />
            <span>📰 3. Informe Mensal (APMBB)</span>
          </button>

          <button
            onClick={() => onTrocarAba('cronograma')}
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
              abaAtiva === 'cronograma'
                ? 'border-[#c9a84e] text-[#1a2b4c] bg-slate-50'
                : 'border-transparent text-slate-600 hover:text-[#1a2b4c] hover:bg-slate-50'
            }`}
          >
            <CalendarDays size={16} className={abaAtiva === 'cronograma' ? 'text-[#c9a84e]' : ''} />
            <span>📅 4. Cronograma</span>
          </button>
        </div>
      </nav>
    </header>
  );
};
