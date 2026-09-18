import { NivelAcessoDef, PermissoesAcesso, UserRole } from '../types';

/**
 * Perfis e Níveis de Acesso Oficiais Padrão da 3ª Cia Escola (PMESP)
 */
export const NIVEIS_ACESSO_PADRAO: NivelAcessoDef[] = [
  {
    id: 'admin',
    nome: 'Administrador (Full)',
    descricao: 'Acesso total e irrestrito a todos os módulos, abas, configurações e gestão de usuários/níveis de acesso.',
    icone: '👑',
    cor: 'amber',
    isPadrao: true,
    permissoes: {
      verPrestacao: true,
      editarPrestacao: true,
      verMateriais: true,
      verInforme: true,
      editarInforme: true,
      verCronograma: true,
      verUsuarios: true,
      materiaisFerramentas: true,
      materiaisSaidas: true,
      materiaisEstoque: true,
      materiaisCompras: true,
      cronogramaMissoes: true,
      cronogramaFotosConclusao: true,
      cronogramaEquipes: true,
      cronogramaResultado: true,
      cronogramaRestaurar: true,
    },
  },
  {
    id: 'uge',
    nome: 'UGE',
    descricao: 'Gestão orçamentária: Prestação de Contas, Balancete, Pesquisas de Preço, Relatórios Mensais e Pauta Diária.',
    icone: '📑',
    cor: 'indigo',
    isPadrao: true,
    permissoes: {
      verPrestacao: true,
      editarPrestacao: true,
      verMateriais: false,
      verInforme: true,
      editarInforme: true,
      verCronograma: true,
      verUsuarios: false,
      materiaisFerramentas: false,
      materiaisSaidas: false,
      materiaisEstoque: false,
      materiaisCompras: false,
      cronogramaMissoes: true,
      cronogramaFotosConclusao: true,
      cronogramaEquipes: true,
      cronogramaResultado: true,
      cronogramaRestaurar: true,
    },
  },
  {
    id: '3cfo',
    nome: '3º CFO',
    descricao: 'Controle de Materiais, Planejamento de Compras, Elaboração do Informe Mensal e Cronograma com Equipes e Resultado.',
    icone: '🎓',
    cor: 'purple',
    isPadrao: true,
    permissoes: {
      verPrestacao: false,
      editarPrestacao: false,
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
    },
  },
  {
    id: 'operacional',
    nome: 'Operacional',
    descricao: 'Operação prática: Almoxarifado/Materiais (Estoque, Saídas, Ferramentas, Compras) e Cronograma Geral.',
    icone: '🛠️',
    cor: 'blue',
    isPadrao: true,
    permissoes: {
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
      materiaisCompras: true,
      cronogramaMissoes: true,
      cronogramaFotosConclusao: true,
      cronogramaEquipes: true,
      cronogramaResultado: true,
      cronogramaRestaurar: true,
    },
  },
  {
    id: 'auxiliar',
    nome: 'Auxiliares',
    descricao: 'Materiais (Ferramentas, Saídas e Estoque), Cronograma com fotos e conclusão, e acesso com edição total no Resultado.',
    icone: '👁️',
    cor: 'emerald',
    isPadrao: true,
    permissoes: {
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
    },
  },
];

/**
 * Normaliza os apelidos legados (ex: 'operador' -> 'operacional', 'visualizador' -> 'auxiliar')
 */
export function normalizarRole(role?: string): string {
  if (!role) return 'auxiliar';
  const r = role.toLowerCase().trim();
  if (r === 'operador') return 'operacional';
  if (r === 'visualizador') return 'auxiliar';
  return r;
}

/**
 * Retorna as permissões ativas de um perfil
 */
export function obterPermissoesRole(
  role: UserRole | string | undefined,
  niveisAcesso: NivelAcessoDef[]
): PermissoesAcesso {
  const roleNorm = normalizarRole(role);
  const nivel = niveisAcesso.find((n) => n.id.toLowerCase() === roleNorm);

  if (nivel) {
    return nivel.permissoes;
  }

  // Fallback seguro caso seja admin
  if (roleNorm === 'admin') {
    return NIVEIS_ACESSO_PADRAO[0].permissoes;
  }

  // Fallback padrão seguro (somente visualização básica)
  return {
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
    cronogramaResultado: false,
    cronogramaRestaurar: false,
  };
}

/**
 * Obtém a definição completa de um nível de acesso
 */
export function obterNivelDef(
  role: UserRole | string | undefined,
  niveisAcesso: NivelAcessoDef[]
): NivelAcessoDef {
  const roleNorm = normalizarRole(role);
  const nivel = niveisAcesso.find((n) => n.id.toLowerCase() === roleNorm);
  if (nivel) return nivel;

  // Se não encontrar, retorna uma definição dinâmica compatível
  return {
    id: roleNorm,
    nome: roleNorm.charAt(0).toUpperCase() + roleNorm.slice(1),
    descricao: 'Nível de acesso customizado do sistema',
    icone: '🛡️',
    cor: 'blue',
    permissoes: obterPermissoesRole(roleNorm, niveisAcesso),
  };
}

/**
 * Retorna classes CSS de cores para badges de acordo com a cor configurada
 */
export function getClassesCorNivel(cor: string): {
  bg: string;
  text: string;
  border: string;
  badge: string;
  cardBorder: string;
} {
  switch (cor) {
    case 'amber':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-900',
        border: 'border-amber-300',
        badge: 'bg-[#c9a84e]/20 text-[#1a2b4c] border border-[#c9a84e]',
        cardBorder: 'border-amber-400 ring-amber-300',
      };
    case 'purple':
      return {
        bg: 'bg-purple-50',
        text: 'text-purple-900',
        border: 'border-purple-300',
        badge: 'bg-purple-100 text-purple-900 border border-purple-200',
        cardBorder: 'border-purple-400 ring-purple-300',
      };
    case 'indigo':
      return {
        bg: 'bg-indigo-50',
        text: 'text-indigo-900',
        border: 'border-indigo-300',
        badge: 'bg-indigo-100 text-indigo-900 border border-indigo-200',
        cardBorder: 'border-indigo-400 ring-indigo-300',
      };
    case 'emerald':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-900',
        border: 'border-emerald-300',
        badge: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
        cardBorder: 'border-emerald-400 ring-emerald-300',
      };
    case 'red':
      return {
        bg: 'bg-red-50',
        text: 'text-red-900',
        border: 'border-red-300',
        badge: 'bg-red-100 text-red-900 border border-red-200',
        cardBorder: 'border-red-400 ring-red-300',
      };
    case 'cyan':
      return {
        bg: 'bg-cyan-50',
        text: 'text-cyan-900',
        border: 'border-cyan-300',
        badge: 'bg-cyan-100 text-cyan-900 border border-cyan-200',
        cardBorder: 'border-cyan-400 ring-cyan-300',
      };
    case 'slate':
      return {
        bg: 'bg-slate-50',
        text: 'text-slate-900',
        border: 'border-slate-300',
        badge: 'bg-slate-100 text-slate-900 border border-slate-200',
        cardBorder: 'border-slate-400 ring-slate-300',
      };
    case 'blue':
    default:
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-900',
        border: 'border-blue-300',
        badge: 'bg-blue-100 text-blue-900 border border-blue-200',
        cardBorder: 'border-blue-400 ring-blue-300',
      };
  }
}
