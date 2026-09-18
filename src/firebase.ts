import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
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
} from './types';

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

// Coleção e Documentos no Firestore para garantir que fotos nunca estourem o limite de 1MB por documento
export const FIRESTORE_COLLECTION = 'sistema_manutencao';
export const FIRESTORE_DOC_ID = 'dados_gerais';
export const FIRESTORE_DOC_MISSOES = 'dados_missoes';
export const FIRESTORE_DOC_INFORME = 'dados_informe';
export const FIRESTORE_DOC_HISTORICO = 'dados_historico';
export const FIRESTORE_DOC_ARQUIVOS_SALVOS = 'dados_arquivos_salvos';
export const FIRESTORE_DOC_USUARIOS = 'dados_usuarios';

export interface DadosSistemaFirestore {
  nfs: NFInstance[];
  pesquisas: PesquisaPrecoItem[];
  balancete: BalanceteState;
  textoParte: TextoParteState;
  materiaisUsados: MaterialUsado[];
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
 * Carrega a lista de usuários salvos no Firestore
 */
export async function carregarUsuariosFirestore(): Promise<UsuarioSistema[]> {
  try {
    const refDoc = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_USUARIOS);
    const snap = await lerDocServidorComFallback(refDoc);
    if (snap && snap.exists()) {
      const data = snap.data() as { usuarios?: UsuarioSistema[]; excluidos?: string[] };
      const excluidosSet = new Set((data?.excluidos || []).map((e) => e.toLowerCase()));

      if (Array.isArray(data?.usuarios) && data.usuarios.length > 0) {
        const mapaExistentes = new Map(data.usuarios.map((u) => [u.email.toLowerCase(), u]));
        const listaMesclada: UsuarioSistema[] = data.usuarios.map((u) => {
          let role = u.role;
          if (role === 'operador') role = 'operacional';
          if (role === 'visualizador') role = 'auxiliar';
          return { ...u, role };
        });

        // Garante que todo o efetivo fixo cadastrado em USUARIOS_INICIAIS esteja presente,
        // EXCETO se o usuário tiver sido explicitamente excluído por um administrador
        let alterou = false;
        for (const uPadrao of USUARIOS_INICIAIS) {
          const emailLower = uPadrao.email.toLowerCase();
          if (!mapaExistentes.has(emailLower) && !excluidosSet.has(emailLower)) {
            listaMesclada.push(uPadrao);
            alterou = true;
          }
        }

        if (alterou) {
          salvarUsuariosFirestore(listaMesclada).catch(console.error);
        }
        return listaMesclada;
      }
    }
    // Se não existia ainda, inicializa com os usuários padrão do sistema
    await salvarUsuariosFirestore(USUARIOS_INICIAIS);
    return USUARIOS_INICIAIS;
  } catch (err) {
    console.warn('Aviso ao carregar usuários do Firestore, utilizando base local:', err);
    try {
      const cached = localStorage.getItem('pmesp_usuarios');
      const cachedExcluidos = localStorage.getItem('pmesp_usuarios_excluidos');
      const excluidosSet = new Set<string>(
        cachedExcluidos ? JSON.parse(cachedExcluidos).map((e: string) => e.toLowerCase()) : []
      );

      if (cached) {
        const parsed = JSON.parse(cached) as UsuarioSistema[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapaExistentes = new Map(parsed.map((u) => [u.email.toLowerCase(), u]));
          const listaMesclada = [...parsed];
          for (const uPadrao of USUARIOS_INICIAIS) {
            const emailLower = uPadrao.email.toLowerCase();
            if (!mapaExistentes.has(emailLower) && !excluidosSet.has(emailLower)) {
              listaMesclada.push(uPadrao);
            }
          }
          return listaMesclada;
        }
      }
    } catch (e) {}
    return USUARIOS_INICIAIS;
  }
}

/**
 * Salva a lista de usuários no Firestore
 */
export async function salvarUsuariosFirestore(usuarios: UsuarioSistema[]): Promise<void> {
  try {
    const refDoc = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_USUARIOS);
    await setDoc(
      refDoc,
      limparParaFirestore({
        usuarios,
        ultimaAtualizacao: new Date().toISOString(),
      }),
      { merge: true }
    );
    try {
      localStorage.setItem('pmesp_usuarios', JSON.stringify(usuarios));
    } catch (e) {}
  } catch (err) {
    console.warn('Aviso ao salvar usuários no Firestore:', err);
    try {
      localStorage.setItem('pmesp_usuarios', JSON.stringify(usuarios));
    } catch (e) {}
  }
}

/**
 * Exclui um usuário do sistema (Firestore e LocalStorage) e registra o e-mail na lista de excluídos
 */
