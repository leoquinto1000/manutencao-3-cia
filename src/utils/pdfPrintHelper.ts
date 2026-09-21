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
  paginasImagens: string[];
}

/**
 * Executa a impressão oficial de folhas A4 diretamente no navegador sem depender de popups ou novas abas.
 * Isola o documento, converte inputs/textareas em texto formatado, oculta toda a UI do sistema
 * e dispara a caixa de diálogo nativa de impressão em padrão estrito A4.
 */
export function executarImpressaoA4(containerElement: HTMLElement, titulo: string = 'Documento Oficial PMESP') {
  try {
    // 1. Remove qualquer container de impressão prévio se existir
    const anterior = document.getElementById('folha-impressao-a4-ativa');
    if (anterior) {
      anterior.remove();
    }

    // 2. Cria o container exclusivo de impressão anexado diretamente ao body
    const printContainer = document.createElement('div');
    printContainer.id = 'folha-impressao-a4-ativa';
    printContainer.className = 'folha-impressao-a4-ativa only-print';

    // 3. Clona o elemento original mantendo estrutura
    const clone = containerElement.cloneNode(true) as HTMLElement;

    // 4. Converte campos editáveis (inputs, textareas, selects) em texto estático com estilo fiel
    const origInputs = containerElement.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      'input, textarea, select'
    );
    const cloneInputs = clone.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      'input, textarea, select'
    );

    origInputs.forEach((orig, idx) => {
      const cloned = cloneInputs[idx];
      if (!cloned) return;

      if (orig instanceof HTMLSelectElement) {
        const span = document.createElement('span');
        span.textContent = orig.options[orig.selectedIndex]?.text || orig.value;
        span.className = (cloned.className || '') + ' print-val-text';
        span.style.fontWeight = 'bold';
        span.style.color = '#000';
        cloned.parentNode?.replaceChild(span, cloned);
      } else if (orig instanceof HTMLTextAreaElement) {
        const div = document.createElement('div');
        div.style.whiteSpace = 'pre-wrap';
        div.textContent = orig.value;
        div.className = (cloned.className || '') + ' print-val-text';
        div.style.color = '#000';
        cloned.parentNode?.replaceChild(div, cloned);
      } else if (orig instanceof HTMLInputElement) {
        if (orig.type === 'checkbox' || orig.type === 'radio') {
          (cloned as HTMLInputElement).checked = orig.checked;
        } else {
          const span = document.createElement('span');
          span.textContent = orig.value;
          span.className = (cloned.className || '') + ' print-val-text';
          span.style.color = '#000';
          cloned.parentNode?.replaceChild(span, cloned);
        }
      }
    });

    // 5. Remove elementos que possuem a classe .no-print
    const noPrintList = clone.querySelectorAll('.no-print');
    noPrintList.forEach((el) => el.remove());

    printContainer.appendChild(clone);
    document.body.appendChild(printContainer);

    // 6. Ativa classe isoladora no body
    document.body.classList.add('modo-impressao-a4-ativo');

    const originalTitle = document.title;
    if (titulo) {
      document.title = titulo;
    }

    // 7. Dispara a impressão
    const triggerPrint = () => {
      window.focus();
      window.print();
    };

    setTimeout(() => {
      triggerPrint();

      // Limpeza segura após a impressão
      const cleanup = () => {
        document.body.classList.remove('modo-impressao-a4-ativo');
        if (printContainer.parentNode) {
          printContainer.parentNode.removeChild(printContainer);
        }
        document.title = originalTitle;
        window.removeEventListener('afterprint', cleanup);
      };

      window.addEventListener('afterprint', cleanup);
      // Timeout de segurança caso afterprint não seja disparado pelo navegador
      setTimeout(cleanup, 4000);
    }, 200);
  } catch (err) {
    console.error('Erro ao executar impressão direta A4:', err);
    window.print();
  }
}

/**
 * Tenta abrir uma janela dedicada para impressão. Caso seja bloqueada pelo navegador
 * (situação comum em ambientes de iframe), recorre com segurança à função executarImpressaoA4.
 */
