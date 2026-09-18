import { initializeApp, getApps, getApp } from 'firebase/app';
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

// Coleção e Documentos no Firestore para garantir que fotos nunca estourem o limite de 1MB por documento
export const FIRESTORE_COLLECTION = 'sistema_manutencao';
export const FIRESTORE_DOC_ID = 'dados_gerais';
export const FIRESTORE_DOC_MISSOES = 'dados_missoes';
export const FIRESTORE_DOC_INFORME = 'dados_informe';
export const FIRESTORE_DOC_HISTORICO = 'dados_historico';
export const FIRESTORE_DOC_ARQUIVOS_SALVOS = 'dados_arquivos_salvos';

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
