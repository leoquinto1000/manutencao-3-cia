import * as pdfjsLib from 'pdfjs-dist';

// Configuração do worker do PDF.js para navegadores
try {
  if (typeof window !== 'undefined') {
    // Usamos o CDN jsdelivr ou unpkg correspondente à versão do pdfjs-dist
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
  }
} catch (err) {
  console.warn('Não foi possível configurar workerSrc do PDF.js automaticamente:', err);
}

export interface ItemDANFEExtraido {
  id: string;
  codigo?: string;
  desc: string;
  descOriginal?: string;
  unid: string;
  qtd: number;
  unit: number;
  total: number;
  ncm?: string;
  cfop?: string;
}

/**
 * Remove '- EAN' e tudo o que vier a seguir da descrição do material,
 * além de limpar espaços em branco e hífens residuais no final.
 * Exemplo:
 * 'CANALETA 20X10MM COM ADESIVO BR 2M - EAN: 7896565962470 - Cód. Forn: 5247'
 * -> 'CANALETA 20X10MM COM ADESIVO BR 2M'
 */
export function limparDescricaoMaterial(rawDesc: string): string {
  if (!rawDesc) return '';

  let clean = rawDesc.trim();

  // Remove quebras de linha no meio da descrição e normaliza espaços
  clean = clean.replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ');

  // Remove qualquer menção a EAN e tudo o que segue (- EAN:, - EAN, EAN:, EAN 789...)
  clean = clean.replace(/\s*-\s*EAN[:\s].*$/i, '');
  clean = clean.replace(/\s*EAN[:\s].*$/i, '');
  clean = clean.replace(/\s*-\s*COD\.?\s*FORN[:\s].*$/i, '');
  clean = clean.replace(/\s*-\s*CÓD\.?\s*FORN[:\s].*$/i, '');

  // Remove também sufixos de conversão que às vezes ficam em notas (ex: '- Conversão 2,300 M2 p/ 1,000 CX')
  clean = clean.replace(/\s*-\s*Conversão\s+.*$/i, '');

  // Remove pontuações ou traços soltos no final
  clean = clean.replace(/[\s\-_.,;:]+$/, '').trim();

  return clean;
}

/**
 * Converte valor numérico no formato brasileiro ('1.234,56' ou '7,9900' ou '3,000') para number
 */
export function converterNumeroBR(val: string | number): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;

  const str = val
    .toString()
    .replace(/[R$\s]/g, '')
    .trim();

  if (!str) return 0;

  // Se tiver vírgula, tratamos padrão pt-BR: '1.234,56' ou '7,99'
  if (str.includes(',')) {
    const limpo = str.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(limpo);
    return isNaN(n) ? 0 : n;
  }

  // Se não tiver vírgula mas tiver ponto (ex: '7.99' ou '3.000')
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

/**
 * Extrai texto completo de um arquivo PDF carregado (todas as páginas),
 * agrupando os elementos por coordenadas Y e X para preservar linhas da tabela.
 */
