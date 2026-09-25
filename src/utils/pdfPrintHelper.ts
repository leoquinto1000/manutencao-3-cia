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
 * Executa a impressão direta da folha no padrão A4 sem disparar pop-ups de janela,
 * garantindo compatibilidade com iFrames, sandbox e navegadores móveis/desktop.
 */
export function imprimirEmNovaJanela(containerElement: HTMLElement, titulo: string = 'Impressão de Documento') {
  executarImpressaoA4(containerElement, titulo);
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

    // Identificador temporário para achar a página exata no clonedDoc
    const pageIdAttr = `a4-page-render-${Date.now()}-${i}`;
    pagina.setAttribute('data-render-id', pageIdAttr);

    // Gera canvas de alta resolução com proporção estrita de 794px × 1123px (A4 a 96DPI)
    const canvas = await html2canvas(pagina, {
      scale: 2, // 2x para nitidez
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      ignoreElements: (element) => element.classList.contains('no-print'),
      width: 794,
      height: 1123,
      windowWidth: 794,
      windowHeight: 1123,
      onclone: (clonedDoc) => {
        // 1. Remove qualquer elemento .no-print
        const noPrintElements = clonedDoc.querySelectorAll('.no-print');
        noPrintElements.forEach((el) => el.remove());

        // 2. Localiza a página clonada exata
        const clonedPage = clonedDoc.querySelector<HTMLElement>(`[data-render-id="${pageIdAttr}"]`);
        if (clonedPage) {
          // Força a página a ter exatamente 794px x 1123px (A4 a 96DPI)
          clonedPage.style.width = '794px';
          clonedPage.style.minWidth = '794px';
          clonedPage.style.maxWidth = '794px';
          clonedPage.style.height = '1123px';
          clonedPage.style.minHeight = '1123px';
          clonedPage.style.maxHeight = '1123px';
          clonedPage.style.margin = '0 auto';
          clonedPage.style.padding = '38px 45px 30px 45px';
          clonedPage.style.border = 'none';
          clonedPage.style.boxShadow = 'none';
          clonedPage.style.boxSizing = 'border-box';
          clonedPage.style.overflow = 'hidden';
          clonedPage.style.backgroundColor = '#ffffff';
          clonedPage.style.display = 'flex';
          clonedPage.style.flexDirection = 'column';
          clonedPage.style.justifyContent = 'space-between';
        }

        // Também normaliza todas as outras páginas A4 no documento clonado
        const allClonedPages = clonedDoc.querySelectorAll<HTMLElement>(
          '.pesquisa-page, .sheet-paper, .balancete-page, .textoparte-page, .apmbb-page, .pauta-diaria-page'
        );
        allClonedPages.forEach((p) => {
          p.style.width = '794px';
          p.style.minWidth = '794px';
          p.style.maxWidth = '794px';
          p.style.boxShadow = 'none';
        });

        // 3. Converte inputs, textareas e selects em texto estático idêntico
        const origInputs = pagina.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
          'input, textarea, select'
        );
        const clonedTarget = clonedPage || clonedDoc;
        const clonedInputs = clonedTarget.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
          'input, textarea, select'
        );

        origInputs.forEach((orig, idx) => {
          const cloned = clonedInputs[idx];
          if (!cloned) return;

          if (orig instanceof HTMLSelectElement) {
            const span = clonedDoc.createElement('span');
            span.textContent = orig.options[orig.selectedIndex]?.text || orig.value || '';
            span.className = cloned.className || '';
            span.style.cssText = cloned.style.cssText;
            span.style.border = 'none';
            span.style.outline = 'none';
            span.style.background = 'transparent';
            span.style.display = 'inline-block';
            span.style.fontWeight = 'bold';
            cloned.parentNode?.replaceChild(span, cloned);
          } else if (orig instanceof HTMLTextAreaElement) {
            const div = clonedDoc.createElement('div');
            div.textContent = orig.value || '';
            div.className = cloned.className || '';
            div.style.cssText = cloned.style.cssText;
            div.style.whiteSpace = 'pre-wrap';
            div.style.wordBreak = 'break-word';
            div.style.border = 'none';
            div.style.outline = 'none';
            div.style.background = 'transparent';
            div.style.resize = 'none';
            cloned.parentNode?.replaceChild(div, cloned);
          } else if (orig instanceof HTMLInputElement) {
            if (orig.type !== 'checkbox' && orig.type !== 'radio') {
              const span = clonedDoc.createElement('span');
              span.textContent = orig.value || '';
              span.className = cloned.className || '';
              span.style.cssText = cloned.style.cssText;
              span.style.display = 'inline-block';
              span.style.border = 'none';
              span.style.outline = 'none';
              span.style.background = 'transparent';
              cloned.parentNode?.replaceChild(span, cloned);
            }
          }
        });
      },
    });

    pagina.removeAttribute('data-render-id');

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
