import React, { useRef, useState } from 'react';
import { TextoParteState, NFInstance } from '../../types';
import { RefreshCw, Printer, FileText } from 'lucide-react';
import { ModalVisualizadorPDF } from './ModalVisualizadorPDF';
import { imprimirEmNovaJanela, executarImpressaoA4 } from '../../utils/pdfPrintHelper';

interface TextoParteViewProps {
  textoParte: TextoParteState;
  onChangeTextoParte: (updated: TextoParteState) => void;
  nfs: NFInstance[];
}

export const TextoParteView: React.FC<TextoParteViewProps> = ({
  textoParte,
  onChangeTextoParte,
  nfs,
}) => {
  const parteRef = useRef<HTMLDivElement>(null);
  const [modalPdfAberto, setModalPdfAberto] = useState<boolean>(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // Aggregate materials from all NFs into the Item 4 text
  const handlePuxarMateriaisParaItem4 = () => {
    const listaItensStr: string[] = [];

    nfs.forEach((nf) => {
      nf.items.forEach((it) => {
        if (it.desc && it.desc.trim() !== '' && it.desc !== 'Novo Material') {
          const qtd = it.qtd || 1;
          const unid = it.unid || 'UN';
          listaItensStr.push(`${qtd} ${it.desc.trim()} (${unid})`);
        }
      });
    });

    if (listaItensStr.length === 0) {
      setMensagemSucesso('⚠️ Nenhum material preenchido encontrado nas planilhas.');
      setTimeout(() => setMensagemSucesso(null), 3500);
      return;
    }

    let textoFinal = '';
    if (listaItensStr.length === 1) {
      textoFinal = listaItensStr[0] + '.';
    } else {
      const ult = listaItensStr.pop();
      textoFinal = listaItensStr.join('; ') + '; e ' + ult + '.';
    }

    onChangeTextoParte({
      ...textoParte,
      item4Materiais: textoFinal,
    });

    setMensagemSucesso('✅ Materiais das planilhas importados com sucesso para o Item 4!');
    setTimeout(() => setMensagemSucesso(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="no-print bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 max-w-[794px] mx-auto">
        <div>
          <h2 className="text-sm font-bold text-[#1a2b4c]">Documento Oficial: Parte</h2>
          <p className="text-xs text-slate-500">
            Justificativa militar padrão para prestação de contas de adiantamento (Decreto 53.980/09).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePuxarMateriaisParaItem4}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition shadow-sm"
            title="Importar lista de itens cotados para o texto de justificativa"
          >
            <RefreshCw size={13} />
            <span>Puxar Materiais</span>
          </button>
          <button
            onClick={() => setModalPdfAberto(true)}
            className="flex items-center gap-1.5 bg-[#c9a84e] hover:bg-[#b8973f] text-[#1a2b4c] text-xs font-bold px-3 py-1.5 rounded-md transition shadow-sm cursor-pointer"
            title="Abrir pré-visualização e gerar arquivo PDF oficial"
          >
            <FileText size={13} />
            <span>Visualizar & Gerar PDF</span>
          </button>
          <button
            onClick={() => {
              if (parteRef.current) {
                executarImpressaoA4(parteRef.current, 'Documento Oficial: Parte - PMESP');
              } else {
                window.print();
              }
            }}
            className="flex items-center gap-1.5 bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-xs font-semibold px-3 py-1.5 rounded-md transition shadow-sm cursor-pointer"
            title="Imprimir folha A4 oficial diretamente"
          >
            <Printer size={13} />
            <span>Imprimir Folha A4</span>
          </button>
        </div>
      </div>

      {mensagemSucesso && (
        <div className="no-print bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold px-4 py-2 rounded-lg max-w-[210mm] mx-auto flex items-center justify-between shadow-2xs">
          <span>{mensagemSucesso}</span>
          <button onClick={() => setMensagemSucesso(null)} className="text-emerald-600 hover:text-emerald-900 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Official A4 Page */}
      <div ref={parteRef} className="textoparte-page bg-white">
        <div>
          {/* Top Header */}
          <div className="flex justify-between items-center border-b-2 border-black pb-1.5 mb-4 text-[10.5px] font-extrabold tracking-wide font-sans">
            <input
              type="text"
              value={textoParte.unidadeHeader}
              onChange={(e) =>
                onChangeTextoParte({ ...textoParte, unidadeHeader: e.target.value })
              }
              className="font-bold bg-transparent border-0 focus:ring-1 focus:ring-black rounded w-2/3"
            />
            <input
              type="text"
              value={textoParte.numeroParte}
              onChange={(e) =>
                onChangeTextoParte({ ...textoParte, numeroParte: e.target.value })
              }
              className="font-bold text-right bg-transparent border-0 focus:ring-1 focus:ring-black rounded w-1/3"
            />
          </div>

          {/* Destinatário */}
          <div className="mb-5 text-center font-bold font-sans text-xs">
            <textarea
              rows={3}
              value={textoParte.cabecalhoDestino}
              onChange={(e) =>
                onChangeTextoParte({ ...textoParte, cabecalhoDestino: e.target.value })
              }
              className="w-full text-center font-bold bg-transparent border-0 focus:ring-1 focus:ring-black rounded resize-none"
            />
          </div>

          {/* Body Paragraphs */}
          <div className="space-y-3.5 text-justify text-xs leading-relaxed font-sans">
            <p className="indent-10">
              <span className="font-bold mr-1">1.</span>
              <textarea
                rows={2}
                value={textoParte.item1}
                onChange={(e) => onChangeTextoParte({ ...textoParte, item1: e.target.value })}
                className="w-full bg-transparent border-0 focus:ring-1 focus:ring-black rounded resize-y"
              />
            </p>

            <div>
              <p className="indent-10 font-bold mb-1">
                2. Fato motivador:
              </p>
              <p className="indent-10">
                <span className="font-bold mr-1">2.1.</span>
                <textarea
                  rows={6}
                  value={textoParte.item2Descricao}
                  onChange={(e) =>
                    onChangeTextoParte({ ...textoParte, item2Descricao: e.target.value })
                  }
                  className="w-full bg-transparent border-0 focus:ring-1 focus:ring-black rounded resize-y"
                />
              </p>
            </div>

            <p className="indent-10">
              <span className="font-bold mr-1">3.</span>
              <textarea
                rows={9}
                value={textoParte.item3}
                onChange={(e) => onChangeTextoParte({ ...textoParte, item3: e.target.value })}
                className="w-full bg-transparent border-0 focus:ring-1 focus:ring-black rounded resize-y text-[11px]"
              />
            </p>

            <div>
              <p className="indent-10 mb-1">
                <span className="font-bold mr-1">4.</span>
                Assim, atendendo à necessidade de pequenos consertos para a conservação das instalações da Academia de Polícia Militar do Barro Branco, especialmente nas dependências da 3ª Cia Es., bem como a brevidade dos reparos, passo a discriminar os itens que foram adquiridos:
              </p>
              {/* Special editable Item 4 textarea */}
              <div className="my-1.5 p-2 bg-amber-50/50 border border-dashed border-amber-300 rounded font-mono text-[11px] leading-relaxed">
                <textarea
                  rows={4}
                  value={textoParte.item4Materiais}
                  onChange={(e) =>
                    onChangeTextoParte({ ...textoParte, item4Materiais: e.target.value })
                  }
                  className="w-full bg-transparent border-0 focus:ring-1 focus:ring-amber-500 rounded resize-y font-sans text-xs"
                />
              </div>
            </div>

            <p className="indent-10">
              <span className="font-bold mr-1">5.</span>
              <textarea
                rows={2}
                value={textoParte.item5}
                onChange={(e) => onChangeTextoParte({ ...textoParte, item5: e.target.value })}
                className="w-full bg-transparent border-0 focus:ring-1 focus:ring-black rounded resize-y"
              />
            </p>

            <p className="indent-10">
              <span className="font-bold mr-1">6.</span>
              <textarea
                rows={2}
                value={textoParte.item6}
                onChange={(e) => onChangeTextoParte({ ...textoParte, item6: e.target.value })}
                className="w-full bg-transparent border-0 focus:ring-1 focus:ring-black rounded resize-y"
              />
            </p>
          </div>
        </div>

        {/* Footer Signature */}
        <div className="mt-8 text-center border-t-2 border-black pt-2.5 font-sans">
          <input
            type="text"
            value={textoParte.assinaturaNome}
            onChange={(e) =>
              onChangeTextoParte({ ...textoParte, assinaturaNome: e.target.value })
            }
            className="text-center font-bold text-xs uppercase tracking-wider bg-transparent border-0 focus:ring-1 focus:ring-black rounded w-80 mx-auto block"
          />
          <input
            type="text"
            value={textoParte.assinaturaCargo}
            onChange={(e) =>
              onChangeTextoParte({ ...textoParte, assinaturaCargo: e.target.value })
            }
            className="text-center text-[10px] text-slate-700 bg-transparent border-0 focus:ring-1 focus:ring-black rounded w-80 mx-auto block mt-0.5"
          />
        </div>
      </div>

      {/* Modal Visualizador e Gerador de PDF */}
      <ModalVisualizadorPDF
        isOpen={modalPdfAberto}
        onClose={() => setModalPdfAberto(false)}
        targetElement={parteRef.current}
        titulo="Documento Oficial: Parte • PMESP"
        subtitulo="Justificativa militar padrão para prestação de contas de adiantamento (Decreto 53.980/09)"
        nomeArquivo={`Documento_Parte_${new Date().toISOString().slice(0, 10)}.pdf`}
        orientacao="p"
      />
    </div>
  );
};