export async function extrairTextoDePDF(file: File | ArrayBuffer): Promise<string> {
  const arrayBuffer = file instanceof ArrayBuffer ? file : await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
    disableFontFace: true,
  });

  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const linhasTextoDoc: string[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items as Array<{
      str: string;
      transform: number[];
      width: number;
      height: number;
    }>;

    if (!items || items.length === 0) continue;

    // Agrupa itens por linha Y aproximada (tolerância de 3.5px)
    const linhasMap: Map<number, Array<{ x: number; text: string }>> = new Map();

    for (const item of items) {
      const text = item.str;
      if (!text || text.trim().length === 0) continue;

      // Filtra marca d'água comum (ex: '2ª VIA', '2a VIA', 'FL 1/4')
      const textLower = text.trim().toLowerCase();
      if (textLower === '2ª via' || textLower === '2a via' || textLower === 'segunda via') {
        continue;
      }

      const x = Math.round(item.transform[4]);
      const y = Math.round(item.transform[5]);

      // Encontra linha Y existente dentro da tolerância
      let foundY: number | null = null;
      for (const existingY of linhasMap.keys()) {
        if (Math.abs(existingY - y) <= 3.5) {
          foundY = existingY;
          break;
        }
      }

      if (foundY !== null) {
        linhasMap.get(foundY)!.push({ x, text });
      } else {
        linhasMap.set(y, [{ x, text }]);
      }
    }

    // Ordena linhas de cima para baixo (em PDF, maior Y é mais alto na página)
    const sortedYs = Array.from(linhasMap.keys()).sort((a, b) => b - a);

    for (const y of sortedYs) {
      const lineItems = linhasMap.get(y)!;
      // Ordena itens da esquerda para a direita
      lineItems.sort((a, b) => a.x - b.x);
      const linhaCompleta = lineItems.map((it) => it.text).join(' ');
      linhasTextoDoc.push(linhaCompleta.trim());
    }

    linhasTextoDoc.push(`--- FIM DA PÁGINA ${pageNum} ---`);
  }

  return linhasTextoDoc.join('\n');
}

/**
 * Analisador inteligente de linhas de DANFE (Nota Fiscal Eletrônica).
 * Consegue ler tabelas com códigos de barras, quebras de linhas, marcas d'água, etc.
 */
