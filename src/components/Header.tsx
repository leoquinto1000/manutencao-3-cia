import React, { useState } from 'react';
import { Shield, FileText, Package, Newspaper, CalendarDays, Cloud, CloudCheck, CloudOff, RefreshCw, AlertTriangle, Check, DownloadCloud } from 'lucide-react';

interface HeaderProps {
  abaAtiva: 'prestacao' | 'materiais' | 'informe' | 'cronograma';
  onTrocarAba: (aba: 'prestacao' | 'materiais' | 'informe' | 'cronograma') => void;
  statusFirebase?: 'carregando' | 'conectado' | 'salvando' | 'erro-permissao' | 'offline';
  ultimaSincronizacao?: string | null;
  onSincronizarManual?: () => void;
  onRecarregarBanco?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  abaAtiva,
  onTrocarAba,
  statusFirebase = 'conectado',
  ultimaSincronizacao,
  onSincronizarManual,
  onRecarregarBanco,
}) => {
  const [modalAjudaRegras, setModalAjudaRegras] = useState(false);

  return (
    <header className="no-print sticky top-0 z-50 bg-[#1a2b4c] text-white shadow-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#c9a84e] text-[#1a2b4c] rounded-lg flex items-center justify-center font-black text-lg border-2 border-white shadow-inner shrink-0">
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

        {/* Status de Sincronização do Firebase (manutencao-3-cia) */}
        <div className="flex items-center gap-2 flex-wrap">
          {statusFirebase === 'carregando' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/60 border border-blue-400/40 text-blue-200 text-xs">
              <RefreshCw size={13} className="animate-spin text-blue-400" />
              <span>Conectando ao Firestore...</span>
            </div>
          )}

          {statusFirebase === 'salvando' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-900/60 border border-amber-400/50 text-amber-200 text-xs">
              <RefreshCw size={13} className="animate-spin text-amber-400" />
              <span>Salvando no Firestore...</span>
            </div>
          )}

          {statusFirebase === 'conectado' && (
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs shadow-xs"
                title={`Conectado ao Firebase Firestore (Projeto: manutencao-3-cia)${
                  ultimaSincronizacao ? ` • Última sincronização: ${ultimaSincronizacao}` : ''
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <Cloud size={14} className="text-emerald-400" />
                <span className="font-semibold">Firebase Conectado</span>
                {ultimaSincronizacao && (
                  <span className="text-[10px] text-emerald-300/80 hidden md:inline">
                    ({ultimaSincronizacao})
                  </span>
                )}
              </div>

              {onRecarregarBanco && (
                <button
                  type="button"
                  onClick={onRecarregarBanco}
                  className="px-2.5 py-1 rounded bg-[#c9a84e]/20 hover:bg-[#c9a84e]/30 border border-[#c9a84e]/50 text-[#e5cd8a] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Recarregar dados atualizados salvos no banco de dados (Firestore)"
                >
                  <DownloadCloud size={13} className="text-[#c9a84e]" />
                  <span className="hidden sm:inline">Recarregar Banco</span>
                </button>
              )}

              {onSincronizarManual && (
                <button
                  type="button"
                  onClick={onSincronizarManual}
                  className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  title="Forçar sincronização com o Firestore agora"
                >
                  <RefreshCw size={12} />
                  <span className="hidden sm:inline">Salvar Nuvem</span>
                </button>
              )}
            </div>
          )}

          {statusFirebase === 'erro-permissao' && (
            <button
              type="button"
              onClick={() => setModalAjudaRegras(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 text-xs hover:bg-amber-500/30 transition cursor-pointer animate-pulse"
              title="Clique para ver como liberar o banco no Firebase Console"
            >
              <AlertTriangle size={14} className="text-amber-400 shrink-0" />
              <span className="font-bold">Aviso: Liberar Regras do Firestore</span>
            </button>
          )}

          {statusFirebase === 'offline' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-600 text-slate-300 text-xs">
              <CloudOff size={13} className="text-slate-400" />
              <span>Modo Local (Offline)</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal Educativo para Regras do Firestore */}
      {modalAjudaRegras && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 text-slate-900">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-3 text-amber-700">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="font-bold text-base">Liberar Regras do Firestore</h3>
                <p className="text-xs text-slate-500">Projeto: manutencao-3-cia</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              O Firebase Firestore foi configurado com sucesso! Se o banco de dados tiver sido criado no modo bloqueado (Production Mode), ele exige que você publique a regra de leitura e gravação no Console:
            </p>

            <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-[11px] font-mono mb-3 overflow-x-auto select-all">
              {`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
            </div>

            <ol className="text-xs text-slate-700 space-y-1.5 list-decimal pl-4 mb-5">
              <li>Acesse o <strong>Firebase Console</strong> (console.firebase.google.com).</li>
              <li>Selecione o projeto <strong>manutencao-3-cia</strong>.</li>
              <li>No menu lateral, clique em <strong>Firestore Database</strong> &gt; aba <strong>Regras (Rules)</strong>.</li>
              <li>Cole o código acima e clique no botão <strong>Publicar (Publish)</strong>.</li>
            </ol>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalAjudaRegras(false)}
                className="px-4 py-2 text-xs font-bold bg-[#1a2b4c] text-white rounded-lg hover:bg-[#2c4373] transition cursor-pointer"
              >
                Entendi, Fechar
              </button>
            </div>
          </div>
        </div>
      )}

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
