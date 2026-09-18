import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Key, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Search, 
  Lock, 
  Mail, 
  BadgeCheck, 
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  UserCheck,
  Pencil,
  Save,
  Copy,
  Check,
  SlidersHorizontal,
} from 'lucide-react';
import { UsuarioSistema, UserRole, MembroEquipe, NivelAcessoDef } from '../types';
import { 
  cadastrarNovoUsuario, 
  redefinirSenhaUsuario, 
  atualizarUsuarioFirestore, 
  salvarUsuariosFirestore,
  excluirUsuarioFirestore
} from '../firebase';
import { NIVEIS_ACESSO_PADRAO, obterNivelDef, getClassesCorNivel } from '../utils/permissoes';
import { GerenciadorNiveisAcesso } from './Usuarios/GerenciadorNiveisAcesso';

interface UsuariosViewProps {
  usuarios: UsuarioSistema[];
  onChangeUsuarios: (usuarios: UsuarioSistema[]) => void;
  usuarioLogado: UsuarioSistema;
  onAtualizarUsuarioLogado?: (usuario: UsuarioSistema) => void;
  membros?: MembroEquipe[];
  niveisAcesso?: NivelAcessoDef[];
  onChangeNiveisAcesso?: (niveis: NivelAcessoDef[]) => Promise<void> | void;
}

const GRADUACOES_OPCOES = [
  'Cel PM',
  'Ten Cel PM',
  'Maj PM',
  'Cap PM',
  '1º Ten PM',
  '2º Ten PM',
  'Aspirante a Oficial PM',
  'Cadete',
  'Cadete PM',
  'Subten PM',
  '1º Sgt PM',
  '2º Sgt PM',
  '3º Sgt PM',
  'Cb PM',
  'Sd PM',
  'Funcionário Civil',
  'Comando / Direção',
];