export async function excluirUsuarioFirestore(id: string): Promise<UsuarioSistema[]> {
  const usuariosAtuais = await carregarUsuariosFirestore();
  const usuarioRemovido = usuariosAtuais.find((u) => u.id === id);
  const novaLista = usuariosAtuais.filter((u) => u.id !== id);

  try {
    const refDoc = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_USUARIOS);
    const snap = await lerDocServidorComFallback(refDoc);
    const dadosAntigos = snap?.exists() ? (snap.data() as { excluidos?: string[] }) : {};
    const excluidosSet = new Set((dadosAntigos?.excluidos || []).map((e) => e.toLowerCase()));
    if (usuarioRemovido?.email) {
      excluidosSet.add(usuarioRemovido.email.toLowerCase());
    }

    await setDoc(
      refDoc,
      limparParaFirestore({
        usuarios: novaLista,
        excluidos: Array.from(excluidosSet),
        ultimaAtualizacao: new Date().toISOString(),
      }),
      { merge: true }
    );

    try {
      localStorage.setItem('pmesp_usuarios', JSON.stringify(novaLista));
      localStorage.setItem('pmesp_usuarios_excluidos', JSON.stringify(Array.from(excluidosSet)));
    } catch (e) {}
  } catch (err) {
    console.warn('Aviso ao excluir usuário no Firestore:', err);
    try {
      localStorage.setItem('pmesp_usuarios', JSON.stringify(novaLista));
      const cachedExcluidos = localStorage.getItem('pmesp_usuarios_excluidos');
      const excluidosArr: string[] = cachedExcluidos ? JSON.parse(cachedExcluidos) : [];
      if (usuarioRemovido?.email && !excluidosArr.includes(usuarioRemovido.email.toLowerCase())) {
        excluidosArr.push(usuarioRemovido.email.toLowerCase());
      }
      localStorage.setItem('pmesp_usuarios_excluidos', JSON.stringify(excluidosArr));
    } catch (e) {}
  }

  return novaLista;
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
        await salvarUsuariosFirestore([...usuarios, novoUser]);
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
): Promise<UsuarioSistema> {
  const emailNorm = dados.email.trim().toLowerCase();
  const usuarios = await carregarUsuariosFirestore();

  if (usuarios.some((u) => u.email.toLowerCase() === emailNorm)) {
    throw new Error('Já existe um usuário cadastrado com este e-mail.');
  }

  let novoUid = 'user-' + Date.now();

  // Tenta criar no Firebase Auth se possível
  try {
    const cred = await createUserWithEmailAndPassword(auth, emailNorm, dados.senha);
    if (cred.user) {
      novoUid = cred.user.uid;
    }
  } catch (err: any) {
    console.info('Criação no Firebase Auth ignorada ou provedor não ativado, registrando no banco:', err?.code);
  }

  const novoUsuario: UsuarioSistema = {
    id: novoUid,
    email: emailNorm,
    nome: dados.nome.trim(),
    graduacaoOuCargo: dados.graduacaoOuCargo.trim(),
    re: dados.re ? dados.re.trim() : undefined,
    role: dados.role,
    ativo: true,
    criadoEm: new Date().toISOString(),
    senhaHash: dados.senha,
  };

  const listaAtualizada = [...usuarios, novoUsuario];
  await salvarUsuariosFirestore(listaAtualizada);
  return novoUsuario;
}

/**
 * Atualiza os dados de um usuário existente
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
  const index = usuarios.findIndex((u) => u.id === usuarioId);
  if (index === -1) {
    throw new Error('Usuário não encontrado para atualização.');
  }

  // Se o e-mail foi alterado, verifica se outro usuário já o possui
  if (dadosAtualizados.email) {
    const emailNorm = dadosAtualizados.email.trim().toLowerCase();
    const existeOutro = usuarios.some((u) => u.id !== usuarioId && u.email.toLowerCase() === emailNorm);
    if (existeOutro) {
      throw new Error('Já existe outro militar/usuário cadastrado com este e-mail.');
    }
  }

  const usuarioAtual = usuarios[index];
  const usuarioModificado: UsuarioSistema = {
    ...usuarioAtual,
    nome: dadosAtualizados.nome !== undefined ? dadosAtualizados.nome.trim() : usuarioAtual.nome,
    email: dadosAtualizados.email !== undefined ? dadosAtualizados.email.trim().toLowerCase() : usuarioAtual.email,
    graduacaoOuCargo: dadosAtualizados.graduacaoOuCargo !== undefined ? dadosAtualizados.graduacaoOuCargo.trim() : usuarioAtual.graduacaoOuCargo,
    re: dadosAtualizados.re !== undefined ? dadosAtualizados.re.trim() : usuarioAtual.re,
    role: dadosAtualizados.role !== undefined ? dadosAtualizados.role : usuarioAtual.role,
    ativo: dadosAtualizados.ativo !== undefined ? dadosAtualizados.ativo : usuarioAtual.ativo,
    senhaHash: dadosAtualizados.novaSenha && dadosAtualizados.novaSenha.trim().length >= 6
      ? dadosAtualizados.novaSenha.trim()
      : usuarioAtual.senhaHash,
  };

  const listaAtualizada = [...usuarios];
  listaAtualizada[index] = usuarioModificado;
  await salvarUsuariosFirestore(listaAtualizada);
  return listaAtualizada;
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
}

