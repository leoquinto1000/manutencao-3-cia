import React, { useState, useEffect } from 'react';
import { Shield, Lock, Mail, Eye, EyeOff, LogIn, KeyRound, AlertCircle, CheckCircle2, Check } from 'lucide-react';
import { UsuarioSistema } from '../types';
import { loginSistema, solicitarRecuperacaoSenha } from '../firebase';

interface LoginViewProps {
  onLoginSucesso: (usuario: UsuarioSistema) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSucesso }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrarSenha, setLembrarSenha] = useState(false);
  const [senhaSalvaFeedback, setSenhaSalvaFeedback] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  // Carrega credenciais salvas previamente se houver
  useEffect(() => {
    try {
      const deveLembrar = localStorage.getItem('pmesp_lembrar_senha') === 'true';
      if (deveLembrar) {
        setLembrarSenha(true);
        const emailSalvo = localStorage.getItem('pmesp_email_salvo');
        const senhaSalva = localStorage.getItem('pmesp_senha_salva');
        if (emailSalvo) setEmail(emailSalvo);
        if (senhaSalva) setSenha(senhaSalva);
      }
    } catch (e) {
      console.warn('Erro ao ler credenciais salvas do localStorage', e);
    }
  }, []);

  const handleAlternarSalvarSenha = () => {
    const novoEstado = !lembrarSenha;
    setLembrarSenha(novoEstado);
    try {
      if (novoEstado) {
        localStorage.setItem('pmesp_lembrar_senha', 'true');
        if (email.trim()) localStorage.setItem('pmesp_email_salvo', email.trim());
        if (senha) localStorage.setItem('pmesp_senha_salva', senha);
        setSenhaSalvaFeedback('Senha será mantida salva');
        setTimeout(() => setSenhaSalvaFeedback(null), 2500);
      } else {
        localStorage.removeItem('pmesp_lembrar_senha');
        localStorage.removeItem('pmesp_email_salvo');
        localStorage.removeItem('pmesp_senha_salva');
        setSenhaSalvaFeedback('Senha salva removida');
        setTimeout(() => setSenhaSalvaFeedback(null), 2500);
      }
    } catch (e) {}
  };

  // Modal de esqueci a senha
  const [modalRecuperar, setModalRecuperar] = useState(false);
  const [emailRecuperar, setEmailRecuperar] = useState('');
  const [carregandoRecuperar, setCarregandoRecuperar] = useState(false);
  const [msgRecuperar, setMsgRecuperar] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !senha.trim()) {
      setErro('Por favor, preencha o e-mail e a senha.');
      return;
    }

    setCarregando(true);
    setErro(null);

    try {
      const { user } = await loginSistema(email, senha);

      // Salva ou remove credenciais de acordo com a preferência
      try {
        if (lembrarSenha) {
          localStorage.setItem('pmesp_lembrar_senha', 'true');
          localStorage.setItem('pmesp_email_salvo', email.trim());
          localStorage.setItem('pmesp_senha_salva', senha);
        } else {
          localStorage.removeItem('pmesp_lembrar_senha');
          localStorage.removeItem('pmesp_email_salvo');
          localStorage.removeItem('pmesp_senha_salva');
        }
      } catch (e) {}

      setSucesso(`Bem-vindo, ${user.graduacaoOuCargo} ${user.nome}!`);
      setTimeout(() => {
        onLoginSucesso(user);
      }, 500);
    } catch (err: any) {
      setErro(err.message || 'Erro ao realizar login.');
    } finally {
      setCarregando(false);
    }
  };

  const handleEnviarRecuperacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRecuperar.trim()) return;
    setCarregandoRecuperar(true);
    setMsgRecuperar(null);
    try {
      const res = await solicitarRecuperacaoSenha(emailRecuperar);
      setMsgRecuperar({
        tipo: res.success ? 'sucesso' : 'erro',
        texto: res.mensagem,
      });
    } catch (e: any) {
      setMsgRecuperar({
        tipo: 'erro',
        texto: 'Não foi possível processar a recuperação de senha no momento.',
      });
    } finally {
      setCarregandoRecuperar(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e1726] via-[#1a2b4c] to-[#0f1d35] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Detalhes de Fundo / Estética Militar PMESP */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#c9a84e]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full my-auto z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Cabeçalho do Card */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#c9a84e] text-[#1a2b4c] rounded-2xl font-black text-3xl border-4 border-white shadow-xl mb-3">
            3ª
          </div>
          <span className="text-xs font-bold text-[#e5cd8a] uppercase tracking-widest block">
            Polícia Militar do Estado de São Paulo
          </span>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">
            Manutenção 3ª Cia
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
            Sistema Integrado de Gestão, Prestação de Contas e Manutenção Predial • APMBB
          </p>
        </div>

        {/* Card de Login Principal */}
        <div className="bg-[#15233e]/90 backdrop-blur-md border border-white/15 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-2 pb-4 mb-5 border-b border-white/10">
            <Shield className="text-[#c9a84e]" size={20} />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Autenticação de Acesso
            </h2>
          </div>

          {erro && (
            <div className="mb-5 p-3.5 bg-red-950/80 border border-red-500/60 rounded-xl text-xs text-red-200 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{erro}</div>
            </div>
          )}

          {sucesso && (
            <div className="mb-5 p-3.5 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-xs text-emerald-200 flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <div className="font-semibold">{sucesso}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                E-mail Institucional ou Cadastrado
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  id="login-email"
                  name="username"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@pmesp.sp.gov.br"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-white/15 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#c9a84e] focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Senha de Acesso
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setEmailRecuperar(email);
                    setMsgRecuperar(null);
                    setModalRecuperar(true);
                  }}
                  className="text-[11px] text-[#e5cd8a] hover:underline cursor-pointer"
                >
                  Esqueci a senha
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  id="login-senha"
                  name="password"
                  autoComplete="current-password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-900/80 border border-white/15 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#c9a84e] focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition cursor-pointer"
                  title={mostrarSenha ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Botão de Opção: Deixar Senha Salva */}
            <div className="flex items-center justify-between py-1 px-1">
              <button
                type="button"
                id="btn-lembrar-senha"
                onClick={handleAlternarSalvarSenha}
                className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-white transition cursor-pointer group select-none text-left"
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                    lembrarSenha
                      ? 'bg-[#c9a84e] border-[#c9a84e] text-[#1a2b4c]'
                      : 'bg-slate-900/90 border-white/30 group-hover:border-white/60 text-transparent'
                  }`}
                >
                  <Check size={12} strokeWidth={3} className={lembrarSenha ? 'opacity-100' : 'opacity-0'} />
                </div>
                <span className="font-medium">Salvar senha neste dispositivo</span>
              </button>

              {senhaSalvaFeedback ? (
                <span className="text-[11px] font-semibold text-[#e5cd8a] animate-in fade-in">
                  {senhaSalvaFeedback}
                </span>
              ) : lembrarSenha ? (
                <span className="text-[10px] text-[#e5cd8a] font-medium bg-[#c9a84e]/15 px-2 py-0.5 rounded-full border border-[#c9a84e]/30">
                  Senha salva
                </span>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full mt-2 py-3 px-4 bg-[#c9a84e] hover:bg-[#b8953c] active:bg-[#a6842f] text-[#1a2b4c] font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {carregando ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#1a2b4c] border-t-transparent rounded-full animate-spin"></div>
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Acessar Sistema</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Rodapé Informativo */}
        <div className="text-center mt-6 text-xs text-slate-400">
          <p className="flex items-center justify-center gap-1.5">
            <Lock size={12} className="text-[#c9a84e]" />
            <span>Ambiente Seguro • Sincronizado via Firebase Firestore</span>
          </p>
        </div>
      </div>

      {/* Modal de Recuperação de Senha */}
      {modalRecuperar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 text-slate-900 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2.5 mb-3 text-[#1a2b4c]">
              <KeyRound size={22} className="text-[#c9a84e]" />
              <h3 className="font-bold text-base">Recuperação de Senha</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Informe o e-mail cadastrado no sistema para receber o link de redefinição de senha:
            </p>

            {msgRecuperar && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-start gap-2 ${
                  msgRecuperar.tipo === 'sucesso'
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                    : 'bg-red-50 border border-red-300 text-red-800'
                }`}
              >
                {msgRecuperar.tipo === 'sucesso' ? (
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                )}
                <div className="leading-relaxed">{msgRecuperar.texto}</div>
              </div>
            )}

            <form onSubmit={handleEnviarRecuperacao} className="space-y-3">
              <input
                type="email"
                required
                value={emailRecuperar}
                onChange={(e) => setEmailRecuperar(e.target.value)}
                placeholder="seu.email@pmesp.sp.gov.br"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#c9a84e]"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalRecuperar(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={carregandoRecuperar}
                  className="px-4 py-1.5 text-xs font-bold bg-[#1a2b4c] text-white hover:bg-[#2c4373] rounded-lg transition cursor-pointer disabled:opacity-50"
                >
                  {carregandoRecuperar ? 'Enviando...' : 'Enviar Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
