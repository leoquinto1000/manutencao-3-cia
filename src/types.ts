export interface MaterialItem {
  id: string;
  desc: string;
  unid: string;
  qtd: number;
  unitPrice: number; // Menor Preço unitário
  companyPrices?: { [companyNum: number]: number };
}

export interface Supplier {
  id: string;
  num: number;
  name: string;
  razaoSocial: string;
  cnpj: string;
  endereco: string;
  contato: string;
}

export interface NFInstance {
  id: number;
  label: string;
  totalEmpresas: number;
  items: MaterialItem[];
  suppliers: Supplier[];
  descontoAplicado: number;
  labelDesconto?: string;
  cidadeData: string;
  responsavelNome: string;
  responsavelCargo: string;
}

export interface PesquisaPrecoItem {
  id: string;
  nfId: number;
  materialId: string;
  materialDesc: string;
  unid: string;
  qtd: number;
  numeroItem: number;
  pesquisaIndice: number; // 1, 2, ou 3
  empresaNum: number;
  empresaNome: string;
  cnpj?: string;
  dataCotacao: string;
  contato: string;
  precoUnitario: number;
  precoTotal: number;
  imagemComprovante?: string;
  linkOuObservacao?: string;
  supplierId?: string;
}

export interface EmpresaCadastrada {
  id: string;
  name: string; // Nome Fantasia
  razaoSocial: string;
  cnpj: string;
  endereco: string;
  contato: string;
  telefone?: string;
  email?: string;
  segmento?: string; // Ex: Materiais Elétricos, Hidráulica, Tintas/Acabamento, Ferramentas, Construção Geral
  observacoes?: string;
  dataCadastro?: string;
}

export interface BalanceteDespesa {
  id: string;
  descricao: string;
  valor: number;
}

export interface BalanceteState {
  elemento: string;
  discriminacao: string;
  mesReferencia: string;
  servidorCodigo: string;
  empenhoNumero: string;
  dataContabilizacao: string;
  dataRecebimento: string;
  responsavelHeader: string;
  uge: string;
  despesas: BalanceteDespesa[];
  dataRecolhimento: string;
  valorAdiantamento: number;
  valorRecolhido: number;
  valorBensTotal: number;
  brasaoUrl: string;
  responsavelAssinatura: string;
  cargoAssinatura: string;
}

export interface TextoParteState {
  unidadeHeader: string;
  numeroParte: string;
  cabecalhoDestino: string;
  item1: string;
  item2Titulo: string;
  item2Descricao: string;
  item3: string;
  item4Materiais: string;
  item5: string;
  item6: string;
  assinaturaNome: string;
  assinaturaCargo: string;
}

export interface MaterialUsado {
  id: string;
  data: string;
  material: string;
  unidade: string;
  qtd: number;
  local: string;
  motivo: string;
  responsavel: string;
}

export interface Ferramenta {
  id: string;
  nome: string;
  categoria: string;
  patrimonio: string;
  estado: 'Excelente' | 'Bom' | 'Regular' | 'Danificado';
  situacao: 'Disponível' | 'Cautelada' | 'Manutenção';
  responsavel?: string;
  dataCautela?: string;
  previsaoDevolucao?: string;
  localizacao: string;
  observacao?: string;
}

export interface ItemListaCompras {
  id: string;
  descricao: string;
  unidade: string;
  qtd: number;
  prioridade: 'Alta' | 'Média' | 'Baixa';
  justificativa: string;
  localAplicacao: string;
  precoEstimadoUnitario: number;
  status: 'Pendente' | 'Em Cotação' | 'Aprovado' | 'Comprado';
  dataRegistro: string;
}

export interface FotoCard {
  id: string;
  url: string;
  legenda: string;
}

export interface PaginaFotoServico {
  id: string;
  tituloServico: string;
  dataServico: string;
  descricao: string;
  anotacao: string;
  tipoGrid: '1' | '2' | '3' | '4';
  fotos: FotoCard[];
}

export interface InformeMensal {
  id: string;
  mesAno: string;
  capaUrl: string;
  capaAltura?: number;
  cabecalhoEsquerda?: string;
  cabecalhoDireita?: string;
  rodapeTexto?: string;
  tituloDestaques?: string;
  titulo: string;
  subtitulo: string;
  equipeTexto: string;
  resumoTexto: string;
  destaques: { id: string; titulo: string; desc: string }[];
  paginas: PaginaFotoServico[];
  criadoEm: string;
}

export interface ProjetoSalvo {
  id_arquivo: number;
  titulo: string;
  dataHora: string;
  nfs: NFInstance[];
  pesquisas?: PesquisaPrecoItem[];
  balancete?: BalanceteState;
  textoParte?: TextoParteState;
}

export interface MembroEquipe {
  id: string;
  graduacao: string;
  nomeGuerra: string;
  nomeCompleto?: string;
  re?: string;
  especialidade: string;
  telefone?: string;
  anoCurso?: string; // Ex: '1°CFO', '2°CFO', '3°CFO', '4°CFO', 'Efetivo Permanente'
  pelotao?: string; // Pelotão: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H'
  ativo: boolean;
  tipoEfetivo?: 'fixo' | 'apoio'; // 'fixo' = Efetivo Fixo da Manutenção, 'apoio' = Policiais que prestam apoio
  origemApoio?: string; // Origem/pelotão de onde o policial veio
  periodoApoio?: string; // Período de apoio (ex: 'Setembro/2026', '15/09 a 20/09', 'Apoio Diário')
  funcaoApoio?: string; // Atividade ou reforço prestado (ex: Pintura geral, Apoio hidráulico)
  observacoesApoio?: string;
  impedimento?: string; // Motivo de impedimento/afastamento temporário (ex: 'Dispensa médica', 'Escala de serviço', etc.)
  impedimentosPorData?: Record<string, string>; // Histórico diário: { 'YYYY-MM-DD': 'Motivo do impedimento' }
}

export interface EquipeManutencao {
  id: string;
  nome: string;
  supervisor?: string;
  encarregado: string;
  especialidade: string;
  membros: string[];
  corBadge?: string;
}

export interface MissaoDiaria {
  id: string;
  data: string; // Formato YYYY-MM-DD
  titulo: string;
  descricao: string;
  local: string;
  prioridade: 'Urgente' | 'Alta' | 'Média' | 'Baixa';
  equipeId?: string;
  equipeNome?: string;
  membrosDesignados?: string;
  turno: 'Manhã (07h15)' | 'Tarde (9º e 10º tempos)' | 'Integral';
  concluida: boolean;
  dataConclusao?: string;
  adiadaParaProximoDia: boolean;
  proximaData?: string;
  materiaisNecessarios?: string;
  observacoes?: string;
  fotoAntesUrl?: string;
  fotoDepoisUrl?: string;
  informePaginaId?: string;
}

export type UserRole = 
  | 'admin' 
  | 'uge' 
  | '3cfo'
  | 'operacional' 
  | 'auxiliar'
  | 'operador' 
  | 'visualizador';

export interface UsuarioSistema {
  id: string;
  email: string;
  nome: string;
  graduacaoOuCargo: string;
  re?: string;
  role: UserRole;
  ativo: boolean;
  criadoEm: string;
  ultimoAcesso?: string;
  senhaHash?: string;
}

