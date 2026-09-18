import React, { useState } from 'react';
import { NivelAcessoDef, PermissoesAcesso, UsuarioSistema, UserRole } from '../../types';
import { getClassesCorNivel, NIVEIS_ACESSO_PADRAO } from '../../utils/permissoes';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Users,
  Lock,
  Sparkles,
  Info,
  Check,
  X,
  FileSpreadsheet,
  Package,
  FileText,
  Calendar,
  UserCheck,
} from 'lucide-react';

interface GerenciadorNiveisAcessoProps {
  niveisAcesso: NivelAcessoDef[];
  onChangeNiveisAcesso: (niveis: NivelAcessoDef[]) => Promise<void> | void;
  usuarios: UsuarioSistema[];
  usuarioLogadoRole?: UserRole;
}

const CORES_DISPONIVEIS: Array<{ id: NivelAcessoDef['cor']; nome: string; dotClass: string }> = [
  { id: 'amber', nome: 'Dourado / Âmbar', dotClass: 'bg-amber-500' },
  { id: 'blue', nome: 'Azul Polícia', dotClass: 'bg-blue-600' },
  { id: 'purple', nome: 'Roxo Oficial', dotClass: 'bg-purple-600' },
  { id: 'emerald', nome: 'Esmeralda / Verde', dotClass: 'bg-emerald-600' },
  { id: 'indigo', nome: 'Índigo Marinho', dotClass: 'bg-indigo-600' },
  { id: 'cyan', nome: 'Ciano Claro', dotClass: 'bg-cyan-500' },
  { id: 'red', nome: 'Vermelho Alerta', dotClass: 'bg-red-500' },
  { id: 'slate', nome: 'Cinza Ardósia', dotClass: 'bg-slate-500' },
];

const EMOJIS_SUGESTOES = ['👑', '📑', '🎓', '🛠️', '👁️', '🛡️', '⭐', '📋', '🔧', '🔍', '🏗️', '👮', '💼', '🎖️', '🚀'];

