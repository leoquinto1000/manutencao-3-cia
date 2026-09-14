import React, { useState, useEffect } from 'react';
import { Download, Printer, X, Loader2, FileCheck, ExternalLink, RefreshCw } from 'lucide-react';
import { gerarDocumentoPdf, imprimirEmNovaJanela, ResultadoPdf } from '../../utils/pdfPrintHelper';

interface ModalVisualizadorPDFProps {
  isOpen: boolean;
  onClose: () => void;
  targetElement: HTMLElement | null;
  titulo: string;
  subtitulo?: string;
  nomeArquivo?: string;
  orientacao?: 'p' | 'l';
}

export const ModalVisualizadorPDF: React.FC<ModalVisualizadorPDFProps> = ({
  isOpen,
  onClose,
  targetElement,
  titulo,
  subtitulo = 'Visualize o documento antes de imprimir ou faça o download em arquivo PDF',
  nomeArquivo = 'documento.pdf',
  orientacao = 'p',
}) => {
  const [carregando, setCarregando] = useState<boolean>(false);
  const [statusTexto, setStatusTexto] = useState<string>('');
  const [progresso, setProgresso] = useState<number>(0);
  const [resultadoPdf, setResultadoPdf] = useState<ResultadoPdf | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !targetElement) {
      if (resultadoPdf?.blobUrl) {
        URL.revokeObjectURL(resultadoPdf.blobUrl);
      }
      setResultadoPdf(null);
      setErro(null);
      return;
    }

    let isMounted = true;

    const processarPdf = async () => {
      setCarregando(true);
      setErro(null);
      setProgresso(10);
      setStatusTexto('Preparando páginas para visualização...');

      try {
        // Pequena pausa para garantir renderização de fontes e imagens
        await new Promise((r) => setTimeout(r, 200));

        const resultado = await gerarDocumentoPdf(targetElement, {
          nomeArquivo,
          orientacao: (orientacao === 'l' ? 'l' : 'p') as 'p' | 'l',
          onProgresso: (texto, pct) => {
            if (isMounted) {
              setStatusTexto(texto);
              setProgresso(pct);
            }
          },
        });

        if (isMounted) {
          setResultadoPdf(resultado);
          setCarregando(false);
        }
      } catch (err: any) {
        console.error('Erro ao gerar PDF:', err);
        if (isMounted) {
          setErro(err.message || 'Falha ao processar o documento PDF.');
          setCarregando(false);
        }
      }
    };

    processarPdf();

    return () => {
      isMounted = false;
    };
  }, [isOpen, targetElement, nomeArquivo, orientacao]);

  if (!isOpen) return null;

  const handleBaixarPdf = () => {
    if (!resultadoPdf) return;
    resultadoPdf.pdf.save(nomeArquivo);
  };

  const handleImprimirJanela = () => {
    if (targetElement) {
      imprimirEmNovaJanela(targetElement, titulo);
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-[#1a2b4c] text-white px-5 py-3.5 flex items-center justify-between gap-4 border-b border-[#2c4373] shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FileCheck size={18} className="text-[#c9a84e]" />
              <h2 className="text-sm md:text-base font-bold truncate tracking-wide">
                {titulo}
              </h2>
            </div>
            <p className="text-[11px] text-slate-300 truncate mt-0.5">
              {subtitulo}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Botão Baixar PDF */}
            <button
              onClick={handleBaixarPdf}
              disabled={carregando || !resultadoPdf}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-sm"
              title="Baixar arquivo em formato PDF"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Baixar PDF</span>
            </button>

            {/* Botão Imprimir */}
            <button
              onClick={handleImprimirJanela}
              className="flex items-center gap-1.5 bg-[#c9a84e] hover:bg-[#b8973f] text-[#1a2b4c] text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-sm"
              title="Imprimir em nova janela (sem bloqueios do navegador)"
            >
              <Printer size={14} />
              <span>Imprimir</span>
            </button>

            {/* Fechar */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition"
              title="Fechar visualizador"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 bg-slate-100 relative overflow-hidden flex flex-col items-center justify-center p-4">
          {carregando ? (
            <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200 text-center max-w-md w-full">
              <Loader2 size={36} className="text-[#1a2b4c] animate-spin mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800 mb-1">
                Gerando Visualização do PDF...
              </h3>
              <p className="text-xs text-slate-500 mb-4">{statusTexto}</p>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-4">
                <div
                  className="bg-[#1a2b4c] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(progresso, 15)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Renderizando tabelas, imagens e notas fiscais em formato padrão A4.
              </p>
            </div>
          ) : erro ? (
            <div className="bg-white p-8 rounded-xl shadow-md border border-red-200 text-center max-w-md">
              <p className="text-sm font-bold text-red-700 mb-2">Erro na geração do PDF</p>
              <p className="text-xs text-slate-600 mb-4">{erro}</p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={handleImprimirJanela}
                  className="bg-[#1a2b4c] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#2c4373]"
                >
                  Imprimir Diretamente
                </button>
              </div>
            </div>
          ) : resultadoPdf ? (
            <div className="w-full h-full flex flex-col">
              <div className="bg-white/80 backdrop-blur-xs px-4 py-1.5 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
                <span>
                  Documento pronto: <strong>{resultadoPdf.totalPaginas} página(s)</strong> gerada(s)
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={resultadoPdf.blobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    <ExternalLink size={12} />
                    <span>Abrir PDF em tela cheia</span>
                  </a>
                </div>
              </div>

              <div className="flex-1 w-full h-full bg-slate-800 p-2 overflow-hidden rounded-b-lg">
                <iframe
                  src={resultadoPdf.blobUrl}
                  title="Pré-visualização do PDF"
                  className="w-full h-full rounded border-0 bg-white"
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Bar */}
        <div className="bg-white px-5 py-2.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Dica: Utilize <strong>"Baixar PDF"</strong> para salvar o arquivo oficial ou <strong>"Imprimir"</strong> para enviar à impressora.
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
