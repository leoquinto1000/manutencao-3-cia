import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  getDocsFromServer,
  onSnapshot,
} from 'firebase/firestore';
import {
  NFInstance,
  PesquisaPrecoItem,
  BalanceteState,
  TextoParteState,
  MaterialUsado,
  InformeMensal,
  ProjetoSalvo,
  MissaoDiaria,
  EquipeManutencao,
  MembroEquipe,
  EmpresaCadastrada,
  UsuarioSistema,
  UserRole,
  NivelAcessoDef,
} from './types';
import { NIVEIS_ACESSO_PADRAO } from './utils/permissoes';
import { removerItemIndexedDB } from './utils/indexedDbStorage';

// Configuração oficial do Firebase fornecida para o projeto manutencao-3-cia
export const firebaseConfig = {
  apiKey: "AIzaSyCJKzbSdAJmdxjaLOEMX6nqR48vGfyMYQ8",
  authDomain: "manutencao-3-cia.firebaseapp.com",
  projectId: "manutencao-3-cia",
  storageBucket: "manutencao-3-cia.firebasestorage.app",
  messagingSenderId: "904703143241",
  appId: "1:904703143241:web:7c2c3944471ede726b7e98",
  measurementId: "G-PYZ3EJ0CYK"
};

// Inicialização segura do Firebase (evita re-inicializações)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Garante persistência permanente da sessão no navegador (nunca expira o login)
try {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Aviso ao definir persistência local no Firebase Auth:', err);
  });
} catch (e) {}

// Coleção e Documentos no Firestore para garantir que fotos nunca estourem o limite de 1MB por documento
export const FIRESTORE_COLLECTION = 'sistema_manutencao';
export const FIRESTORE_DOC_ID = 'dados_gerais';
export const FIRESTORE_DOC_MISSOES = 'dados_missoes';
export const FIRESTORE_DOC_INFORME = 'dados_informe';
export const FIRESTORE_DOC_HISTORICO = 'dados_historico';
export const FIRESTORE_DOC_ARQUIVOS_SALVOS = 'dados_arquivos_salvos';
export const FIRESTORE_DOC_USUARIOS = 'dados_usuarios';
export const FIRESTORE_DOC_NIVEIS_ACESSO = 'dados_niveis_acesso';

export interface DadosSistemaFirestore {
  nfs: NFInstance[];
  pesquisas: PesquisaPrecoItem[];
  balancete: BalanceteState;
  textoParte: TextoParteState;
  materiaisUsados: MaterialUsado[];
  ferramentas?: import('./types').Ferramenta[];
  itensCompras?: import('./types').ItemListaCompras[];
  informeAtual: InformeMensal;
  informesArquivados: InformeMensal[];
  arquivosSalvos: ProjetoSalvo[];
  missoes: MissaoDiaria[];
  equipes: EquipeManutencao[];
  membros: MembroEquipe[];
  bancoFornecedores: EmpresaCadastrada[];
  ultimaAtualizacao?: string;
  autorUltimaEdicao?: string;
}

/**
 * Remove recursivamente propriedades com valor `undefined` que o Firestore rejeita
 */
export function limparParaFirestore<T>(dado: T): T {
  try {
    return JSON.parse(JSON.stringify(dado));
  } catch (err) {
    return dado;
  }
}

/**
 * Auxiliar para ler documento diretamente do servidor remoto do Firestore,
 * com fallback para o cache local caso o dispositivo esteja offline ou com instabilidade.
 */
async function lerDocServidorComFallback(refDoc: any) {
  try {
    return await getDocFromServer(refDoc);
  } catch (err) {
    try {
      return await getDoc(refDoc);
    } catch (e2) {
      return null;
    }
  }
}

/**
 * Auxiliar para ler coleção diretamente do servidor remoto do Firestore,
 * com fallback para o cache local.
 */
async function lerColecaoServidorComFallback(colRef: any) {
  try {
    return await getDocsFromServer(colRef);
  } catch (err) {
    try {
      return await getDocs(colRef);
    } catch (e2) {
      return null;
    }
  }
}

/**
 * Carrega todos os dados do sistema salvos no Firestore,
 * combinando os documentos particionados para suportar fotos sem limite de 1MB.
 */
