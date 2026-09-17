import { GoogleGenAI, Type } from '@google/genai';

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  try {
    const { fileBase64, mimeType, textoBruto } = req.body || {};

    if (!fileBase64 && !textoBruto) {
      return res.status(400).json({ error: 'Nenhum arquivo ou texto enviado para extração.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Chave GEMINI_API_KEY não configurada no ambiente. Configure nas variáveis de ambiente da Vercel.',
      });
    }

    const ai = getAI();

    const promptInstrucoes = `
Você é um especialista tributário e de compras que processa Notas Fiscais Eletrônicas brasileiras (DANFE).
Analise o documento anexo (que pode conter múltiplas páginas, marcas d'água como '2ª VIA', números fiscais variados, NCM, CST, CFOP, Bc. ICMS, etc.).

REQUISITOS OBRIGATÓRIOS:
1. GERE 'textoExtraido':
   - Uma transcrição completa, limpa e legível de toda a Nota Fiscal, organizada por seções:
     - DADOS DO EMITENTE / FORNECEDOR (Razão Social, Nome Fantasia, CNPJ, Endereço se visível).
     - IDENTIFICAÇÃO DA NOTA (Número da NF, Série, Data de Emissão, Chave de Acesso se houver).
     - RELAÇÃO TEXTUAL DOS PRODUTOS/MATERIAIS (cada item com descrição limpa sem o '- EAN', unidade, quantidade, valor unitário e valor total).
     - TOTAIS DA NOTA (Valor total dos produtos, descontos se houver, valor total da nota).
   - Este texto deve ser detalhado e perfeito para leitura humana e cópia/relatório.

2. GERE 'fornecedor':
   - O nome do fornecedor/emitente identificado no cabeçalho (se for a empresa padrão das cotações da unidade, 'Comercial Barro Branco Materiais de Construção').

3. GERE 'itens' (Array de objetos com cada material extraído):
   - 'desc': DESCRIÇÃO DO MATERIAL. REGRA CRÍTICA: Desconsidere rigorosamente o '- EAN' e tudo o que vier a seguir (por exemplo, remova '- EAN: 789...', '- Cód. Forn: ...', 'EAN 789...'). Remova também traços soltos no final. Apenas o nome do material deve permanecer.
   - 'unid': UNIDADE DE FORNECIMENTO da nota (ex: UN, M2, LATA, CX, PC, RL, KG, M, CJ).
   - 'qtd': QUANTIDADE comprada em formato numérico (ex: 3, 2, 1, 10, 6, 2.3).
   - 'unit': PREÇO UNITÁRIO numérico (ex: 7.99, 3.29, 20.90, 129.00).
   - 'total': PREÇO TOTAL numérico do item (ex: 23.97, 6.58, 48.07, 774.00).

Ignore marcas d'água como '2ª VIA' ou 'DOCUMENTO AUXILIAR DA NOTA FISCAL' e concentre-se na extração precisa dos itens.
`;

    let contents: any;

    if (fileBase64 && mimeType) {
      contents = {
        parts: [
          {
            inlineData: {
              mimeType,
              data: fileBase64,
            },
          },
          {
            text: promptInstrucoes,
          },
        ],
      };
    } else {
      contents = {
        parts: [
          {
            text: `${promptInstrucoes}\n\nTEXTO BRUTO DA NOTA FISCAL:\n${textoBruto}`,
          },
        ],
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        thinkingConfig: {
          thinkingLevel: 'LOW' as any,
        },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fornecedor: {
              type: Type.STRING,
              description: 'Nome do fornecedor ou emitente da nota',
            },
            textoExtraido: {
              type: Type.STRING,
              description: 'Texto transcrito completo e organizado da Nota Fiscal',
            },
            itens: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  desc: {
                    type: Type.STRING,
                    description: 'Descrição limpa do material sem o - EAN e o que seguir',
                  },
                  unid: {
                    type: Type.STRING,
                    description: 'Unidade de fornecimento (UN, M2, CX, LATA, etc.)',
                  },
                  qtd: {
                    type: Type.NUMBER,
                    description: 'Quantidade numérica do item',
                  },
                  unit: {
                    type: Type.NUMBER,
                    description: 'Preço unitário numérico',
                  },
                  total: {
                    type: Type.NUMBER,
                    description: 'Preço total numérico do item',
                  },
                },
                required: ['desc', 'unid', 'qtd', 'unit', 'total'],
              },
            },
          },
          required: ['textoExtraido', 'itens'],
        },
      },
    });

    const responseText = response.text?.trim() || '{}';
    const parsedData = JSON.parse(responseText);

    return res.status(200).json({
      success: true,
      fornecedor: parsedData.fornecedor || 'Comercial Barro Branco Materiais de Construção',
      textoExtraido: parsedData.textoExtraido || '',
      itens: parsedData.itens || [],
    });
  } catch (err: any) {
    console.error('Erro ao processar extração no Gemini (Vercel):', err);
    return res.status(500).json({
      error: err.message || 'Falha ao processar Nota Fiscal via IA.',
    });
  }
}
