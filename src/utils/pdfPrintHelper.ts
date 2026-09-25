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
                setTimeout(resolve, 600);
              }
            })
        )
      );
    }

    // 1. Associa marcadores temporários nos inputs para mapeamento fiel dos valores
    const origInputs = Array.from(
      pagina.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        'input, textarea, select'
      )
    );
    origInputs.forEach((el, idx) => {
      el.setAttribute('data-print-field-id', String(idx));
    });

    // 2. Clona a página isolada do restante da aplicação
    const pageClone = pagina.cloneNode(true) as HTMLElement;

    // Limpa atributo do DOM ativo
    origInputs.forEach((el) => {
      el.removeAttribute('data-print-field-id');
    });

    // 3. Remove todos os elementos .no-print do clone
    const noPrintList = pageClone.querySelectorAll('.no-print');
    noPrintList.forEach((el) => el.remove());

    // 4. Converte os inputs clonados em texto estático com estilo correspondente
    const clonedInputs = Array.from(
      pageClone.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        '[data-print-field-id]'
      )
    );

    clonedInputs.forEach((cloned) => {
      const idx = Number(cloned.getAttribute('data-print-field-id'));
      const orig = origInputs[idx];
      if (!orig) return;

      if (orig instanceof HTMLSelectElement) {
        const span = document.createElement('span');
        span.textContent = orig.options[orig.selectedIndex]?.text || orig.value || '';
        span.className = cloned.className || '';
        span.style.cssText = cloned.style.cssText;
        span.style.border = 'none';
        span.style.background = 'transparent';
        span.style.display = 'inline-block';
        span.style.fontWeight = 'bold';
        cloned.parentNode?.replaceChild(span, cloned);
      } else if (orig instanceof HTMLTextAreaElement) {
        const div = document.createElement('div');
        div.textContent = orig.value || '';
        div.className = cloned.className || '';
        div.style.cssText = cloned.style.cssText;
        div.style.whiteSpace = 'pre-wrap';
        div.style.wordBreak = 'break-word';
        div.style.border = 'none';
        div.style.background = 'transparent';
        div.style.resize = 'none';
        div.style.overflow = 'visible';
        cloned.parentNode?.replaceChild(div, cloned);
      } else if (orig instanceof HTMLInputElement) {
        if (orig.type === 'file' || orig.type === 'hidden') {
          cloned.remove();
        } else if (orig.type !== 'checkbox' && orig.type !== 'radio') {
          const span = document.createElement('span');
          span.textContent = orig.value || '';
          span.className = cloned.className || '';
          span.style.cssText = cloned.style.cssText;
          span.style.display = 'inline-block';
          span.style.border = 'none';
          span.style.background = 'transparent';
          cloned.parentNode?.replaceChild(span, cloned);
        }
      }
    });

    // 5. Configura proporções estritas A4 (794px × 1123px) no clone
    pageClone.style.width = '794px';
    pageClone.style.minWidth = '794px';
    pageClone.style.maxWidth = '794px';
    pageClone.style.height = '1123px';
    pageClone.style.minHeight = '1123px';
    pageClone.style.maxHeight = '1123px';
    pageClone.style.margin = '0';
    pageClone.style.padding = '36px 45px 30px 45px';
    pageClone.style.border = 'none';
    pageClone.style.boxShadow = 'none';
    pageClone.style.boxSizing = 'border-box';
    pageClone.style.overflow = 'hidden';
    pageClone.style.backgroundColor = '#ffffff';
    pageClone.style.display = 'flex';
    pageClone.style.flexDirection = 'column';
    pageClone.style.justifyContent = 'space-between';

    // 6. Anexa a página em container isolado no topo do body para renderização sem desvios de rolagem
    const mountWrapper = document.createElement('div');
    mountWrapper.style.position = 'fixed';
    mountWrapper.style.left = '0';
    mountWrapper.style.top = '0';
    mountWrapper.style.width = '794px';
    mountWrapper.style.height = '1123px';
    mountWrapper.style.zIndex = '-9999';
    mountWrapper.style.opacity = '0';
    mountWrapper.style.pointerEvents = 'none';
    mountWrapper.style.overflow = 'hidden';
    mountWrapper.appendChild(pageClone);
    document.body.appendChild(mountWrapper);

    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvas(pageClone, {
        scale: 2, // 2x para máxima nitidez A4
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        height: 1123,
        windowWidth: 794,
        windowHeight: 1123,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
      });
    } finally {
      if (mountWrapper.parentNode) {
        mountWrapper.parentNode.removeChild(mountWrapper);
      }
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    paginasImagens.push(imgData);

    if (i > 0) {
      pdf.addPage('a4', orientacao);
    }

    // Cada folha no PDF ocupa exatamente o tamanho padrão da página A4 (210mm x 297mm)
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfLargura, pdfAltura, undefined, 'FAST');
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
