import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

export interface GerarPdfOptions {
  nomeArquivo?: string;
  orientacao?: 'p' | 'l';
  onProgresso?: (etapa: string, porcentagem: number) => void;
}

export interface ResultadoPdf {
  pdf: jsPDF;
  blob: Blob;
  blobUrl: string;
  totalPaginas: number;
}

/**
 * Abre uma janela separada do navegador contendo unicamente os documentos estilizados
 * e dispara a impressão nativa. Isso contorna completamente as limitações e bloqueios de iframe.
 */
export function imprimirEmNovaJanela(containerElement: HTMLElement, titulo: string = 'Impressão de Documento') {
  try {
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) {
      // Se popup for bloqueado pelo navegador, tenta o print normal
      window.print();
      return;
    }

    // Coleta estilos aplicados
    const styleSheets = Array.from(document.styleSheets);
    let stylesHtml = '';
    
    styleSheets.forEach((sheet) => {
      try {
        if (sheet.href) {
          stylesHtml += `<link rel="stylesheet" href="${sheet.href}">\n`;
        } else if (sheet.cssRules) {
          const rules = Array.from(sheet.cssRules).map((r) => r.cssText).join('\n');
          stylesHtml += `<style>${rules}</style>\n`;
        }
      } catch {
        // Regras protegidas por CORS podem falhar silenciosamente
      }
    });

    const conteudo = containerElement.outerHTML || containerElement.innerHTML;

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <title>${titulo}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          ${stylesHtml}
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
            * {
              box-sizing: border-box !important;
            }
            body {
              background: #ffffff !important;
              color: #000000 !important;
              margin: 0 !important;
              padding: 0 !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              font-size: 11px;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print, input[type="file"], button.no-print {
              display: none !important;
            }
            button:not(.no-print) {
              background: transparent !important;
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
              font: inherit !important;
              color: inherit !important;
              cursor: default !important;
            }
            .only-print {
              display: block !important;
            }
            .pesquisa-page {
              border: 2px solid #000 !important;
              box-shadow: none !important;
              margin: 0 auto !important;
              page-break-after: always !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              width: 100% !important;
              max-width: 194mm !important;
              height: 275mm !important;
              max-height: 275mm !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              overflow: hidden !important;
              box-sizing: border-box !important;
            }
            .sheet-paper {
              border: none !important;
              box-shadow: none !important;
              padding: 4mm !important;
              margin: 0 auto !important;
              width: 100% !important;
              max-width: none !important;
              page-break-after: auto !important;
              box-sizing: border-box !important;
            }
            .pauta-diaria-page {
              border: none !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              padding: 0 !important;
              margin: 0 auto !important;
              width: 100% !important;
              max-width: 190mm !important;
              background: #ffffff !important;
              box-sizing: border-box !important;
            }
            .pauta-diaria-page table {
              width: 100% !important;
              max-width: 100% !important;
              table-layout: fixed !important;
              border-collapse: collapse !important;
            }
            .pauta-diaria-page th,
            .pauta-diaria-page td {
              box-sizing: border-box !important;
              word-break: break-word !important;
              overflow-wrap: anywhere !important;
              overflow: hidden !important;
              hyphens: auto;
            }
            .pauta-diaria-page div {
              box-sizing: border-box !important;
              max-width: 100% !important;
            }
            .break-inside-avoid {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .balancete-page {
              border: none !important;
              box-shadow: none !important;
              padding: 6mm 8mm !important;
              margin: 0 auto !important;
              page-break-after: always !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              width: 100% !important;
              max-width: 194mm !important;
              max-height: 275mm !important;
              overflow: hidden !important;
              box-sizing: border-box !important;
            }
            .apmbb-page {
              border: none !important;
              box-shadow: none !important;
              padding: 6mm 8mm 6mm 8mm !important;
              margin: 0 auto !important;
              page-break-before: auto !important;
              page-break-after: always !important;
              break-after: page !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              width: 100% !important;
              max-width: 194mm !important;
              min-height: 275mm !important;
              height: 275mm !important;
              max-height: 275mm !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              overflow: hidden !important;
              box-sizing: border-box !important;
            }
            .apmbb-page:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
            #documento-informe-print-wrapper,
            .documento-informe-print-wrapper {
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              max-width: 194mm !important;
            }
            #documento-informe-print-wrapper > *,
            .documento-informe-print-wrapper > * {
              margin: 0 auto !important;
              padding: 0 !important;
              width: 100% !important;
              max-width: 194mm !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-after: always !important;
              break-after: page !important;
            }
            #documento-informe-print-wrapper > *:last-child,
            .documento-informe-print-wrapper > *:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
            .textoparte-page {
              border: none !important;
              box-shadow: none !important;
              padding: 8mm 10mm !important;
              margin: 0 auto 10mm auto !important;
              page-break-after: always !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              width: 100% !important;
              max-width: 194mm !important;
              box-sizing: border-box !important;
            }
            table {
              border-collapse: collapse !important;
              page-break-inside: auto;
            }
            thead {
              display: table-header-group;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            /* Garantir que inputs pareçam texto normal impresso */
            input, select, textarea {
              border: none !important;
              background: transparent !important;
              box-shadow: none !important;
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="position: fixed; top: 12px; right: 12px; z-index: 99999; background: #1a2b4c; padding: 6px 14px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.2);">
            <button type="button" onclick="window.focus(); window.print();" style="color: #ffffff; font-weight: bold; font-size: 13px; cursor: pointer; border: none; background: transparent; display: flex; items-center; gap: 6px;">
              🖨️ Clique para Imprimir / Salvar PDF
            </button>
          </div>
          ${conteudo}
          <script>
            function executarImpressao() {
              setTimeout(function() {
                try {
                  window.focus();
                  window.print();
                } catch (e) {
                  console.error('Erro ao acionar impressão:', e);
                }
              }, 400);
            }
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
              executarImpressao();
            } else {
              window.addEventListener('DOMContentLoaded', executarImpressao);
              window.addEventListener('load', executarImpressao);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  } catch (err) {
    console.error('Erro ao abrir janela de impressão:', err);
    window.print();
  }
}

/**
 * Converte um elemento ou conjunto de páginas A4 em documento PDF navegável/baixável
 */
export async function gerarDocumentoPdf(
  container: HTMLElement,
  opcoes: GerarPdfOptions = {}
): Promise<ResultadoPdf> {
  const {
    nomeArquivo = 'documento.pdf',
    orientacao = 'p',
    onProgresso,
  } = opcoes;

  // Busca páginas individuais (ex: .pesquisa-page, .sheet-paper, .balancete-page, .textoparte-page)
  let paginas = Array.from(
    container.querySelectorAll<HTMLElement>(
      '.pesquisa-page, .sheet-paper, .balancete-page, .textoparte-page, .apmbb-page'
    )
  );

  // Se não encontrar sub-páginas, utiliza o próprio container
  if (paginas.length === 0) {
    paginas = [container];
  }

  const pdf = new jsPDF({
    orientation: orientacao,
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfLargura = orientacao === 'p' ? 210 : 297;
  const pdfAltura = orientacao === 'p' ? 297 : 210;

  for (let i = 0; i < paginas.length; i++) {
    const pagina = paginas[i];
    if (onProgresso) {
      onProgresso(`Processando página ${i + 1} de ${paginas.length}...`, Math.round(((i) / paginas.length) * 100));
    }

    // Garante que todas as imagens da página estejam carregadas antes da captura pelo canvas
    const imagens = Array.from(pagina.querySelectorAll<HTMLImageElement>('img'));
    if (imagens.length > 0) {
      await Promise.all(
        imagens.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete && img.naturalHeight !== 0) {
                resolve();
              } else {
                img.onload = () => resolve();
                img.onerror = () => resolve();
                setTimeout(resolve, 800);
              }
            })
        )
      );
    }

    // Cria canvas de alta resolução com suporte a oklch e sincronização de campos
    const isA4Formatada = pagina.classList.contains('apmbb-page') || pagina.classList.contains('pesquisa-page');

    const canvas = await html2canvas(pagina, {
      scale: 2, // 2x para boa nitidez
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      ignoreElements: (element) => element.classList.contains('no-print'),
      windowWidth: isA4Formatada ? 794 : 1024,
      onclone: (clonedDoc) => {
        // Sincroniza valores de inputs e textareas no DOM clonado
        try {
          const origInputs = pagina.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
          const clonedInputs = clonedDoc.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
          origInputs.forEach((orig, idx) => {
            const clone = clonedInputs[idx];
            if (clone) {
              clone.value = orig.value;
              clone.setAttribute('value', orig.value);
              if (clone instanceof HTMLTextAreaElement) {
                clone.textContent = orig.value;
              }
            }
          });

          // Oculta elementos que não devem sair na impressão
          clonedDoc.querySelectorAll('.no-print').forEach((el) => {
            (el as HTMLElement).style.display = 'none';
          });
        } catch (e) {
          console.warn('Aviso ao sincronizar elementos clonados:', e);
        }
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    if (i > 0) {
      pdf.addPage('a4', orientacao);
    }

    // Se a página já está estritamente dimensionada em A4 (como .apmbb-page),
    // ela já possui seus próprios paddings internos que atuam como margens da folha.
    const margem = isA4Formatada ? 0 : 5;
    const larguraDisponivel = pdfLargura - (margem * 2);
    const alturaDisponivel = pdfAltura - (margem * 2);

    const aspectCanvas = canvas.width / canvas.height;
    let renderW = larguraDisponivel;
    let renderH = renderW / aspectCanvas;

    if (renderH > alturaDisponivel) {
      renderH = alturaDisponivel;
      renderW = renderH * aspectCanvas;
    }

    const posX = margem + (larguraDisponivel - renderW) / 2;
    const posY = margem + (alturaDisponivel - renderH) / 2;

    pdf.addImage(imgData, 'JPEG', posX, posY, renderW, renderH, undefined, 'FAST');
  }

  if (onProgresso) {
    onProgresso('Finalizando PDF...', 100);
  }

  const blob = pdf.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  return {
    pdf,
    blob,
    blobUrl,
    totalPaginas: paginas.length,
  };
}