export const GerenciadorNiveisAcesso: React.FC<GerenciadorNiveisAcessoProps> = ({
  niveisAcesso,
  onChangeNiveisAcesso,
  usuarios,
  usuarioLogadoRole,
}) => {
  const isAdmin = usuarioLogadoRole === 'admin';

  // Modal de Criação / Edição
  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState<boolean>(false);
  const [nivelIdOriginal, setNivelIdOriginal] = useState<string>('');

  // Formulário de Nível de Acesso
  const [formNome, setFormNome] = useState('');
  const [formId, setFormId] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formIcone, setFormIcone] = useState('🛡️');
  const [formCor, setFormCor] = useState<NivelAcessoDef['cor']>('blue');
  const [formPermissoes, setFormPermissoes] = useState<PermissoesAcesso>({
    verPrestacao: false,
    editarPrestacao: false,
    verMateriais: true,
    verInforme: false,
    editarInforme: false,
    verCronograma: true,
    verUsuarios: false,
    materiaisFerramentas: true,
    materiaisSaidas: true,
    materiaisEstoque: true,
    materiaisCompras: false,
    cronogramaMissoes: true,
    cronogramaFotosConclusao: true,
    cronogramaEquipes: false,
    cronogramaResultado: true,
    cronogramaRestaurar: false,
  });

  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // Contagem de usuários por role
  const contagemUsuariosPorRole = (roleId: string) => {
    const roleLower = roleId.toLowerCase();
    return usuarios.filter((u) => {
      const uRole = u.role?.toLowerCase();
      if (uRole === roleLower) return true;
      if (roleLower === 'operacional' && uRole === 'operador') return true;
      if (roleLower === 'auxiliar' && uRole === 'visualizador') return true;
      return false;
    }).length;
  };

  // Abre modal para criar novo perfil
  const handleAbrirNovo = () => {
    setModoEdicao(false);
    setNivelIdOriginal('');
    setFormNome('');
    setFormId('');
    setFormDescricao('');
    setFormIcone('🛡️');
    setFormCor('blue');
    setFormPermissoes({
      verPrestacao: false,
      editarPrestacao: false,
      verMateriais: true,
      verInforme: false,
      editarInforme: false,
      verCronograma: true,
      verUsuarios: false,
      materiaisFerramentas: true,
      materiaisSaidas: true,
      materiaisEstoque: true,
      materiaisCompras: false,
      cronogramaMissoes: true,
      cronogramaFotosConclusao: true,
      cronogramaEquipes: false,
      cronogramaResultado: true,
      cronogramaRestaurar: false,
    });
    setMensagemErro(null);
    setModalAberto(true);
  };

  // Abre modal para editar perfil existente
  const handleAbrirEditar = (nivel: NivelAcessoDef) => {
    setModoEdicao(true);
    setNivelIdOriginal(nivel.id);
    setFormNome(nivel.nome);
    setFormId(nivel.id);
    setFormDescricao(nivel.descricao || '');
    setFormIcone(nivel.icone || '🛡️');
    setFormCor(nivel.cor || 'blue');
    setFormPermissoes({ ...nivel.permissoes });
    setMensagemErro(null);
    setModalAberto(true);
  };

  // Copia modelo de permissões
  const handleCopiarModelo = (modeloId: string) => {
    const modelo = niveisAcesso.find((n) => n.id === modeloId) || NIVEIS_ACESSO_PADRAO.find((n) => n.id === modeloId);
    if (modelo) {
      setFormPermissoes({ ...modelo.permissoes });
      setFormCor(modelo.cor);
      setFormIcone(modelo.icone);
      mostrarFeedback(`Permissões copiadas do modelo "${modelo.nome}"`);
    }
  };

  // Toggle de permissão individual com regras de coerência
  const togglePermissao = (chave: keyof PermissoesAcesso) => {
    setFormPermissoes((prev) => {
      const novo = { ...prev, [chave]: !prev[chave] };

      // Coerência 1: Se desabilitar verMateriais, desabilita subabas
      if (chave === 'verMateriais' && !novo.verMateriais) {
        novo.materiaisFerramentas = false;
        novo.materiaisSaidas = false;
        novo.materiaisEstoque = false;
        novo.materiaisCompras = false;
      }
      // Se habilitar qualquer subaba de materiais, habilita verMateriais
      if (
        (chave === 'materiaisFerramentas' ||
          chave === 'materiaisSaidas' ||
          chave === 'materiaisEstoque' ||
          chave === 'materiaisCompras') &&
        novo[chave]
      ) {
        novo.verMateriais = true;
      }

      // Coerência 2: Se desabilitar verPrestacao, desabilita editarPrestacao
      if (chave === 'verPrestacao' && !novo.verPrestacao) {
        novo.editarPrestacao = false;
      }
      if (chave === 'editarPrestacao' && novo.editarPrestacao) {
        novo.verPrestacao = true;
      }

      // Coerência 3: Se desabilitar verInforme, desabilita editarInforme
      if (chave === 'verInforme' && !novo.verInforme) {
        novo.editarInforme = false;
      }
      if (chave === 'editarInforme' && novo.editarInforme) {
        novo.verInforme = true;
      }

      // Coerência 4: Se desabilitar verCronograma, desabilita sub-recursos
      if (chave === 'verCronograma' && !novo.verCronograma) {
        novo.cronogramaMissoes = false;
        novo.cronogramaFotosConclusao = false;
        novo.cronogramaEquipes = false;
        novo.cronogramaResultado = false;
        novo.cronogramaRestaurar = false;
      }
      if (
        (chave === 'cronogramaMissoes' ||
          chave === 'cronogramaFotosConclusao' ||
          chave === 'cronogramaEquipes' ||
          chave === 'cronogramaResultado' ||
          chave === 'cronogramaRestaurar') &&
        novo[chave]
      ) {
        novo.verCronograma = true;
      }

      return novo;
    });
  };

  const mostrarFeedback = (msg: string) => {
    setMensagemSucesso(msg);
    setTimeout(() => setMensagemSucesso(null), 4000);
  };

  // Salva ou atualiza nível de acesso
  const handleSalvarNivel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setMensagemErro('Apenas administradores podem gerenciar níveis de acesso.');
      return;
    }

    const nomeTratado = formNome.trim();
    if (!nomeTratado) {
      setMensagemErro('O nome do nível de acesso é obrigatório.');
      return;
    }

    // Gera ID / slug
    let idTratado = formId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    if (!idTratado) {
      idTratado = nomeTratado
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '_')
        .slice(0, 20);
    }

    if (!modoEdicao) {
      const existe = niveisAcesso.some((n) => n.id.toLowerCase() === idTratado);
      if (existe) {
        setMensagemErro(`Já existe um nível de acesso com o identificador "${idTratado}". Escolha outro nome/código.`);
        return;
      }
    }

    // Se estiver editando admin, garante que não perca permissão de admin/usuarios
    if (modoEdicao && nivelIdOriginal === 'admin') {
      formPermissoes.verUsuarios = true;
      formPermissoes.verPrestacao = true;
      formPermissoes.verCronograma = true;
    }

    setSalvando(true);
    setMensagemErro(null);

    try {
      let listaAtualizada: NivelAcessoDef[];
      const dataHora = new Date().toISOString();

      if (modoEdicao) {
        listaAtualizada = niveisAcesso.map((n) => {
          if (n.id === nivelIdOriginal) {
            return {
              ...n,
              nome: nomeTratado,
              descricao: formDescricao.trim(),
              icone: formIcone.trim() || '🛡️',
              cor: formCor,
              permissoes: formPermissoes,
              atualizadoEm: dataHora,
            };
          }
          return n;
        });
      } else {
        const novoNivel: NivelAcessoDef = {
          id: idTratado,
          nome: nomeTratado,
          descricao: formDescricao.trim() || `Perfil personalizado: ${nomeTratado}`,
          icone: formIcone.trim() || '🛡️',
          cor: formCor,
          isPadrao: false,
          permissoes: formPermissoes,
          criadoEm: dataHora,
          atualizadoEm: dataHora,
        };
        listaAtualizada = [...niveisAcesso, novoNivel];
      }

      await onChangeNiveisAcesso(listaAtualizada);
      setModalAberto(false);
      mostrarFeedback(
        modoEdicao
          ? `Nível de acesso "${nomeTratado}" atualizado com sucesso!`
          : `Novo nível de acesso "${nomeTratado}" criado com sucesso!`
      );
    } catch (err: any) {
      console.error('Erro ao salvar nível de acesso:', err);
      setMensagemErro('Não foi possível salvar o nível de acesso. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  // Exclusão de nível customizado
  const handleExcluirNivel = async (nivel: NivelAcessoDef) => {
    if (!isAdmin) return;
    if (nivel.id === 'admin') {
      alert('O perfil Administrador raiz não pode ser excluído.');
      return;
    }

    const qtdUsuarios = contagemUsuariosPorRole(nivel.id);
    if (qtdUsuarios > 0) {
      alert(
        `Não é possível excluir o nível "${nivel.nome}" porque existem ${qtdUsuarios} usuário(s) associado(s) a ele. Reatribua os usuários a outro perfil primeiro.`
      );
      return;
    }

    const confirmou = window.confirm(
      `Confirma a exclusão definitiva do nível de acesso "${nivel.nome}" (${nivel.id})?`
    );
    if (!confirmou) return;

    try {
      const novaLista = niveisAcesso.filter((n) => n.id !== nivel.id);
      await onChangeNiveisAcesso(novaLista);
      mostrarFeedback(`Nível de acesso "${nivel.nome}" excluído com sucesso.`);
    } catch (e) {
      alert('Erro ao excluir nível de acesso.');
    }
  };

  // Restaurar padrões oficiais PMESP
  const handleRestaurarPadroes = async () => {
    if (!isAdmin) return;
    const confirmou = window.confirm(
      'Deseja restaurar as definições e permissões oficiais dos 5 perfis padrão da PMESP (Administrador, UGE, 3º CFO, Operacional e Auxiliares)? Seus perfis personalizados adicionais serão mantidos.'
    );
    if (!confirmou) return;

    try {
      const mapaPadroes = new Map(NIVEIS_ACESSO_PADRAO.map((p) => [p.id, p]));
      const listaMesclada: NivelAcessoDef[] = [];

      // Adiciona os padrões oficiais restaurados
      for (const padrao of NIVEIS_ACESSO_PADRAO) {
        listaMesclada.push(padrao);
      }

      // Mantém perfis customizados existentes
      for (const n of niveisAcesso) {
        if (!mapaPadroes.has(n.id)) {
          listaMesclada.push(n);
        }
      }

      await onChangeNiveisAcesso(listaMesclada);
      mostrarFeedback('Perfis padrão da PMESP restaurados para a configuração oficial.');
    } catch (e) {
      alert('Erro ao restaurar perfis padrão.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {mensagemSucesso && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-lg shadow-sm flex items-center justify-between text-xs font-semibold animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{mensagemSucesso}</span>
          </div>
          <button onClick={() => setMensagemSucesso(null)} className="text-emerald-700 hover:text-emerald-900">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header & Ações */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#1a2b4c]/10 text-[#1a2b4c] rounded-lg">
              <Shield size={22} className="text-[#1a2b4c]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Gerenciador de Níveis de Acesso & Permissões (RBAC)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Crie novos perfis funcionais ou edite as permissões granulares dos níveis existentes no sistema da 3ª Cia.
              </p>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={handleRestaurarPadroes}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition border border-slate-200 cursor-pointer"
              title="Restaura os perfis oficiais PMESP"
            >
              <RotateCcw size={14} />
              <span>Restaurar Padrões PMESP</span>
            </button>

            <button
              type="button"
              onClick={handleAbrirNovo}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#1a2b4c] hover:bg-[#2a406c] rounded-lg shadow-sm transition cursor-pointer"
            >
              <Plus size={16} />
              <span>Criar Novo Nível de Acesso</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid de Níveis de Acesso */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {niveisAcesso.map((nivel) => {
          const corStyles = getClassesCorNivel(nivel.cor || 'blue');
          const qtdUsers = contagemUsuariosPorRole(nivel.id);
          const p = nivel.permissoes;

          return (
            <div
              key={nivel.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden"
            >
              {/* Topo do Card */}
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-2xl border border-slate-200 shrink-0">
                      {nivel.icone || '🛡️'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-800">{nivel.nome}</h3>
                        {nivel.isPadrao && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                            Oficial
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${corStyles.badge}`}>
                          Código: {nivel.id}
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                          <Users size={12} /> {qtdUsers} usuário(s)
                        </span>
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleAbrirEditar(nivel)}
                        className="p-1.5 text-slate-500 hover:text-[#1a2b4c] hover:bg-slate-100 rounded-md transition cursor-pointer"
                        title="Editar Nível de Acesso e Permissões"
                      >
                        <Edit2 size={15} />
                      </button>
                      {!nivel.isPadrao && (
                        <button
                          type="button"
                          onClick={() => handleExcluirNivel(nivel)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                          title="Excluir este nível personalizado"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-600 mt-3 leading-relaxed min-h-[36px]">
                  {nivel.descricao || 'Sem descrição cadastrada.'}
                </p>
              </div>

              {/* Matriz de Permissões Habilitadas */}
              <div className="p-4 bg-slate-50/70 text-xs space-y-2.5 flex-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Módulos & Recursos Liberados:
                </div>

                <div className="space-y-1.5 text-[11px]">
                  {/* Prestação */}
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                    <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <FileSpreadsheet size={13} className="text-slate-400" />
                      1. Prestação de Contas
                    </span>
                    {p.verPrestacao ? (
                      <span className="text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded font-bold text-[10px]">
                        {p.editarPrestacao ? 'Ver & Editar' : 'Somente Ver'}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">Bloqueado</span>
                    )}
                  </div>

                  {/* Materiais */}
                  <div className="py-1 border-b border-slate-200/60">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Package size={13} className="text-slate-400" />
                        2. Controle de Materiais
                      </span>
                      {p.verMateriais ? (
                        <span className="text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded font-bold text-[10px]">
                          Liberado
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Bloqueado</span>
                      )}
                    </div>
                    {p.verMateriais && (
                      <div className="flex flex-wrap gap-1 mt-1 pl-4">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded ${
                            p.materiaisEstoque ? 'bg-blue-100 text-blue-800 font-semibold' : 'bg-slate-200 text-slate-400 line-through'
                          }`}
                        >
                          Estoque
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded ${
                            p.materiaisSaidas ? 'bg-blue-100 text-blue-800 font-semibold' : 'bg-slate-200 text-slate-400 line-through'
                          }`}
                        >
                          Saídas
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded ${
                            p.materiaisFerramentas ? 'bg-blue-100 text-blue-800 font-semibold' : 'bg-slate-200 text-slate-400 line-through'
                          }`}
                        >
                          Ferramentas
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded ${
                            p.materiaisCompras ? 'bg-amber-100 text-amber-900 font-semibold' : 'bg-slate-200 text-slate-400 line-through'
                          }`}
                        >
                          Compras
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Informe */}
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                    <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <FileText size={13} className="text-slate-400" />
                      3. Informe Mensal
                    </span>
                    {p.verInforme ? (
                      <span className="text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded font-bold text-[10px]">
                        {p.editarInforme ? 'Ver & Redigir' : 'Somente Ver'}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">Bloqueado</span>
                    )}
                  </div>

                  {/* Cronograma */}
                  <div className="py-1 border-b border-slate-200/60">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Calendar size={13} className="text-slate-400" />
                        4. Cronograma
                      </span>
                      {p.verCronograma ? (
                        <span className="text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded font-bold text-[10px]">
                          Liberado
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Bloqueado</span>
                      )}
                    </div>
                    {p.verCronograma && (
                      <div className="flex flex-wrap gap-1 mt-1 pl-4">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded ${
                            p.cronogramaMissoes ? 'bg-purple-100 text-purple-800 font-semibold' : 'bg-slate-200 text-slate-400 line-through'
                          }`}
                        >
                          Missões
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded ${
                            p.cronogramaFotosConclusao ? 'bg-purple-100 text-purple-800 font-semibold' : 'bg-slate-200 text-slate-400 line-through'
                          }`}
                        >
                          Fotos & Conclusão
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded ${
                            p.cronogramaEquipes ? 'bg-purple-100 text-purple-800 font-semibold' : 'bg-slate-200 text-slate-400 line-through'
                          }`}
                        >
                          Equipes
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded ${
                            p.cronogramaResultado ? 'bg-purple-100 text-purple-800 font-semibold' : 'bg-slate-200 text-slate-400 line-through'
                          }`}
                        >
                          Resultado
                        </span>
                        {p.cronogramaRestaurar && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-semibold">
                            Restaurar Geral
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Usuários */}
                  <div className="flex items-center justify-between py-1">
                    <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <UserCheck size={13} className="text-slate-400" />
                      5. Gestão de Usuários / RBAC
                    </span>
                    {p.verUsuarios ? (
                      <span className="text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded font-bold text-[10px]">
                        Admin Total
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">Bloqueado</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Ação rápida no rodapé */}
              {isAdmin && (
                <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {nivel.atualizadoEm ? `Atualizado em ${new Date(nivel.atualizadoEm).toLocaleDateString('pt-BR')}` : 'Configuração padrão'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAbrirEditar(nivel)}
                    className="text-xs font-bold text-[#1a2b4c] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Configurar Permissões →
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE NÍVEL DE ACESSO */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-8 overflow-hidden animate-scale-in">
            {/* Topo do Modal */}
            <div className="bg-[#1a2b4c] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">
                  {formIcone || '🛡️'}
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {modoEdicao ? `Editar Nível de Acesso: ${formNome}` : 'Criar Novo Nível de Acesso'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Configure a identidade e permissões granulares deste perfil
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="text-slate-300 hover:text-white p-1 rounded-md hover:bg-white/10 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Conteúdo do Formulário */}
            <form onSubmit={handleSalvarNivel} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {mensagemErro && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <XCircle size={16} className="shrink-0" />
                  <span>{mensagemErro}</span>
                </div>
              )}

              {/* Informações Básicas */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Info size={14} className="text-[#1a2b4c]" />
                    Identificação do Nível de Acesso
                  </h4>

                  {!modoEdicao && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500">Copiar modelo:</span>
                      <select
                        onChange={(e) => e.target.value && handleCopiarModelo(e.target.value)}
                        defaultValue=""
                        className="text-xs border border-slate-300 rounded px-2 py-1 bg-slate-50"
                      >
                        <option value="">Selecione um modelo...</option>
                        {niveisAcesso.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-6">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nome do Perfil <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formNome}
                      onChange={(e) => setFormNome(e.target.value)}
                      placeholder="Ex: Chefe de Obras, Comandante de Pelotão..."
                      className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-[#1a2b4c] focus:outline-hidden"
                    />
                  </div>

                  <div className="md:col-span-6">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Código / Identificador (slug) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={modoEdicao && (formId === 'admin' || formId === 'uge')}
                      value={formId}
                      onChange={(e) => setFormId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      placeholder="Ex: cmt_pelotao, almoxarife"
                      className="w-full text-xs font-mono border border-slate-300 rounded-lg px-3 py-2.5 bg-slate-50 focus:ring-2 focus:ring-[#1a2b4c] focus:outline-hidden disabled:opacity-60"
                    />
                    <span className="text-[10px] text-slate-400">Usado internamente pelo sistema de autenticação.</span>
                  </div>

                  <div className="md:col-span-12">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Descrição da Atribuição & Finalidade
                    </label>
                    <input
                      type="text"
                      value={formDescricao}
                      onChange={(e) => setFormDescricao(e.target.value)}
                      placeholder="Descreva o escopo e o que este perfil tem autorização para realizar..."
                      className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#1a2b4c] focus:outline-hidden"
                    />
                  </div>

                  {/* Ícone e Cor */}
                  <div className="md:col-span-6">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ícone Representativo (Emoji)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={4}
                        value={formIcone}
                        onChange={(e) => setFormIcone(e.target.value)}
                        className="w-14 text-center text-xl border border-slate-300 rounded-lg py-1.5"
                      />
                      <div className="flex flex-wrap gap-1">
                        {EMOJIS_SUGESTOES.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setFormIcone(emoji)}
                            className={`w-7 h-7 rounded hover:bg-slate-200 flex items-center justify-center text-sm transition ${
                              formIcone === emoji ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-slate-100'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-6">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cor do Distintivo & Badges
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CORES_DISPONIVEIS.map((cor) => (
                        <button
                          key={cor.id}
                          type="button"
                          onClick={() => setFormCor(cor.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border transition cursor-pointer ${
                            formCor === cor.id
                              ? 'border-slate-800 bg-slate-100 font-bold shadow-xs'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${cor.dotClass}`} />
                          <span>{cor.nome.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-slate-200" />

              {/* SELEÇÃO GRANULAR DE PERMISSÕES */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock size={14} className="text-[#1a2b4c]" />
                    Permissões Granulares de Acesso
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormPermissoes({
                          verPrestacao: true,
                          editarPrestacao: true,
                          verMateriais: true,
                          verInforme: true,
                          editarInforme: true,
                          verCronograma: true,
                          verUsuarios: false,
                          materiaisFerramentas: true,
                          materiaisSaidas: true,
                          materiaisEstoque: true,
                          materiaisCompras: true,
                          cronogramaMissoes: true,
                          cronogramaFotosConclusao: true,
                          cronogramaEquipes: true,
                          cronogramaResultado: true,
                          cronogramaRestaurar: true,
                        })
                      }
                      className="text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer"
                    >
                      Marcar Todas
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormPermissoes({
                          verPrestacao: false,
                          editarPrestacao: false,
                          verMateriais: false,
                          verInforme: false,
                          editarInforme: false,
                          verCronograma: true,
                          verUsuarios: false,
                          materiaisFerramentas: false,
                          materiaisSaidas: false,
                          materiaisEstoque: false,
                          materiaisCompras: false,
                          cronogramaMissoes: true,
                          cronogramaFotosConclusao: true,
                          cronogramaEquipes: false,
                          cronogramaResultado: true,
                          cronogramaRestaurar: false,
                        })
                      }
                      className="text-[11px] font-semibold text-slate-600 hover:underline cursor-pointer"
                    >
                      Somente Cronograma
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Bloco 1: Prestação de Contas */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet size={16} className="text-indigo-600" />
                        <span className="font-bold text-xs text-slate-800">1. Módulo Prestação de Contas</span>
                      </div>
                      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formPermissoes.verPrestacao}
                          onChange={() => togglePermissao('verPrestacao')}
                          className="w-4 h-4 text-[#1a2b4c] rounded border-slate-300 focus:ring-[#1a2b4c]"
                        />
                        <span>Habilitar Aba Prestação de Contas</span>
                      </label>
                    </div>

                    {formPermissoes.verPrestacao && (
                      <div className="pl-6 border-l-2 border-indigo-200 ml-2 space-y-2">
                        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formPermissoes.editarPrestacao}
                            onChange={() => togglePermissao('editarPrestacao')}
                            className="w-4 h-4 text-[#1a2b4c] rounded border-slate-300 focus:ring-[#1a2b4c]"
                          />
                          <span>
                            <strong>Editar Prestação</strong> (Cadastrar / Excluir Notas Fiscais, Pesquisas de Preço, Balancete e Fornecedores)
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Bloco 2: Controle de Materiais */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-blue-600" />
                        <span className="font-bold text-xs text-slate-800">2. Módulo Controle de Materiais</span>
                      </div>
                      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formPermissoes.verMateriais}
                          onChange={() => togglePermissao('verMateriais')}
                          className="w-4 h-4 text-[#1a2b4c] rounded border-slate-300 focus:ring-[#1a2b4c]"
                        />
                        <span>Habilitar Aba Controle de Materiais</span>
                      </label>
                    </div>

                    {formPermissoes.verMateriais && (
                      <div className="pl-6 border-l-2 border-blue-200 ml-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formPermissoes.materiaisEstoque}
                            onChange={() => togglePermissao('materiaisEstoque')}
                            className="w-4 h-4 text-[#1a2b4c] rounded border-slate-300 focus:ring-[#1a2b4c]"
                          />
                          <span>📦 Subaba Materiais em Estoque</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formPermissoes.materiaisSaidas}
                            onChange={() => togglePermissao('materiaisSaidas')}
                            className="w-4 h-4 text-[#1a2b4c] rounded border-slate-300 focus:ring-[#1a2b4c]"
                          />
                          <span>📋 Subaba Controle de Saídas</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formPermissoes.materiaisFerramentas}
                            onChange={() => togglePermissao('materiaisFerramentas')}
                            className="w-4 h-4 text-[#1a2b4c] rounded border-slate-300 focus:ring-[#1a2b4c]"
                          />
                          <span>🔧 Subaba Controle de Ferramentas</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formPermissoes.materiaisCompras}
                            onChange={() => togglePermissao('materiaisCompras')}
                            className="w-4 h-4 text-[#1a2b4c] rounded border-slate-300 focus:ring-[#1a2b4c]"
                          />
                          <span>🛒 Subaba Lista de Compras & Necessidades</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Bloco 3: Informe Mensal */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-purple-600" />
                        <span className="font-bold text-xs text-slate-800">3. Módulo Informe Mensal</span>
                      </div>
                      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formPermissoes.verInforme}
                          onChange={() => togglePermissao('verInforme')}
                          className="w-4 h-4 text-[#1a2b4c] rounded border-slate-300 focus:ring-[#1a2b4c]"
                        />
                        <span>Habilitar Aba Informe Mensal</span>
                      </label>
                    </div>

                    {formPermissoes.verInforme && (
                      <div className="pl-6 border-l-2 border-purple-200 ml-2 space-y-2">
                        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formPermissoes.editarInforme}
                            onChange={() => togglePermissao('editarInforme')}
                            className="w-4 h-4 text-[#1a2b4c] rounded border-slate-300 focus:ring-[#1a2b4c]"
                          />
                          <span>
                            <strong>Redigir & Salvar</strong> (Edição do relatório oficial, arquivamento e impressão)
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Bloco 4: Cronograma */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-emerald-600" />
                        <span className="font-bold text-xs text-slate-800">4. Módulo Cronograma de Manutenção</span>
                      </div>
                      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formPermissoes.verCronograma}
                          onChange={() => togglePermissao('verCronograma')}
                          className="w-4 h-4 text-[#1a2b4c] rounded border-slate-300 focus:ring-[#1a2b4c]"
                        />
                        <span>Habilitar Aba Cronograma</span>
                      </label>
                    </div>

                    {formPermissoes.verCronograma && (
                      <div className="pl-6 border-l-2 border-emerald-200 ml-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formPermissoes.cronogramaMissoes}
                            onChange={() => togglePermissao('cronogramaMissoes')}
                            className="w-4 h-4 text-[#1a2b4c] rounded border-slate-300 focus:ring-[#1a2b4c]"
                          />
                          <span>📅 Subaba Missões Diárias (Pauta)</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formPermissoes.cronogramaFotosConclusao}
                            onChange={() => togglePermissao('cronogramaFotosConclusao')}
                            className="w-4 h-4 text-[#1a2b4c] rounded border-slate-300 focus:ring-[#1a2b4c]"
                          />
                          <span>📸 Registrar Fotos (Antes/Depois) & Conclusão</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formPermissoes.cronogramaEquipes}
                            onChange={() => togglePermissao('cronogramaEquipes')}
                            className="w-4 h-4 text-[#1a2b4c] rounded border-slate-300 focus:ring-[#1a2b4c]"
                          />
                          <span>👥 Subaba Equipes & Efetivo</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formPermissoes.cronogramaResultado}
                            onChange={() => togglePermissao('cronogramaResultado')}
                            className="w-4 h-4 text-[#1a2b4c] rounded border-slate-300 focus:ring-[#1a2b4c]"
                          />
                          <span>📊 Subaba Resultado & Impedimentos</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs text-red-700 cursor-pointer sm:col-span-2">
                          <input
                            type="checkbox"
                            checked={formPermissoes.cronogramaRestaurar}
                            onChange={() => togglePermissao('cronogramaRestaurar')}
                            className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-600"
                          />
                          <span>
                            ⚠️ <strong>Restaurar Cronograma Completo</strong> (Botão que reseta todas as missões para o estado inicial padrão)
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Bloco 5: Usuários e RBAC */}
                  <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck size={16} className="text-amber-800" />
                        <span className="font-bold text-xs text-amber-900">
                          5. Gestão de Usuários & Níveis de Acesso
                        </span>
                      </div>
                      <label className="flex items-center gap-2 text-xs font-bold text-amber-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formPermissoes.verUsuarios}
                          onChange={() => togglePermissao('verUsuarios')}
                          disabled={formId === 'admin'}
                          className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                        />
                        <span>Acesso Total à Gestão de Usuários e RBAC</span>
                      </label>
                    </div>
                    <p className="text-[11px] text-amber-800/80">
                      Permite cadastrar policiais, redefinir senhas, excluir usuários e criar/editar níveis de acesso do sistema.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1a2b4c] hover:bg-[#2a406c] rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {salvando ? (
                    <span>Salvando...</span>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>{modoEdicao ? 'Salvar Alterações' : 'Criar Nível de Acesso'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