export async function carregarDadosFirestore(): Promise<DadosSistemaFirestore | null> {
  try {
    const refGeral = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
    const refMissoes = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_MISSOES);
    const refInforme = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_INFORME);
    const refHistorico = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_HISTORICO);
    const refArquivosSalvos = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ARQUIVOS_SALVOS);
    const colInformesIndividuais = collection(db, FIRESTORE_COLLECTION, 'dados_historico', 'informes');

    // Leituras diretas no servidor com fallback suave
    const [
      snapGeral,
      snapMissoes,
      snapInforme,
      snapHistorico,
      snapArquivosSalvos,
      snapColInformes,
    ] = await Promise.all([
      lerDocServidorComFallback(refGeral),
      lerDocServidorComFallback(refMissoes),
      lerDocServidorComFallback(refInforme),
      lerDocServidorComFallback(refHistorico),
      lerDocServidorComFallback(refArquivosSalvos),
      lerColecaoServidorComFallback(colInformesIndividuais),
    ]);

    const temAlgumDado =
      Boolean(snapGeral?.exists()) ||
      Boolean(snapMissoes?.exists()) ||
      Boolean(snapInforme?.exists()) ||
      Boolean(snapHistorico?.exists()) ||
      Boolean(snapArquivosSalvos?.exists()) ||
      Boolean(snapColInformes && !snapColInformes.empty);

    if (!temAlgumDado) {
      return null;
    }

    const dadosGerais = snapGeral?.exists() ? (snapGeral.data() as Record<string, any>) : {};
    const dadosMissoes = snapMissoes?.exists() ? (snapMissoes.data() as Record<string, any>) : null;
    const dadosInforme = snapInforme?.exists() ? (snapInforme.data() as Record<string, any>) : null;
    const dadosHistorico = snapHistorico?.exists() ? (snapHistorico.data() as Record<string, any>) : null;
    const dadosArquivosSalvos = snapArquivosSalvos?.exists() ? (snapArquivosSalvos.data() as Record<string, any>) : null;

    const missoesFinais = (dadosMissoes?.missoes as MissaoDiaria[]) || dadosGerais.missoes;
    const informeFinal = (dadosInforme?.informeAtual as InformeMensal) || dadosGerais.informeAtual;

    // Recupera informes arquivados tanto da subcoleção individual quanto do documento consolidado
    const mapInformes = new Map<string, InformeMensal>();
    if (snapColInformes && !snapColInformes.empty) {
      snapColInformes.forEach((docSnap) => {
        if (docSnap.exists()) {
          const inf = docSnap.data() as InformeMensal;
          if (inf && inf.id) {
            mapInformes.set(inf.id, inf);
          }
        }
      });
    }

    const informesHistoricoDoc =
      (dadosHistorico?.informesArquivados as InformeMensal[]) || dadosGerais.informesArquivados;
    if (Array.isArray(informesHistoricoDoc)) {
      for (const inf of informesHistoricoDoc) {
        if (inf && inf.id && !mapInformes.has(inf.id)) {
          mapInformes.set(inf.id, inf);
        }
      }
    }
    const informesArquivadosFinais = Array.from(mapInformes.values());

    // Recupera projetos/arquivos salvos
    const arquivosSalvosFinais =
      (dadosArquivosSalvos?.arquivosSalvos as ProjetoSalvo[]) ||
      (dadosHistorico?.arquivosSalvos as ProjetoSalvo[]) ||
      dadosGerais.arquivosSalvos;

    return {
      nfs: dadosGerais.nfs || [],
      pesquisas: dadosGerais.pesquisas || [],
      balancete: dadosGerais.balancete as BalanceteState,
      textoParte: dadosGerais.textoParte as TextoParteState,
      materiaisUsados: dadosGerais.materiaisUsados || [],
      ferramentas: dadosGerais.ferramentas || undefined,
      itensCompras: dadosGerais.itensCompras || undefined,
      informeAtual: informeFinal as InformeMensal,
      informesArquivados: informesArquivadosFinais || [],
      arquivosSalvos: arquivosSalvosFinais || [],
      missoes: missoesFinais || [],
      equipes: dadosGerais.equipes || [],
      membros: dadosGerais.membros || [],
      bancoFornecedores: dadosGerais.bancoFornecedores || [],
      ultimaAtualizacao:
        dadosGerais.ultimaAtualizacao ||
        dadosMissoes?.ultimaAtualizacao ||
        dadosInforme?.ultimaAtualizacao ||
        new Date().toISOString(),
    };
  } catch (error) {
    console.error('Erro ao ler do Firestore:', error);
    throw error;
  }
}

/**
 * Salva todos os dados atuais particionados no Firestore,
 * garantindo que documentos de fotos não ultrapassem o limite de 1MB por documento.
 */
