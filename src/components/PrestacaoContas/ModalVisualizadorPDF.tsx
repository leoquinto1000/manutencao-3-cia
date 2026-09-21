import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Printer,
  X,
  Loader2,
  FileCheck,
  ExternalLink,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Layers,
  FileText,
  Eye,
} from 'lucide-react';
import {
  gerarDocumentoPdf,
  executarImpressaoA4,
  ResultadoPdf,
} from '../../utils/pdfPrintHelper';

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
  subtitulo = 'Pré-visualização oficial das folhas A4 com opções de impressão e download em PDF',
  nomeArquivo = 'documento-oficial-pmesp.pdf',
  orientacao = 'p',
}) => {
  const [carregando, setCarregando] = useState<boolean>(false);
  const [statusTexto, setStatusTexto] = useState<string>('');
  const [progresso, setProgresso] = useState<number>(0);
  const [resultadoPdf, setResultadoPdf] = useState<ResultadoPdf | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Controles de Visualização
  const [modoVisualizador, setModoVisualizador] = useState<'a4' | 'nativo'>('a4');
  const [layoutExibicao, setLayoutExibicao] = useState<'todas' | 'unica'>('todas');
  const [paginaAtual, setPaginaAtual] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(100);

  const containerScrollRef = useRef<HTMLDivElement>(null);

  const processarPdf = async () => {
    if (!targetElement) return;

    setCarregando(true);
    setErro(null);
    setProgresso(10);
    setStatusTexto('Preparando folhas para renderização A4...');

    try {
      // Pausa estratégica para assegurar carregamento de fontes e imagens no DOM
      await new Promise((r) => setTimeout(r, 250));

      const resultado = await gerarDocumentoPdf(targetElement, {
        nomeArquivo,
        orientacao: (orientacao === 'l' ? 'l' : 'p') as 'p' | 'l',
        onProgresso: (texto, pct) => {
          setStatusTexto(texto);
          setProgresso(pct);
        },
      });

      setResultadoPdf(resultado);
      setPaginaAtual(0);
      setCarregando(false);
    } catch (err: any) {
      console.error('Erro ao gerar visualização do PDF:', err);
      setErro(err?.message || 'Falha ao processar as folhas do documento.');
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !targetElement) {
      if (resultadoPdf?.blobUrl) {
        URL.revokeObjectURL(resultadoPdf.blobUrl);
      }
      setResultadoPdf(null);
      setErro(null);
      return;
    }

    processarPdf();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, targetElement, nomeArquivo, orientacao]);

  if (!isOpen) return null;

  const handleBaixarPdf = () => {
    if (!resultadoPdf) return;
    resultadoPdf.pdf.save(nomeArquivo);
  };

  const handleImprimir = () => {
    if (targetElement) {
      executarImpressaoA4(targetElement, titulo);
    } else {
      window.print();
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 15, 180));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 15, 45));
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  const totalPaginas = resultadoPdf?.paginasImagens?.length || resultadoPdf?.totalPaginas || 1;

  return (
    <div className="no-print fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[94vh] flex flex-col overflow-hidden border border-slate-300">
        
        {/* Top Header */}
        <div className="bg-[#1a2b4c] text-white px-4 sm:px-6 py-3 flex items-center justify-between gap-4 border-b border-[#2c4373] shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FileCheck size={18} className="text-[#c9a84e] shrink-0" />
              <h2 className="text-sm sm:text-base font-bold truncate tracking-wide">
                {titulo}
              </h2>
              <span className="hidden sm:inline-block bg-[#2c4373] text-[#c9a84e] text-[10px] font-bold px-2 py-0.5 rounded border border-[#3b558c]">
                Formato A4 (210×297mm)
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate mt-0.5">
              {subtitulo}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Recarregar */}
            <button
              onClick={processarPdf}
              disabled={carregando}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition"
              title="Recarregar pré-visualização"
            >
              <RefreshCw size={16} className={carregando ? 'animate-spin' : ''} />
            </button>

            {/* Baixar PDF */}
            <button
              onClick={handleBaixarPdf}
              disabled={carregando || !resultadoPdf}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-sm cursor-pointer"
              title="Baixar arquivo oficial em formato PDF"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Baixar PDF</span>
            </button>

            {/* Imprimir */}
            <button
              onClick={handleImprimir}
              className="flex items-center gap-1.5 bg-[#c9a84e] hover:bg-[#b8973f] text-[#1a2b4c] text-xs font-bold px-3.5 py-1.5 rounded-lg transition shadow-sm cursor-pointer"
              title="Imprimir documento oficial em formato A4"
            >
              <Printer size={14} />
              <span>Imprimir Folha(s) A4</span>
            </button>

            {/* Fechar */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
              title="Fechar visualizador"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Toolbar de Controle da Pré-Visualização */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 select-none">
          {/* Seletor de Modo */}
          <div className="flex items-center gap-1.5 bg-white p-0.5 rounded-lg border border-slate-300 shadow-2xs">
            <button
              onClick={() => setModoVisualizador('a4')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
                modoVisualizador === 'a4'
                  ? 'bg-[#1a2b4c] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Exibir folhas renderizadas no padrão exato de impressão A4"
            >
              <Eye size={13} />
              <span>Folhas A4 ({totalPaginas})</span>
            </button>

            <button
              onClick={() => setModoVisualizador('nativo')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
                modoVisualizador === 'nativo'
                  ? 'bg-[#1a2b4c] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Exibir no leitor nativo de PDF do navegador"
            >
              <FileText size={13} />
              <span>PDF Embutido</span>
            </button>
          </div>

          {/* Controles de Folhas e Zoom (ativos no modo A4) */}
          {modoVisualizador === 'a4' && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Alternar modo de rolagem ou folha única */}
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-300">
                <button
                  onClick={() => setLayoutExibicao('todas')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    layoutExibicao === 'todas'
                      ? 'bg-slate-200 text-slate-800'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Ver todas as folhas enfileiradas"
                >
                  <span className="flex items-center gap-1">
                    <Layers size={11} />
                    <span>Todas</span>
                  </span>
                </button>
                <button
                  onClick={() => setLayoutExibicao('unica')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    layoutExibicao === 'unica'
                      ? 'bg-slate-200 text-slate-800'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Navegar folha por folha"
                >
                  <span>Individual</span>
                </button>
              </div>

              {/* Navegação de Página quando em modo 'unica' */}
              {layoutExibicao === 'unica' && totalPaginas > 1 && (
                <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-300">
                  <button
                    onClick={() => setPaginaAtual((p) => Math.max(0, p - 1))}
                    disabled={paginaAtual === 0}
                    className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                    title="Folha anterior"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-[11px] font-bold text-slate-700 px-1">
                    Folha {paginaAtual + 1} de {totalPaginas}
                  </span>
                  <button
                    onClick={() => setPaginaAtual((p) => Math.min(totalPaginas - 1, p + 1))}
                    disabled={paginaAtual === totalPaginas - 1}
                    className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                    title="Próxima folha"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {/* Controles de Zoom */}
              <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-300">
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= 45}
                  className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                  title="Diminuir zoom"
                >
                  <ZoomOut size={13} />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="text-[11px] font-bold text-slate-700 px-1.5 hover:text-[#1a2b4c]"
                  title="Ajustar zoom para 100%"
                >
                  {zoom}%
                </button>
                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= 180}
                  className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                  title="Aumentar zoom"
                >
                  <ZoomIn size={13} />
                </button>
              </div>
            </div>
          )}

          {/* Links e status lateral */}
          {resultadoPdf?.blobUrl && (
            <div className="flex items-center gap-2">
              <a
                href={resultadoPdf.blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900 transition"
                title="Abrir o arquivo PDF em uma nova aba do navegador"
              >
                <ExternalLink size={12} />
                <span>Abrir em Nova Aba</span>
              </a>
            </div>
          )}
        </div>

        {/* Content Body / Canvas de Pré-Visualização */}
        <div
          ref={containerScrollRef}
          className="flex-1 bg-slate-800 relative overflow-y-auto overflow-x-auto flex flex-col items-center p-4 sm:p-6"
        >
          {carregando ? (
            <div className="my-auto bg-white p-8 rounded-xl shadow-lg border border-slate-300 text-center max-w-md w-full animate-in fade-in">
              <Loader2 size={38} className="text-[#1a2b4c] animate-spin mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800 mb-1">
                Processando Folhas no Padrão A4...
              </h3>
              <p className="text-xs text-slate-500 mb-4">{statusTexto}</p>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-3">
                <div
                  className="bg-[#1a2b4c] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(progresso, 15)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Ajustando proporções de 210mm × 297mm com máxima nitidez visual.
              </p>
            </div>
          ) : erro ? (
            <div className="my-auto bg-white p-8 rounded-xl shadow-lg border border-red-300 text-center max-w-md animate-in fade-in">
              <p className="text-sm font-bold text-red-700 mb-2">Erro ao renderizar pré-visualização</p>
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">{erro}</p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={handleImprimir}
                  className="bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                >
                  Imprimir Folha A4 Diretamente
                </button>
                <button
                  onClick={processarPdf}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition"
                >
                  Tentar Novamente
                </button>
              </div>
            </div>
          ) : resultadoPdf ? (
            modoVisualizador === 'a4' ? (
              /* Visualizador de Folhas Renderizadas A4 */
              <div
                className="flex flex-col items-center gap-8 py-2 transition-all duration-150"
                style={{
                  width: `${zoom}%`,
                  maxWidth: 'none',
                }}
              >
                {layoutExibicao === 'todas' ? (
                  /* Modo Todas as Folhas */
                  resultadoPdf.paginasImagens.map((imgSrc, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center group"
                      style={{ width: '100%', maxWidth: '210mm' }}
                    >
                      {/* Indicador de Folha */}
                      <div className="w-full flex items-center justify-between text-[11px] text-slate-300 font-semibold mb-2 px-1">
                        <span className="flex items-center gap-1.5 text-slate-200">
                          <span className="bg-[#c9a84e] text-[#1a2b4c] font-black px-1.5 py-0.5 rounded text-[10px]">
                            FOLHA {idx + 1} DE {totalPaginas}
                          </span>
                          <span>Padrão A4 • 210mm × 297mm</span>
                        </span>
                        <span className="text-slate-400 text-[10px]">Página Oficial</span>
                      </div>

                      {/* Folha A4 em Papel Branco com Sombra */}
                      <div
                        className="bg-white rounded-xs shadow-2xl overflow-hidden border border-slate-400/30 transition-transform"
                        style={{
                          width: '100%',
                          aspectRatio: '210 / 297',
                        }}
                      >
                        <img
                          src={imgSrc}
                          alt={`Folha ${idx + 1} em Formato A4`}
                          className="w-full h-full object-contain block bg-white"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  /* Modo Folha Única */
                  <div
                    className="flex flex-col items-center"
                    style={{ width: '100%', maxWidth: '210mm' }}
                  >
                    <div className="w-full flex items-center justify-between text-[11px] text-slate-300 font-semibold mb-2 px-1">
                      <span className="bg-[#c9a84e] text-[#1a2b4c] font-black px-2 py-0.5 rounded text-[10px]">
                        FOLHA {paginaAtual + 1} DE {totalPaginas}
                      </span>
                      <span className="text-slate-300 text-[10px]">Formato A4 (210×297mm)</span>
                    </div>

                    <div
                      className="bg-white rounded-xs shadow-2xl overflow-hidden border border-slate-400/30"
                      style={{
                        width: '100%',
                        aspectRatio: '210 / 297',
                      }}
                    >
                      <img
                        src={resultadoPdf.paginasImagens[paginaAtual] || resultadoPdf.paginasImagens[0]}
                        alt={`Folha ${paginaAtual + 1} em Formato A4`}
                        className="w-full h-full object-contain block bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Modo PDF Embutido */
              <div className="w-full h-full flex flex-col bg-white rounded-lg overflow-hidden border border-slate-300 shadow-md">
                <iframe
                  src={resultadoPdf.blobUrl}
                  title="Pré-visualização Oficial do PDF"
                  className="w-full flex-1 border-0 bg-white"
                />
              </div>
            )
          ) : null}
        </div>

        {/* Footer Bar */}
        <div className="bg-white px-5 py-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Folhas dimensionadas estritamente para papel <strong>A4 (210 × 297 mm)</strong></span>
            </span>
            <span className="hidden md:inline text-slate-400">•</span>
            <span className="hidden md:inline text-slate-500">
              Clique em <strong>"Imprimir Folha(s) A4"</strong> para enviar diretamente à impressora sem falhas
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleImprimir}
              className="bg-[#1a2b4c] hover:bg-[#2c4373] text-white font-bold px-3.5 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={13} />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
