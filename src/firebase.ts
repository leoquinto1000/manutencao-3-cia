import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
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

// Coleção e Documento central no Firestore
export const FIRESTORE_COLLECTION = 'sistema_manutencao';
export const FIRESTORE_DOC_ID = 'dados_gerais';

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
 * Carrega todos os dados do sistema salvos no Firestore
 */
export async function carregarDadosFirestore(): Promise<DadosSistemaFirestore | null> {
  try {
    const ref = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as DadosSistemaFirestore;
    }
    return null;
  } catch (error) {
    console.error('Erro ao ler do Firestore:', error);
    throw error;
  }
}

/**
 * Salva todos os dados atuais no documento central do Firestore
 */
export async function salvarDadosFirestore(dados: Partial<DadosSistemaFirestore>): Promise<void> {
  try {
    const ref = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
    const dadosLimpos = limparParaFirestore({
      ...dados,
      ultimaAtualizacao: new Date().toISOString(),
    });
    await setDoc(ref, dadosLimpos, { merge: true });
  } catch (error) {
    console.error('Erro ao salvar no Firestore:', error);
    throw error;
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