export async function salvarDadosFirestore(dados: Partial<DadosSistemaFirestore>): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    const promises: Promise<any>[] = [];

    // 1. Dados Estruturais Gerais (NFs, pesquisas, balancete, textoParte, equipes, membros, etc.)
    const {
      missoes,
      informeAtual,
      informesArquivados,
      arquivosSalvos,
      ...dadosGeraisSemFotosPesadas
    } = dados;

    const refGeral = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
    promises.push(
      setDoc(
        refGeral,
        limparParaFirestore({
          ...dadosGeraisSemFotosPesadas,
          ultimaAtualizacao: timestamp,
        }),
        { merge: true }
      )
    );

    // 2. Missões e suas fotos (salvas em documento dedicado para não esgotar 1MB)
    if (missoes !== undefined) {
      const refMissoes = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_MISSOES);
      promises.push(
        setDoc(
          refMissoes,
          limparParaFirestore({
            missoes,
            ultimaAtualizacao: timestamp,
          }),
          { merge: true }
        )
      );
    }

    // 3. Informe Mensal e suas fotos (salvo em documento dedicado)
    if (informeAtual !== undefined) {
      const refInforme = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_INFORME);
      promises.push(
        setDoc(
          refInforme,
          limparParaFirestore({
            informeAtual,
            ultimaAtualizacao: timestamp,
          }),
          { merge: true }
        )
      );
    }

    // 4. Arquivos Salvos da Prestação de Contas (salvo em documento dedicado sem concorrência de fotos)
    if (arquivosSalvos !== undefined) {
      const refArquivos = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ARQUIVOS_SALVOS);
      promises.push(
        setDoc(
          refArquivos,
          limparParaFirestore({
            arquivosSalvos,
            ultimaAtualizacao: timestamp,
          }),
          { merge: true }
        )
      );
    }

    // 5. Informes Arquivados (salva cada informe em documento próprio na subcoleção para nunca estourar 1MB)
    if (informesArquivados !== undefined) {
      for (const inf of informesArquivados) {
        if (inf && inf.id) {
          const refInfItem = doc(db, FIRESTORE_COLLECTION, 'dados_historico', 'informes', inf.id);
          promises.push(
            setDoc(refInfItem, limparParaFirestore(inf), { merge: true }).catch((err) => {
              console.warn(`Aviso ao salvar informe individual ${inf.id} no Firestore:`, err);
            })
          );
        }
      }

      // Salva também índice consolidado no documento geral de histórico
      const refHistorico = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_HISTORICO);
      promises.push(
        setDoc(
          refHistorico,
          limparParaFirestore({
            informesArquivados,
            ...(arquivosSalvos !== undefined ? { arquivosSalvos } : {}),
            ultimaAtualizacao: timestamp,
          }),
          { merge: true }
        ).catch((err) => {
          // Se estourar 1MB no consolidado, as subcoleções já garantiram a gravação
          console.warn('Documento consolidado de histórico atingiu cota; subcoleções ativas:', err);
        })
      );
    }

    await Promise.all(promises);
  } catch (error) {
    console.error('Erro ao salvar no Firestore:', error);
    throw error;
  }
}

/**
 * Remove um informe arquivado do Firestore
 */
export async function excluirInformeArquivadoFirestore(id: string): Promise<void> {
  try {
    const refInfItem = doc(db, FIRESTORE_COLLECTION, 'dados_historico', 'informes', id);
    await deleteDoc(refInfItem);
  } catch (err) {
    console.warn(`Aviso ao excluir informe arquivado ${id} do Firestore:`, err);
  }
}

/**
 * Escuta atualizações em tempo real vindas de outros aparelhos ou abas
 */
export function escutarDadosFirestore(
  onAtualizacao: (dados: DadosSistemaFirestore) => void,
  onErro: (erro: any) => void
) {
  const ref = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        const dados = snap.data() as DadosSistemaFirestore;
        onAtualizacao(dados);
      }
    },
    (erro) => {
      console.warn('Alerta na conexão do Firestore:', erro);
      onErro(erro);
    }
  );
}

// ==========================================
// GESTÃO DE USUÁRIOS E AUTENTICAÇÃO
// ==========================================

