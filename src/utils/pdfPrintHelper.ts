import html2canvas from 'html2canvas';
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

    const conteudo = containerElement.innerHTML;

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
            body {
              background: #ffffff !important;
              color: #000000 !important;
              margin: 0;
              padding: 0;
              font-family: Arial, Helvetica, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print, button, input[type="file"] {
              display: none !important;
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
              padding: 4mm !important;
              margin: 0 auto !important;
              width: 100% !important;
              max-width: 100% !important;
              background: #ffffff !important;
              box-sizing: border-box !important;
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
            .textoparte-page, .apmbb-page {
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
          ${conteudo}
          <script>
            window.addEventListener('load', function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 400);
            });
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

    // Cria canvas de alta resolução
    const canvas = await html2canvas(pagina, {
      scale: 2, // 2x para boa nitidez
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      ignoreElements: (element) => element.classList.contains('no-print'),
      windowWidth: 1024,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    if (i > 0) {
      pdf.addPage('a4', orientacao);
    }

    // Calcula proporções preservando margem
    const margem = 5; // 5mm de margem
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
    const posY = margem;

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