export function parseDANFETexto(textoCompleto: string): ItemDANFEExtraido[] {
  if (!textoCompleto || textoCompleto.trim().length === 0) return [];

  const linhas = textoCompleto
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const itens: ItemDANFEExtraido[] = [];

  // Padrão típico de linha de produto de DANFE:
  // [COD] [DESCRIÇÃO...] [NCM] [CST] [CFOP] [UN] [QTDE] [VL. UNIT.] [VL. TOTAL]
  // Ex: 89477101 CANALETA 20X10MM COM ADESIVO BR 2M - EAN: 7896565962470 3916.20.00 060 5405 UN 3,000 7,9900 23,97
  // Regex flexível para capturar colunas da direita (Unidade, Qtd, Preço Unitário, Preço Total)
  const regexFimLinhaDANFE =
    /\s+(UN|M2|LATA|CX|PC|RL|KG|M|CJ|SC|PAR|FD|MIL)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)(?:\s+.*)?$/i;

  // Regex para linha que começa com código numérico (ex: 8 dígitos como 89477101 ou 69994940)
  const regexInicioCodigo = /^(\d{6,14})\s+(.+)$/;

  let itemEmConstrucao: {
    codigo?: string;
    linhasDescricao: string[];
    unid: string;
    qtd: number;
    unit: number;
    total: number;
  } | null = null;

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];

    // Ignora linhas de cabeçalho, rodapé ou marcas d'água
    if (
      linha.includes('DADOS DOS PRODUTOS') ||
      linha.includes('CÁLCULO DO IMPOSTO') ||
      linha.includes('CÁLCULO DO ISSQN') ||
      linha.includes('DADOS ADICIONAIS') ||
      linha.includes('--- FIM DA PÁGINA') ||
      linha.includes('INFORMAÇÕES DO LOCAL') ||
      linha.includes('TRANSPORTADOR/VOLUMES') ||
      linha.startsWith('CHAVE DE ACESSO') ||
      linha.startsWith('PROTOCOLO DE AUTORIZAÇÃO') ||
      linha.startsWith('NATUREZA DA OPERAÇÃO') ||
      linha.includes('DOCUMENTO AUXILIAR DA NOTA') ||
      /^(2ª|2a)\s+via/i.test(linha)
    ) {
      continue;
    }

    // Verifica se a linha tem colunas numéricas de fechamento de produto (UN, QTDE, VL. UNIT, VL. TOTAL)
    const matchFim = linha.match(regexFimLinhaDANFE);

    if (matchFim) {
      // Se tínhamos um item anterior em construção, salvamos ele
      if (itemEmConstrucao) {
        const descCompleta = itemEmConstrucao.linhasDescricao.join(' ');
        itens.push({
          id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
          codigo: itemEmConstrucao.codigo,
          descOriginal: descCompleta,
          desc: limparDescricaoMaterial(descCompleta),
          unid: itemEmConstrucao.unid.toUpperCase(),
          qtd: itemEmConstrucao.qtd,
          unit: itemEmConstrucao.unit,
          total: itemEmConstrucao.total,
        });
        itemEmConstrucao = null;
      }

      const unid = matchFim[1];
      const qtdStr = matchFim[2];
      const unitStr = matchFim[3];
      const totalStr = matchFim[4];

      const qtd = converterNumeroBR(qtdStr);
      const unit = converterNumeroBR(unitStr);
      const total = converterNumeroBR(totalStr);

      // Parte antes das colunas numéricas
      let prefixo = linha.substring(0, matchFim.index).trim();

      // Remove NCM, CST, CFOP do final do prefixo se existirem (ex: 3916.20.00 060 5405)
      prefixo = prefixo.replace(/\s+\d{4}\.?\d{2}\.?\d{2}\s+\d{3}\s+\d{4}$/, '');
      prefixo = prefixo.replace(/\s+\d{3}\s+\d{4}$/, '');

      let codigo: string | undefined;
      let descTexto = prefixo;

      const matchCod = prefixo.match(regexInicioCodigo);
      if (matchCod) {
        codigo = matchCod[1];
        descTexto = matchCod[2];
      }

      itemEmConstrucao = {
        codigo,
        linhasDescricao: [descTexto],
        unid,
        qtd,
        unit,
        total,
      };
    } else if (itemEmConstrucao) {
      // É uma linha de continuação da descrição (ex: '- EAN: 7891435933680 - Cód. Forn: 57241065')
      // Adiciona à descrição
      if (
        !linha.startsWith('Bc.ICMS') &&
        !linha.startsWith('VL. TOTAL') &&
        !linha.includes('BASE DE CÁLCULO')
      ) {
        itemEmConstrucao.linhasDescricao.push(linha);
      }
    } else {
      // Tentativa de ler linha copiada de planilha / texto livre com tabulações
      const partesTab = linha.split('\t');
      if (partesTab.length >= 3) {
        const descBruta = partesTab[0].trim();
        const unid = partesTab.length >= 4 ? partesTab[1].trim() : 'UN';
        const qtdIdx = partesTab.length >= 4 ? 2 : 1;
        const unitIdx = partesTab.length >= 4 ? 3 : 2;

        const qtd = converterNumeroBR(partesTab[qtdIdx]);
        const unit = converterNumeroBR(partesTab[unitIdx]);
        const total = qtd * unit;

        itens.push({
          id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
          descOriginal: descBruta,
          desc: limparDescricaoMaterial(descBruta),
          unid: unid || 'UN',
          qtd: qtd || 1,
          unit: unit || 0,
          total: total || 0,
        });
      }
    }
  }

  // Se sobrou um item no final
  if (itemEmConstrucao) {
    const descCompleta = itemEmConstrucao.linhasDescricao.join(' ');
    itens.push({
      id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      codigo: itemEmConstrucao.codigo,
      descOriginal: descCompleta,
      desc: limparDescricaoMaterial(descCompleta),
      unid: itemEmConstrucao.unid.toUpperCase(),
      qtd: itemEmConstrucao.qtd,
      unit: itemEmConstrucao.unit,
      total: itemEmConstrucao.total,
    });
  }

  return itens;
}

/**
 * 32 Itens extraídos com exatidão máxima da Nota Fiscal DANFE Obramax (anexada pelo usuário),
 * com a remoção solicitada do '- EAN' e códigos subsequentes.
 */