export function imprimirEmNovaJanela(containerElement: HTMLElement, titulo: string = 'Impressão de Documento') {
  try {
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) {
      // Bloqueio de popup detectado: usa impressão isolada local A4
      executarImpressaoA4(containerElement, titulo);
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
        // Regras com restrições de CORS
      }
    });

    const clone = containerElement.cloneNode(true) as HTMLElement;
    const origInputs = containerElement.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      'input, textarea, select'
    );
    const cloneInputs = clone.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      'input, textarea, select'
    );

    origInputs.forEach((orig, idx) => {
      const cloned = cloneInputs[idx];
      if (!cloned) return;
      if (orig instanceof HTMLSelectElement) {
        const span = document.createElement('span');
        span.textContent = orig.options[orig.selectedIndex]?.text || orig.value;
        span.style.fontWeight = 'bold';
        cloned.parentNode?.replaceChild(span, cloned);
      } else if (orig instanceof HTMLTextAreaElement) {
        const div = document.createElement('div');
        div.style.whiteSpace = 'pre-wrap';
        div.textContent = orig.value;
        cloned.parentNode?.replaceChild(div, cloned);
      } else if (orig instanceof HTMLInputElement) {
        if (orig.type !== 'checkbox' && orig.type !== 'radio') {
          const span = document.createElement('span');
          span.textContent = orig.value;
          cloned.parentNode?.replaceChild(span, cloned);
        }
      }
    });

    const noPrints = clone.querySelectorAll('.no-print');
    noPrints.forEach((el) => el.remove());

    const conteudo = clone.outerHTML || clone.innerHTML;

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
              margin: 0 !important;
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
            .only-print {
              display: block !important;
            }
            .pesquisa-page,
            .sheet-paper,
            .balancete-page,
            .textoparte-page,
            .apmbb-page,
            .pauta-diaria-page {
              width: 210mm !important;
              max-width: 210mm !important;
              min-height: 297mm !important;
              height: 297mm !important;
              max-height: 297mm !important;
              margin: 0 auto !important;
              padding: 10mm 12mm !important;
              page-break-after: always !important;
              break-after: page !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              box-sizing: border-box !important;
              overflow: hidden !important;
              border: none !important;
              box-shadow: none !important;
            }
            .pesquisa-page {
              border: 2px solid #000 !important;
              padding: 0 !important;
            }
            .pesquisa-page:last-child,
            .sheet-paper:last-child,
            .balancete-page:last-child,
            .textoparte-page:last-child,
            .apmbb-page:last-child,
            .pauta-diaria-page:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
            table {
              border-collapse: collapse !important;
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="position: fixed; top: 12px; right: 12px; z-index: 99999; background: #1a2b4c; padding: 6px 14px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.25);">
            <button type="button" onclick="window.focus(); window.print();" style="color: #ffffff; font-weight: bold; font-size: 13px; cursor: pointer; border: none; background: transparent; display: flex; align-items: center; gap: 6px;">
              🖨️ Imprimir / Salvar PDF A4
            </button>
          </div>
          ${conteudo}
          <script>
            setTimeout(function() {
              try {
                window.focus();
                window.print();
              } catch (e) {
                console.error(e);
              }
            }, 350);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  } catch (err) {
    console.error('Erro ao abrir janela de impressão, recorrendo à impressão direta:', err);
    executarImpressaoA4(containerElement, titulo);
  }
}

/**
 * Converte um elemento ou conjunto de páginas em documento PDF oficial formato A4 (210mm x 297mm)
 * e gera prévias visuais em alta resolução de cada folha renderizada.
 */
export async function gerarDocumentoPdf(
  container: HTMLElement,
  opcoes: GerarPdfOptions = {}
): Promise<ResultadoPdf> {
  const {
    orientacao = 'p',
    onProgresso,
  } = opcoes;

  // Busca páginas individuais formatadas
  let paginas = Array.from(
    container.querySelectorAll<HTMLElement>(
      '.pesquisa-page, .sheet-paper, .balancete-page, .textoparte-page, .apmbb-page, .pauta-diaria-page'
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

  const paginasImagens: string[] = [];

  for (let i = 0; i < paginas.length; i++) {
    const pagina = paginas[i];
    if (onProgresso) {
      onProgresso(`Processando folha A4 (${i + 1} de ${paginas.length})...`, Math.round(((i) / paginas.length) * 100));
    }

    // Garante que todas as imagens da folha estejam totalmente carregadas
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

    // Gera canvas de alta resolução com proporção estrita de 794px (~210mm a 96DPI)
    const canvas = await html2canvas(pagina, {
      scale: 2, // 2x para nitidez
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      ignoreElements: (element) => element.classList.contains('no-print'),
      windowWidth: 794,
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
            }
          });
        } catch {
          // Ignora erros de sincronização
        }
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    paginasImagens.push(imgData);

    if (i > 0) {
      pdf.addPage('a4', orientacao);
    }

    // Cada folha no PDF ocupa exatamente o tamanho da página A4 (210mm x 297mm)
    const aspectCanvas = canvas.width / canvas.height;
    let renderW = pdfLargura;
    let renderH = renderW / aspectCanvas;

    if (renderH > pdfAltura) {
      renderH = pdfAltura;
      renderW = renderH * aspectCanvas;
    }

    const posX = (pdfLargura - renderW) / 2;
    const posY = (pdfAltura - renderH) / 2;

    pdf.addImage(imgData, 'JPEG', posX, posY, renderW, renderH, undefined, 'FAST');
  }

  if (onProgresso) {
    onProgresso('Finalizando documento PDF...', 100);
  }

  const blob = pdf.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  return {
    pdf,
    blob,
    blobUrl,
    totalPaginas: paginas.length,
    paginasImagens,
  };
}
