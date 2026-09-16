import { NFInstance, BalanceteState, TextoParteState, MaterialUsado, InformeMensal, EmpresaCadastrada } from './types';

export function formatMoeda(val: number): string {
  if (isNaN(val)) return 'R$ 0,00';
  return val.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseMoeda(val: string | number): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  // Remove "R$", spaces, replace dots then replace comma with dot
  const clean = val
    .toString()
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

export function gerarId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

/**
 * Faz o download de uma foto (Base64/DataURL ou link) no navegador do usuário
 */
export function baixarFoto(urlOuDataUrl: string, nomeArquivo: string): void {
  if (!urlOuDataUrl) return;
  try {
    const link = document.createElement('a');
    link.href = urlOuDataUrl;
    const nomeLimpo =
      nomeArquivo.toLowerCase().endsWith('.jpg') ||
      nomeArquivo.toLowerCase().endsWith('.jpeg') ||
      nomeArquivo.toLowerCase().endsWith('.png')
        ? nomeArquivo
        : `${nomeArquivo}.jpg`;
    link.download = nomeLimpo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Erro ao baixar foto:', err);
  }
}

/**
 * Redimensiona e comprime uma foto (File ou DataURL) para JPEG otimizado
 * (dimensão máxima de 1024px e qualidade 0.72).
 * Isso reduz fotos pesadas de celulares (4MB-10MB) para apenas ~40KB-70KB,
 * permitindo que sejam salvas no Firestore e no armazenamento local sem estourar limites
 * e sem perder qualidade visual para exibição e relatórios A4.
 */
export function comprimirImagemParaArmazenamento(
  arquivoOuDataUrl: File | string,
  maxDimensao: number = 1024,
  qualidade: number = 0.72
): Promise<string> {
  return new Promise((resolve) => {
    const processarDataUrl = (dataUrl: string) => {
      // Se for URL externa de internet (ex: https://), não precisa comprimir
      if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
        resolve(dataUrl);
        return;
      }

      const img = new Image();
      img.onload = () => {
        let largura = img.width;
        let altura = img.height;

        if (largura > maxDimensao || altura > maxDimensao) {
          if (largura > altura) {
            altura = Math.round((altura * maxDimensao) / largura);
            largura = maxDimensao;
          } else {
            largura = Math.round((largura * maxDimensao) / altura);
            altura = maxDimensao;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = largura;
        canvas.height = altura;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        // Fundo branco para garantir que transparências de PNG fiquem brancas em JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, largura, altura);
        ctx.drawImage(img, 0, 0, largura, altura);

        try {
          const compressedDataUrl = canvas.toDataURL('image/jpeg', qualidade);
          resolve(compressedDataUrl);
        } catch (e) {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };

    if (typeof arquivoOuDataUrl === 'string') {
      processarDataUrl(arquivoOuDataUrl);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const rawDataUrl = ev.target?.result as string;
        processarDataUrl(rawDataUrl);
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(arquivoOuDataUrl);
    }
  });
}

export const DADOS_INICIAIS_NF1: NFInstance = {
  id: 1,
  label: 'NF 1 - Materiais Hidráulicos & Elétricos',
  totalEmpresas: 3,
  cidadeData: 'SÃO PAULO, 27 DE AGOSTO DE 2026',
  responsavelNome: 'ANDRÉ EMÍDIO FROES',
  responsavelCargo: '1º Ten PM 3ª Cia/Ex',
  descontoAplicado: 0.43,
  labelDesconto: 'Desconto Aplicado (NF)',
  items: [
    {
      id: 'item-1',
      desc: 'Canaleta 20x10mm com adesivo 2m',
      unid: 'UN',
      qtd: 3,
      unitPrice: 7.99,
      companyPrices: { 1: 7.99, 2: 8.50, 3: 9.20 },
    },
    {
      id: 'item-2',
      desc: 'Placa 2 Postos Separados 4x2 Aria',
      unid: 'UN',
      qtd: 2,
      unitPrice: 4.89,
      companyPrices: { 1: 4.89, 2: 5.40, 3: 5.15 },
    },
    {
      id: 'item-3',
      desc: 'Selante Adesivo PU40 Preto 310g',
      unid: 'UN',
      qtd: 1,
      unitPrice: 28.90,
      companyPrices: { 1: 28.90, 2: 31.00, 3: 32.50 },
    },
    {
      id: 'item-4',
      desc: 'Conjunto 2 Tomadas 2P+T 10A',
      unid: 'CJ',
      qtd: 10,
      unitPrice: 13.89,
      companyPrices: { 1: 13.89, 2: 15.20, 3: 14.90 },
    },
    {
      id: 'item-5',
      desc: 'Tinta Acrílica Fosca Branca 20L',
      unid: 'LATA',
      qtd: 1,
      unitPrice: 249.90,
      companyPrices: { 1: 249.90, 2: 265.00, 3: 258.00 },
    },
    {
      id: 'item-6',
      desc: 'Chuveiro Eletrônico 220V 6800W',
      unid: 'UN',
      qtd: 6,
      unitPrice: 119.90,
      companyPrices: { 1: 119.90, 2: 129.90, 3: 125.00 },
    },
    {
      id: 'item-7',
      desc: 'Resistência Chuveiro Lorenzetti 220V',
      unid: 'UN',
      qtd: 6,
      unitPrice: 24.50,
      companyPrices: { 1: 24.50, 2: 27.00, 3: 26.50 },
    },
    {
      id: 'item-8',
      desc: 'Assento Sanitário Almofadado Branco',
      unid: 'UN',
      qtd: 8,
      unitPrice: 42.00,
      companyPrices: { 1: 42.00, 2: 46.90, 3: 45.00 },
    },
  ],
  suppliers: [
    {
      id: 'forn-1',
      num: 1,
      name: 'Comercial Barro Branco Materiais de Construção',
      razaoSocial: 'Comercial Barro Branco Mat. Construção Ltda - ME',
      cnpj: '12.345.678/0001-90',
      endereco: 'Av. Nova Cantareira, 3200 - Tucuruvi, São Paulo - SP',
      contato: '(11) 2203-1100 / vendas@barrobrancomat.com.br',
    },
    {
      id: 'forn-2',
      num: 2,
      name: 'EletroNorte Distribuidora de Elétrica',
      razaoSocial: 'EletroNorte Materiais Elétricos e Hidráulicos Ltda',
      cnpj: '98.765.432/0001-12',
      endereco: 'Rua Voluntários da Pátria, 1450 - Santana, São Paulo - SP',
      contato: '(11) 2971-8844 / orcamento@eletronorte.com.br',
    },
    {
      id: 'forn-3',
      num: 3,
      name: 'ConstruFácil Centro de Compras',
      razaoSocial: 'ConstruFácil Materiais Básicos e Acabamentos S.A.',
      cnpj: '45.678.901/0001-34',
      endereco: 'Av. Santos Dumont, 800 - Bom Retiro, São Paulo - SP',
      contato: '(11) 3311-5500 / contato@construfacil.com.br',
    },
  ],
};

export const DADOS_INICIAIS_BALANCETE: BalanceteState = {
  elemento: '33903052',
  discriminacao: 'MATERIAIS DE CONSTRUÇÃO',
  mesReferencia: 'AGOSTO DE 2026',
  servidorCodigo: '288.269.308-28',
  empenhoNumero: '2026NE 00204',
  dataContabilizacao: '28/08/2026',
  dataRecebimento: '18 DE AGOSTO DE 2026',
  responsavelHeader: 'Do Sr. ANDRÉ EMIDIO FROES',
  uge: 'UGE - 180174',
  despesas: [
    {
      id: 'desp-1',
      descricao: 'NF 1 - Materiais Hidráulicos & Elétricos (Comercial Barro Branco)',
      valor: 1686.06,
    },
  ],
  dataRecolhimento: '29/08/2026',
  valorAdiantamento: 4000.00,
  valorRecolhido: 0.43,
  valorBensTotal: 4000.00,
  brasaoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Bras%C3%A3o_do_estado_de_S%C3%A3o_Paulo.svg/200px-Bras%C3%A3o_do_estado_de_S%C3%A3o_Paulo.svg.png',
  responsavelAssinatura: 'ANDRÉ EMIDIO FROES',
  cargoAssinatura: '1º TEN PM - RESP. PELO ADIANTAMENTO',
};

export const DADOS_INICIAIS_TEXTOPARTE: TextoParteState = {
  unidadeHeader: 'ACADEMIA DE POLÍCIA MILITAR DO BARRO BRANCO - O003',
  numeroParte: 'PARTE N° APMBB-042/33/2026',
  cabecalhoDestino: 'Do Resp. de Adiantamento - Natureza 33903052\nAo Sr. Dirigente\nAssunto: Aquisição de material.',
  item1: 'Considerando a necessidade de realização de despesa por meio de adiantamento, bem como a inviabilidade de subordinar-se ao processo normal de aquisição, passo a discriminar, motivadamente, o uso dos valores recebidos a título de adiantamento e as pendências que urgiam a aquisição de bens.',
  item2Titulo: 'Fato motivador:',
  item2Descricao: 'em decorrência de danos causados pelo próprio uso contínuo das instalações, bem como avarias provocadas pelo desgaste natural dos espaços físicos da 3ª Companhia da Academia de Polícia Militar do Barro Branco, compreendendo os alojamentos, banheiros/sanitários, corredores e áreas comuns de circulação, constatou-se a urgência na realização de reparos e manutenções preventivas e corretivas. Fazia-se premente a substituição imediata de componentes hidrossanitários desgastados (chuveiros inoperantes, resistências queimadas, assentos danificados, torneiras e válvulas de descarga com vazamentos), a adequação e eliminação de riscos na rede de alimentação elétrica (troca de tomadas, módulos interruptores, placas e fiações expostas), o reparo em trechos de revestimentos cerâmicos avariados para estancar infiltrações, bem como a pintura de proteção e sinalização de pisos e áreas de passagem, a fim de garantir a salubridade, a segurança dos usuários e a preservação das condições mínimas de uso do patrimônio público estadual.',
  item3: 'Destarte, com fulcro artigo 2º e alínea “a”, do inciso I, do artigo 3º, ambos, do Decreto nº 53.980, de 29 de janeiro de 2009, efetuou-se a aquisição de materiais por intermédio de adiantamento, considerando-se o aspecto excepcional e imprescindível para conservação da Unidade, cuja realização não permitia delongas. Vejamos os dispositivos supramencionados:\nArtigo 2º - Poderão realizar-se pelo regime de adiantamento os gastos decorrentes de despesa extraordinária e urgente, cuja realização não permita delongas; de despesa de conservação, inclusive a relativa a combustível e material de consumo; de despesas miúdas e de pronto pagamento; de transportes em geral; de diligências policiais e administrativas para operações fazendárias; de representação eventual e gratificação de representação; de pagamento excepcional devidamente justificado e autorizado pelo Governador ou por expressa disposição de lei.\nArtigo 3º - O item despesa miúda e de pronto pagamento somente poderá ser utilizado para realização das seguintes despesas:\nI - a que se fizer: com selos postais, telegramas, material e serviços de limpeza e higiene, lavagem de roupa, café e lanche, pequenos carretos, transportes urbanos, pequenos consertos, gás e aquisição avulsa, no interesse público, de livros, jornais, revistas e outras publicações; (grifou-se); com encadernações avulsas e artigos de escritório, de desenho, impressos e papelaria, em quantidade restrita, para uso ou consumo próximo ou imediato; com artigos farmacêuticos ou de laboratório, em quantidade restrita, para uso ou consumo próximo ou imediato.\nII - outra qualquer, de pequeno vulto e de necessidade imediata, desde que devidamente justificada. (grifou-se)',
  item4Materiais: '3 Canaletas 20x10mm com adesivo 2m (UN); 2 Placas 2 Postos Separados 4x2 Aria (UN); 1 Selante Adesivo PU40 Preto 310g (UN); 10 Conjuntos 2 Tomadas 2P+T 10A (CJ); 1 Tinta Acrílica Fosca Branca 20L (LATA); 6 Chuveiros Eletrônico 220V 6800W (UN); 6 Resistências Chuveiro Lorenzetti 220V (UN); e 8 Assentos Sanitário Almofadado Branco (UN).',
  item5: 'Por fim, destaca-se ser de competência dos usuários do imóvel zelar pela sua conservação e realizar manutenções preventivas e corretivas, nos moldes das I-38-PM, visando, ainda, proporcionar bem-estar ao efetivo da APMBB e das pessoas que visitam a Unidade.',
  item6: 'Outrossim, consultada a Seção responsável acerca dos materiais que eventualmente precisam ser adquiridos, obteve-se como resposta não haver disponibilidade em estoque, sequer previsão para aquisição, razão qual utilizou-se desta via excepcional para sanar os problemas constatados.',
  assinaturaNome: 'ANDRÉ EMIDIO FROES',
  assinaturaCargo: '1º Ten PM - Resp. pelo Adiantamento',
};

export const DADOS_INICIAIS_MATERIAIS_USADOS: MaterialUsado[] = [
  {
    id: 'mat-1',
    data: '27/08/2026',
    material: 'Canaleta 20x10mm com Adesivo BR 2M',
    unidade: 'UN',
    qtd: 3,
    local: 'Alojamento dos Cabos e Soldados - 3ª Cia',
    motivo: 'Instalação de novos pontos de tomada para computadores da guarda',
    responsavel: 'Cb PM Ribeiro',
  },
  {
    id: 'mat-2',
    data: '28/08/2026',
    material: 'Chuveiro Eletrônico 220V 6800W',
    unidade: 'UN',
    qtd: 2,
    local: 'Vestiário dos Cadetes - Bloco B',
    motivo: 'Substituição de aparelhos queimados com fiação danificada',
    responsavel: 'Sd PM Santana',
  },
  {
    id: 'mat-3',
    data: '28/08/2026',
    material: 'Assento Sanitário Almofadado Branco',
    unidade: 'UN',
    qtd: 4,
    local: 'Sanitários Coletivos - Piso 1',
    motivo: 'Troca de assentos trincados decorrentes de desgaste contínuo',
    responsavel: 'Sd PM Santana',
  },
  {
    id: 'mat-4',
    data: '29/08/2026',
    material: 'Tinta Acrílica Fosca Branca 20L',
    unidade: 'LATA',
    qtd: 0.5,
    local: 'Corredor Principal e Sala de Instrução',
    motivo: 'Retoque de paredes danificadas por umidade e raspagens',
    responsavel: 'Cb PM Ribeiro',
  },
];

export const DADOS_INICIAIS_INFORME: InformeMensal = {
  id: 'informe-agosto-2026',
  mesAno: 'AGOSTO 2026',
  capaUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=900&auto=format&fit=crop&q=60',
  capaAltura: 195,
  cabecalhoEsquerda: 'ACADEMIA DE POLÍCIA MILITAR DO BARRO BRANCO - O003',
  cabecalhoDireita: 'MANUTENÇÃO 3ª CIA\nCIA ES',
  rodapeTexto: 'BERÇO DO OFICIALATO PAULISTA',
  tituloDestaques: 'Dentre as principais atividades executadas, destacam-se:',
  titulo: 'INFORME DE SERVIÇOS REALIZADOS',
  subtitulo: 'REALIZAÇÕES AGOSTO 2026 • CUIDADO COM O QUE É NOSSO',
  equipeTexto: `CAP PM IVANOV
1° TEN PM FROES
CAD PM CRISTIAN
CAD PM DIOMAZIO
CAD PM MURILLO SOARES
CAD PM PECIUKONIS
CAD PM AUGUSTO
CAD PM FABIO
CAD PM PEROZIN
CAD PM SALVIONI
CAD PM ULISSES SILVEIRA
CAD PM FREIRE
CAD PM ISACK
CAD PM RAVELY`,
  resumoTexto: 'Neste informe, a 3ª Companhia detalha as intervenções de manutenção e as melhorias infraestruturais realizadas durante o mês de agosto. O foco do período concentrou-se na revitalização de áreas de uso comum e na eficiência dos sistemas de apoio, visando elevar o padrão de habitabilidade e funcionalidade da subunidade.',
  destaques: [
    {
      id: 'dest-1',
      titulo: 'Pintura e Revitalização',
      desc: 'Retoques em áreas críticas dos alojamentos, corredores e salas de instrução.',
    },
    {
      id: 'dest-2',
      titulo: 'Sistema elétrico',
      desc: 'Substituição de tomadas avariadas garantindo maior segurança e economia de energia.',
    },
    {
      id: 'dest-3',
      titulo: 'Áreas de Convivência',
      desc: 'Manutenção preventiva no mobiliário e revisão completa das instalações hidráulicas.',
    },
  ],
  paginas: [
    {
      id: 'pag-1',
      tituloServico: 'REVITALIZAÇÃO HIDRÁULICA E CHUVEIROS',
      dataServico: 'AGOSTO 2026',
      descricao: 'Troca de chuveiros e revisão de torneiras dos vestiários do Bloco Central da 3ª Cia.',
      anotacao: '✅ 06 Chuveiros novos instalados com fiação dimensionada em 6mm²',
      tipoGrid: '2',
      fotos: [
        {
          id: 'f-1',
          url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=60',
          legenda: 'ANTES: Chuveiro inoperante com fiação aparente',
        },
        {
          id: 'f-2',
          url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600&auto=format&fit=crop&q=60',
          legenda: 'DEPOIS: Chuveiro eletrônico 6800W instalado e vedado',
        },
      ],
    },
    {
      id: 'pag-2',
      tituloServico: 'MANUTENÇÃO ELÉTRICA E PONTOS DE FORÇA',
      dataServico: 'AGOSTO 2026',
      descricao: 'Instalação de canaletas e novas tomadas duplas 10A nos alojamentos.',
      anotacao: '⚡ Eliminação de extensões improvisadas e adequação à NR-10',
      tipoGrid: '3',
      fotos: [
        {
          id: 'f-3',
          url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=60',
          legenda: 'Ponto antigo sem aterramento',
        },
        {
          id: 'f-4',
          url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=60',
          legenda: 'Passagem dos cabos por canaleta',
        },
        {
          id: 'f-5',
          url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=60',
          legenda: 'Conjuntos 2P+T instalados e testados',
        },
      ],
    },
  ],
  criadoEm: new Date().toLocaleDateString('pt-BR'),
};

export function parseXMLNFe(xmlString: string) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  const detList = xmlDoc.getElementsByTagName('det');
  if (detList.length === 0) {
    throw new Error('Formato de NF-e não reconhecido ou sem itens <det>');
  }

  let emitenteNome = 'EMPRESA XML';
  let emitenteCNPJ = '';
  let emitenteEnd = '';
  let emitenteFone = '';

  const emit = xmlDoc.getElementsByTagName('emit')[0];
  if (emit) {
    emitenteNome = emit.getElementsByTagName('xNome')[0]?.textContent || emitenteNome;
    emitenteCNPJ = emit.getElementsByTagName('CNPJ')[0]?.textContent || '';
    const enderEmit = emit.getElementsByTagName('enderEmit')[0];
    if (enderEmit) {
      const logr = enderEmit.getElementsByTagName('xLgr')[0]?.textContent || '';
      const nro = enderEmit.getElementsByTagName('nro')[0]?.textContent || '';
      const b空氣 = enderEmit.getElementsByTagName('xBairro')[0]?.textContent || '';
      const mun = enderEmit.getElementsByTagName('xMun')[0]?.textContent || '';
      const uf = enderEmit.getElementsByTagName('UF')[0]?.textContent || '';
      emitenteEnd = `${logr}, ${nro} - ${b空氣}, ${mun}/${uf}`.trim();
      emitenteFone = enderEmit.getElementsByTagName('fone')[0]?.textContent || '';
    }
  }

  const itens = [];
  for (let i = 0; i < detList.length; i++) {
    const prod = detList[i].getElementsByTagName('prod')[0];
    if (prod) {
      const xProd = prod.getElementsByTagName('xProd')[0]?.textContent || 'Item';
      const qCom = parseFloat(prod.getElementsByTagName('qCom')[0]?.textContent || '1');
      const uCom = prod.getElementsByTagName('uCom')[0]?.textContent || 'UN';
      const vUnCom = parseFloat(prod.getElementsByTagName('vUnCom')[0]?.textContent || '0');

      itens.push({
        id: gerarId(),
        desc: xProd,
        unid: uCom,
        qtd: isNaN(qCom) ? 1 : qCom,
        unitPrice: isNaN(vUnCom) ? 0 : vUnCom,
        companyPrices: { 1: isNaN(vUnCom) ? 0 : vUnCom },
      });
    }
  }

  return {
    emitente: {
      name: emitenteNome,
      razaoSocial: emitenteNome,
      cnpj: emitenteCNPJ,
      endereco: emitenteEnd,
      contato: emitenteFone || '-',
    },
    itens,
  };
}

export function parseTabelaTexto(texto: string) {
  const linhas = texto.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const itens = [];

  for (const linha of linhas) {
    let partes = linha.split('\t');
    if (partes.length < 2) {
      partes = linha.split(/\s{2,}/);
    }

    if (partes.length >= 3) {
      const desc = partes[0].trim();
      const qtd = parseMoeda(partes[1].trim()) || 1;
      const unit = parseMoeda(partes[2].trim()) || 0;
      itens.push({ desc, unid: 'UN', qtd, unit });
    } else if (partes.length === 2) {
      const desc = partes[0].trim();
      const unit = parseMoeda(partes[1].trim()) || 0;
      itens.push({ desc, unid: 'UN', qtd: 1, unit });
    } else if (linha) {
      itens.push({ desc: linha, unid: 'UN', qtd: 1, unit: 0 });
    }
  }
  return itens;
}

export const DADOS_INICIAIS_FERRAMENTAS: import('./types').Ferramenta[] = [
  {
    id: 'ferr-1',
    nome: 'Furadeira e Parafusadeira de Impacto 18V com 2 Baterias',
    categoria: 'Elétrica',
    patrimonio: '3ªCIA-ELET-01',
    estado: 'Excelente',
    situacao: 'Disponível',
    localizacao: 'Armário de Ferramentas - 3ª Cia',
    responsavel: '',
    dataCautela: '',
    previsaoDevolucao: '',
  },
  {
    id: 'ferr-2',
    nome: 'Jogo de Chaves Combinadas 6 a 22mm (16 peças)',
    categoria: 'Manual',
    patrimonio: '3ªCIA-MAN-02',
    estado: 'Bom',
    situacao: 'Disponível',
    localizacao: 'Armário de Ferramentas - 3ª Cia',
    responsavel: '',
    dataCautela: '',
    previsaoDevolucao: '',
  },
  {
    id: 'ferr-3',
    nome: 'Escada Articulada de Alumínio 4x3 Degraus (12 degraus)',
    categoria: 'Acesso/Escada',
    patrimonio: '3ªCIA-ACES-03',
    estado: 'Bom',
    situacao: 'Cautelada',
    localizacao: 'Alojamento 3ª Cia',
    responsavel: 'Cb PM Ribeiro',
    dataCautela: '28/08/2026',
    previsaoDevolucao: '30/08/2026',
  },
  {
    id: 'ferr-4',
    nome: 'Alicate Universal Isolado 1000V Tramontina Pro 8"',
    categoria: 'Elétrica',
    patrimonio: '3ªCIA-ELET-04',
    estado: 'Bom',
    situacao: 'Disponível',
    localizacao: 'Armário de Ferramentas - 3ª Cia',
    responsavel: '',
    dataCautela: '',
    previsaoDevolucao: '',
  },
  {
    id: 'ferr-5',
    nome: 'Trena a Laser Digital 40 Metros Bosch GLM 40',
    categoria: 'Medição',
    patrimonio: '3ªCIA-MED-05',
    estado: 'Excelente',
    situacao: 'Cautelada',
    localizacao: 'Sala do Oficial de Dia',
    responsavel: '1º Ten PM Froes',
    dataCautela: '29/08/2026',
    previsaoDevolucao: '31/08/2026',
  },
  {
    id: 'ferr-6',
    nome: 'Marreta Oitavada 2kg com Cabo de Fibra de Vidro',
    categoria: 'Manual',
    patrimonio: '3ªCIA-MAN-06',
    estado: 'Bom',
    situacao: 'Disponível',
    localizacao: 'Oficina da 3ª Cia',
    responsavel: '',
    dataCautela: '',
    previsaoDevolucao: '',
  },
  {
    id: 'ferr-7',
    nome: 'Nível de Alumínio Magnético 60cm Profissional',
    categoria: 'Medição',
    patrimonio: '3ªCIA-MED-07',
    estado: 'Excelente',
    situacao: 'Disponível',
    localizacao: 'Armário de Ferramentas - 3ª Cia',
    responsavel: '',
    dataCautela: '',
    previsaoDevolucao: '',
  },
];

export const DADOS_INICIAIS_LISTA_COMPRAS: import('./types').ItemListaCompras[] = [
  {
    id: 'comp-1',
    descricao: 'Cabo Flexível 2,5mm² 750V Azul 100m',
    unidade: 'ROLO',
    qtd: 2,
    prioridade: 'Alta',
    justificativa: 'Adequação dos circuitos elétricos e tomadas dos alojamentos',
    localAplicacao: 'Alojamento dos Cabos e Soldados - 3ª Cia',
    precoEstimadoUnitario: 185.0,
    status: 'Pendente',
    dataRegistro: '28/08/2026',
  },
  {
    id: 'comp-2',
    descricao: 'Disjuntor Bipolar DIN 32A Curva C',
    unidade: 'UN',
    qtd: 4,
    prioridade: 'Alta',
    justificativa: 'Substituição no quadro geral do vestiário dos cadetes',
    localAplicacao: 'Vestiário dos Cadetes - Bloco B',
    precoEstimadoUnitario: 38.5,
    status: 'Em Cotação',
    dataRegistro: '28/08/2026',
  },
  {
    id: 'comp-3',
    descricao: 'Fita Veda Rosca 18mm x 50m Tigre',
    unidade: 'UN',
    qtd: 6,
    prioridade: 'Média',
    justificativa: 'Manutenção preventiva nas conexões hidráulicas dos sanitários',
    localAplicacao: 'Sanitários Coletivos - Piso 1 e 2',
    precoEstimadoUnitario: 11.9,
    status: 'Pendente',
    dataRegistro: '29/08/2026',
  },
  {
    id: 'comp-4',
    descricao: 'Lâmpada Tubular LED T8 18W 6500K Bivolt 120cm',
    unidade: 'UN',
    qtd: 20,
    prioridade: 'Média',
    justificativa: 'Substituição de fluorescentes queimadas no corredor e sala de aula',
    localAplicacao: 'Corredor Principal e Sala de Instrução',
    precoEstimadoUnitario: 16.0,
    status: 'Pendente',
    dataRegistro: '29/08/2026',
  },
  {
    id: 'comp-5',
    descricao: 'Selante Silicone Acético Incolor 280g Tubo',
    unidade: 'UN',
    qtd: 4,
    prioridade: 'Baixa',
    justificativa: 'Vedação e calafetação nas bancadas de pias e lavatórios',
    localAplicacao: 'Vestiários e Sanitários',
    precoEstimadoUnitario: 21.5,
    status: 'Aprovado',
    dataRegistro: '30/08/2026',
  },
];

export const DADOS_INICIAIS_MEMBROS: import('./types').MembroEquipe[] = [
  {
    id: 'membro-froes',
    graduacao: '1º Ten PM',
    nomeGuerra: '1º Ten PM Froes',
    nomeCompleto: '',
    re: '142.890-1',
    especialidade: 'Oficial Coordenador de Manutenção',
    telefone: '(11) 981265643',
    anoCurso: 'Efetivo Permanente',
    pelotao: '',
    ativo: true,
    tipoEfetivo: 'fixo',
  },
  {
    id: 'membro-perozin',
    graduacao: 'Cad PM',
    nomeGuerra: 'Cad PM Perozin',
    nomeCompleto: 'Gustavo Perozin',
    re: '230060-5',
    especialidade: 'Elétrica e Gestão',
    telefone: '(14) 996556882',
    anoCurso: '2°CFO',
    pelotao: '',
    ativo: true,
    tipoEfetivo: 'fixo',
  },
  {
    id: 'membro-salvioni',
    graduacao: 'Cad PM',
    nomeGuerra: 'Cad PM Salvioni',
    nomeCompleto: 'Lucas Batista Salvioni',
    re: '252664-6',
    especialidade: 'Pintura e Gestão',
    telefone: '(17) 99753-2203',
    anoCurso: '2°CFO',
    pelotao: '',
    ativo: true,
    tipoEfetivo: 'fixo',
  },
  {
    id: 'membro-diomazio',
    graduacao: 'Cad PM',
    nomeGuerra: 'Cad PM Diomazio',
    nomeCompleto: 'Gabriel Fernando Diomazio Figueira',
    re: '144966-4',
    especialidade: 'Compras e Administração',
    telefone: '(18) 997423001',
    anoCurso: '3°CFO',
    pelotao: '',
    ativo: true,
    tipoEfetivo: 'fixo',
  },
  {
    id: 'membro-fabio',
    graduacao: 'Cad PM',
    nomeGuerra: 'Cad PM Fabio',
    nomeCompleto: 'João Batista de Moura Fábio',
    re: '252593-3',
    especialidade: 'Elétrica e Hidráulica',
    telefone: '(44) 998185606',
    anoCurso: '2°CFO',
    pelotao: '',
    ativo: true,
    tipoEfetivo: 'fixo',
  },
  {
    id: 'membro-freire',
    graduacao: 'Cad PM',
    nomeGuerra: 'Cad PM Freire',
    nomeCompleto: 'Israel Freire Moreira',
    re: '260062-5',
    especialidade: 'Auxiliar em Geral',
    telefone: '(21) 995925260',
    anoCurso: '1°CFO',
    pelotao: '',
    ativo: true,
    tipoEfetivo: 'fixo',
  },
  {
    id: 'membro-ulisses',
    graduacao: 'Cad PM',
    nomeGuerra: 'Cad PM Ulisses Silveira',
    nomeCompleto: 'Ulisses Silveira da Silva Gonçalves',
    re: '180823-A',
    especialidade: 'Elétrica e Auxiliar Geral',
    telefone: '(16) 992846868',
    anoCurso: '1°CFO',
    pelotao: '',
    ativo: true,
    tipoEfetivo: 'fixo',
  },
  {
    id: 'membro-ravely',
    graduacao: 'Cad PM',
    nomeGuerra: 'Cad PM Ravely',
    nomeCompleto: 'César Ravely Moura da Silva',
    re: '230342-6',
    especialidade: 'Auxiliar em Geral',
    telefone: '(11) 914811237',
    anoCurso: '1°CFO',
    pelotao: '',
    ativo: true,
    tipoEfetivo: 'fixo',
  },
  {
    id: 'membro-isack',
    graduacao: 'Cad PM',
    nomeGuerra: 'Cad PM Isack',
    nomeCompleto: 'Isack Soares Moreira',
    re: '250021-3',
    especialidade: 'Pintura e Auxiliar Geral',
    telefone: '(19) 998402562',
    anoCurso: '1°CFO',
    pelotao: '',
    ativo: true,
    tipoEfetivo: 'fixo',
  },
  {
    id: 'membro-augusto',
    graduacao: 'Cad PM',
    nomeGuerra: 'Cad PM Augusto',
    nomeCompleto: 'Leonardo Augusto Quinto',
    re: '170429-0',
    especialidade: 'UGE',
    telefone: '(17) 981193408',
    anoCurso: '2°CFO',
    pelotao: '',
    ativo: true,
    tipoEfetivo: 'fixo',
  },
  {
    id: 'membro-peciukonis',
    graduacao: 'Cad PM',
    nomeGuerra: 'Cad PM Peciukonis',
    nomeCompleto: 'Thiago Peciukonis',
    re: '191800-1',
    especialidade: 'UGE',
    telefone: '(11) 981724414',
    anoCurso: '2°CFO',
    pelotao: '',
    ativo: true,
    tipoEfetivo: 'fixo',
  },
];

export const DADOS_INICIAIS_EQUIPES: import('./types').EquipeManutencao[] = [
  {
    id: 'eq-1',
    nome: 'Equipe Alfa - Elétrica & Gestão',
    supervisor: '1º Ten PM Froes',
    encarregado: 'Cad PM Perozin',
    especialidade: 'Instalações elétricas, canaletas, tomadas e gestão',
    membros: ['Cad PM Perozin', 'Cad PM Fabio', 'Cad PM Ulisses Silveira'],
    corBadge: 'blue',
  },
  {
    id: 'eq-2',
    nome: 'Equipe Bravo - Compras & UGE',
    supervisor: '1º Ten PM Froes',
    encarregado: 'Cad PM Diomazio',
    especialidade: 'Administração de materiais, compras e gestão UGE',
    membros: ['Cad PM Diomazio', 'Cad PM Augusto', 'Cad PM Peciukonis'],
    corBadge: 'emerald',
  },
  {
    id: 'eq-3',
    nome: 'Equipe Charlie - Pintura & Auxiliar Geral',
    supervisor: '1º Ten PM Froes',
    encarregado: 'Cad PM Salvioni',
    especialidade: 'Pintura, reformas gerais e conservação predial',
    membros: ['Cad PM Salvioni', 'Cad PM Freire', 'Cad PM Ravely', 'Cad PM Isack'],
    corBadge: 'amber',
  },
];

// Helper para obter data de hoje no formato YYYY-MM-DD
export const formatarDataISO = (data: Date = new Date()): string => {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

export const adicionarDiasISO = (dataISO: string, dias: number): string => {
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  data.setDate(data.getDate() + dias);
  return formatarDataISO(data);
};

export const formatarDataCabecalho = (dataISO: string): string => {
  try {
    const [ano, mes, dia] = dataISO.split('-').map(Number);
    const dataObj = new Date(ano, mes - 1, dia);
    const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'long' });
    const diaFormatado = String(dia).padStart(2, '0');
    const mesNome = dataObj.toLocaleDateString('pt-BR', { month: 'long' });
    return `${diaSemana.toUpperCase()}, ${diaFormatado} de ${mesNome.toUpperCase()} de ${ano}`;
  } catch {
    return dataISO;
  }
};

export const formatarDataCurta = (dataISO: string): string => {
  try {
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
  } catch {
    return dataISO;
  }
};

export const getImpedimentoMembroNoDia = (
  membro: import('./types').MembroEquipe,
  dataISO: string
): string => {
  if (membro.impedimentosPorData && membro.impedimentosPorData[dataISO] !== undefined) {
    return membro.impedimentosPorData[dataISO] || '';
  }
  // Se ainda não tiver registro específico para esta data, e for a data de hoje:
  const hoje = formatarDataISO();
  if (dataISO === hoje && membro.impedimento) {
    return membro.impedimento;
  }
  return '';
};

export const temImpedimentoNoDia = (
  membro: import('./types').MembroEquipe,
  dataISO: string
): boolean => {
  const imp = getImpedimentoMembroNoDia(membro, dataISO);
  return Boolean(
    imp &&
    imp.trim().length > 0 &&
    imp.toLowerCase() !== 'sem impedimento' &&
    imp.toLowerCase() !== 'nenhum' &&
    imp.toLowerCase() !== 'apto'
  );
};

const hojeStr = formatarDataISO();
const ontemStr = adicionarDiasISO(hojeStr, -1);
const amanhaStr = adicionarDiasISO(hojeStr, 1);

export const DADOS_INICIAIS_MISSOES: import('./types').MissaoDiaria[] = [
  {
    id: 'mis-1',
    data: hojeStr,
    titulo: 'Instalação de tomadas 10A e canaletas no Alojamento',
    descricao: 'Instalar 3 canaletas 20x10mm e 4 conjuntos de tomadas 10A para novos postos de computadores da guarda.',
    local: 'Alojamento dos Cabos e Soldados - 3ª Cia',
    prioridade: 'Alta',
    equipeId: 'eq-1',
    equipeNome: 'Equipe Alfa - Elétrica & Rede',
    membrosDesignados: 'Cb PM Ribeiro, Cad PM Cristian',
    turno: 'Manhã (07h15)',
    concluida: true,
    dataConclusao: hojeStr,
    adiadaParaProximoDia: false,
    materiaisNecessarios: '3 canaletas 20x10mm, 4 tomadas 2P+T 10A',
    observacoes: 'Serviço finalizado com teste de carga aprovado.',
  },
  {
    id: 'mis-2',
    data: hojeStr,
    titulo: 'Substituição de chuveiros queimados e fiação',
    descricao: 'Efetuar troca de 2 chuveiros eletrônicos 220V 6800W e revisão nos cabos com terminal prensado.',
    local: 'Vestiário dos Cadetes - Bloco B',
    prioridade: 'Urgente',
    equipeId: 'eq-2',
    equipeNome: 'Equipe Bravo - Hidrossanitária',
    membrosDesignados: 'Sd PM Santana, Cad PM Diomazio',
    turno: 'Manhã (07h15)',
    concluida: true,
    dataConclusao: hojeStr,
    adiadaParaProximoDia: false,
    materiaisNecessarios: '2 chuveiros 220V, conectores cerâmicos, fita isolante',
    observacoes: 'Chuveiros regulados na tensão adequada.',
  },
  {
    id: 'mis-3',
    data: hojeStr,
    titulo: 'Retoque de pintura e calafetação nas paredes do corredor',
    descricao: 'Lixar áreas com marcas de raspagem, aplicar massa/selante PU e pintar com tinta acrílica branca fosca.',
    local: 'Corredor Principal e Sala de Instrução',
    prioridade: 'Média',
    equipeId: 'eq-3',
    equipeNome: 'Equipe Charlie - Pintura & Conservação',
    membrosDesignados: 'Cb PM Silva, Sd PM Pereira',
    turno: 'Tarde (9º e 10º tempos)',
    concluida: false,
    adiadaParaProximoDia: true,
    proximaData: amanhaStr,
    materiaisNecessarios: '0.5 lata de tinta branca 20L, lixa para parede, rolo de lã',
    observacoes: 'Necessário aguardar secagem do emboço; serviço continuará amanhã.',
  },
  {
    id: 'mis-4',
    data: hojeStr,
    titulo: 'Troca de assentos sanitários almofadados avariados',
    descricao: 'Substituição de 4 assentos plásticos trincados por modelos almofadados de alta resistência nos sanitários.',
    local: 'Sanitários Coletivos - Piso 1',
    prioridade: 'Média',
    equipeId: 'eq-2',
    equipeNome: 'Equipe Bravo - Hidrossanitária',
    membrosDesignados: 'Sd PM Santana',
    turno: 'Tarde (9º e 10º tempos)',
    concluida: false,
    adiadaParaProximoDia: false,
    materiaisNecessarios: '4 assentos sanitários brancos almofadados',
    observacoes: 'Em andamento durante o término do expediente.',
  },
  {
    id: 'mis-5',
    data: amanhaStr,
    titulo: 'Continuação da pintura do corredor e rodapés',
    descricao: 'Segunda demão de tinta acrílica e limpeza geral de respingos nas luminárias e interruptores.',
    local: 'Corredor Principal - 3ª Cia',
    prioridade: 'Média',
    equipeId: 'eq-3',
    equipeNome: 'Equipe Charlie - Pintura & Conservação',
    membrosDesignados: 'Cb PM Silva, Sd PM Pereira',
    turno: 'Manhã (07h15)',
    concluida: false,
    adiadaParaProximoDia: false,
    materiaisNecessarios: 'Tinta acrílica, fita crepe para proteção',
    observacoes: 'Missão postergada do dia anterior.',
  },
];

export const DADOS_INICIAIS_BANCO_FORNECEDORES: EmpresaCadastrada[] = [
  {
    id: 'banco-forn-1',
    name: 'Comercial Barro Branco Materiais de Construção',
    razaoSocial: 'Comercial Barro Branco Mat. Construção Ltda - ME',
    cnpj: '12.345.678/0001-90',
    endereco: 'Av. Nova Cantareira, 3200 - Tucuruvi, São Paulo - SP',
    contato: '(11) 2203-1100 / vendas@barrobrancomat.com.br',
    telefone: '(11) 2203-1100',
    email: 'vendas@barrobrancomat.com.br',
    segmento: 'Construção & Alvenaria',
    observacoes: 'Fornecedor local tradicional na região do Barro Branco/Cantareira.',
    dataCadastro: '2026-08-01',
  },
  {
    id: 'banco-forn-2',
    name: 'EletroNorte Distribuidora de Elétrica',
    razaoSocial: 'EletroNorte Materiais Elétricos e Hidráulicos Ltda',
    cnpj: '98.765.432/0001-12',
    endereco: 'Rua Voluntários da Pátria, 1450 - Santana, São Paulo - SP',
    contato: '(11) 2971-8844 / orcamento@eletronorte.com.br',
    telefone: '(11) 2971-8844',
    email: 'orcamento@eletronorte.com.br',
    segmento: 'Materiais Elétricos & Iluminação',
    observacoes: 'Distribuidora especializada em fiação, disjuntores, canaletas e reatores.',
    dataCadastro: '2026-08-01',
  },
  {
    id: 'banco-forn-3',
    name: 'ConstruFácil Centro de Compras',
    razaoSocial: 'ConstruFácil Materiais Básicos e Acabamentos S.A.',
    cnpj: '45.678.901/0001-34',
    endereco: 'Av. Santos Dumont, 800 - Bom Retiro, São Paulo - SP',
    contato: '(11) 3326-5500 / contato@construfacilsp.com.br',
    telefone: '(11) 3326-5500',
    email: 'contato@construfacilsp.com.br',
    segmento: 'Hidráulica & Acabamentos',
    observacoes: 'Louças sanitárias, chuveiros, torneiras e conexões de PVC.',
    dataCadastro: '2026-08-01',
  },
  {
    id: 'banco-forn-4',
    name: 'Cores & Tintas Paulistana',
    razaoSocial: 'Comercial de Tintas e Abrasivos Paulistana Eireli',
    cnpj: '33.221.554/0001-88',
    endereco: 'Av. Cruzeiro do Sul, 2100 - Canindé, São Paulo - SP',
    contato: '(11) 2221-4433 / vendas@corespauistana.com.br',
    telefone: '(11) 2221-4433',
    email: 'vendas@corespauistana.com.br',
    segmento: 'Pintura & Vernizes',
    observacoes: 'Tintas acrílicas, esmaltes sintéticos, rolos de lã e massas corridas.',
    dataCadastro: '2026-08-10',
  },
  {
    id: 'banco-forn-5',
    name: 'MegaFer Ferramentas e Fixações',
    razaoSocial: 'MegaFer Ferragens, Parafusos e Ferramentas Ltda',
    cnpj: '21.889.776/0001-55',
    endereco: 'Rua Florêncio de Abreu, 750 - Centro, São Paulo - SP',
    contato: '(11) 3228-9900 / comercial@megafer.com.br',
    telefone: '(11) 3228-9900',
    email: 'comercial@megafer.com.br',
    segmento: 'Ferramentas & Ferragens',
    observacoes: 'Fixadores, brocas, discos de corte, selantes PU e ferramentas manuais.',
    dataCadastro: '2026-08-15',
  },
];