export const ITENS_EXEMPLO_OBRAMAX_DANFE: ItemDANFEExtraido[] = [
  {
    id: 'obr-1',
    codigo: '89477101',
    descOriginal: 'CANALETA 20X10MM COM ADESIVO BR 2M - EAN: 7896565962470 - Cód. Forn: 5247',
    desc: 'CANALETA 20X10MM COM ADESIVO BR 2M',
    unid: 'UN',
    qtd: 3,
    unit: 7.99,
    total: 23.97,
  },
  {
    id: 'obr-2',
    codigo: '89352431',
    descOriginal: 'PLACA 2 POSTOS SEP. 4X2 BR ARIA - EAN: 7891435936902 - Cód. Forn: 57203006',
    desc: 'PLACA 2 POSTOS SEP. 4X2 BR ARIA',
    unid: 'UN',
    qtd: 2,
    unit: 3.29,
    total: 6.58,
  },
  {
    id: 'obr-3',
    codigo: '89854324',
    descOriginal: 'SELANTE ADESIVO PU40 TURBO PT 310G BT - EAN: 7898570238786 - Cód. Forn: 21689',
    desc: 'SELANTE ADESIVO PU40 TURBO PT 310G BT',
    unid: 'UN',
    qtd: 1,
    unit: 16.90,
    total: 16.90,
  },
  {
    id: 'obr-4',
    codigo: '89804176',
    descOriginal: 'CONJ 2 TOM 2P+T 10A 4X2 BR ARIA - EAN: 7891435933680 - Cód. Forn: 57241065 - V. DESC: R$ 8,30',
    desc: 'CONJ 2 TOM 2P+T 10A 4X2 BR ARIA',
    unid: 'UN',
    qtd: 10,
    unit: 13.89,
    total: 138.90,
  },
  {
    id: 'obr-5',
    codigo: '89791233',
    descOriginal: 'TINTA ECN ACR FSC DESEMP BR 20L ECN - EAN: 7891019965081 - Cód. Forn: 5885755',
    desc: 'TINTA ECN ACR FSC DESEMP BR 20L ECN',
    unid: 'UN',
    qtd: 1,
    unit: 209.90,
    total: 209.90,
  },
  {
    id: 'obr-6',
    codigo: '89850666',
    descOriginal: 'RESIST CHUV LOREN SHOWER 220V 6800W-LORE - EAN: 7896451860598 - Cód. Forn: 7589150',
    desc: 'RESIST CHUV LOREN SHOWER 220V 6800W-LORE',
    unid: 'UN',
    qtd: 6,
    unit: 42.90,
    total: 257.40,
  },
  {
    id: 'obr-7',
    codigo: '89352543',
    descOriginal: 'MODULO INT PARAL 6A BR ARIA - EAN: 7891435937091 - Cód. Forn: 57217002',
    desc: 'MODULO INT PARAL 6A BR ARIA',
    unid: 'UN',
    qtd: 1,
    unit: 7.29,
    total: 7.29,
  },
  {
    id: 'obr-8',
    codigo: '89854331',
    descOriginal: 'SELANTE ADESIVO PU40 TURBO BG 310G BT - EAN: 7898570238779 - Cód. Forn: 21688',
    desc: 'SELANTE ADESIVO PU40 TURBO BG 310G BT',
    unid: 'UN',
    qtd: 1,
    unit: 16.99,
    total: 16.99,
  },
  {
    id: 'obr-9',
    codigo: '89797414',
    descOriginal: 'TINTA PRM ACR FSC PISO VM DMC 3.6L SV - EAN: 7891260056237 - Cód. Forn: 53420116',
    desc: 'TINTA PRM ACR FSC PISO VM DMC 3.6L SV',
    unid: 'UN',
    qtd: 1,
    unit: 104.90,
    total: 104.90,
  },
  {
    id: 'obr-10',
    codigo: '89888134',
    descOriginal: 'ESCOVA SANITARIA REDONDA BR - EAN: 7891222376294 - Cód. Forn: ESAN2/R*BR1',
    desc: 'ESCOVA SANITARIA REDONDA BR',
    unid: 'UN',
    qtd: 6,
    unit: 22.90,
    total: 137.40,
  },
  {
    id: 'obr-11',
    codigo: '89145532',
    descOriginal: 'PISTOLA SILICONE ABERTA 310ML SPARTA - EAN: 7899612796929 - Cód. Forn: 6863655',
    desc: 'PISTOLA SILICONE ABERTA 310ML SPARTA',
    unid: 'UN',
    qtd: 1,
    unit: 8.99,
    total: 8.99,
  },
  {
    id: 'obr-12',
    codigo: '89436921',
    descOriginal: 'PORTA SHAMPOO DP MASTER 42,8CM PT - EAN: 7897807425586 - Cód. Forn: 2558',
    desc: 'PORTA SHAMPOO DP MASTER 42,8CM PT',
    unid: 'UN',
    qtd: 6,
    unit: 50.90,
    total: 305.40,
  },
  {
    id: 'obr-13',
    codigo: '89146995',
    descOriginal: 'PLUGUE MOV P.CAB 2P 10A 250V PT - EAN: 7898322644841 - Cód. Forn: 14030',
    desc: 'PLUGUE MOV P.CAB 2P 10A 250V PT',
    unid: 'UN',
    qtd: 1,
    unit: 2.89,
    total: 2.89,
  },
  {
    id: 'obr-14',
    codigo: '89828144',
    descOriginal: 'KIT PAR CHIP PHS+BUC 4.5X60MM 8MM 50PCS - EAN: 7898493219640 - Cód. Forn: 2112',
    desc: 'KIT PAR CHIP PHS+BUC 4.5X60MM 8MM 50PCS',
    unid: 'UN',
    qtd: 1,
    unit: 18.99,
    total: 18.99,
  },
  {
    id: 'obr-15',
    codigo: '89797435',
    descOriginal: 'TINTA PRM ACR FSC PISO AZUL 3.6L SV - EAN: 7891260056022 - Cód. Forn: 53420275',
    desc: 'TINTA PRM ACR FSC PISO AZUL 3.6L SV',
    unid: 'UN',
    qtd: 1,
    unit: 104.90,
    total: 104.90,
  },
  {
    id: 'obr-16',
    codigo: '89048274',
    descOriginal: 'FITA VEDA ROSCA 18MMX50M AMANCO - EAN: 7891960629667 - Cód. Forn: 000000000000993317',
    desc: 'FITA VEDA ROSCA 18MMX50M AMANCO',
    unid: 'UN',
    qtd: 2,
    unit: 11.69,
    total: 23.38,
  },
  {
    id: 'obr-17',
    codigo: '89352536',
    descOriginal: 'MODULO INT SIMP 6A BR ARIA - EAN: 7891435935967 - Cód. Forn: 57217001',
    desc: 'MODULO INT SIMP 6A BR ARIA',
    unid: 'UN',
    qtd: 3,
    unit: 5.09,
    total: 15.27,
  },
  {
    id: 'obr-18',
    codigo: '89641405',
    descOriginal: 'FITA CREPE BRANCA 48MMX50M TEKBOND - EAN: 7898472262513 - Cód. Forn: 21111048500',
    desc: 'FITA CREPE BRANCA 48MMX50M TEKBOND',
    unid: 'UN',
    qtd: 1,
    unit: 12.90,
    total: 12.90,
  },
  {
    id: 'obr-19',
    codigo: '89551791',
    descOriginal: 'EXTENSAO PROLONG PRQ 2P+T 20A 20M PT - EAN: 7897356526338 - Cód. Forn: 226336',
    desc: 'EXTENSAO PROLONG PRQ 2P+T 20A 20M PT',
    unid: 'UN',
    qtd: 1,
    unit: 229.90,
    total: 229.90,
  },
  {
    id: 'obr-20',
    codigo: '89267416',
    descOriginal: 'VALV MIC STOCMATIC CR AUT 2010 - EAN: 7894627030600 - Cód. Forn: 760499',
    desc: 'VALV MIC STOCMATIC CR AUT 2010',
    unid: 'UN',
    qtd: 1,
    unit: 249.90,
    total: 249.90,
  },
  {
    id: 'obr-21',
    codigo: '89266933',
    descOriginal: 'FITA ISOLANTE IMPERIAL SLIM 18MM 20M - EAN: 7891040105502 - Cód. Forn: HB004216362',
    desc: 'FITA ISOLANTE IMPERIAL SLIM 18MM 20M',
    unid: 'UN',
    qtd: 3,
    unit: 8.79,
    total: 26.37,
  },
  {
    id: 'obr-22',
    codigo: '89087922',
    descOriginal: 'TINTA PRM ACR FSC NVCOR PISO VERDE 3.6L - EAN: 7891323079612 - Cód. Forn: 38088101',
    desc: 'TINTA PRM ACR FSC NVCOR PISO VERDE 3.6L',
    unid: 'UN',
    qtd: 1,
    unit: 125.90,
    total: 125.90,
  },
  {
    id: 'obr-23',
    codigo: '89177761',
    descOriginal: 'ASSENTO CONV SOFT PP BR-ASTRA - EAN: 7891222045879 - Cód. Forn: TPJ/AS*BR1',
    desc: 'ASSENTO CONV SOFT PP BR-ASTRA',
    unid: 'UN',
    qtd: 8,
    unit: 36.49,
    total: 291.92,
  },
  {
    id: 'obr-24',
    codigo: '89628616',
    descOriginal: 'PARAF AGL CH 5.0X70MM BLOCO OCO 6MM 15PC - EAN: 7896526634538 - Cód. Forn: SPOC/35',
    desc: 'PARAF AGL CH 5.0X70MM BLOCO OCO 6MM 15PC',
    unid: 'UN',
    qtd: 1,
    unit: 19.99,
    total: 19.99,
  },
  {
    id: 'obr-25',
    codigo: '89797365',
    descOriginal: 'TINTA PRM ACR FSC PISO AM DMC 3,6L SV - EAN: 7891260056022 - Cód. Forn: 53419796',
    desc: 'TINTA PRM ACR FSC PISO AM DMC 3,6L SV',
    unid: 'UN',
    qtd: 1,
    unit: 104.90,
    total: 104.90,
  },
  {
    id: 'obr-26',
    codigo: '69994940',
    descOriginal: 'CABIDE FIXAR GANCHO BASIC PT - EAN: 7899006607107 - Cód. Forn: 31297',
    desc: 'CABIDE FIXAR GANCHO BASIC PT',
    unid: 'UN',
    qtd: 2,
    unit: 19.90,
    total: 39.80,
  },
  {
    id: 'obr-27',
    codigo: '89828130',
    descOriginal: 'KIT PAR CHIP PHS+BUC 4.0X45MM 6MM 100PCS - EAN: 7898493219633 - Cód. Forn: 2111',
    desc: 'KIT PAR CHIP PHS+BUC 4.0X45MM 6MM 100PCS',
    unid: 'UN',
    qtd: 2,
    unit: 19.99,
    total: 39.98,
  },
  {
    id: 'obr-28',
    codigo: '89659752',
    descOriginal: 'CHUV LOREN SHOWER ELETRON 220V 6800W-LOR - EAN: 7896451860529 - Cód. Forn: 7510157',
    desc: 'CHUV LOREN SHOWER ELETRON 220V 6800W-LOR',
    unid: 'UN',
    qtd: 6,
    unit: 129.00,
    total: 774.00,
  },
  {
    id: 'obr-29',
    codigo: '89628602',
    descOriginal: 'PARAF AGL CH 4.5X60MM BLOCO OCO 6MM 15PC - EAN: 7896526634521 - Cód. Forn: SPOC/29',
    desc: 'PARAF AGL CH 4.5X60MM BLOCO OCO 6MM 15PC',
    unid: 'UN',
    qtd: 1,
    unit: 12.99,
    total: 12.99,
  },
  {
    id: 'obr-30',
    codigo: '89391995',
    descOriginal: 'REV 325783 RT AC BR 32X59 2,30M2 - EAN: 7899695225729 - Cód. Forn: LDL325783 A - Conversão 2,300 M2 p/ 1,000 CX',
    desc: 'REV 325783 RT AC BR 32X59 2,30M2',
    unid: 'M2',
    qtd: 2.3,
    unit: 20.90,
    total: 48.07,
  },
  {
    id: 'obr-31',
    codigo: '89499816',
    descOriginal: 'TORN TANQ/JARD LONGA LUNY 1130 C55 CR - EAN: 7894248315841 - Cód. Forn: 31584',
    desc: 'TORN TANQ/JARD LONGA LUNY 1130 C55 CR',
    unid: 'UN',
    qtd: 2,
    unit: 57.90,
    total: 115.80,
  },
  {
    id: 'obr-32',
    codigo: '89443382',
    descOriginal: 'RESIST CHUV IDEALE PLUS 4T 220V 6800W-ZA - EAN: 7897273257568 - Cód. Forn: 92050009',
    desc: 'RESIST CHUV IDEALE PLUS 4T 220V 6800W-ZA',
    unid: 'UN',
    qtd: 6,
    unit: 21.90,
    total: 131.40,
  },
];