export const UsuariosView: React.FC<UsuariosViewProps> = ({
  usuarios,
  onChangeUsuarios,
  usuarioLogado,
  onAtualizarUsuarioLogado,
  membros = [],
  niveisAcesso,
  onChangeNiveisAcesso,
}) => {
  const niveis = niveisAcesso && niveisAcesso.length > 0 ? niveisAcesso : NIVEIS_ACESSO_PADRAO;
  const [abaSecundaria, setAbaSecundaria] = useState<'usuarios' | 'niveis'>('usuarios');
  const [busca, setBusca] = useState('');
  const [filtroRole, setFiltroRole] = useState<string>('todos');

  // Modal Novo Usuário
  const [modalNovo, setModalNovo] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [graduacao, setGraduacao] = useState('1º Sgt PM');
  const [re, setRe] = useState('');
  const [role, setRole] = useState<UserRole>('operacional');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [salvandoNovo, setSalvandoNovo] = useState(false);
  const [erroNovo, setErroNovo] = useState<string | null>(null);

  // Modal Redefinir Senha
  const [usuarioRedefinir, setUsuarioRedefinir] = useState<UsuarioSistema | null>(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [sucessoSenha, setSucessoSenha] = useState<string | null>(null);

  // Modal Editar Usuário
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioSistema | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editGraduacao, setEditGraduacao] = useState('1º Sgt PM');
  const [editRe, setEditRe] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('operacional');
  const [editAtivo, setEditAtivo] = useState(true);
  const [editNovaSenha, setEditNovaSenha] = useState('');
  const [editConfirmarSenha, setEditConfirmarSenha] = useState('');
  const [editMostrarSenha, setEditMostrarSenha] = useState(false);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState<string | null>(null);

  // Modal Credenciais do Efetivo
  const [modalCredenciais, setModalCredenciais] = useState(false);
  const [buscaCredenciais, setBuscaCredenciais] = useState('');
  const [copiadoTudo, setCopiadoTudo] = useState(false);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Modal Confirmar Exclusão de Usuário
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState<UsuarioSistema | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  // Feedback geral
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const exibirFeedback = (texto: string, tipo: 'sucesso' | 'erro' = 'sucesso') => {
    setFeedback({ tipo, texto });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleCadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      setErroNovo('Preencha todos os campos obrigatórios.');
      return;
    }

    if (senha.length < 6) {
      setErroNovo('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      setErroNovo('As senhas digitadas não coincidem.');
      return;
    }

    setSalvandoNovo(true);
    setErroNovo(null);

    try {
      const novoUsuario = await cadastrarNovoUsuario({
        nome,
        email,
        graduacaoOuCargo: graduacao,
        re,
        role,
        senha,
      });

      const listaNova = [...usuarios, novoUsuario];
      onChangeUsuarios(listaNova);
      setModalNovo(false);
      setNome('');
      setEmail('');
      setRe('');
      setSenha('');
      setConfirmarSenha('');
      exibirFeedback(`Usuário ${novoUsuario.nome} cadastrado com sucesso!`);
    } catch (err: any) {
      setErroNovo(err.message || 'Erro ao cadastrar usuário.');
    } finally {
      setSalvandoNovo(false);
    }
  };

  const handleAlternarStatus = async (usuario: UsuarioSistema) => {
    if (usuario.id === usuarioLogado.id) {
      alert('Você não pode desativar seu próprio usuário logado.');
      return;
    }

    const novaLista = usuarios.map((u) =>
      u.id === usuario.id ? { ...u, ativo: !u.ativo } : u
    );
    onChangeUsuarios(novaLista);
    await salvarUsuariosFirestore(novaLista);
    exibirFeedback(`Status de ${usuario.nome} alterado para ${!usuario.ativo ? 'Ativo' : 'Inativo'}.`);
  };

  const handleAlterarRole = async (usuario: UsuarioSistema, novoRole: UserRole) => {
    if (usuario.id === usuarioLogado.id && novoRole !== 'admin') {
      alert('Você não pode revogar seu próprio papel de Administrador.');
      return;
    }

    const novaLista = usuarios.map((u) =>
      u.id === usuario.id ? { ...u, role: novoRole } : u
    );
    onChangeUsuarios(novaLista);
    await salvarUsuariosFirestore(novaLista);
    exibirFeedback(`Permissão de ${usuario.nome} alterada com sucesso.`);
  };

  const handleAbrirExclusao = (usuario: UsuarioSistema) => {
    if (usuario.id === usuarioLogado.id) {
      exibirFeedback('Você não pode excluir sua própria conta enquanto estiver conectado.', 'erro');
      return;
    }
    setUsuarioParaExcluir(usuario);
  };

  const handleConfirmarExclusao = async () => {
    if (!usuarioParaExcluir) return;
    if (usuarioParaExcluir.id === usuarioLogado.id) {
      exibirFeedback('Você não pode excluir sua própria conta enquanto estiver conectado.', 'erro');
      setUsuarioParaExcluir(null);
      return;
    }

    setExcluindo(true);
    try {
      const listaAtualizada = await excluirUsuarioFirestore(usuarioParaExcluir.id);
      onChangeUsuarios(listaAtualizada);
      exibirFeedback(`Usuário ${usuarioParaExcluir.graduacaoOuCargo} ${usuarioParaExcluir.nome} excluído com sucesso.`);
      setUsuarioParaExcluir(null);
    } catch (err: any) {
      exibirFeedback(err.message || 'Erro ao excluir usuário.', 'erro');
    } finally {
      setExcluindo(false);
    }
  };

  const handleAbrirEdicao = (usuario: UsuarioSistema) => {
    setUsuarioEditando(usuario);
    setEditNome(usuario.nome);
    setEditEmail(usuario.email);
    setEditGraduacao(usuario.graduacaoOuCargo || '1º Sgt PM');
    setEditRe(usuario.re || '');
    setEditRole(usuario.role);
    setEditAtivo(usuario.ativo);
    setEditNovaSenha('');
    setEditConfirmarSenha('');
    setEditMostrarSenha(false);
    setErroEdicao(null);
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioEditando) return;

    if (!editNome.trim() || !editEmail.trim()) {
      setErroEdicao('Nome e e-mail institucional são obrigatórios.');
      return;
    }

    if (usuarioEditando.id === usuarioLogado.id) {
      if (!editAtivo) {
        setErroEdicao('Você não pode desativar seu próprio usuário logado.');
        return;
      }
      if (editRole !== 'admin') {
        setErroEdicao('Você não pode revogar seu próprio perfil de Administrador.');
        return;
      }
    }

    if (editNovaSenha.trim()) {
      if (editNovaSenha.trim().length < 6) {
        setErroEdicao('A nova senha deve ter no mínimo 6 caracteres.');
        return;
      }
      if (editNovaSenha.trim() !== editConfirmarSenha.trim()) {
        setErroEdicao('As novas senhas digitadas não coincidem.');
        return;
      }
    }

    setSalvandoEdicao(true);
    setErroEdicao(null);

    try {
      const listaAtualizada = await atualizarUsuarioFirestore(usuarioEditando.id, {
        nome: editNome.trim(),
        email: editEmail.trim(),
        graduacaoOuCargo: editGraduacao.trim(),
        re: editRe.trim(),
        role: editRole,
        ativo: editAtivo,
        novaSenha: editNovaSenha.trim() ? editNovaSenha.trim() : undefined,
      });

      onChangeUsuarios(listaAtualizada);

      // Se editou o próprio militar conectado, atualiza a sessão local
      if (usuarioEditando.id === usuarioLogado.id) {
        const meuUsuarioAtualizado = listaAtualizada.find((u) => u.id === usuarioLogado.id);
        if (meuUsuarioAtualizado) {
          onAtualizarUsuarioLogado?.(meuUsuarioAtualizado);
        }
      }

      setUsuarioEditando(null);
      exibirFeedback(`Dados do militar ${editNome.trim()} atualizados com sucesso!`);
    } catch (err: any) {
      setErroEdicao(err.message || 'Erro ao atualizar dados do militar.');
    } finally {
      setSalvandoEdicao(false);
    }
  };

  const handleSalvarNovaSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioRedefinir) return;
    if (novaSenha.length < 6) {
      alert('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setSalvandoSenha(true);
    try {
      await redefinirSenhaUsuario(usuarioRedefinir.id, novaSenha);
      setSucessoSenha(`Senha de ${usuarioRedefinir.nome} atualizada com sucesso!`);
      const novaLista = usuarios.map((u) =>
        u.id === usuarioRedefinir.id ? { ...u, senhaHash: novaSenha } : u
      );
      onChangeUsuarios(novaLista);
      setTimeout(() => {
        setUsuarioRedefinir(null);
        setNovaSenha('');
        setSucessoSenha(null);
      }, 1500);
    } catch (e: any) {
      alert('Erro ao atualizar senha.');
    } finally {
      setSalvandoSenha(false);
    }
  };

  // Sincronização automática de militares do efetivo fixo para a lista de usuários
  const handleSincronizarEfetivo = () => {
    const listaFonte = membros && membros.length > 0 ? membros : [];
    const fixos = listaFonte.filter((m) => m.tipoEfetivo !== 'apoio');

    if (fixos.length === 0) {
      exibirFeedback('Nenhum militar do efetivo fixo encontrado para sincronizar.', 'erro');
      return;
    }

    let adicionados = 0;
    const novosUsuarios = [...usuarios];

    for (const m of fixos) {
      const reLimpo = m.re ? m.re.replace(/\D/g, '') : '';
      const jaExiste = novosUsuarios.some((u) => {
        const uReLimpo = u.re ? u.re.replace(/\D/g, '') : '';
        if (reLimpo && uReLimpo && reLimpo === uReLimpo) return true;
        const nomeAlvo = (m.nomeGuerra || m.nomeCompleto || '').toLowerCase().replace(/^(1º ten pm|cad pm)\s*/i, '').trim();
        if (nomeAlvo && u.nome.toLowerCase().includes(nomeAlvo)) return true;
        return false;
      });

      if (!jaExiste) {
        const nomeGuerraLimpo = (m.nomeGuerra || '')
          .toLowerCase()
          .replace(/^(1º ten pm|cad pm)\s*/i, '')
          .trim()
          .split(' ')[0]
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z]/g, '');

        const emailSugerido = `${nomeGuerraLimpo || 'militar'}@pmesp.sp.gov.br`;

        let userRole: UserRole = 'auxiliar';
        const esp = (m.especialidade || '').toLowerCase();
        const grad = (m.graduacao || '').toLowerCase();
        if (esp.includes('coordenador') || esp.includes('supervisor') || grad.includes('ten') || grad.includes('cap')) {
          userRole = 'admin';
        } else if (esp.includes('uge') || esp.includes('compras') || esp.includes('administração')) {
          userRole = 'uge';
        } else if (esp.includes('elétrica') || esp.includes('pintura') || esp.includes('gestão') || esp.includes('hidráulica')) {
          userRole = 'operacional';
        }

        novosUsuarios.push({
          id: `user-membro-${m.id || Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          nome: m.nomeCompleto || m.nomeGuerra,
          email: emailSugerido,
          graduacaoOuCargo: m.graduacao === 'Cad PM' ? 'Cadete PM' : m.graduacao,
          re: m.re,
          role: userRole,
          ativo: true,
          criadoEm: new Date().toISOString(),
          senhaHash: 'pmesp123456',
        });
        adicionados++;
      }
    }

    if (adicionados > 0) {
      onChangeUsuarios(novosUsuarios);
      exibirFeedback(`${adicionados} usuário(s) do efetivo fixo foram cadastrados com sucesso!`);
    } else {
      exibirFeedback('Todos os militares do efetivo fixo já possuem cadastro de usuário no sistema.');
    }
  };

  // Copiar relação de credenciais
  const handleCopiarCredenciaisTodas = () => {
    const texto = usuarios
      .map(
        (u) =>
          `• ${u.graduacaoOuCargo} ${u.nome} (RE: ${u.re || 'N/D'})\n  E-mail: ${u.email}\n  Perfil: ${
            u.role === 'admin'
              ? 'Administrador (Full)'
              : u.role === 'uge'
              ? 'UGE'
              : u.role === '3cfo'
              ? '3º CFO'
              : u.role === 'operacional' || u.role === 'operador'
              ? 'Operacional'
              : 'Auxiliar'
          }\n  Senha Padrão: ${u.senhaHash || 'pmesp123456'}\n`
      )
      .join('\n');

    navigator.clipboard.writeText(
      `--- CREDENCIAIS DE ACESSO - EFETIVO 3ª COMPANHIA (PMESP) ---\nSistema de Manutenção & Prestação de Contas\n\n${texto}`
    );
    setCopiadoTudo(true);
    setTimeout(() => setCopiadoTudo(false), 2500);
    exibirFeedback('Relação de credenciais copiada para a área de transferência!');
  };

  const handleCopiarLinha = (u: UsuarioSistema) => {
    const perfilLabel = u.role === '3cfo' ? '3º CFO' : u.role;
    const texto = `Login: ${u.email} | Senha: ${u.senhaHash || 'pmesp123456'} | Perfil: ${perfilLabel}`;
    navigator.clipboard.writeText(texto);
    setCopiadoId(u.id);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  // Filtragem
  const usuariosFiltrados = usuarios.filter((u) => {
    const correspondeBusca =
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.email.toLowerCase().includes(busca.toLowerCase()) ||
      (u.re && u.re.toLowerCase().includes(busca.toLowerCase())) ||
      (u.graduacaoOuCargo && u.graduacaoOuCargo.toLowerCase().includes(busca.toLowerCase()));

    const correspondeRole =
      filtroRole === 'todos' ||
      u.role === filtroRole ||
      (filtroRole === 'operacional' && u.role === 'operador') ||
      (filtroRole === 'auxiliar' && u.role === 'visualizador');
    return correspondeBusca && correspondeRole;
  });

  const totalAdmins = usuarios.filter((u) => u.role === 'admin').length;
  const totalUge = usuarios.filter((u) => u.role === 'uge').length;
  const total3CFO = usuarios.filter((u) => u.role === '3cfo').length;
  const totalOperacionais = usuarios.filter((u) => u.role === 'operacional' || u.role === 'operador').length;
  const totalAuxiliares = usuarios.filter((u) => u.role === 'auxiliar' || u.role === 'visualizador').length;
  const totalAtivos = usuarios.filter((u) => u.ativo).length;

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-16 right-4 z-50 px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            feedback.tipo === 'sucesso'
              ? 'bg-[#1a2b4c] text-white border border-[#c9a84e]'
              : 'bg-red-900 text-white border border-red-500'
          }`}
        >
          {feedback.tipo === 'sucesso' ? (
            <CheckCircle size={16} className="text-[#c9a84e]" />
          ) : (
            <AlertTriangle size={16} className="text-red-400" />
          )}
          <span>{feedback.texto}</span>
        </div>
      )}

      {/* Top Header do Módulo */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#1a2b4c]">
            <Shield size={22} className="text-[#c9a84e]" />
            <h2 className="text-lg font-bold">Gestão de Usuários & Níveis de Acesso</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Controle de perfis, permissões e credenciais de acesso da 3ª Companhia (PMESP)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAbaSecundaria(abaSecundaria === 'niveis' ? 'usuarios' : 'niveis')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition border cursor-pointer shadow-2xs ${
              abaSecundaria === 'niveis'
                ? 'bg-[#1a2b4c] text-white border-[#1a2b4c]'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-300'
            }`}
            title="Gerenciar e criar níveis de acesso do sistema (RBAC)"
          >
            <SlidersHorizontal size={14} className={abaSecundaria === 'niveis' ? 'text-[#c9a84e]' : 'text-indigo-700'} />
            <span>{abaSecundaria === 'niveis' ? 'Ver Usuários' : 'Níveis de Acesso (RBAC)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setModalCredenciais(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg flex items-center gap-1.5 transition border border-slate-300 cursor-pointer shadow-2xs"
            title="Visualizar a relação de e-mails, permissões e senhas padrão de acesso"
          >
            <Key size={14} className="text-[#c9a84e]" />
            <span>Credenciais do Efetivo</span>
          </button>

          <button
            type="button"
            onClick={handleSincronizarEfetivo}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-lg flex items-center gap-1.5 transition border border-amber-300 cursor-pointer shadow-2xs"
            title="Garante que todos os policiais militares do efetivo fixo possuam conta de usuário cadastrada"
          >
            <RefreshCw size={14} className="text-amber-700" />
            <span>Sincronizar Efetivo Fixo</span>
          </button>

          <button
            type="button"
            onClick={() => setModalNovo(true)}
            className="px-4 py-2 bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <UserPlus size={15} className="text-[#c9a84e]" />
            <span>Cadastrar Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* Abas Secundárias: Usuários vs Níveis de Acesso */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setAbaSecundaria('usuarios')}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition cursor-pointer ${
            abaSecundaria === 'usuarios'
              ? 'bg-[#1a2b4c] text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users size={16} className={abaSecundaria === 'usuarios' ? 'text-[#c9a84e]' : 'text-slate-400'} />
          <span>Efetivo & Usuários Cadastrados</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            abaSecundaria === 'usuarios' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {usuarios.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaSecundaria('niveis')}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition cursor-pointer ${
            abaSecundaria === 'niveis'
              ? 'bg-[#1a2b4c] text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <SlidersHorizontal size={16} className={abaSecundaria === 'niveis' ? 'text-[#c9a84e]' : 'text-slate-400'} />
          <span>Níveis de Acesso & Permissões (RBAC)</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            abaSecundaria === 'niveis' ? 'bg-[#c9a84e] text-[#1a2b4c]' : 'bg-amber-100 text-amber-900'
          }`}>
            {niveis.length} perfis
          </span>
        </button>
      </div>

      {abaSecundaria === 'niveis' ? (
        <GerenciadorNiveisAcesso
          niveisAcesso={niveis}
          onChangeNiveisAcesso={onChangeNiveisAcesso || (() => {})}
          usuarios={usuarios}
          usuarioLogadoRole={usuarioLogado.role}
        />
      ) : (
        <>
          {/* Cartões dos Níveis de Acesso (Dinâmicos RBAC Conforme Configuração) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {niveis.map((nivel) => {
              const corClasses = getClassesCorNivel(nivel.cor);
              const totalDesseNivel = usuarios.filter(
                (u) =>
                  u.role === nivel.id ||
                  (nivel.id === 'operacional' && u.role === 'operador') ||
                  (nivel.id === 'auxiliar' && u.role === 'visualizador')
              ).length;
              return (
                <div
                  key={nivel.id}
                  className={`${corClasses.badge} rounded-xl p-4 shadow-xs flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
                        <span className="text-lg">{nivel.icone}</span>
                        <h3>{nivel.nome}</h3>
                      </div>
                      {nivel.sistema && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-black/10 opacity-70">
                          Padrão
                        </span>
                      )}
                    </div>
                    <p className="text-xs opacity-90 leading-relaxed line-clamp-3">
                      {nivel.descricao}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-black/10">
                      {totalDesseNivel} usuário(s)
                    </span>
                    <button
                      type="button"
                      onClick={() => setAbaSecundaria('niveis')}
                      className="text-[10px] font-bold underline opacity-75 hover:opacity-100 cursor-pointer"
                    >
                      Editar Permissões →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, e-mail, RE ou posto..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a84e]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Filtrar:</label>
          <select
            value={filtroRole}
            onChange={(e) => setFiltroRole(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#c9a84e]"
          >
            <option value="todos">Todos os Perfis ({usuarios.length})</option>
            {niveis.map((n) => {
              const count = usuarios.filter(
                (u) =>
                  u.role === n.id ||
                  (n.id === 'operacional' && u.role === 'operador') ||
                  (n.id === 'auxiliar' && u.role === 'visualizador')
              ).length;
              return (
                <option key={n.id} value={n.id}>
                  {n.icone} {n.nome} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Militar / Usuário</th>
                <th className="py-3 px-4">E-mail Institucional</th>
                <th className="py-3 px-4">RE</th>
                <th className="py-3 px-4">Nível de Acesso</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Nenhum usuário encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((u) => {
                  const isEu = u.id === usuarioLogado.id;
                  const nivelU = obterNivelDef(u.role, niveis);
                  const corU = getClassesCorNivel(nivelU.cor);
                  const isEfetivoFixo =
                    u.id.startsWith('user-membro-') ||
                    (membros &&
                      membros.some((m) => {
                        if (m.tipoEfetivo === 'apoio') return false;
                        const mRe = m.re ? m.re.replace(/\D/g, '') : '';
                        const uRe = u.re ? u.re.replace(/\D/g, '') : '';
                        if (mRe && uRe && mRe === uRe) return true;
                        const nomeBase = (m.nomeGuerra || m.nomeCompleto || '')
                          .toLowerCase()
                          .replace(/^(1º ten pm|cad pm)\s*/i, '')
                          .trim();
                        return Boolean(nomeBase && u.nome.toLowerCase().includes(nomeBase));
                      }));

                  return (
                    <tr key={u.id} className={`hover:bg-slate-50/80 transition ${!u.ativo ? 'opacity-60 bg-slate-50/40' : ''}`}>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${corU.badge}`}
                            title={`${nivelU.icone} ${nivelU.nome}`}
                          >
                            {nivelU.icone || u.graduacaoOuCargo.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex flex-wrap items-center gap-1.5">
                              <span>{u.graduacaoOuCargo} {u.nome}</span>
                              {isEfetivoFixo && (
                                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0">
                                  Efetivo Fixo
                                </span>
                              )}
                              {isEu && (
                                <span className="bg-[#1a2b4c] text-white text-[9px] px-1.5 py-0.2 rounded font-bold">
                                  Você
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Cadastrado em {new Date(u.criadoEm).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {u.email}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                        {u.re || '-'}
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={u.role === 'operador' ? 'operacional' : u.role === 'visualizador' ? 'auxiliar' : u.role}
                          disabled={isEu}
                          onChange={(e) => handleAlterarRole(u, e.target.value as UserRole)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none transition ${corU.badge}`}
                        >
                          {niveis.map((n) => (
                            <option key={n.id} value={n.id}>
                              {n.icone} {n.nome}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          disabled={isEu}
                          onClick={() => handleAlternarStatus(u)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                            u.ativo
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                          }`}
                        >
                          {u.ativo ? '● Ativo' : '○ Inativo'}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAbrirEdicao(u)}
                            className="p-1.5 rounded text-blue-700 hover:text-blue-900 hover:bg-blue-50 transition cursor-pointer"
                            title="Editar dados cadastrais do militar"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setUsuarioRedefinir(u);
                              setNovaSenha('');
                              setSucessoSenha(null);
                            }}
                            className="p-1.5 rounded text-slate-600 hover:text-[#1a2b4c] hover:bg-slate-100 transition cursor-pointer"
                            title="Redefinir Senha deste usuário"
                          >
                            <Key size={15} />
                          </button>

                          <button
                            type="button"
                            disabled={isEu}
                            onClick={() => handleAbrirExclusao(u)}
                            className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isEu ? 'Não é possível excluir a sua própria conta conectada' : 'Excluir usuário do sistema'}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Modal Cadastrar Novo Usuário */}
      {modalNovo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 text-slate-900 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2 text-[#1a2b4c]">
                <UserPlus size={20} className="text-[#c9a84e]" />
                <h3 className="font-bold text-base">Cadastrar Novo Usuário Militar</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalNovo(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {erroNovo && (
              <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0 text-red-500" />
                <span>{erroNovo}</span>
              </div>
            )}

            <form onSubmit={handleCadastrar} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Posto / Graduação
                  </label>
                  <select
                    value={graduacao}
                    onChange={(e) => setGraduacao(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#c9a84e]"
                  >
                    {GRADUACOES_OPCOES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    RE (Registro Estatístico)
                  </label>
                  <input
                    type="text"
                    value={re}
                    onChange={(e) => setRe(e.target.value)}
                    placeholder="Ex: 123456-7"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#c9a84e]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo / Nome de Guerra *
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Carlos Eduardo Silva (Sgt Carlos)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#c9a84e]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail Institucional / Login *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@pmesp.sp.gov.br"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#c9a84e]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nível de Acesso (Perfil) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {niveis.map((n) => {
                    const isSel =
                      role === n.id ||
                      (n.id === 'operacional' && role === 'operador') ||
                      (n.id === 'auxiliar' && role === 'visualizador');
                    const corClasses = getClassesCorNivel(n.cor);
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => setRole(n.id as UserRole)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                          isSel
                            ? `${corClasses.badge} shadow-xs ring-2 ring-offset-1 font-bold`
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="font-bold text-xs flex items-center gap-1">
                          <span>{n.icone}</span>
                          <span>{n.nome}</span>
                        </div>
                        <div className="text-[10px] opacity-80 mt-0.5 line-clamp-2">
                          {n.descricao}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Senha de Acesso (Mín. 6 dígitos) *
                  </label>
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#c9a84e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirmar Senha *
                  </label>
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    required
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#c9a84e]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="text-xs text-[#1a2b4c] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {mostrarSenha ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{mostrarSenha ? 'Ocultar senhas' : 'Exibir senhas digitadas'}</span>
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalNovo(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoNovo}
                  className="px-5 py-2 text-xs font-bold bg-[#1a2b4c] text-white hover:bg-[#2c4373] rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {salvandoNovo ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Cadastrando...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} className="text-[#c9a84e]" />
                      <span>Cadastrar Militar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Redefinir Senha */}
      {usuarioRedefinir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 text-slate-900 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2.5 text-[#1a2b4c] mb-3">
              <Key size={20} className="text-[#c9a84e]" />
              <h3 className="font-bold text-base">Redefinir Senha</h3>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Defina a nova senha para o militar{' '}
              <strong>{usuarioRedefinir.graduacaoOuCargo} {usuarioRedefinir.nome}</strong>:
            </p>

            {sucessoSenha && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle size={15} className="text-emerald-600 shrink-0" />
                <span>{sucessoSenha}</span>
              </div>
            )}

            <form onSubmit={handleSalvarNovaSenha} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nova Senha (Mínimo 6 caracteres)
                </label>
                <input
                  type="password"
                  required
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#c9a84e]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUsuarioRedefinir(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoSenha}
                  className="px-4 py-1.5 text-xs font-bold bg-[#1a2b4c] text-white hover:bg-[#2c4373] rounded-lg transition cursor-pointer disabled:opacity-50"
                >
                  {salvandoSenha ? 'Salvando...' : 'Atualizar Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuário Cadastrado */}
      {usuarioEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 text-slate-900 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2 text-[#1a2b4c]">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center">
                  <Pencil size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base">Editar Cadastro do Militar / Usuário</h3>
                  <div className="text-[11px] text-slate-500">
                    {usuarioEditando.graduacaoOuCargo} {usuarioEditando.nome} {usuarioEditando.re ? `• RE ${usuarioEditando.re}` : ''}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUsuarioEditando(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-sm font-bold p-1 rounded hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {erroEdicao && (
              <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0 text-red-500" />
                <span>{erroEdicao}</span>
              </div>
            )}

            <form onSubmit={handleSalvarEdicao} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Posto / Graduação
                  </label>
                  <select
                    value={editGraduacao}
                    onChange={(e) => setEditGraduacao(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#c9a84e]"
                  >
                    {GRADUACOES_OPCOES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    RE (Registro Estatístico)
                  </label>
                  <input
                    type="text"
                    value={editRe}
                    onChange={(e) => setEditRe(e.target.value)}
                    placeholder="Ex: 123456-7"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#c9a84e]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo / Nome de Guerra *
                </label>
                <input
                  type="text"
                  required
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  placeholder="Ex: Carlos Eduardo Silva (Sgt Carlos)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#c9a84e]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail Institucional / Login *
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="exemplo@pmesp.sp.gov.br"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#c9a84e]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Nível de Acesso (Perfil) *
                  </label>
                  {usuarioEditando.id === usuarioLogado.id && (
                    <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Sua própria conta (perfil fixado como Admin)
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {niveis.map((n) => {
                    const isSel =
                      editRole === n.id ||
                      (n.id === 'operacional' && editRole === 'operador') ||
                      (n.id === 'auxiliar' && editRole === 'visualizador');
                    const isDesabilitado = usuarioEditando.id === usuarioLogado.id && n.id !== 'admin';
                    const corClasses = getClassesCorNivel(n.cor);
                    return (
                      <button
                        key={n.id}
                        type="button"
                        disabled={isDesabilitado}
                        onClick={() => setEditRole(n.id as UserRole)}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          isDesabilitado
                            ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
                            : isSel
                            ? `${corClasses.badge} shadow-xs ring-2 ring-offset-1 font-bold cursor-pointer`
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer'
                        }`}
                      >
                        <div className="font-bold text-xs flex items-center gap-1">
                          <span>{n.icone}</span>
                          <span>{n.nome}</span>
                        </div>
                        <div className="text-[10px] opacity-80 mt-0.5 line-clamp-2">
                          {n.descricao}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status da Conta
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditAtivo(true)}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                      editAtivo
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-400 shadow-xs'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle size={14} className={editAtivo ? 'text-emerald-600' : 'text-slate-400'} />
                    <span>Conta Ativa</span>
                  </button>

                  <button
                    type="button"
                    disabled={usuarioEditando.id === usuarioLogado.id}
                    onClick={() => setEditAtivo(false)}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      usuarioEditando.id === usuarioLogado.id
                        ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400 border-slate-200'
                        : !editAtivo
                        ? 'bg-red-50 text-red-800 border-red-400 shadow-xs cursor-pointer'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 cursor-pointer'
                    }`}
                    title={usuarioEditando.id === usuarioLogado.id ? 'Você não pode desativar seu próprio usuário logado' : ''}
                  >
                    <XCircle size={14} className={!editAtivo ? 'text-red-600' : 'text-slate-400'} />
                    <span>Conta Inativa</span>
                  </button>
                </div>
              </div>

              {/* Bloco de Alteração de Senha Opcional */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Key size={14} className="text-[#c9a84e]" />
                    <span>Alterar Senha de Acesso (Opcional)</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Deixe vazio para manter atual</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nova Senha (Mín. 6 dígitos)
                    </label>
                    <input
                      type={editMostrarSenha ? 'text' : 'password'}
                      value={editNovaSenha}
                      onChange={(e) => setEditNovaSenha(e.target.value)}
                      placeholder="Deixe em branco p/ manter"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#c9a84e]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Confirmar Nova Senha
                    </label>
                    <input
                      type={editMostrarSenha ? 'text' : 'password'}
                      value={editConfirmarSenha}
                      onChange={(e) => setEditConfirmarSenha(e.target.value)}
                      placeholder="Confirme a nova senha"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#c9a84e]"
                    />
                  </div>
                </div>

                {editNovaSenha.length > 0 && (
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setEditMostrarSenha(!editMostrarSenha)}
                      className="text-[11px] text-slate-600 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      {editMostrarSenha ? <EyeOff size={13} /> : <Eye size={13} />}
                      <span>{editMostrarSenha ? 'Ocultar senha digitada' : 'Ver senha digitada'}</span>
                    </button>
                    {editNovaSenha !== editConfirmarSenha && editConfirmarSenha.length > 0 && (
                      <span className="text-[10px] text-red-600 font-semibold">Senhas não coincidem</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200">
                {usuarioEditando.id !== usuarioLogado.id ? (
                  <button
                    type="button"
                    onClick={() => {
                      const u = usuarioEditando;
                      setUsuarioEditando(null);
                      handleAbrirExclusao(u);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer flex items-center gap-1.5 border border-red-200"
                  >
                    <Trash2 size={13} />
                    <span>Excluir Usuário</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setUsuarioEditando(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvandoEdicao}
                    className="px-5 py-2 text-xs font-bold bg-[#1a2b4c] text-white hover:bg-[#2c4373] rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    {salvandoEdicao ? (
                      <>
                        <RefreshCw size={14} className="animate-spin text-[#c9a84e]" />
                        <span>Salvando Alterações...</span>
                      </>
                    ) : (
                      <>
                        <Save size={14} className="text-[#c9a84e]" />
                        <span>Salvar Alterações</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Credenciais do Efetivo da 3ª Cia */}
      {modalCredenciais && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1a2b4c] text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#c9a84e]/20 rounded-lg text-[#c9a84e]">
                  <Key size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base">Credenciais de Acesso — Efetivo 3ª Cia</h3>
                  <p className="text-xs text-slate-300">
                    Relação de logins e senhas para distribuição ao efetivo militar da Manutenção
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopiarCredenciaisTodas}
                  className="px-3.5 py-1.5 bg-[#c9a84e] hover:bg-[#b8953f] text-[#1a2b4c] font-bold text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  {copiadoTudo ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiadoTudo ? 'Copiado!' : 'Copiar Relação'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalCredenciais(false)}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>

            {/* Sub-header com busca e instruções */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={buscaCredenciais}
                  onChange={(e) => setBuscaCredenciais(e.target.value)}
                  placeholder="Pesquisar militar por nome, RE ou e-mail..."
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#c9a84e]"
                />
              </div>

              <div className="text-[11px] text-slate-500 font-medium">
                Total: <span className="font-bold text-slate-800">{usuarios.length}</span> usuários cadastrados
              </div>
            </div>

            {/* Conteúdo da Tabela */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <Shield size={16} className="text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Diretriz de Segurança Militar</p>
                  <p className="text-[11px] text-amber-800/90 leading-relaxed">
                    A senha padrão inicial de todos os usuários é <strong>pmesp123456</strong>. Cada militar pode alterar sua senha a qualquer momento através do seu painel de usuário ou solicitando ao Administrador da 3ª Cia.
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Militar / Função</th>
                      <th className="py-2.5 px-3">RE</th>
                      <th className="py-2.5 px-3">E-mail (Login)</th>
                      <th className="py-2.5 px-3">Nível de Acesso</th>
                      <th className="py-2.5 px-3">Senha Padrão</th>
                      <th className="py-2.5 px-3 text-center">Copiar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {usuarios
                      .filter((u) => {
                        if (!buscaCredenciais.trim()) return true;
                        const b = buscaCredenciais.toLowerCase();
                        return (
                          u.nome.toLowerCase().includes(b) ||
                          u.email.toLowerCase().includes(b) ||
                          (u.re && u.re.toLowerCase().includes(b)) ||
                          u.graduacaoOuCargo.toLowerCase().includes(b)
                        );
                      })
                      .map((u) => {
                        const isCopiado = copiadoId === u.id;
                        return (
                          <tr key={u.id} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              <div className="flex items-center gap-1.5">
                                <span>{u.graduacaoOuCargo} {u.nome}</span>
                                {u.id.startsWith('user-membro-') && (
                                  <span className="bg-amber-100 text-amber-900 text-[9px] px-1.5 py-0.2 rounded font-bold">
                                    Efetivo
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">
                              {u.re || '-'}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700 font-medium select-all">
                              {u.email}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                                  u.role === 'admin'
                                    ? 'bg-[#c9a84e]/20 text-[#1a2b4c] border border-[#c9a84e]'
                                    : u.role === 'uge'
                                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                                    : u.role === '3cfo'
                                    ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                    : u.role === 'operacional' || u.role === 'operador'
                                    ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {u.role === 'admin'
                                  ? '👑 Administrador'
                                  : u.role === 'uge'
                                  ? '📑 UGE'
                                  : u.role === '3cfo'
                                  ? '🎓 3º CFO'
                                  : u.role === 'operacional' || u.role === 'operador'
                                  ? '🛠️ Operacional'
                                  : '👁️ Auxiliares'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-800 font-bold select-all">
                              {u.senhaHash || 'pmesp123456'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleCopiarLinha(u)}
                                className={`p-1.5 rounded transition cursor-pointer ${
                                  isCopiado
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                                }`}
                                title="Copiar login e senha deste militar"
                              >
                                {isCopiado ? <Check size={14} /> : <Copy size={14} />}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Pressione ESC ou clique em Fechar para sair
              </span>
              <button
                type="button"
                onClick={() => setModalCredenciais(false)}
                className="px-5 py-2 text-xs font-bold bg-[#1a2b4c] text-white hover:bg-[#2c4373] rounded-lg transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão de Usuário */}
      {usuarioParaExcluir && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-red-100 bg-red-50/70 flex items-center gap-3">
              <div className="p-2.5 bg-red-100 text-red-700 rounded-xl shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="font-bold text-base text-red-950">Excluir Usuário</h3>
                <p className="text-xs text-red-700">Esta ação revogará o acesso do militar ao sistema</p>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700">
              <p className="leading-relaxed">
                Tem certeza de que deseja excluir o cadastro deste militar? Ele perderá imediatamente as credenciais de autenticação e o acesso a todos os módulos da 3ª Companhia.
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center border-b border-slate-200/70 pb-2">
                  <span className="text-slate-500 text-[11px]">Militar:</span>
                  <span className="font-bold text-slate-900">
                    {usuarioParaExcluir.graduacaoOuCargo} {usuarioParaExcluir.nome}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200/70 pb-2">
                  <span className="text-slate-500 text-[11px]">RE:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {usuarioParaExcluir.re || 'N/D'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200/70 pb-2">
                  <span className="text-slate-500 text-[11px]">E-mail de Login:</span>
                  <span className="font-mono text-slate-700 font-medium">
                    {usuarioParaExcluir.email}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-[11px]">Nível de Acesso:</span>
                  <span className="font-semibold text-slate-800 uppercase text-[10px] bg-slate-200 px-2 py-0.5 rounded">
                    {usuarioParaExcluir.role === '3cfo'
                      ? '3º CFO'
                      : usuarioParaExcluir.role === 'admin'
                      ? 'Admin (Full)'
                      : usuarioParaExcluir.role}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 leading-relaxed">
                <strong>Aviso:</strong> A exclusão é sincronizada com o banco de dados e impede novos acessos. Caso necessário futuramente, o usuário poderá ser recadastrado manualmente ou pela sincronização do efetivo.
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={excluindo}
                onClick={() => setUsuarioParaExcluir(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={excluindo}
                onClick={handleConfirmarExclusao}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {excluindo ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Confirmar Exclusão</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