export const USUARIOS_INICIAIS: UsuarioSistema[] = [
  // Administradores do Sistema e Comando
  {
    id: 'user-admin-1',
    email: 'leoquinto1000@gmail.com',
    nome: 'Leonardo Quinto',
    graduacaoOuCargo: 'Cap PM',
    re: '123456-7',
    role: 'admin',
    ativo: true,
    criadoEm: '2026-01-01T00:00:00.000Z',
    senhaHash: 'pmesp123456',
  },
  {
    id: 'user-admin-2',
    email: 'admin@pmesp.sp.gov.br',
    nome: 'Administrador 3ª Cia',
    graduacaoOuCargo: 'Comando',
    re: '100001-0',
    role: 'admin',
    ativo: true,
    criadoEm: '2026-01-01T00:00:00.000Z',
    senhaHash: 'pmesp123456',
  },
  // Oficial Coordenador / Supervisor do Efetivo Fixo da Manutenção
  {
    id: 'user-membro-froes',
    email: 'froes@pmesp.sp.gov.br',
    nome: 'João Froes',
    graduacaoOuCargo: '1º Ten PM',
    re: '142.890-1',
    role: 'admin',
    ativo: true,
    criadoEm: '2026-01-01T00:00:00.000Z',
    senhaHash: 'pmesp123456',
  },
  // Efetivo Fixo da Manutenção - Equipe Alfa (Elétrica & Gestão)
  {
    id: 'user-membro-perozin',
    email: 'perozin@pmesp.sp.gov.br',
    nome: 'Gustavo Perozin',
    graduacaoOuCargo: 'Cadete PM',
    re: '230060-5',
    role: 'operacional',
    ativo: true,
    criadoEm: '2026-01-01T00:00:00.000Z',
    senhaHash: 'pmesp123456',
  },
  {
    id: 'user-membro-fabio',
    email: 'fabio@pmesp.sp.gov.br',
    nome: 'João Batista de Moura Fábio',
    graduacaoOuCargo: 'Cadete PM',
    re: '252593-3',
    role: 'operacional',
    ativo: true,
    criadoEm: '2026-01-01T00:00:00.000Z',
    senhaHash: 'pmesp123456',
  },
  {
    id: 'user-membro-ulisses',
    email: 'ulisses@pmesp.sp.gov.br',
    nome: 'Ulisses Silveira da Silva Gonçalves',
    graduacaoOuCargo: 'Cadete PM',
    re: '180823-A',
    role: 'operacional',
    ativo: true,
    criadoEm: '2026-01-01T00:00:00.000Z',
    senhaHash: 'pmesp123456',
  },
  // Efetivo Fixo da Manutenção - Equipe Bravo (Compras, Orçamentos & UGE)
  {
    id: 'user-membro-diomazio',
    email: 'diomazio@pmesp.sp.gov.br',
    nome: 'Gabriel Fernando Diomazio Figueira',
    graduacaoOuCargo: 'Cadete PM',
    re: '144966-4',
    role: 'uge',
    ativo: true,
    criadoEm: '2026-01-01T00:00:00.000Z',
    senhaHash: 'pmesp123456',
  },
  {
    id: 'user-membro-augusto',
    email: 'augusto@pmesp.sp.gov.br',
    nome: 'Leonardo Augusto Quinto',
    graduacaoOuCargo: 'Cadete PM',
    re: '170429-0',
    role: 'uge',
    ativo: true,
    criadoEm: '2026-01-01T00:00:00.000Z',
    senhaHash: 'pmesp123456',
  },
  {
    id: 'user-membro-peciukonis',
    email: 'peciukonis@pmesp.sp.gov.br',
    nome: 'Thiago Peciukonis',
    graduacaoOuCargo: 'Cadete PM',
    re: '191800-1',
    role: 'uge',
    ativo: true,
    criadoEm: '2026-01-01T00:00:00.000Z',
    senhaHash: 'pmesp123456',
  },
  // Efetivo Fixo da Manutenção - Equipe Charlie (Pintura & Auxiliar Geral)
  {
    id: 'user-membro-salvioni',
    email: 'salvioni@pmesp.sp.gov.br',
    nome: 'Lucas Batista Salvioni',
    graduacaoOuCargo: 'Cadete PM',
    re: '252664-6',
    role: 'operacional',
    ativo: true,
    criadoEm: '2026-01-01T00:00:00.000Z',
    senhaHash: 'pmesp123456',
  },
  {
    id: 'user-membro-freire',
    email: 'freire@pmesp.sp.gov.br',
    nome: 'Israel Freire Moreira',
    graduacaoOuCargo: 'Cadete PM',
    re: '260062-5',
    role: 'auxiliar',
    ativo: true,
    criadoEm: '2026-01-01T00:00:00.000Z',
    senhaHash: 'pmesp123456',
  },
  {
    id: 'user-membro-ravely',
    email: 'ravely@pmesp.sp.gov.br',
    nome: 'César Ravely Moura da Silva',
    graduacaoOuCargo: 'Cadete PM',
    re: '230342-6',
    role: 'auxiliar',
    ativo: true,
    criadoEm: '2026-01-01T00:00:00.000Z',
    senhaHash: 'pmesp123456',
  },
  {
    id: 'user-membro-isack',
    email: 'isack@pmesp.sp.gov.br',
    nome: 'Isack Soares Moreira',
    graduacaoOuCargo: 'Cadete PM',
    re: '250021-3',
    role: 'auxiliar',
    ativo: true,
    criadoEm: '2026-01-01T00:00:00.000Z',
    senhaHash: 'pmesp123456',
  },
  // Contas Genéricas de Função
  {
    id: 'user-uge-1',
    email: 'uge@pmesp.sp.gov.br',
    nome: 'Gestão UGE',
    graduacaoOuCargo: '1º Ten PM',
    re: '102030-4',
    role: 'uge',
    ativo: true,
    criadoEm: '2026-01-01T00:00:00.000Z',
    senhaHash: 'uge123456',
  },
  {
    id: 'user-operacional-1',
    email: 'manutencao@pmesp.sp.gov.br',
    nome: 'Carlos Eduardo Silva',
    graduacaoOuCargo: '1º Sgt PM',
    re: '987654-3',
    role: 'operacional',
    ativo: true,
    criadoEm: '2026-01-01T00:00:00.000Z',
    senhaHash: 'manutencao123',
  },
  {
    id: 'user-auxiliar-1',
    email: 'auxiliar@pmesp.sp.gov.br',
    nome: 'Marcos Pereira',
    graduacaoOuCargo: 'Cb PM',
    re: '112233-4',
    role: 'auxiliar',
    ativo: true,
    criadoEm: '2026-01-01T00:00:00.000Z',
    senhaHash: 'auxiliar123',
  },
];

