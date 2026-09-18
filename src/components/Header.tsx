import React, { useState } from 'react';
import { 
  Shield, 
  FileText, 
  Package, 
  Newspaper, 
  CalendarDays, 
  Cloud, 
  CloudCheck, 
  CloudOff, 
  RefreshCw, 
  AlertTriangle, 
  Check, 
  DownloadCloud,
  Users,
  LogOut,
  UserCheck
} from 'lucide-react';
import { UsuarioSistema } from '../types';

export type AbaNavegacao = 'prestacao' | 'materiais' | 'informe' | 'cronograma' | 'usuarios';

interface HeaderProps {
  abaAtiva: AbaNavegacao;
  onTrocarAba: (aba: AbaNavegacao) => void;
  statusFirebase?: 'carregando' | 'conectado' | 'salvando' | 'erro-permissao' | 'offline';
  ultimaSincronizacao?: string | null;
  onSincronizarManual?: () => void;
  onRecarregarBanco?: () => void;
  usuarioLogado?: UsuarioSistema | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  abaAtiva,
  onTrocarAba,
  statusFirebase = 'conectado',
  ultimaSincronizacao,
  onSincronizarManual,
  onRecarregarBanco,
  usuarioLogado,
  onLogout,
}) => {
  const [modalAjudaRegras, setModalAjudaRegras] = useState(false);
  const role = usuarioLogado?.role;
  const isAdmin = role === 'admin';
  const isUGE = role === 'uge';
  const is3CFO = role === '3cfo';
  const isOperacional = role === 'operacional' || role === 'operador';
  const isAuxiliar = role === 'auxiliar' || role === 'visualizador';

  // Visibilidade estrita das abas conforme as diretrizes de nível de acesso
  const canVerPrestacao = isAdmin || isUGE;
  const canVerMateriais = isAdmin || isOperacional || is3CFO;
  const canVerInforme = isAdmin || isUGE || is3CFO;
  const canVerCronograma = isAdmin || isUGE || isOperacional || isAuxiliar || is3CFO;
  const canVerUsuarios = isAdmin;

  return (
    <header className="no-print sticky top-0 z-50 bg-[#1a2b4c] text-white shadow-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
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

        <div className="flex items-center gap-3 flex-wrap justify-between w-full lg:w-auto">
          {/* Status de Sincronização do Firebase */}
          <div className="flex items-center gap-2 flex-wrap">
            {statusFirebase === 'carregando' && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/60 border border-blue-400/40 text-blue-200 text-xs">
                <RefreshCw size={13} className="animate-spin text-blue-400" />
                <span>Conectando...</span>
              </div>
            )}

            {statusFirebase === 'salvando' && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-900/60 border border-amber-400/50 text-amber-200 text-xs">
                <RefreshCw size={13} className="animate-spin text-amber-400" />
                <span>Salvando...</span>
              </div>
            )}

            {statusFirebase === 'conectado' && (
              <div className="flex items-center gap-1.5">
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs shadow-xs"
                  title={`Conectado ao Firestore (manutencao-3-cia)${
                    ultimaSincronizacao ? ` • Sincronizado: ${ultimaSincronizacao}` : ''
                  }`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  <Cloud size={13} className="text-emerald-400" />
                  <span className="font-semibold text-[11px] hidden sm:inline">Nuvem Conectada</span>
                </div>

                {onRecarregarBanco && (
                  <button
                    type="button"
                    onClick={onRecarregarBanco}
                    className="px-2 py-1 rounded bg-[#c9a84e]/20 hover:bg-[#c9a84e]/30 border border-[#c9a84e]/50 text-[#e5cd8a] text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                    title="Recarregar dados atualizados do banco"
                  >
                    <DownloadCloud size={12} className="text-[#c9a84e]" />
                    <span className="hidden sm:inline">Recarregar</span>
                  </button>
                )}
              </div>
            )}

            {statusFirebase === 'erro-permissao' && (
              <button
                type="button"
                onClick={() => setModalAjudaRegras(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 text-xs hover:bg-amber-500/30 transition cursor-pointer"
              >
                <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                <span className="font-bold text-[11px]">Liberar Regras</span>
              </button>
            )}

            {statusFirebase === 'offline' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-600 text-slate-300 text-xs">
                <CloudOff size={13} className="text-slate-400" />
                <span className="text-[11px]">Modo Local</span>
              </div>
            )}
          </div>

          {/* Usuário Logado e Perfil Militar */}
          {usuarioLogado && (
            <div className="flex items-center gap-2 pl-2 border-l border-white/15">
              <div className="flex items-center gap-2 bg-black/25 px-2.5 py-1 rounded-lg border border-white/10">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                    isAdmin
                      ? 'bg-[#c9a84e] text-[#1a2b4c]'
                      : isUGE
                      ? 'bg-amber-500 text-white'
                      : is3CFO
                      ? 'bg-purple-600 text-white'
                      : isOperacional
                      ? 'bg-blue-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {usuarioLogado.graduacaoOuCargo.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                    <span className="text-slate-200">{usuarioLogado.graduacaoOuCargo}</span>
                    <span className="text-white">{usuarioLogado.nome.split(' ')[0]}</span>
                    {isAdmin && (
                      <span className="text-[9px] font-bold bg-[#c9a84e] text-[#1a2b4c] px-1.5 py-0.2 rounded">
                        Admin (Full)
                      </span>
                    )}
                    {isUGE && (
                      <span className="text-[9px] font-bold bg-amber-500/30 text-amber-200 px-1.5 py-0.2 rounded border border-amber-400/40">
                        UGE
                      </span>
                    )}
                    {is3CFO && (
                      <span className="text-[9px] font-bold bg-purple-500/40 text-purple-200 px-1.5 py-0.2 rounded border border-purple-400/40">
                        3º CFO
                      </span>
                    )}
                    {isOperacional && (
                      <span className="text-[9px] font-bold bg-blue-500/40 text-blue-200 px-1.5 py-0.2 rounded border border-blue-400/40">
                        Operacional
                      </span>
                    )}
                    {isAuxiliar && (
                      <span className="text-[9px] font-bold bg-emerald-500/40 text-emerald-200 px-1.5 py-0.2 rounded border border-emerald-400/40">
                        Auxiliar
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-200 hover:text-white transition cursor-pointer"
                  title="Encerrar Sessão / Trocar Usuário"
                >
                  <LogOut size={14} />
                </button>
              )}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-2 overflow-x-auto items-center justify-between">
          <div className="flex gap-2">
            {canVerPrestacao && (
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
            )}

            {canVerMateriais && (
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
            )}

            {canVerInforme && (
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
            )}

            {canVerCronograma && (
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
            )}

            {canVerUsuarios && (
              <button
                onClick={() => onTrocarAba('usuarios')}
                className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                  abaAtiva === 'usuarios'
                    ? 'border-[#c9a84e] text-[#1a2b4c] bg-slate-50'
                    : 'border-transparent text-slate-600 hover:text-[#1a2b4c] hover:bg-slate-50'
                }`}
              >
                <Users size={16} className={abaAtiva === 'usuarios' ? 'text-[#c9a84e]' : ''} />
                <span>👥 5. Gestão de Usuários</span>
              </button>
            )}
          </div>

          {isAuxiliar && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-full text-xs font-bold">
              <span>📋 Perfil Auxiliar (Cronograma, Fotos, Conclusão & Resultado)</span>
            </div>
          )}

          {isOperacional && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 border border-blue-300 rounded-full text-xs font-bold">
              <span>🛠️ Perfil Operacional (Materiais & Cronograma)</span>
            </div>
          )}

          {is3CFO && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-800 border border-purple-300 rounded-full text-xs font-bold">
              <span>🎓 Perfil 3º CFO (Materiais, Informe & Cronograma)</span>
            </div>
          )}

          {isUGE && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded-full text-xs font-bold">
              <span>🏛️ Perfil UGE (Prestação, Informe & Cronograma)</span>
            </div>
          )}

          {isAdmin && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-[#c9a84e]/15 text-[#1a2b4c] border border-[#c9a84e]/40 rounded-full text-xs font-bold">
              <span>👑 Administrador Full</span>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};