/**
 * Gera um texto transcrito completo, limpo e legível da Nota Fiscal
 * contendo cabeçalho, relação de materiais sem o '- EAN', colunas e totais.
 */
export function gerarTextoFormatadoNF(
  itens: ItemDANFEExtraido[],
  fornecedor: string = 'Comercial Barro Branco Materiais de Construção',
  numeroNF: string = '000.089.443 (2ª VIA)'
): string {
  const qtdTotal = itens.reduce((acc, it) => acc + (Number(it.qtd) || 0), 0);
  const valorTotal = itens.reduce((acc, it) => acc + (Number(it.total) || 0), 0);

  const linhas: string[] = [
    '========================================================================',
    '        DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA (DANFE)            ',
    '========================================================================',
    `EMITENTE / FORNECEDOR : ${fornecedor}`,
    `DOCUMENTO / IDENTIF.  : DANFE NF-e ${numeroNF}`,
    `DESTINATÁRIO          : 3ª Cia - PMESP / APMBB`,
    `FINALIDADE            : Prestação de Contas / Pesquisa de Preços`,
    `TOTAL DE MATERIAIS    : ${itens.length} itens`,
    '========================================================================',
    '',
    'RELAÇÃO DE MATERIAIS EXTRAÍDOS (DESCRIÇÃO SEM CÓDIGO "- EAN"):',
    '------------------------------------------------------------------------',
  ];

  itens.forEach((item, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    const unitStr = (Number(item.unit) || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    const totalStr = (Number(item.total) || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    linhas.push(`[${num}] ${item.desc}`);
    linhas.push(
      `     UN FORN: ${item.unid.padEnd(5)} | QTD: ${String(item.qtd).padEnd(6)} | PREÇO UNIT: ${unitStr.padEnd(12)} | PREÇO TOTAL: ${totalStr}`
    );
    linhas.push('------------------------------------------------------------------------');
  });

  linhas.push('');
  linhas.push('========================================================================');
  linhas.push('TOTAIS CONSOLIDADOS DA NOTA FISCAL:');
  linhas.push(`- Quantidade Total de Itens/Peças : ${qtdTotal.toLocaleString('pt-BR')}`);
  linhas.push(
    `- Valor Total dos Produtos        : ${valorTotal.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })}`
  );
  linhas.push(
    `- Valor Total da Nota Fiscal      : ${valorTotal.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })}`
  );
  linhas.push('========================================================================');

  return linhas.join('\n');
}