/**
 * Função utilitária para garantir a integridade absoluta da lista de usuários:
 * - Remove duplicatas por e-mail ou por ID
 * - Garante que todo usuário tenha um ID único
 * - Normaliza e-mails para minúsculas sem espaços
 */
export function deduplicarUsuarios(lista: UsuarioSistema[]): UsuarioSistema[] {
  if (!Array.isArray(lista)) return [];
  const idsVistos = new Set<string>();
  const emailsVistos = new Set<string>();
  const resultado: UsuarioSistema[] = [];

  for (const rawItem of lista) {
    if (!rawItem || typeof rawItem !== 'object') continue;

    // Desempacota caso tenha vindo embrulhado como { novoUsuario } de versões anteriores
    const u: any = (rawItem as any).novoUsuario && typeof (rawItem as any).novoUsuario === 'object'
      ? (rawItem as any).novoUsuario
      : rawItem;

    const rawEmail = (u.email || '').toString().trim().toLowerCase();
    if (!rawEmail) continue;

    // Se já vimos este e-mail, ignoramos para evitar duplicados no cadastro/listagem
    if (emailsVistos.has(rawEmail)) {
      continue;
    }

    // Garante que cada usuário tenha um ID exclusivo e estável
    let uid = (u.id || '').toString().trim();
    if (!uid || idsVistos.has(uid)) {
      uid = uid && !idsVistos.has(uid) ? uid : `user-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    }

    idsVistos.add(uid);
    emailsVistos.add(rawEmail);

    let role = u.role;
    if (role === 'operador') role = 'operacional';
    if (role === 'visualizador') role = 'auxiliar';

    resultado.push({
      ...u,
      id: uid,
      email: rawEmail,
      role: role || 'operacional',
      nome: (u.nome || rawEmail.split('@')[0]).toString().trim(),
      graduacaoOuCargo: (u.graduacaoOuCargo || '1º Sgt PM').toString().trim(),
      re: u.re ? String(u.re).trim() : undefined,
      ativo: u.ativo !== false,
      senhaHash: u.senhaHash || 'pmesp123456',
    });
  }

  return resultado;
}

/**
 * Carrega a lista de usuários salvos no Firestore
 * O banco de dados Firestore é a autoridade máxima:
 * NÃO reinjeta usuários padrão caso tenham sido editados ou excluídos pelo Administrador.
 */
export async function carregarUsuariosFirestore(): Promise<UsuarioSistema[]> {
  try {
    const refDoc = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_USUARIOS);
    const snap = await lerDocServidorComFallback(refDoc);
    if (snap && snap.exists()) {
      const data = snap.data() as { usuarios?: UsuarioSistema[] };

      if (Array.isArray(data?.usuarios)) {
        const listaLimpa = deduplicarUsuarios(data.usuarios);

        // Se foram encontradas e removidas duplicidades antigas no banco, salva a versão limpa imediatamente
        if (listaLimpa.length !== data.usuarios.length) {
          salvarUsuariosFirestore(listaLimpa).catch(console.error);
        } else {
          try {
            localStorage.setItem('pmesp_usuarios', JSON.stringify(listaLimpa));
          } catch (e) {}
        }
        return listaLimpa;
      }
    }
    // Se o documento ainda não existia no Firestore, verifica se há cache local prévio
    try {
      const cached = localStorage.getItem('pmesp_usuarios');
      if (cached) {
        const parsed = JSON.parse(cached) as UsuarioSistema[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const limpaCache = deduplicarUsuarios(parsed);
          await salvarUsuariosFirestore(limpaCache);
          return limpaCache;
        }
      }
    } catch (e) {}

    // Apenas na primeira inicialização absoluta do sistema
    const usuariosPadrao = deduplicarUsuarios(USUARIOS_INICIAIS);
    await salvarUsuariosFirestore(usuariosPadrao);
    return usuariosPadrao;
  } catch (err) {
    console.warn('Aviso ao carregar usuários do Firestore, utilizando base local:', err);
    try {
      const cached = localStorage.getItem('pmesp_usuarios');
      if (cached) {
        const parsed = JSON.parse(cached) as UsuarioSistema[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return deduplicarUsuarios(parsed);
        }
      }
    } catch (e) {}
    return deduplicarUsuarios(USUARIOS_INICIAIS);
  }
}

/**
 * Salva a lista de usuários no Firestore e no cache local com deduplicação garantida
 */
export async function salvarUsuariosFirestore(usuarios: UsuarioSistema[]): Promise<void> {
  const listaLimpa = deduplicarUsuarios(usuarios);
  try {
    const refDoc = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_USUARIOS);
    await setDoc(
      refDoc,
      limparParaFirestore({
        usuarios: listaLimpa,
        ultimaAtualizacao: new Date().toISOString(),
      }),
      { merge: true }
    );
    try {
      localStorage.setItem('pmesp_usuarios', JSON.stringify(listaLimpa));
    } catch (e) {}
  } catch (err) {
    console.warn('Aviso ao salvar usuários no Firestore:', err);
    try {
      localStorage.setItem('pmesp_usuarios', JSON.stringify(listaLimpa));
    } catch (e) {}
  }
}

/**
 * Exclui pontualmente um usuário do sistema (Firestore e LocalStorage)
 * Remove estritamente o usuário correspondente ao ID informado, sem remover duplicados incorretamente
 * e garante que ele não volte após recarregar.
 */
export async function excluirUsuarioFirestore(id: string): Promise<UsuarioSistema[]> {
  const usuariosAtuais = await carregarUsuariosFirestore();
  const usuarioAlvo = usuariosAtuais.find((u) => u.id === id);
  const emailAlvo = usuarioAlvo ? usuarioAlvo.email.trim().toLowerCase() : '';

  // Filtra removendo estritamente o usuário selecionado
  const novaLista = usuariosAtuais.filter((u) => {
    if (u.id === id) return false;
    if (emailAlvo && u.email.trim().toLowerCase() === emailAlvo) return false;
    return true;
  });

  const listaAtualizada = deduplicarUsuarios(novaLista);

  try {
    const refDoc = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_USUARIOS);
    await setDoc(
      refDoc,
      limparParaFirestore({
        usuarios: listaAtualizada,
        ultimaAtualizacao: new Date().toISOString(),
      }),
      { merge: true }
    );
    try {
      localStorage.setItem('pmesp_usuarios', JSON.stringify(listaAtualizada));
    } catch (e) {}
  } catch (err) {
    console.warn('Aviso ao excluir usuário no Firestore:', err);
    try {
      localStorage.setItem('pmesp_usuarios', JSON.stringify(listaAtualizada));
    } catch (e) {}
  }

  return listaAtualizada;
}

/**
 * Realiza autenticação com e-mail e senha.
 * Tenta primeiramente via Firebase Auth (se o provedor e-mail/senha estiver ativo no console).
 * Possui fallback direto com os perfis cadastrados no Firestore/banco de dados para garantir
 * que nenhum militar fique bloqueado caso o provedor ainda não tenha sido ativado no Console.
 */
export async function loginSistema(
  email: string,
  senha: string
): Promise<{ user: UsuarioSistema; modo: 'firebase' | 'banco' }> {
  const emailNorm = email.trim().toLowerCase();
  const senhaTrim = senha.trim();

  // 1. Carrega a lista atualizada de usuários do sistema
  const usuarios = await carregarUsuariosFirestore();
  const usuarioCadastrado = usuarios.find((u) => u.email.toLowerCase() === emailNorm);

  if (usuarioCadastrado && !usuarioCadastrado.ativo) {
    throw new Error('Este usuário está inativo. Entre em contato com o Administrador da 3ª Cia.');
  }

  // 2. Tenta autenticação direta via Firebase Auth
  try {
    const userCredential = await signInWithEmailAndPassword(auth, emailNorm, senhaTrim);
    if (userCredential.user) {
      if (usuarioCadastrado) {
        // Atualiza último acesso
        const atualizados = usuarios.map((u) =>
          u.id === usuarioCadastrado.id ? { ...u, ultimoAcesso: new Date().toISOString() } : u
        );
        salvarUsuariosFirestore(atualizados).catch(() => {});
        return { user: { ...usuarioCadastrado, ultimoAcesso: new Date().toISOString() }, modo: 'firebase' };
      } else {
        // Usuário autenticado no Firebase Auth mas ainda não na lista local
        const novoUser: UsuarioSistema = {
          id: userCredential.user.uid,
          email: emailNorm,
          nome: userCredential.user.displayName || emailNorm.split('@')[0],
          graduacaoOuCargo: emailNorm.includes('admin') || emailNorm === 'leoquinto1000@gmail.com' ? 'Cap PM' : 'Policial Militar',
          role: emailNorm.includes('admin') || emailNorm === 'leoquinto1000@gmail.com' ? 'admin' : 'operacional',
          ativo: true,
          criadoEm: new Date().toISOString(),
          ultimoAcesso: new Date().toISOString(),
        };
        const atualizados = deduplicarUsuarios([...usuarios, novoUser]);
        await salvarUsuariosFirestore(atualizados);
        return { user: novoUser, modo: 'firebase' };
      }
    }
  } catch (fbAuthErr: any) {
    // Se o Firebase Auth falhou por senha incorreta ou usuário não encontrado nele,
    // verificamos se corresponde ao cadastro de usuários do banco Firestore
    console.info('Tentando validação contra banco de dados do sistema...', fbAuthErr?.code);
  }

  // 3. Validação pelo banco de dados Firestore
  if (usuarioCadastrado) {
    if (usuarioCadastrado.senhaHash === senhaTrim) {
      const atualizados = usuarios.map((u) =>
        u.id === usuarioCadastrado.id ? { ...u, ultimoAcesso: new Date().toISOString() } : u
      );
      salvarUsuariosFirestore(atualizados).catch(() => {});
      return { user: { ...usuarioCadastrado, ultimoAcesso: new Date().toISOString() }, modo: 'banco' };
    } else {
      throw new Error('Senha incorreta. Verifique a senha digitada ou solicite a redefinição.');
    }
  }

  throw new Error('Usuário não encontrado com este e-mail. Verifique os dados ou solicite cadastro ao Administrador.');
}

/**
 * Cria ou cadastra um novo usuário no sistema
 * Retorna o usuário criado e a lista completa atualizada e deduplicada
 */
export async function cadastrarNovoUsuario(
  dados: {
    nome: string;
    email: string;
    graduacaoOuCargo: string;
    re?: string;
    role: UserRole;
    senha: string;
  }
): Promise<{ novoUsuario: UsuarioSistema; listaAtualizada: UsuarioSistema[] }> {
  const emailNorm = dados.email.trim().toLowerCase();
  const reNorm = dados.re ? dados.re.trim().toLowerCase() : '';
  const usuarios = await carregarUsuariosFirestore();

  if (usuarios.some((u) => u.email.trim().toLowerCase() === emailNorm)) {
    throw new Error('Já existe um usuário cadastrado com este e-mail institucional.');
  }

  if (reNorm && usuarios.some((u) => u.re && u.re.trim().toLowerCase() === reNorm)) {
    throw new Error(`Já existe um militar cadastrado com este RE (${dados.re?.trim()}).`);
  }

  // Gera um identificador único exclusivo e legível
  const novoUid = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const novoUsuario: UsuarioSistema = {
    id: novoUid,
    email: emailNorm,
    nome: dados.nome.trim(),
    graduacaoOuCargo: dados.graduacaoOuCargo.trim(),
    re: dados.re ? dados.re.trim() : undefined,
    role: dados.role,
    ativo: true,
    criadoEm: new Date().toISOString(),
    senhaHash: dados.senha.trim(),
  };

  const listaAtualizada = deduplicarUsuarios([...usuarios, novoUsuario]);
  await salvarUsuariosFirestore(listaAtualizada);
  return { novoUsuario, listaAtualizada };
}

/**
 * Atualiza os dados de um usuário existente
 * Atualiza estritamente no local sem gerar clones ou duplicatas
 */
export async function atualizarUsuarioFirestore(
  usuarioId: string,
  dadosAtualizados: {
    nome?: string;
    email?: string;
    graduacaoOuCargo?: string;
    re?: string;
    role?: UserRole;
    ativo?: boolean;
    novaSenha?: string;
  }
): Promise<UsuarioSistema[]> {
  const usuarios = await carregarUsuariosFirestore();
  let index = usuarios.findIndex((u) => u.id === usuarioId);
  if (index === -1 && dadosAtualizados.email) {
    index = usuarios.findIndex((u) => u.email.trim().toLowerCase() === dadosAtualizados.email!.trim().toLowerCase());
  }
  if (index === -1) {
    throw new Error('Usuário não encontrado para atualização.');
  }

  const usuarioAtual = usuarios[index];

  // Se o e-mail foi alterado, verifica se outro usuário já o possui
  if (dadosAtualizados.email) {
    const emailNorm = dadosAtualizados.email.trim().toLowerCase();
    const existeOutro = usuarios.some((u, i) => i !== index && u.email.trim().toLowerCase() === emailNorm);
    if (existeOutro) {
      throw new Error('Já existe outro militar/usuário cadastrado com este e-mail institucional.');
    }
  }

  // Se o RE foi alterado, verifica se outro usuário já o possui
  if (dadosAtualizados.re) {
    const reNorm = dadosAtualizados.re.trim().toLowerCase();
    const existeOutroRe = usuarios.some((u, i) => i !== index && u.re && u.re.trim().toLowerCase() === reNorm);
    if (existeOutroRe) {
      throw new Error(`Já existe outro militar cadastrado com este RE (${dadosAtualizados.re.trim()}).`);
    }
  }

  const usuarioModificado: UsuarioSistema = {
    ...usuarioAtual,
    nome: dadosAtualizados.nome !== undefined ? dadosAtualizados.nome.trim() : usuarioAtual.nome,
    email: dadosAtualizados.email !== undefined ? dadosAtualizados.email.trim().toLowerCase() : usuarioAtual.email,
    graduacaoOuCargo: dadosAtualizados.graduacaoOuCargo !== undefined ? dadosAtualizados.graduacaoOuCargo.trim() : usuarioAtual.graduacaoOuCargo,
    re: dadosAtualizados.re !== undefined ? (dadosAtualizados.re.trim() || undefined) : usuarioAtual.re,
    role: dadosAtualizados.role !== undefined ? dadosAtualizados.role : usuarioAtual.role,
    ativo: dadosAtualizados.ativo !== undefined ? dadosAtualizados.ativo : usuarioAtual.ativo,
    senhaHash: dadosAtualizados.novaSenha && dadosAtualizados.novaSenha.trim().length >= 6
      ? dadosAtualizados.novaSenha.trim()
      : usuarioAtual.senhaHash,
  };

  const listaAtualizada = [...usuarios];
  listaAtualizada[index] = usuarioModificado;
  const listaLimpa = deduplicarUsuarios(listaAtualizada);
  await salvarUsuariosFirestore(listaLimpa);
  return listaLimpa;
}

/**
 * Redefine a senha de um usuário existente
 */
export async function redefinirSenhaUsuario(usuarioId: string, novaSenha: string): Promise<void> {
  const usuarios = await carregarUsuariosFirestore();
  const listaAtualizada = usuarios.map((u) => (u.id === usuarioId ? { ...u, senhaHash: novaSenha } : u));
  await salvarUsuariosFirestore(listaAtualizada);
}

/**
 * Envia e-mail de recuperação de senha pelo Firebase Auth
 */
export async function solicitarRecuperacaoSenha(email: string): Promise<{ success: boolean; mensagem: string }> {
  try {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
    return {
      success: true,
      mensagem: `E-mail de recuperação enviado para ${email}. Verifique sua caixa de entrada e spam.`,
    };
  } catch (err: any) {
    console.warn('Erro ao enviar e-mail de recuperação via Firebase Auth:', err);
    return {
      success: false,
      mensagem: 'Não foi possível enviar o e-mail automático. Solicite a redefinição diretamente ao Administrador da 3ª Cia.',
    };
  }
}

/**
 * Desconecta o usuário do sistema
 */
export async function logoutSistema(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {}
  try {
    localStorage.removeItem('pmesp_usuario_logado');
  } catch (e) {}
  try {
    await removerItemIndexedDB('pmesp_usuario_logado');
  } catch (e) {}
}

/**
 * Carrega a lista de níveis de acesso (perfis) do Firestore com fallback local
 */
export async function carregarNiveisAcessoFirestore(): Promise<NivelAcessoDef[]> {
  try {
    const refDoc = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_NIVEIS_ACESSO);
    const snap = await getDoc(refDoc);

    if (snap.exists()) {
      const data = snap.data() as { niveis?: NivelAcessoDef[] };
      if (Array.isArray(data?.niveis) && data.niveis.length > 0) {
        const mapaExistentes = new Map(data.niveis.map((n) => [n.id.toLowerCase(), n]));
        const listaCompleta = [...data.niveis];
        for (const pPadrao of NIVEIS_ACESSO_PADRAO) {
          if (!mapaExistentes.has(pPadrao.id.toLowerCase())) {
            listaCompleta.push(pPadrao);
          }
        }
        try {
          localStorage.setItem('pmesp_niveis_acesso', JSON.stringify(listaCompleta));
        } catch (e) {}
        return listaCompleta;
      }
    }
  } catch (err) {
    console.warn('Aviso ao carregar níveis de acesso do Firestore:', err);
  }

  // Fallback para localStorage ou padrão
  try {
    const cached = localStorage.getItem('pmesp_niveis_acesso');
    if (cached) {
      const parsed = JSON.parse(cached) as NivelAcessoDef[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const mapaExistentes = new Map(parsed.map((n) => [n.id.toLowerCase(), n]));
        const listaCompleta = [...parsed];
        for (const pPadrao of NIVEIS_ACESSO_PADRAO) {
          if (!mapaExistentes.has(pPadrao.id.toLowerCase())) {
            listaCompleta.push(pPadrao);
          }
        }
        return listaCompleta;
      }
    }
  } catch (e) {}

  return NIVEIS_ACESSO_PADRAO;
}

/**
 * Salva a lista de níveis de acesso (perfis) no Firestore e localStorage
 */
export async function salvarNiveisAcessoFirestore(niveis: NivelAcessoDef[]): Promise<void> {
  try {
    const refDoc = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_NIVEIS_ACESSO);
    await setDoc(
      refDoc,
      limparParaFirestore({
        niveis,
        ultimaAtualizacao: new Date().toISOString(),
      }),
      { merge: true }
    );
    try {
      localStorage.setItem('pmesp_niveis_acesso', JSON.stringify(niveis));
    } catch (e) {}
  } catch (err) {
    console.warn('Aviso ao salvar níveis de acesso no Firestore:', err);
    try {
      localStorage.setItem('pmesp_niveis_acesso', JSON.stringify(niveis));
    } catch (e) {}
  }
}


