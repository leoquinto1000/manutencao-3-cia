import React, { useState, useRef } from 'react';
import {
  InformeMensal,
  PaginaFotoServico,
  FotoCard,
  MembroEquipe,
  StatusInformeMensal,
  TipoBadgeFoto,
  HistoricoModificacaoInforme,
} from '../../types';
import { gerarId, baixarFoto, comprimirImagemParaArmazenamento, DADOS_INICIAIS_INFORME } from '../../utils';
import { ModalVisualizadorPDF } from '../PrestacaoContas/ModalVisualizadorPDF';
import { LayoutAntesDepois } from './LayoutAntesDepois';
import { BadgeFotoColorido } from './BadgeFotoColorido';
import { ModalHistoricoAuditoria } from './ModalHistoricoAuditoria';
import { DashboardGestaoArquivo } from './DashboardGestaoArquivo';
import {
  Plus,
  Trash2,
  Printer,
  Archive,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  Grid,
  LayoutGrid,
  AlertTriangle,
  X,
  Download,
  Eye,
  Search,
  FileText,
  Users,
  Sliders,
  Edit2,
  Check,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Copy,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  ArrowLeftRight,
  History,
  ShieldCheck,
  Tag,
  Palette,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface InformeMensalViewProps {
  informeAtual: InformeMensal;
  onChangeInformeAtual: (informe: InformeMensal) => void;
  informesArquivados: InformeMensal[];
  onArquivarInforme: (informe: InformeMensal, idExistenteParaAtualizar?: string) => void;
  onCarregarInformeArquivado: (informe: InformeMensal) => void;
  onExcluirInformeArquivado: (id: string) => void;
  onLimparHistoricoInformes: () => void;
  onImportarBackupInformes?: (informes: InformeMensal[]) => void;
  usuarioLogado?: { nome?: string; graduacaoOuCargo?: string; email?: string } | null;
  membros?: MembroEquipe[];
}

export const InformeMensalView: React.FC<InformeMensalViewProps> = ({
  informeAtual,
  onChangeInformeAtual,
  informesArquivados,
  onArquivarInforme,
  onCarregarInformeArquivado,
  onExcluirInformeArquivado,
  onLimparHistoricoInformes,
  onImportarBackupInformes,
  usuarioLogado,
  membros = [],
}) => {
  const [subAba, setSubAba] = useState<'edicao' | 'arquivo'>('edicao');
  const [informeParaExcluir, setInformeParaExcluir] = useState<InformeMensal | null>(null);
  const [informeParaVisualizar, setInformeParaVisualizar] = useState<InformeMensal | null>(null);
  const [modalLimparAberto, setModalLimparAberto] = useState<boolean>(false);
  const [modalNovoAberto, setModalNovoAberto] = useState<boolean>(false);
  const [modalPdfAberto, setModalPdfAberto] = useState<boolean>(false);
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState<boolean>(false);
  const [popoverBadgeFotoKey, setPopoverBadgeFotoKey] = useState<string | null>(null);
  const [paginaParaExcluirId, setPaginaParaExcluirId] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [filtroPesquisa, setFiltroPesquisa] = useState<string>('');
  const [modoEdicaoDestaques, setModoEdicaoDestaques] = useState<boolean>(false);
  const [destaqueEmEdicaoId, setDestaqueEmEdicaoId] = useState<string | null>(null);

  const documentoRef = useRef<HTMLDivElement>(null);
  const inputCapaRef = useRef<HTMLInputElement>(null);
  const inputNovaPaginaFotosRef = useRef<HTMLInputElement>(null);
  const [carregandoCapa, setCarregandoCapa] = useState<boolean>(false);
  const [isDraggingCapa, setIsDraggingCapa] = useState<boolean>(false);

  // Ref que garante sempre a versão mais recente do informe nas funções assíncronas
  const informeAtualRef = useRef(informeAtual);
  informeAtualRef.current = informeAtual;

  // Estado para indicar qual foto específica está sendo enviada/processada no momento (chave: "pagId-fotoId")
  const [uploadingFotoKey, setUploadingFotoKey] = useState<string | null>(null);
  // Estado para indicar drag & drop sobre uma foto específica
  const [dragOverFotoKey, setDragOverFotoKey] = useState<string | null>(null);

  const informeArquivadoCorrespondente = informeAtual.id
    ? informesArquivados.find((x) => x.id === informeAtual.id)
    : null;

  const informesFiltrados = informesArquivados.filter((inf) => {
    if (!filtroPesquisa.trim()) return true;
    const termo = filtroPesquisa.toLowerCase();
    return (
      inf.titulo?.toLowerCase().includes(termo) ||
      inf.mesAno?.toLowerCase().includes(termo) ||
      inf.subtitulo?.toLowerCase().includes(termo)
    );
  });

  const handleUpdateField = (field: keyof InformeMensal, val: any) => {
    onChangeInformeAtual({ ...informeAtualRef.current, [field]: val });
  };

  const handleUploadCapa = async (file: File) => {
    if (!file) return;
    setCarregandoCapa(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const rawDataUrl = ev.target?.result as string;
        if (!rawDataUrl) {
          setCarregandoCapa(false);
          return;
        }

        let finalDataUrl = rawDataUrl;
        try {
          // Comprime suavemente para otimização de render e armazenamento
          const compressed = await comprimirImagemParaArmazenamento(rawDataUrl, 1280, 0.76);
          if (compressed && compressed.length > 50) {
            finalDataUrl = compressed;
          }
        } catch (e) {
          console.warn('Compressão falhou, utilizando imagem original:', e);
        }

        handleUpdateField('capaUrl', finalDataUrl);
        setCarregandoCapa(false);
        setMensagemSucesso('🖼️ Imagem da capa atualizada com sucesso!');
        setTimeout(() => setMensagemSucesso(null), 3000);
      };
      reader.onerror = (err) => {
        console.error('Erro ao ler arquivo da capa:', err);
        setCarregandoCapa(false);
        setMensagemSucesso('⚠️ Não foi possível ler o arquivo selecionado.');
        setTimeout(() => setMensagemSucesso(null), 3500);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Falha geral no upload da capa:', err);
      setCarregandoCapa(false);
    }
  };

  const handleRestaurarCapaPadrao = () => {
    handleUpdateField('capaUrl', DADOS_INICIAIS_INFORME.capaUrl);
    handleUpdateField('capaAltura', 195);
    setMensagemSucesso('🔄 Imagem da capa restaurada para o padrão oficial.');
    setTimeout(() => setMensagemSucesso(null), 3000);
  };

  // Adiciona página com layout dedicado Antes e Depois
  const handleAddPaginaAntesDepois = () => {
    const novaPagina: PaginaFotoServico = {
      id: gerarId(),
      tituloServico: 'RECUPERAÇÃO E REVITALIZAÇÃO PREDIAL',
      dataServico: informeAtualRef.current.mesAno || 'AGOSTO 2026',
      descricao: 'Registro comparativo entre o estado inicial antes dos reparos e as intervenções técnicas de revitalização executadas.',
      anotacao: '✅ Intervenção concluída garantindo a segurança, funcionalidade e habitabilidade das instalações.',
      tipoGrid: 'antes_depois',
      layoutDedicado: 'antes_depois',
      fotos: [
        {
          id: gerarId(),
          url: '',
          legenda: 'Registro do estado inicial com avarias e desgaste',
          tipoBadge: 'antes',
          badgeTexto: 'ANTES • ESTADO INICIAL',
          badgeCor: 'vermelho',
        },
        {
          id: gerarId(),
          url: '',
          legenda: 'Serviço finalizado com revitalização completa',
          tipoBadge: 'depois',
          badgeTexto: 'DEPOIS • REVITALIZADO',
          badgeCor: 'verde',
        },
      ],
    };

    const paginasAtuais = informeAtualRef.current.paginas || [];
    handleUpdateField('paginas', [...paginasAtuais, novaPagina]);
    setMensagemSucesso(`⚖️ Página ${paginasAtuais.length + 2} adicionada no Layout Dedicado "Antes e Depois"!`);
    setTimeout(() => setMensagemSucesso(null), 3500);
  };

  const handleAtualizarStatus = (novoStatus: StatusInformeMensal) => {
    const agora = new Date().toLocaleString('pt-BR');
    const autor = usuarioLogado?.nome || 'Operador';
    const novoHistorico: HistoricoModificacaoInforme = {
      id: gerarId(),
      dataHora: agora,
      usuario: autor,
      acao: `Alteração de Situação para "${novoStatus}"`,
      detalhe: `Status do relatório atualizado para ${novoStatus}.`,
    };
    const historicoAtual = informeAtualRef.current.historico || [];
    onChangeInformeAtual({
      ...informeAtualRef.current,
      status: novoStatus,
      ultimaAtualizacao: agora,
      autorUltimaAtualizacao: autor,
      historico: [novoHistorico, ...historicoAtual],
    });
    setMensagemSucesso(`📌 Situação do informe definida como "${novoStatus}"!`);
    setTimeout(() => setMensagemSucesso(null), 3000);
  };

  const handleArquivarComAuditoria = (idExistente?: string) => {
    const agora = new Date().toLocaleString('pt-BR');
    const autor = usuarioLogado?.nome || 'Operador';
    const qtdPags = (informeAtualRef.current.paginas || []).length + 1;
    const historicoAtual = informeAtualRef.current.historico || [];
    const novoHistorico: HistoricoModificacaoInforme = {
      id: gerarId(),
      dataHora: agora,
      usuario: autor,
      acao: idExistente ? 'Atualização de Arquivamento' : 'Arquivamento no Acervo Histórico',
      detalhe: `Informe arquivado com ${qtdPags} páginas e registros técnicos de manutenção.`,
    };

    const informeAtualizado: InformeMensal = {
      ...informeAtualRef.current,
      status: informeAtualRef.current.status === 'Rascunho' ? 'Aprovado' : (informeAtualRef.current.status || 'Aprovado'),
      ultimaAtualizacao: agora,
      autorUltimaAtualizacao: autor,
      historico: [novoHistorico, ...historicoAtual],
    };

    onChangeInformeAtual(informeAtualizado);
    onArquivarInforme(informeAtualizado, idExistente);
    setMensagemSucesso('📦 Informe arquivado com sucesso no acervo permanente da subunidade!');
    setTimeout(() => setMensagemSucesso(null), 4000);
  };

  const handleDuplicarParaNovoMes = (inf: InformeMensal) => {
    const meses = [
      'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
      'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
    ];
    let proximoMes = 'NOVO MÊS';
    const match = (inf.mesAno || '').match(/([A-ZÇ]+)\s*(\d{4})/i);
    if (match) {
      const mesNome = match[1].toUpperCase();
      const ano = parseInt(match[2], 10);
      const idx = meses.findIndex((m) => mesNome.includes(m));
      if (idx !== -1) {
        const proxIdx = (idx + 1) % 12;
        const proxAno = proxIdx === 0 ? ano + 1 : ano;
        proximoMes = `${meses[proxIdx]} ${proxAno}`;
      }
    }
    const autor = usuarioLogado?.nome || 'Operador';
    const agora = new Date().toLocaleString('pt-BR');
    const novoInforme: InformeMensal = {
      ...JSON.parse(JSON.stringify(inf)),
      id: gerarId(),
      mesAno: proximoMes,
      subtitulo: `REALIZAÇÕES ${proximoMes} • CUIDADO COM O QUE É NOSSO`,
      status: 'Rascunho',
      versao: 1,
      criadoEm: new Date().toLocaleDateString('pt-BR'),
      ultimaAtualizacao: agora,
      autorUltimaAtualizacao: autor,
      historico: [
        {
          id: gerarId(),
          dataHora: agora,
          usuario: autor,
          acao: 'Criação a partir de Relatório Anterior',
          detalhe: `Relatório inicializado para o mês de ${proximoMes} mantendo estrutura e configurações institucionais.`,
        },
      ],
    };
    onChangeInformeAtual(novoInforme);
    setSubAba('edicao');
    setMensagemSucesso(`📄 Novo informe para "${proximoMes}" gerado com base no mês anterior!`);
    setTimeout(() => setMensagemSucesso(null), 4000);
  };

  const handleAddPaginaFotos = () => {
    const novaPagina: PaginaFotoServico = {
      id: gerarId(),
      tituloServico: 'SERVIÇO DE MANUTENÇÃO PREDIAL',
      dataServico: informeAtualRef.current.mesAno || 'AGOSTO 2026',
      descricao: 'Descrição detalhada dos reparos executados pelos Cadetes e Efetivo da 3ª Companhia.',
      anotacao: '✅ Intervenção concluída garantindo a segurança e funcionalidade das instalações.',
      tipoGrid: '2',
      fotos: [
        {
          id: gerarId(),
          url: '', // Inicia vazio para destacar o espaço de inserção direta do computador
          legenda: 'Registro do estado inicial com avarias',
          tipoBadge: 'antes',
          badgeTexto: 'ANTES',
          badgeCor: 'vermelho',
        },
        {
          id: gerarId(),
          url: '', // Inicia vazio para destacar o espaço de inserção direta do computador
          legenda: 'Serviço finalizado com revitalização completa',
          tipoBadge: 'depois',
          badgeTexto: 'DEPOIS',
          badgeCor: 'verde',
        },
      ],
    };

    const paginasAtuais = informeAtualRef.current.paginas || [];
    handleUpdateField('paginas', [...paginasAtuais, novaPagina]);
    setMensagemSucesso(`📄 Página ${paginasAtuais.length + 2} adicionada! Clique nos espaços para carregar as fotos do seu computador.`);
    setTimeout(() => setMensagemSucesso(null), 3500);
  };

  // Cria uma nova página no relatório diretamente a partir dos arquivos selecionados do computador
  const handleCriarPaginaComFotosDoPC = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    try {
      const fotosCarregadas: FotoCard[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const dataUrl = await comprimirImagemParaArmazenamento(file, 1200, 0.78);
        if (dataUrl && dataUrl.length > 50 && !dataUrl.startsWith('data:,')) {
          const prefixo = i === 0 ? 'ANTES: ' : i === 1 ? 'DEPOIS: ' : '';
          const nomeLimpo = file.name.replace(/\.[^/.]+$/, '').toUpperCase();
          fotosCarregadas.push({
            id: gerarId(),
            url: dataUrl,
            legenda: `${prefixo}${nomeLimpo}`,
          });
        }
      }

      if (fotosCarregadas.length === 0) {
        setMensagemSucesso('⚠️ Não foi possível ler as fotos selecionadas. Verifique o formato dos arquivos.');
        setTimeout(() => setMensagemSucesso(null), 3500);
        return;
      }

      const gridCalculado: '1' | '2' | '3' | '4' =
        fotosCarregadas.length === 1 ? '1' : fotosCarregadas.length === 3 ? '3' : fotosCarregadas.length >= 4 ? '4' : '2';

      const novaPagina: PaginaFotoServico = {
        id: gerarId(),
        tituloServico: 'SERVIÇO DE MANUTENÇÃO PREDIAL',
        dataServico: informeAtualRef.current.mesAno || 'AGOSTO 2026',
        descricao: 'Descrição detalhada dos reparos executados pelos Cadetes e Efetivo da 3ª Companhia.',
        anotacao: '✅ Intervenção concluída garantindo a segurança e funcionalidade das instalações.',
        tipoGrid: gridCalculado,
        fotos: fotosCarregadas,
      };

      const paginasAtuais = informeAtualRef.current.paginas || [];
      handleUpdateField('paginas', [...paginasAtuais, novaPagina]);
      setMensagemSucesso(`📄 Página ${paginasAtuais.length + 2} criada com ${fotosCarregadas.length} foto(s) do seu computador!`);
      setTimeout(() => setMensagemSucesso(null), 3500);
    } catch (err) {
      console.error('Erro ao criar página com fotos do computador:', err);
      setMensagemSucesso('⚠️ Ocorreu um erro ao carregar as fotos selecionadas.');
      setTimeout(() => setMensagemSucesso(null), 3500);
    }
  };

  const handleUpdatePagina = (pagId: string, field: keyof PaginaFotoServico, val: any) => {
    const updated = informeAtual.paginas.map((p) => (p.id === pagId ? { ...p, [field]: val } : p));
    handleUpdateField('paginas', updated);
  };

  const handleRemovePagina = (pagId: string) => {
    handleUpdateField(
      'paginas',
      informeAtual.paginas.filter((p) => p.id !== pagId)
    );
    setMensagemSucesso('🗑️ Página de fotos removida com sucesso!');
    setTimeout(() => setMensagemSucesso(null), 3000);
  };

  const handleMoverPagina = (pagIdx: number, direcao: 'cima' | 'baixo') => {
    const paginas = [...informeAtual.paginas];
    const novoIdx = direcao === 'cima' ? pagIdx - 1 : pagIdx + 1;
    if (novoIdx < 0 || novoIdx >= paginas.length) return;
    const temp = paginas[pagIdx];
    paginas[pagIdx] = paginas[novoIdx];
    paginas[novoIdx] = temp;
    handleUpdateField('paginas', paginas);
    setMensagemSucesso(`📄 Página ${pagIdx + 2} movida para a posição ${novoIdx + 2}!`);
    setTimeout(() => setMensagemSucesso(null), 3000);
  };

  const handleDuplicarPagina = (pagId: string) => {
    const pagina = informeAtualRef.current.paginas.find((p) => p.id === pagId);
    if (!pagina) return;
    const novaPagina: PaginaFotoServico = {
      ...pagina,
      id: gerarId(),
      tituloServico: `${pagina.tituloServico} (CÓPIA)`,
      fotos: pagina.fotos.map((f) => ({ ...f, id: gerarId() })),
    };
    const indexOriginal = informeAtualRef.current.paginas.findIndex((p) => p.id === pagId);
    const novasPaginas = [...informeAtualRef.current.paginas];
    novasPaginas.splice(indexOriginal + 1, 0, novaPagina);
    handleUpdateField('paginas', novasPaginas);
    setMensagemSucesso('📋 Página duplicada com sucesso!');
    setTimeout(() => setMensagemSucesso(null), 3000);
  };

  const handleUploadFotoPagina = async (pagId: string, fotoId: string, file: File) => {
    if (!file) return;
    const key = `${pagId}-${fotoId}`;
    setUploadingFotoKey(key);
    try {
      const dataUrl = await comprimirImagemParaArmazenamento(file, 1200, 0.78);
      if (!dataUrl || dataUrl.length < 50 || dataUrl.startsWith('data:,')) {
        throw new Error('Falha ao processar arquivo de imagem');
      }
      const updated = informeAtualRef.current.paginas.map((p) => {
        if (p.id !== pagId) return p;
        const updatedFotos = p.fotos.map((f) => (f.id === fotoId ? { ...f, url: dataUrl } : f));
        return { ...p, fotos: updatedFotos };
      });
      handleUpdateField('paginas', updated);
      setMensagemSucesso('📷 Foto do computador carregada com sucesso no documento!');
      setTimeout(() => setMensagemSucesso(null), 2500);
    } catch (err) {
      console.error('Erro ao processar foto da página:', err);
      setMensagemSucesso('⚠️ Não foi possível carregar esta foto. Por favor, tente com outro arquivo de imagem.');
      setTimeout(() => setMensagemSucesso(null), 3500);
    } finally {
      setUploadingFotoKey(null);
    }
  };

  const handleAddFotoComUpload = async (pagId: string, fileOrList: File | FileList | File[]) => {
    const files: File[] = fileOrList instanceof File ? [fileOrList] : Array.from(fileOrList);
    if (files.length === 0) return;
    setUploadingFotoKey(`pagina-${pagId}`);
    try {
      const novasFotos: FotoCard[] = [];
      for (const file of files) {
        const dataUrl = await comprimirImagemParaArmazenamento(file, 1200, 0.78);
        if (dataUrl && dataUrl.length > 50 && !dataUrl.startsWith('data:,')) {
          novasFotos.push({
            id: gerarId(),
            url: dataUrl,
            legenda: file.name.replace(/\.[^/.]+$/, '').toUpperCase() || 'Registro Fotográfico',
          });
        }
      }

      if (novasFotos.length > 0) {
        const updated = informeAtualRef.current.paginas.map((p) => {
          if (p.id !== pagId) return p;
          return { ...p, fotos: [...p.fotos, ...novasFotos] };
        });
        handleUpdateField('paginas', updated);
        setMensagemSucesso(`📷 ${novasFotos.length} foto(s) do computador inserida(s) na página!`);
        setTimeout(() => setMensagemSucesso(null), 3000);
      }
    } catch (err) {
      console.error('Erro ao adicionar fotos do computador:', err);
      setMensagemSucesso('⚠️ Ocorreu um erro ao carregar as imagens selecionadas.');
      setTimeout(() => setMensagemSucesso(null), 3500);
    } finally {
      setUploadingFotoKey(null);
    }
  };

  const handleUpdateLegendaFoto = (pagId: string, fotoId: string, legenda: string) => {
    const updated = informeAtualRef.current.paginas.map((p) => {
      if (p.id !== pagId) return p;
      const updatedFotos = p.fotos.map((f) => (f.id === fotoId ? { ...f, legenda } : f));
      return { ...p, fotos: updatedFotos };
    });
    handleUpdateField('paginas', updated);
  };

  const handleAddFotoToPagina = (pagId: string) => {
    const updated = informeAtualRef.current.paginas.map((p) => {
      if (p.id !== pagId) return p;
      const newFoto: FotoCard = {
        id: gerarId(),
        url: '', // Inicia vazio para destacar dropzone de carregamento do computador
        legenda: 'Novo registro fotográfico do serviço',
      };
      return { ...p, fotos: [...p.fotos, newFoto] };
    });
    handleUpdateField('paginas', updated);
    setMensagemSucesso('🖼️ Novo espaço de foto inserido! Clique nele para carregar a imagem do seu computador.');
    setTimeout(() => setMensagemSucesso(null), 2500);
  };

  const handleRemoveFotoFromPagina = (pagId: string, fotoId: string) => {
    const updated = informeAtual.paginas.map((p) => {
      if (p.id !== pagId) return p;
      return { ...p, fotos: p.fotos.filter((f) => f.id !== fotoId) };
    });
    handleUpdateField('paginas', updated);
    setMensagemSucesso('🗑️ Foto excluída da página.');
    setTimeout(() => setMensagemSucesso(null), 2500);
  };

  const handleMoverFoto = (pagId: string, fotoIdx: number, direcao: 'esquerda' | 'direita') => {
    const updated = informeAtual.paginas.map((p) => {
      if (p.id !== pagId) return p;
      const fotos = [...p.fotos];
      const targetIdx = direcao === 'esquerda' ? fotoIdx - 1 : fotoIdx + 1;
      if (targetIdx < 0 || targetIdx >= fotos.length) return p;
      const temp = fotos[fotoIdx];
      fotos[fotoIdx] = fotos[targetIdx];
      fotos[targetIdx] = temp;
      return { ...p, fotos };
    });
    handleUpdateField('paginas', updated);
  };

  const handleMoverDestaque = (index: number, direcao: 'cima' | 'baixo') => {
    const destaques = [...(informeAtual.destaques || [])];
    const targetIdx = direcao === 'cima' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= destaques.length) return;
    const temp = destaques[index];
    destaques[index] = destaques[targetIdx];
    destaques[targetIdx] = temp;
    handleUpdateField('destaques', destaques);
  };

  const handleNovoEmBranco = () => {
    onChangeInformeAtual({
      id: gerarId(),
      mesAno: 'NOVO MÊS',
      titulo: 'INFORME DE MANUTENÇÃO',
      subtitulo: 'AÇÕES DE INFRAESTRUTURA E GESTÃO PREDIAL',
      cabecalhoEsquerda: 'ACADEMIA DE POLÍCIA MILITAR DO BARRO BRANCO - O003',
      cabecalhoDireita: 'MANUTENÇÃO 3ª CIA\nCIA ES',
      capaUrl: DADOS_INICIAIS_INFORME.capaUrl,
      capaAltura: 195,
      equipeTexto: '',
      resumoTexto: '',
      tituloDestaques: 'Dentre as principais atividades executadas, destacam-se:',
      destaques: [],
      rodapeTexto: 'BERÇO DO OFICIALATO PAULISTA',
      paginas: [],
    });
    setModalNovoAberto(false);
    setMensagemSucesso('📄 Novo informe em branco pronto para preenchimento!');
    setTimeout(() => setMensagemSucesso(null), 3500);
  };

  const handleRestaurarModeloPadrao = () => {
    onChangeInformeAtual({
      ...DADOS_INICIAIS_INFORME,
      id: gerarId(),
    });
    setModalNovoAberto(false);
    setMensagemSucesso('🔄 Modelo padrão do informe restaurado com sucesso!');
    setTimeout(() => setMensagemSucesso(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Sub tabs */}
      <div className="no-print flex justify-center gap-2 mb-2">
        <button
          onClick={() => setSubAba('edicao')}
          className={`px-4 py-2 text-xs font-bold rounded-md transition ${
            subAba === 'edicao'
              ? 'bg-[#1a2b4c] text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          📝 1. Edição do Informe do Mês
        </button>
        <button
          onClick={() => setSubAba('arquivo')}
          className={`px-4 py-2 text-xs font-bold rounded-md transition ${
            subAba === 'arquivo'
              ? 'bg-[#1a2b4c] text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          📁 2. Arquivo de Informes ({informesArquivados.length})
        </button>
      </div>

      {subAba === 'edicao' && (
        <div className="space-y-4">
          {/* Mensagem de Feedback */}
          {mensagemSucesso && (
            <div className="no-print bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-between shadow-2xs animate-in fade-in duration-150 max-w-[820px] mx-auto">
              <span>{mensagemSucesso}</span>
              <button onClick={() => setMensagemSucesso(null)} className="text-emerald-600 hover:text-emerald-900 font-bold ml-2">✕</button>
            </div>
          )}

          {/* Banner quando editando um informe carregado do arquivo histórico */}
          {informeArquivadoCorrespondente && (
            <div className="no-print bg-amber-50 border border-amber-300 rounded-lg p-3 max-w-[820px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-950 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">📝</span>
                <div>
                  <span className="font-bold">Editando Informe Arquivado:</span>{' '}
                  <span className="font-medium">"{informeArquivadoCorrespondente.titulo} - {informeArquivadoCorrespondente.mesAno}"</span>
                  <div className="text-[11px] text-amber-800">
                    Você pode salvar alterações atualizando o registro existente ou criando um novo arquivamento.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onArquivarInforme(informeAtual, informeAtual.id);
                    setMensagemSucesso('💾 Informe arquivado atualizado com sucesso no histórico!');
                    setTimeout(() => setMensagemSucesso(null), 4000);
                  }}
                  className="bg-amber-700 hover:bg-amber-800 text-white font-semibold px-2.5 py-1.5 rounded transition cursor-pointer"
                >
                  Atualizar no Arquivo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onArquivarInforme(informeAtual);
                    setMensagemSucesso('➕ Salvo como novo informe adicional no arquivo!');
                    setTimeout(() => setMensagemSucesso(null), 4000);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5 py-1.5 rounded transition cursor-pointer"
                >
                  Salvar Novo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChangeInformeAtual({ ...DADOS_INICIAIS_INFORME, id: gerarId() });
                    setMensagemSucesso('📄 Novo informe em branco iniciado.');
                    setTimeout(() => setMensagemSucesso(null), 3000);
                  }}
                  className="text-slate-600 hover:text-slate-900 underline text-xs cursor-pointer ml-1"
                >
                  Limpar
                </button>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="no-print bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 max-w-[820px] mx-auto">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1a2b4c]">Mês:</span>
                <input
                  type="text"
                  value={informeAtual.mesAno}
                  onChange={(e) => handleUpdateField('mesAno', e.target.value.toUpperCase())}
                  className="w-32 px-2 py-1 font-bold text-xs uppercase border border-slate-300 rounded focus:ring-1 focus:ring-[#1a2b4c]"
                />
              </div>

              {/* Status do Relatório com Badges Coloridos */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-600">Status:</span>
                <select
                  value={informeAtual.status || 'Aprovado'}
                  onChange={(e) => handleAtualizarStatus(e.target.value as StatusInformeMensal)}
                  className={`text-xs font-extrabold px-2.5 py-1 rounded-md border outline-none cursor-pointer transition ${
                    informeAtual.status === 'Rascunho'
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : informeAtual.status === 'Em Revisão'
                      ? 'bg-blue-50 text-blue-900 border-blue-300'
                      : informeAtual.status === 'Arquivado'
                      ? 'bg-purple-50 text-purple-900 border-purple-300'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  }`}
                >
                  <option value="Aprovado">🟢 Aprovado Oficial</option>
                  <option value="Em Revisão">🔵 Em Revisão</option>
                  <option value="Rascunho">🟡 Rascunho</option>
                  <option value="Arquivado">🟣 Arquivado</option>
                </select>
              </div>

              {/* Botão de Histórico e Auditoria */}
              <button
                type="button"
                onClick={() => setModalHistoricoAberto(true)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition cursor-pointer"
                title="Visualizar histórico e auditoria de alterações deste relatório"
              >
                <History size={13} className="text-[#1a2b4c]" />
                <span>Histórico ({(informeAtual.historico || []).length})</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setModalNovoAberto(true)}
                className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-2 rounded-md transition border border-slate-300 cursor-pointer"
                title="Iniciar novo informe em branco ou restaurar modelo padrão"
              >
                <FileText size={14} className="text-slate-600" />
                <span>Novo</span>
              </button>

              {/* Botão Dedicado + Antes e Depois */}
              <button
                type="button"
                onClick={handleAddPaginaAntesDepois}
                className="flex items-center gap-1.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white text-xs font-extrabold px-3 py-2 rounded-md transition shadow-sm cursor-pointer"
                title="Adicionar página com Layout Dedicado Antes e Depois com Badges Coloridos"
              >
                <Sparkles size={14} className="text-[#c9a84e]" />
                <span>+ Antes & Depois</span>
              </button>

              {/* Input oculto para carregar fotos do PC e criar nova página automaticamente */}
              <input
                ref={inputNovaPaginaFotosRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleCriarPaginaComFotosDoPC(e.target.files);
                    e.target.value = '';
                  }
                }}
              />
              <button
                type="button"
                onClick={() => inputNovaPaginaFotosRef.current?.click()}
                className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-2.5 py-2 rounded-md transition shadow-sm cursor-pointer"
                title="Criar nova página carregando diretamente as fotos do seu computador"
              >
                <Upload size={14} />
                <span>+ Fotos PC</span>
              </button>

              <button
                type="button"
                onClick={handleAddPaginaFotos}
                className="flex items-center gap-1 bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-xs font-semibold px-2.5 py-2 rounded-md transition shadow-sm cursor-pointer"
                title="Adicionar nova página com fotos de serviços"
              >
                <Plus size={14} />
                <span>+ Pág ({informeAtual.paginas.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setModalPdfAberto(true)}
                className="flex items-center gap-1.5 bg-[#b89535] hover:bg-[#a48228] text-white text-xs font-bold px-3 py-2 rounded-md transition shadow-sm cursor-pointer"
                title="Visualizar relatório oficial formatado em folhas A4, exportar PDF ou imprimir"
              >
                <Eye size={14} />
                <span>Visualizar Relatório Oficial</span>
              </button>
              <button
                type="button"
                onClick={() => handleArquivarComAuditoria()}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-2.5 py-2 rounded-md transition shadow-sm cursor-pointer"
                title="Salvar este informe no arquivo permanente de relatórios com auditoria"
              >
                <Archive size={14} />
                <span>Arquivar</span>
              </button>
            </div>
          </div>

          {/* Documento Oficial Completo (Capa + Todas as Páginas de Fotos) */}
          <div ref={documentoRef} id="documento-informe-print-wrapper" className="space-y-8 print:space-y-0 print:m-0 print:p-0">
            {/* Document Cover Page (A4) */}
            <div className="relative group w-full max-w-[210mm] mx-auto print:max-w-[210mm] print:m-0 print:p-0">
              <div className="no-print mb-2 flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                <span className="flex items-center gap-1.5 text-[#1a2b4c] font-bold">
                  <FileText size={14} className="text-[#c9a84e]" />
                  <span>Página 1 (Capa Oficial)</span>
                </span>
                <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded text-[11px] border border-slate-200 font-medium">
                  Folha A4 • 210 × 297 mm
                </span>
              </div>
              <div className="apmbb-page bg-white">
              <div>
                {/* Header Institucional (Editável) */}
                <div className="flex justify-between items-start border-b-2 border-black pb-1.5 mb-4 font-heading gap-4">
                  <input
                    type="text"
                    value={informeAtual.cabecalhoEsquerda ?? 'ACADEMIA DE POLÍCIA MILITAR DO BARRO BRANCO - O003'}
                    onChange={(e) => handleUpdateField('cabecalhoEsquerda', e.target.value.toUpperCase())}
                    title="Clique para editar o cabeçalho institucional"
                    className="text-[11px] font-black text-black tracking-wide uppercase bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-blue-50/20 rounded px-1.5 py-0.5 w-full max-w-md transition outline-none"
                  />
                  <textarea
                    rows={2}
                    value={informeAtual.cabecalhoDireita ?? 'MANUTENÇÃO 3ª CIA\nCIA ES'}
                    onChange={(e) => handleUpdateField('cabecalhoDireita', e.target.value.toUpperCase())}
                    title="Clique para editar a subunidade/companhia"
                    className="text-[11px] font-black text-black tracking-wide text-right uppercase leading-tight bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-blue-50/20 rounded px-1.5 py-0.5 w-56 transition outline-none resize-none"
                  />
                </div>

                {/* Cover photo banner com Suporte a Upload Direto, Drag & Drop e Troca Confiável */}
                <div
                  className={`relative mb-4 group rounded-xl overflow-hidden border transition-all ${
                    isDraggingCapa ? 'ring-3 ring-[#1a2b4c] border-[#1a2b4c]' : 'border-slate-300 shadow-sm'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingCapa(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingCapa(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingCapa(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleUploadCapa(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  <div
                    className="bg-black transition-all relative flex items-center justify-center overflow-hidden"
                    style={{ height: `${informeAtual.capaAltura || 195}px` }}
                  >
                    <img
                      src={informeAtual.capaUrl || DADOS_INICIAIS_INFORME.capaUrl}
                      alt="Banner Capa Fachada"
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DADOS_INICIAIS_INFORME.capaUrl;
                      }}
                    />

                    {/* Indicador visual de processamento da capa */}
                    {carregandoCapa && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20">
                        <Loader2 size={30} className="animate-spin mb-1.5 text-[#c9a84e]" />
                        <span className="text-xs font-bold tracking-wide">Atualizando imagem da capa...</span>
                      </div>
                    )}

                    {/* Indicador de Drag & Drop ativo */}
                    {isDraggingCapa && (
                      <div className="absolute inset-0 bg-blue-900/80 border-2 border-dashed border-white flex flex-col items-center justify-center text-white z-30">
                        <Upload size={32} className="animate-bounce mb-1 text-white" />
                        <span className="text-xs font-black uppercase tracking-wider">Solte a foto da fachada aqui</span>
                      </div>
                    )}
                  </div>

                  {/* Input de Arquivo oculto vinculado ao Ref */}
                  <input
                    ref={inputCapaRef}
                    id="input-arquivo-capa"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleUploadCapa(e.target.files[0]);
                        e.target.value = '';
                      }
                    }}
                  />

                  {/* Botões de Ação na Capa */}
                  <div className="no-print absolute bottom-2.5 right-2.5 flex items-center gap-1.5 z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        inputCapaRef.current?.click();
                      }}
                      disabled={carregandoCapa}
                      className="bg-white/95 hover:bg-white text-slate-800 hover:text-[#1a2b4c] text-xs font-bold px-3 py-1.5 rounded-lg shadow-md hover:shadow-lg border border-slate-300/80 cursor-pointer transition flex items-center gap-1.5 backdrop-blur-xs disabled:opacity-50"
                      title="Clique para selecionar uma nova foto da capa do seu dispositivo"
                    >
                      <Upload size={13} className="text-[#1a2b4c]" />
                      <span>Alterar Imagem</span>
                    </button>

                    {informeAtual.capaUrl && informeAtual.capaUrl !== DADOS_INICIAIS_INFORME.capaUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRestaurarCapaPadrao();
                        }}
                        disabled={carregandoCapa}
                        className="bg-white/90 hover:bg-white text-slate-600 hover:text-red-700 text-[11px] font-semibold px-2 py-1.5 rounded-lg shadow-xs border border-slate-300/80 cursor-pointer transition flex items-center gap-1 backdrop-blur-xs"
                        title="Restaurar a fachada padrão da APMBB"
                      >
                        <RotateCcw size={11} />
                        <span>Padrão</span>
                      </button>
                    )}
                  </div>
                </div>

              {/* Titles */}
              <div className="text-center mb-4 space-y-1">
                <input
                  type="text"
                  value={informeAtual.titulo}
                  onChange={(e) => handleUpdateField('titulo', e.target.value)}
                  placeholder="TÍTULO DO INFORME"
                  title="Clique para editar o título principal"
                  className="font-heading text-xl font-extrabold text-[#1a2b4c] text-center w-full uppercase tracking-wide bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-blue-50/20 rounded px-2 py-1 transition outline-none"
                />
                <input
                  type="text"
                  value={informeAtual.subtitulo}
                  onChange={(e) => handleUpdateField('subtitulo', e.target.value)}
                  placeholder="SUBTÍTULO DO INFORME"
                  title="Clique para editar o subtítulo"
                  className="font-heading text-xs font-black text-[#b89535] text-center w-full uppercase tracking-wider bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-blue-50/20 rounded px-2 py-0.5 transition outline-none mt-0.5"
                />
              </div>

              {/* Editorial Grid: Team and Text (Sem barra de rolagem, caixas ajustadas) */}
              {(() => {
                const totalLinhasEquipe = Math.max((informeAtual.equipeTexto || '').split('\n').length, 1);
                const linhasEquipeCalc = Math.max(totalLinhasEquipe + 1, 14);

                const handlePreencherEfetivoCadastrado = () => {
                  if (!membros || membros.length === 0) return;
                  const nomesFormatados = membros
                    .map((m) => `${m.graduacao} PM ${m.nomeGuerra}`)
                    .join('\n');
                  handleUpdateField('equipeTexto', nomesFormatados);
                  setMensagemSucesso('📋 Lista da equipe preenchida com o efetivo cadastrado da 3ª Cia!');
                  setTimeout(() => setMensagemSucesso(null), 3500);
                };

                return (
                  <div className="grid grid-cols-[260px_1fr] gap-5 mt-2">
                    {/* Team roster */}
                    <div className="border-r border-slate-300 pr-3 font-mono text-[10.5px] font-bold leading-relaxed text-slate-900 flex flex-col">
                      <div className="no-print flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200 gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-sans flex items-center gap-1">
                          <Users size={11} />
                          <span>Equipe de Manutenção</span>
                        </span>
                        <div className="flex items-center gap-1">
                          {membros && membros.length > 0 && (
                            <button
                              type="button"
                              onClick={handlePreencherEfetivoCadastrado}
                              className="text-[9.5px] font-bold text-[#1a2b4c] hover:text-[#2c4373] bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded transition cursor-pointer font-sans"
                              title="Copiar nomes dos militares cadastrados da 3ª Cia para esta lista"
                            >
                              Copiar Efetivo
                            </button>
                          )}
                          {informeAtual.equipeTexto && (
                            <button
                              type="button"
                              onClick={() => handleUpdateField('equipeTexto', '')}
                              className="text-[9px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-1 py-0.5 rounded transition cursor-pointer font-sans"
                              title="Limpar a lista de equipe"
                            >
                              Limpar
                            </button>
                          )}
                        </div>
                      </div>
                      <textarea
                        rows={linhasEquipeCalc}
                        value={informeAtual.equipeTexto}
                        onChange={(e) => handleUpdateField('equipeTexto', e.target.value)}
                        placeholder="Digite o efetivo militar (ex: 1° TEN PM FROES)..."
                        title="Equipe de Manutenção (dimensão adaptável, sem barra de rolagem)"
                        className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-blue-50/20 rounded px-1.5 py-1 resize-none font-bold font-mono text-[10.5px] leading-relaxed text-slate-900 outline-none overflow-hidden transition"
                        style={{
                          height: 'auto',
                          minHeight: `${Math.max(totalLinhasEquipe * 21, 280)}px`,
                        }}
                      />
                    </div>

                    {/* Editorial text */}
                    <div className="text-xs leading-relaxed text-slate-900 text-justify space-y-3 font-sans flex flex-col">
                      <div>
                        <div className="no-print text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Resumo Editorial:
                        </div>
                        <textarea
                          rows={Math.max(4, Math.ceil((informeAtual.resumoTexto || '').length / 55), (informeAtual.resumoTexto || '').split('\n').length + 1)}
                          value={informeAtual.resumoTexto}
                          onChange={(e) => handleUpdateField('resumoTexto', e.target.value)}
                          placeholder="Descreva as principais intervenções de manutenção do mês..."
                          title="Clique para editar o resumo editorial"
                          className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-blue-50/20 rounded px-1.5 py-1 resize-none leading-relaxed text-slate-900 text-justify outline-none transition overflow-hidden"
                          style={{
                            height: 'auto',
                            minHeight: '80px',
                          }}
                          ref={(el) => {
                            if (el) {
                              el.style.height = 'auto';
                              el.style.height = `${el.scrollHeight}px`;
                            }
                          }}
                        />
                      </div>

                      <div className="pt-1 flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={informeAtual.tituloDestaques ?? 'Dentre as principais atividades executadas, destacam-se:'}
                          onChange={(e) => handleUpdateField('tituloDestaques', e.target.value)}
                          title="Clique para editar o título dos destaques"
                          className="font-bold text-[#1a2b4c] text-xs w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-blue-50/20 rounded px-1.5 py-0.5 outline-none transition"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setModoEdicaoDestaques(!modoEdicaoDestaques);
                            setDestaqueEmEdicaoId(null);
                          }}
                          className="no-print shrink-0 text-[10px] font-bold text-[#1a2b4c] hover:text-[#2c4373] bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2 py-0.5 rounded transition flex items-center gap-1 cursor-pointer"
                          title={modoEdicaoDestaques ? "Visualizar texto escrito do documento" : "Editar destaques em caixas expansíveis"}
                        >
                          {modoEdicaoDestaques ? (
                            <>
                              <FileText size={11} />
                              <span>Ver Texto Escrito</span>
                            </>
                          ) : (
                            <>
                              <Edit2 size={11} />
                              <span>Editar Destaques</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Lista dos Destaques - Exibição em Texto Escrito do Documento ou Edição Completa */}
                      {modoEdicaoDestaques ? (
                        <div className="space-y-3 text-xs">
                          {(informeAtual.destaques || []).map((dest, i) => (
                            <div key={dest.id || i} className="bg-slate-50/90 border border-slate-200 rounded-md p-2.5 space-y-2 text-xs">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1">
                                  <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-600 block mb-0.5">
                                    Título da Atividade:
                                  </label>
                                  <input
                                    type="text"
                                    value={dest.titulo}
                                    onChange={(e) => {
                                      const updated = (informeAtual.destaques || []).map((d, dIdx) =>
                                        dIdx === i ? { ...d, titulo: e.target.value } : d
                                      );
                                      handleUpdateField('destaques', updated);
                                    }}
                                    placeholder="Ex: Pintura e Revitalização"
                                    className="w-full font-bold text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-[#1a2b4c] outline-none"
                                  />
                                </div>
                                <div className="flex items-center gap-0.5 self-end pb-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleMoverDestaque(i, 'cima')}
                                    disabled={i === 0}
                                    className="text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed p-1 hover:bg-slate-200 rounded transition cursor-pointer"
                                    title="Mover para cima"
                                  >
                                    <ChevronUp size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoverDestaque(i, 'baixo')}
                                    disabled={i === (informeAtual.destaques || []).length - 1}
                                    className="text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed p-1 hover:bg-slate-200 rounded transition cursor-pointer"
                                    title="Mover para baixo"
                                  >
                                    <ChevronDown size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = (informeAtual.destaques || []).filter((_, dIdx) => dIdx !== i);
                                      handleUpdateField('destaques', updated);
                                    }}
                                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition cursor-pointer ml-1"
                                    title="Excluir este destaque"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>
                              <div>
                                <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-600 block mb-0.5">
                                  Descrição Completa do Trabalho:
                                </label>
                                <textarea
                                  rows={Math.max(2, Math.ceil((dest.desc || '').length / 60))}
                                  value={dest.desc}
                                  onChange={(e) => {
                                    const updated = (informeAtual.destaques || []).map((d, dIdx) =>
                                      dIdx === i ? { ...d, desc: e.target.value } : d
                                    );
                                    handleUpdateField('destaques', updated);
                                  }}
                                  placeholder="Descreva detalhadamente o serviço executado..."
                                  className="w-full text-slate-800 bg-white border border-slate-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-[#1a2b4c] outline-none resize-y leading-relaxed"
                                />
                              </div>
                            </div>
                          ))}
                          <div className="flex justify-between items-center pt-1 no-print">
                            <button
                              type="button"
                              onClick={() => {
                                const novoDestaque = {
                                  id: gerarId(),
                                  titulo: 'Nova Atividade',
                                  desc: 'Descrição dos trabalhos executados...',
                                };
                                handleUpdateField('destaques', [...(informeAtual.destaques || []), novoDestaque]);
                              }}
                              className="text-[11px] font-bold text-[#1a2b4c] hover:text-[#2c4373] flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              <Plus size={13} />
                              <span>Adicionar Mais um Destaque</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setModoEdicaoDestaques(false)}
                              className="px-3 py-1 bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-[11px] font-bold rounded flex items-center gap-1 transition cursor-pointer"
                            >
                              <Check size={12} />
                              <span>Concluir e Exibir no Documento</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5 text-xs">
                          {(informeAtual.destaques || []).map((dest, i) => {
                            const estaEditandoEste = destaqueEmEdicaoId === dest.id;

                            if (estaEditandoEste) {
                              return (
                                <div key={dest.id || i} className="bg-blue-50/60 border border-blue-200 rounded-md p-2.5 space-y-2 text-xs">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1">
                                      <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-600 block mb-0.5">
                                        Título da Atividade:
                                      </label>
                                      <input
                                        type="text"
                                        value={dest.titulo}
                                        onChange={(e) => {
                                          const updated = (informeAtual.destaques || []).map((d, dIdx) =>
                                            dIdx === i ? { ...d, titulo: e.target.value } : d
                                          );
                                          handleUpdateField('destaques', updated);
                                        }}
                                        placeholder="Ex: Pintura e Revitalização"
                                        className="w-full font-bold text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-[#1a2b4c] outline-none"
                                      />
                                    </div>
                                    <div className="flex items-center gap-0.5 self-end pb-0.5">
                                      <button
                                        type="button"
                                        onClick={() => handleMoverDestaque(i, 'cima')}
                                        disabled={i === 0}
                                        className="text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed p-1 hover:bg-slate-200 rounded transition cursor-pointer"
                                        title="Mover para cima"
                                      >
                                        <ChevronUp size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleMoverDestaque(i, 'baixo')}
                                        disabled={i === (informeAtual.destaques || []).length - 1}
                                        className="text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed p-1 hover:bg-slate-200 rounded transition cursor-pointer"
                                        title="Mover para baixo"
                                      >
                                        <ChevronDown size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = (informeAtual.destaques || []).filter((_, dIdx) => dIdx !== i);
                                          handleUpdateField('destaques', updated);
                                          setDestaqueEmEdicaoId(null);
                                        }}
                                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition cursor-pointer ml-1"
                                        title="Excluir este destaque"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-600 block mb-0.5">
                                      Descrição Completa do Trabalho:
                                    </label>
                                    <textarea
                                      rows={Math.max(2, Math.ceil((dest.desc || '').length / 60))}
                                      value={dest.desc}
                                      onChange={(e) => {
                                        const updated = (informeAtual.destaques || []).map((d, dIdx) =>
                                          dIdx === i ? { ...d, desc: e.target.value } : d
                                        );
                                        handleUpdateField('destaques', updated);
                                      }}
                                      placeholder="Descreva detalhadamente o serviço executado..."
                                      className="w-full text-slate-800 bg-white border border-slate-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-[#1a2b4c] outline-none resize-y leading-relaxed"
                                    />
                                  </div>
                                  <div className="flex justify-end pt-0.5">
                                    <button
                                      type="button"
                                      onClick={() => setDestaqueEmEdicaoId(null)}
                                      className="px-2.5 py-1 bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-[11px] font-bold rounded flex items-center gap-1 transition cursor-pointer"
                                    >
                                      <Check size={12} />
                                      <span>Concluir</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={dest.id || i}
                                className="flex items-start gap-1.5 group/dest relative py-0.5 px-1 -mx-1 rounded hover:bg-slate-50 transition cursor-pointer"
                                onClick={() => setDestaqueEmEdicaoId(dest.id)}
                                title="Clique para editar este destaque"
                              >
                                <span className="font-bold text-[#1a2b4c] mt-0.5 shrink-0 select-none">•</span>
                                <div className="flex-1 text-xs text-slate-800 leading-relaxed text-justify">
                                  <strong className="font-bold text-slate-900 mr-1">{dest.titulo}:</strong>
                                  <span className="text-slate-800">{dest.desc}</span>
                                </div>
                                <div className="no-print opacity-0 group-hover/dest:opacity-100 flex items-center gap-0.5 shrink-0 ml-1.5 transition">
                                  {i > 0 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoverDestaque(i, 'cima');
                                      }}
                                      className="text-slate-500 hover:text-slate-800 p-1 hover:bg-slate-200 rounded transition cursor-pointer"
                                      title="Mover destaque para cima"
                                    >
                                      <ChevronUp size={12} />
                                    </button>
                                  )}
                                  {i < (informeAtual.destaques || []).length - 1 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoverDestaque(i, 'baixo');
                                      }}
                                      className="text-slate-500 hover:text-slate-800 p-1 hover:bg-slate-200 rounded transition cursor-pointer"
                                      title="Mover destaque para baixo"
                                    >
                                      <ChevronDown size={12} />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDestaqueEmEdicaoId(dest.id);
                                    }}
                                    className="text-[#1a2b4c] hover:text-[#2c4373] p-1 hover:bg-slate-200 rounded transition cursor-pointer"
                                    title="Editar este destaque"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const updated = (informeAtual.destaques || []).filter((_, dIdx) => dIdx !== i);
                                      handleUpdateField('destaques', updated);
                                    }}
                                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition cursor-pointer"
                                    title="Remover este destaque"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          <div className="no-print pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                const novoId = gerarId();
                                const novoDestaque = {
                                  id: novoId,
                                  titulo: 'Nova Atividade',
                                  desc: 'Descrição dos trabalhos executados...',
                                };
                                handleUpdateField('destaques', [...(informeAtual.destaques || []), novoDestaque]);
                                setDestaqueEmEdicaoId(novoId);
                              }}
                              className="text-[11px] font-bold text-[#1a2b4c] hover:text-[#2c4373] flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              <Plus size={13} />
                              <span>Adicionar Atividade em Destaque</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer Institucional (Editável) */}
            <div className="border-t-2 border-black pt-2 text-center font-heading text-[11px] font-black tracking-widest text-black uppercase mt-4">
              <input
                type="text"
                value={informeAtual.rodapeTexto ?? 'BERÇO DO OFICIALATO PAULISTA'}
                onChange={(e) => handleUpdateField('rodapeTexto', e.target.value.toUpperCase())}
                title="Clique para editar o rodapé institucional"
                className="text-center font-heading text-[11px] font-black tracking-widest text-black uppercase w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-blue-50/20 rounded py-0.5 outline-none transition"
              />
            </div>
              </div>
            </div>

            {/* Dynamic Photo Pages */}
            {informeAtual.paginas.map((pagina, pagIdx) => (
              <div key={pagina.id} className="relative group w-full max-w-[210mm] mx-auto print:max-w-[210mm] print:m-0 print:p-0">
                <div className="no-print mb-2 flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                  <span className="flex items-center gap-1.5 text-[#1a2b4c] font-bold">
                    <ImageIcon size={14} className="text-[#c9a84e]" />
                    <span>Página {pagIdx + 2} de {informeAtual.paginas.length + 1} (Registro Fotográfico)</span>
                  </span>
                  <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded text-[11px] border border-slate-200 font-medium">
                    Folha A4 • 210 × 297 mm
                  </span>
                </div>

                {/* Toolbar on page hover */}
                <div className="no-print absolute top-8 right-2 z-10 flex flex-wrap items-center gap-1.5 bg-slate-900/90 backdrop-blur-xs p-1.5 rounded-lg shadow-lg border border-white/20 transition">
                {/* Page Badge */}
                <span className="text-[10px] font-bold text-[#c9a84e] px-1.5 py-0.5 bg-white/10 rounded">
                  Pág. {pagIdx + 2} de {informeAtual.paginas.length + 1}
                </span>

                {/* Reordenar Página */}
                <div className="flex items-center gap-0.5 border-r border-white/20 pr-1.5">
                  <button
                    type="button"
                    onClick={() => handleMoverPagina(pagIdx, 'cima')}
                    disabled={pagIdx === 0}
                    className="p-1 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed rounded transition cursor-pointer"
                    title="Mover esta página para cima"
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoverPagina(pagIdx, 'baixo')}
                    disabled={pagIdx === informeAtual.paginas.length - 1}
                    className="p-1 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed rounded transition cursor-pointer"
                    title="Mover esta página para baixo"
                  >
                    <ChevronDown size={13} />
                  </button>
                </div>

                {/* Duplicar Página */}
                <button
                  type="button"
                  onClick={() => handleDuplicarPagina(pagina.id)}
                  className="px-1.5 py-1 text-[10.5px] font-semibold text-slate-200 hover:text-white hover:bg-white/20 rounded flex items-center gap-1 cursor-pointer transition border-r border-white/20 pr-1.5"
                  title="Duplicar esta página (estrutura e textos)"
                >
                  <Copy size={12} />
                  <span>Duplicar</span>
                </button>

                {/* Seletor de Grid / Colunas e Layout Dedicado */}
                <div className="flex items-center gap-0.5 border-r border-white/20 pr-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdatePagina(pagina.id, 'tipoGrid', 'antes_depois');
                      handleUpdatePagina(pagina.id, 'layoutDedicado', 'antes_depois');
                    }}
                    className={`px-2 py-0.5 text-[10px] font-extrabold rounded cursor-pointer transition flex items-center gap-1 ${
                      pagina.tipoGrid === 'antes_depois' || pagina.layoutDedicado === 'antes_depois'
                        ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white font-black shadow-xs ring-1 ring-white/40'
                        : 'bg-white/10 text-rose-300 hover:bg-white/20'
                    }`}
                    title="Layout Dedicado Antes e Depois com Badges Coloridos"
                  >
                    <Sparkles size={11} className="text-[#c9a84e]" />
                    <span>Antes & Depois</span>
                  </button>

                  <span className="text-[9.5px] text-slate-400 font-bold mx-1">|</span>

                  <span className="text-[9.5px] text-slate-300 font-bold mr-0.5">Colunas:</span>
                  {(['1', '2', '3', '4'] as const).map((cols) => (
                    <button
                      key={cols}
                      type="button"
                      onClick={() => {
                        handleUpdatePagina(pagina.id, 'tipoGrid', cols);
                        handleUpdatePagina(pagina.id, 'layoutDedicado', 'colunas');
                      }}
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer transition ${
                        pagina.tipoGrid === cols && pagina.layoutDedicado !== 'antes_depois'
                          ? 'bg-[#c9a84e] text-slate-950 font-black shadow-xs'
                          : 'bg-white/10 text-slate-200 hover:bg-white/20'
                      }`}
                      title={`${cols} foto(s) no layout`}
                    >
                      {cols}
                    </button>
                  ))}
                </div>

                {/* Adicionar Fotos: Upload direto ou padrão */}
                <input
                  id={`input-fotos-pagina-${pagina.id}`}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleAddFotoComUpload(pagina.id, e.target.files);
                      e.target.value = '';
                    }
                  }}
                />
                <label
                  htmlFor={`input-fotos-pagina-${pagina.id}`}
                  className="px-2 py-1 text-[10.5px] font-bold text-emerald-300 hover:text-emerald-100 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 rounded flex items-center gap-1 cursor-pointer transition"
                  title="Enviar foto(s) do computador diretamente para esta página"
                >
                  <Upload size={12} className="pointer-events-none" />
                  <span className="pointer-events-none">+ Fotos do PC</span>
                </label>

                <button
                  type="button"
                  onClick={() => handleAddFotoToPagina(pagina.id)}
                  className="px-1.5 py-1 text-[10.5px] font-semibold text-blue-200 hover:text-white hover:bg-blue-900/60 rounded flex items-center gap-1 cursor-pointer transition"
                  title="Adicionar mais um espaço de foto com legenda"
                >
                  <Plus size={12} />
                  <span>Foto</span>
                </button>

                {/* Baixar todas as fotos */}
                {pagina.fotos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      pagina.fotos.forEach((foto, fIdx) => {
                        setTimeout(() => {
                          baixarFoto(foto.url, `pagina-${pagIdx + 1}-foto-${fIdx + 1}.jpg`);
                        }, fIdx * 250);
                      });
                      setMensagemSucesso(`📥 Baixando ${pagina.fotos.length} fotos da página ${pagIdx + 2}...`);
                      setTimeout(() => setMensagemSucesso(null), 3500);
                    }}
                    className="p-1 text-slate-200 hover:text-white hover:bg-white/20 rounded cursor-pointer transition"
                    title="Baixar todas as fotos desta página"
                  >
                    <Download size={13} />
                  </button>
                )}

                {/* Excluir Página */}
                <button
                  type="button"
                  onClick={() => setPaginaParaExcluirId(pagina.id)}
                  className="p-1 text-red-400 hover:text-red-200 hover:bg-red-900/60 rounded transition cursor-pointer"
                  title="Excluir esta página de fotos"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="apmbb-page bg-white">
                <div>
                  {/* Top Header Institucional (Editável) */}
                  <div className="flex justify-between items-start border-b-2 border-black pb-1.5 mb-4 font-heading gap-4">
                    <input
                      type="text"
                      value={informeAtual.cabecalhoEsquerda ?? 'ACADEMIA DE POLÍCIA MILITAR DO BARRO BRANCO - O003'}
                      onChange={(e) => handleUpdateField('cabecalhoEsquerda', e.target.value.toUpperCase())}
                      className="text-[11px] font-black text-black tracking-wide uppercase bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-blue-50/20 rounded px-1.5 py-0.5 w-full max-w-md transition outline-none"
                    />
                    <textarea
                      rows={2}
                      value={informeAtual.cabecalhoDireita ?? 'MANUTENÇÃO 3ª CIA\nCIA ES'}
                      onChange={(e) => handleUpdateField('cabecalhoDireita', e.target.value.toUpperCase())}
                      className="text-[11px] font-black text-black tracking-wide text-right uppercase leading-tight bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-blue-50/20 rounded px-1.5 py-0.5 w-56 transition outline-none resize-none"
                    />
                  </div>

                  {/* Service titles */}
                  <div className="text-center mb-5 space-y-1">
                    <input
                      type="text"
                      value={pagina.tituloServico}
                      onChange={(e) =>
                        handleUpdatePagina(pagina.id, 'tituloServico', e.target.value.toUpperCase())
                      }
                      placeholder="NOME DO SERVIÇO EXECUTADO"
                      className="font-heading text-lg font-extrabold text-[#1a2b4c] text-center w-full uppercase tracking-wide bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-blue-50/20 rounded px-2 py-0.5 outline-none transition"
                    />
                    <div className="font-heading text-xs font-bold text-[#b89535] text-center uppercase tracking-wider">
                      <input
                        type="text"
                        value={pagina.dataServico}
                        onChange={(e) =>
                          handleUpdatePagina(pagina.id, 'dataServico', e.target.value.toUpperCase())
                        }
                        placeholder="MÊS / DATA DO SERVIÇO"
                        className="font-heading text-xs font-bold text-[#b89535] text-center uppercase tracking-wider bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-blue-50/20 rounded px-2 py-0.5 outline-none transition"
                      />
                    </div>
                    <textarea
                      rows={Math.max(2, Math.ceil((pagina.descricao || '').length / 90))}
                      value={pagina.descricao}
                      onChange={(e) =>
                        handleUpdatePagina(pagina.id, 'descricao', e.target.value)
                      }
                      placeholder="Descrição detalhada dos reparos e serviços executados..."
                      className="text-xs text-slate-700 text-center w-full max-w-xl mx-auto block mt-1 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-blue-50/20 rounded px-2 py-1 outline-none resize-none transition"
                    />
                  </div>

                  {/* Renderização Condicional: Layout Dedicado Antes e Depois ou Grid Padrão */}
                  {pagina.tipoGrid === 'antes_depois' || pagina.layoutDedicado === 'antes_depois' ? (
                    <LayoutAntesDepois
                      pagina={pagina}
                      onUpdatePagina={(field, val) => handleUpdatePagina(pagina.id, field, val)}
                      onUploadFoto={(fotoId, file) => handleUploadFotoPagina(pagina.id, fotoId, file)}
                      uploadingFotoKey={uploadingFotoKey}
                      dragOverFotoKey={dragOverFotoKey}
                      setDragOverFotoKey={setDragOverFotoKey}
                      onBaixarFoto={baixarFoto}
                      modoEdicao={true}
                    />
                  ) : (
                    /* Photos Grid Padrão */
                    <div
                      className={`grid gap-4 my-4 ${
                        pagina.tipoGrid === '1'
                          ? 'grid-cols-1 max-w-lg mx-auto'
                          : pagina.tipoGrid === '3'
                          ? 'grid-cols-3'
                          : pagina.tipoGrid === '4'
                          ? 'grid-cols-2'
                          : 'grid-cols-2'
                      }`}
                    >
                      {pagina.fotos.map((foto, fIdx) => {
                        const fotoCardKey = `${pagina.id}-${foto.id}`;
                        const isUploadingThis = uploadingFotoKey === fotoCardKey;
                        const isDraggingThis = dragOverFotoKey === fotoCardKey;
                        const inputFotoId = `input-foto-${pagina.id}-${foto.id}`;
                        const temFoto = Boolean(foto.url && foto.url.trim() !== '');

                        return (
                          <div
                            key={foto.id}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDragOverFotoKey(fotoCardKey);
                            }}
                            onDragLeave={() => setDragOverFotoKey(null)}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDragOverFotoKey(null);
                              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                handleUploadFotoPagina(pagina.id, foto.id, e.dataTransfer.files[0]);
                              }
                            }}
                            className={`bg-white rounded-xl overflow-hidden shadow-sm border flex flex-col items-center relative group/foto transition-all ${
                              isDraggingThis
                                ? 'border-blue-500 ring-2 ring-blue-400/50 bg-blue-50/20'
                                : 'border-slate-200'
                            }`}
                          >
                            <input
                              id={inputFotoId}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleUploadFotoPagina(pagina.id, foto.id, e.target.files[0]);
                                  e.target.value = '';
                                }
                              }}
                            />

                            <div className="relative w-full overflow-hidden">
                              {/* Badge Colorido na Foto (se ativo) */}
                              {foto.tipoBadge && foto.tipoBadge !== 'nenhum' && (
                                <div className="absolute top-2 left-2 z-10 pointer-events-none">
                                  <BadgeFotoColorido
                                    tipoBadge={foto.tipoBadge}
                                    badgeTexto={foto.badgeTexto}
                                    badgeCor={foto.badgeCor}
                                    tamanho="sm"
                                  />
                                </div>
                              )}

                              {temFoto ? (
                                <img
                                  src={foto.url}
                                  referrerPolicy="no-referrer"
                                  alt={foto.legenda || 'Registro fotográfico'}
                                  className={`w-full object-cover block bg-slate-100 ${
                                    pagina.tipoGrid === '1'
                                      ? 'h-80'
                                      : pagina.tipoGrid === '3'
                                      ? 'h-44'
                                      : pagina.tipoGrid === '4'
                                      ? 'h-48'
                                      : 'h-64'
                                  }`}
                                />
                              ) : (
                                /* Dropzone de upload quando o espaço está vazio */
                                <div
                                  onClick={() => {
                                    const el = document.getElementById(inputFotoId) as HTMLInputElement;
                                    el?.click();
                                  }}
                                  className={`w-full bg-slate-50 hover:bg-blue-50/50 border-2 border-dashed border-slate-300 hover:border-[#1a2b4c] flex flex-col items-center justify-center gap-2 cursor-pointer transition p-4 text-center ${
                                    pagina.tipoGrid === '1'
                                      ? 'h-80'
                                      : pagina.tipoGrid === '3'
                                      ? 'h-44'
                                      : pagina.tipoGrid === '4'
                                      ? 'h-48'
                                      : 'h-64'
                                  }`}
                                >
                                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#1a2b4c]">
                                    <Upload size={18} />
                                  </div>
                                  <span className="font-heading font-bold text-xs text-slate-800">
                                    Inserir Foto do Computador
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    Clique ou arraste a imagem para cá
                                  </span>
                                </div>
                              )}

                              {/* Overlay de carregamento ao processar foto */}
                              {isUploadingThis && (
                                <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20 text-white">
                                  <Loader2 className="animate-spin text-[#c9a84e]" size={28} />
                                  <span className="text-xs font-bold">Processando foto...</span>
                                </div>
                              )}

                              {/* Overlay ao arrastar arquivo por cima */}
                              {isDraggingThis && (
                                <div className="absolute inset-0 bg-blue-600/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20 text-white pointer-events-none">
                                  <Upload className="animate-bounce" size={32} />
                                  <span className="text-xs font-bold">Solte a imagem para substituir!</span>
                                </div>
                              )}

                              {/* Botão flutuante para Substituir Foto do PC (visível no hover ou mobile) */}
                              {temFoto && !isUploadingThis && (
                                <div className="no-print absolute bottom-2 right-2 opacity-90 group-hover/foto:opacity-100 transition-opacity">
                                  <label
                                    htmlFor={inputFotoId}
                                    className="bg-slate-900/80 hover:bg-[#1a2b4c] text-white text-[10.5px] font-bold px-2.5 py-1 rounded-md shadow-md flex items-center gap-1.5 cursor-pointer backdrop-blur-xs transition"
                                    title="Clique para escolher outra foto do seu computador"
                                  >
                                    <Upload size={11} className="pointer-events-none text-[#c9a84e]" />
                                    <span className="pointer-events-none">Substituir Foto</span>
                                  </label>
                                </div>
                              )}

                              {/* Foto Action Bar (Mover, Baixar, Tag/Badge, Substituir, Excluir) */}
                              <div className="no-print absolute top-1.5 right-1.5 flex items-center gap-1 bg-slate-900/80 backdrop-blur-xs p-1 rounded-md shadow-md z-10">
                                {fIdx > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoverFoto(pagina.id, fIdx, 'esquerda')}
                                    className="text-white hover:text-[#c9a84e] p-0.5 hover:bg-white/20 rounded transition cursor-pointer"
                                    title="Mover foto para a esquerda"
                                  >
                                    <ArrowLeft size={12} />
                                  </button>
                                )}
                                {fIdx < pagina.fotos.length - 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoverFoto(pagina.id, fIdx, 'direita')}
                                    className="text-white hover:text-[#c9a84e] p-0.5 hover:bg-white/20 rounded transition cursor-pointer"
                                    title="Mover foto para a direita"
                                  >
                                    <ArrowRight size={12} />
                                  </button>
                                )}
                                {/* Botão de Badge Colorido */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPopoverBadgeFotoKey(popoverBadgeFotoKey === fotoCardKey ? null : fotoCardKey)
                                  }
                                  className="text-white hover:text-amber-300 p-0.5 hover:bg-white/20 rounded transition cursor-pointer"
                                  title="Etiquetar com Badge (Antes, Depois, Durante, Detalhe)"
                                >
                                  <Tag size={12} />
                                </button>
                                {temFoto && (
                                  <button
                                    type="button"
                                    onClick={() => baixarFoto(foto.url, `pagina-${pagIdx + 1}-${foto.legenda ? foto.legenda.slice(0, 20).replace(/\s+/g, '_') : 'foto'}.jpg`)}
                                    className="text-white hover:text-emerald-300 p-0.5 hover:bg-white/20 rounded transition cursor-pointer"
                                    title="Salvar foto no dispositivo"
                                  >
                                    <Download size={12} />
                                  </button>
                                )}
                                <label
                                  htmlFor={inputFotoId}
                                  className="text-white hover:text-blue-300 p-0.5 hover:bg-white/20 rounded transition cursor-pointer flex items-center"
                                  title="Substituir por outra foto do computador"
                                >
                                  <Upload size={12} className="pointer-events-none" />
                                </label>
                                {pagina.fotos.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFotoFromPagina(pagina.id, foto.id)}
                                    className="text-red-400 hover:text-red-200 p-0.5 hover:bg-red-900/50 rounded transition cursor-pointer"
                                    title="Excluir esta foto"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>

                              {/* Popover de Escolha Rápida de Badge */}
                              {popoverBadgeFotoKey === fotoCardKey && (
                                <div className="no-print absolute top-8 right-1 z-30 bg-slate-900 border border-white/20 rounded-lg p-2 shadow-xl text-white text-[11px] animate-in fade-in duration-100 min-w-[170px]">
                                  <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-white/10 font-bold text-[#c9a84e]">
                                    <span>Badge na Foto:</span>
                                    <button
                                      type="button"
                                      onClick={() => setPopoverBadgeFotoKey(null)}
                                      className="text-slate-400 hover:text-white"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    {[
                                      { label: '🔴 Antes', tipo: 'antes' as TipoBadgeFoto, cor: 'vermelho' as const, txt: 'ANTES' },
                                      { label: '🟢 Depois', tipo: 'depois' as TipoBadgeFoto, cor: 'verde' as const, txt: 'DEPOIS' },
                                      { label: '🟡 Durante', tipo: 'durante' as TipoBadgeFoto, cor: 'amarelo' as const, txt: 'EM ANDAMENTO' },
                                      { label: '🔵 Detalhe', tipo: 'detalhe' as TipoBadgeFoto, cor: 'azul' as const, txt: 'DETALHE' },
                                      { label: '⚪ Sem Badge', tipo: 'nenhum' as TipoBadgeFoto, cor: 'cinza' as const, txt: '' },
                                    ].map((item) => (
                                      <button
                                        key={item.label}
                                        type="button"
                                        onClick={() => {
                                          const updated = informeAtualRef.current.paginas.map((p) => {
                                            if (p.id !== pagina.id) return p;
                                            const updatedFotos = p.fotos.map((f) =>
                                              f.id === foto.id
                                                ? { ...f, tipoBadge: item.tipo, badgeTexto: item.txt, badgeCor: item.cor }
                                                : f
                                            );
                                            return { ...p, fotos: updatedFotos };
                                          });
                                          handleUpdateField('paginas', updated);
                                          setPopoverBadgeFotoKey(null);
                                        }}
                                        className="text-left px-2 py-1 rounded hover:bg-white/10 font-semibold transition"
                                      >
                                        {item.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="w-full bg-slate-50 border-t border-slate-200 p-2 text-center">
                              <input
                                type="text"
                                value={foto.legenda}
                                onChange={(e) =>
                                  handleUpdateLegendaFoto(pagina.id, foto.id, e.target.value)
                                }
                                placeholder="Legenda da foto..."
                                className="w-full text-center font-heading text-[11.5px] font-bold text-slate-800 bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-blue-50/20 rounded px-1 py-0.5 outline-none transition"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Annotation Box */}
                  <div className="mt-5 flex justify-center">
                    <div className="border-2 border-black rounded-lg px-3 py-1.5 bg-white text-xs font-semibold text-black inline-flex items-center gap-2 max-w-2xl w-full">
                      <input
                        type="text"
                        value={pagina.anotacao}
                        onChange={(e) =>
                          handleUpdatePagina(pagina.id, 'anotacao', e.target.value)
                        }
                        placeholder="Anotação técnica / parecer da intervenção..."
                        className="w-full font-semibold text-xs bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-blue-50/20 rounded px-1 py-0.5 outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Institucional (Editável) */}
                <div className="border-t-2 border-black pt-2 text-center font-heading text-[11px] font-black tracking-widest text-black uppercase mt-4">
                  <input
                    type="text"
                    value={informeAtual.rodapeTexto ?? 'BERÇO DO OFICIALATO PAULISTA'}
                    onChange={(e) => handleUpdateField('rodapeTexto', e.target.value.toUpperCase())}
                    className="text-center font-heading text-[11px] font-black tracking-widest text-black uppercase w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-[#1a2b4c] focus:bg-blue-50/20 rounded py-0.5 outline-none transition"
                  />
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {subAba === 'arquivo' && (
        <DashboardGestaoArquivo
          informesArquivados={informesArquivados}
          onCarregarInforme={(inf) => {
            onCarregarInformeArquivado(inf);
            setSubAba('edicao');
            setMensagemSucesso(`Informe "${inf.titulo} - ${inf.mesAno}" carregado para edição.`);
            setTimeout(() => setMensagemSucesso(null), 3500);
          }}
          onVisualizarInforme={(inf) => setInformeParaVisualizar(inf)}
          onExcluirInforme={(inf) => setInformeParaExcluir(inf)}
          onLimparHistorico={() => setModalLimparAberto(true)}
          onDuplicarParaNovoMes={handleDuplicarParaNovoMes}
          onImportarBackup={onImportarBackupInformes}
          onAbrirImpressaoDireta={(inf) => {
            onCarregarInformeArquivado(inf);
            setSubAba('edicao');
            setTimeout(() => setModalPdfAberto(true), 250);
          }}
        />
      )}

      {/* Modal de Consulta e Visualização Completa do Informe Arquivado */}
      {informeParaVisualizar && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-slate-100 rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-300 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#1a2b4c] text-white px-5 py-3.5 rounded-t-xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <FileText size={18} className="text-[#c9a84e]" />
                <div>
                  <h3 className="text-sm font-bold">
                    Consulta de Informe Arquivado: {informeParaVisualizar.titulo} - {informeParaVisualizar.mesAno}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Arquivado em: {informeParaVisualizar.criadoEm || 'Agosto 2026'} • Total de páginas: {informeParaVisualizar.paginas.length + 1}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onChangeInformeAtual(informeParaVisualizar);
                    setInformeParaVisualizar(null);
                    setSubAba('edicao');
                    setTimeout(() => setModalPdfAberto(true), 200);
                  }}
                  className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded transition shadow-xs cursor-pointer flex items-center gap-1.5"
                  title="Abrir diretamente no Visualizador Oficial de PDF"
                >
                  <Eye size={13} className="text-[#c9a84e]" />
                  <span>Visualizar PDF Oficial</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onCarregarInformeArquivado(informeParaVisualizar);
                    setInformeParaVisualizar(null);
                    setSubAba('edicao');
                    setMensagemSucesso(`Informe "${informeParaVisualizar.titulo}" pronto para edição.`);
                    setTimeout(() => setMensagemSucesso(null), 3500);
                  }}
                  className="bg-[#c9a84e] hover:bg-[#b89535] text-[#1a2b4c] text-xs font-bold px-3 py-1.5 rounded transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>✏️ Carregar para Edição</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInformeParaVisualizar(null)}
                  className="text-white/80 hover:text-white p-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content Preview */}
            <div className="p-4 overflow-y-auto space-y-6 flex-1 bg-slate-200/60">
              {/* Capa */}
              <div className="bg-white p-8 rounded-lg border border-slate-300 shadow-sm w-full max-w-[210mm] mx-auto font-sans">
                <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-4 font-heading text-[10px] font-black uppercase">
                  <span>{informeParaVisualizar.cabecalhoEsquerda || 'ACADEMIA DE POLÍCIA MILITAR DO BARRO BRANCO - O003'}</span>
                  <span className="text-right whitespace-pre-line">{informeParaVisualizar.cabecalhoDireita || 'MANUTENÇÃO 3ª CIA\nCIA ES'}</span>
                </div>

                {informeParaVisualizar.capaUrl && (
                  <div
                    className="mb-4 rounded-lg overflow-hidden border border-slate-300 bg-black"
                    style={{ maxHeight: `${informeParaVisualizar.capaAltura || 195}px` }}
                  >
                    <img
                      src={informeParaVisualizar.capaUrl}
                      alt="Capa"
                      className="w-full object-cover"
                      style={{ height: `${informeParaVisualizar.capaAltura || 195}px` }}
                    />
                  </div>
                )}

                <div className="text-center my-4 space-y-1">
                  <h1 className="text-base font-black text-[#1a2b4c] uppercase tracking-wide">
                    {informeParaVisualizar.titulo}
                  </h1>
                  <p className="text-xs font-bold text-[#b89535] uppercase">
                    {informeParaVisualizar.subtitulo}
                  </p>
                  <p className="text-[11px] font-bold text-slate-700 uppercase">
                    MÊS: {informeParaVisualizar.mesAno}
                  </p>
                </div>

                {/* Editorial Grid no Modal */}
                <div className="grid grid-cols-[220px_1fr] gap-4 mt-4 pt-3 border-t border-slate-200">
                  <div className="border-r border-slate-200 pr-3 font-mono text-[10px] font-bold text-slate-900 whitespace-pre-line leading-relaxed">
                    <div className="text-[9px] uppercase font-sans font-bold text-slate-500 mb-1">Equipe:</div>
                    {informeParaVisualizar.equipeTexto}
                  </div>
                  <div className="text-xs text-slate-800 space-y-2.5 leading-relaxed text-justify">
                    <p>{informeParaVisualizar.resumoTexto}</p>
                    {informeParaVisualizar.destaques && informeParaVisualizar.destaques.length > 0 && (
                      <div className="pt-1">
                        <p className="font-bold text-[#1a2b4c] text-xs mb-1">
                          {informeParaVisualizar.tituloDestaques || 'Dentre as principais atividades executadas, destacam-se:'}
                        </p>
                        <div className="space-y-1 text-[11px]">
                          {informeParaVisualizar.destaques.map((d, i) => (
                            <div key={d.id || i} className="flex items-start gap-1">
                              <span className="font-bold text-[#1a2b4c]">•</span>
                              <div>
                                <span className="font-bold text-slate-900 mr-1">{d.titulo}:</span>
                                <span>{d.desc}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t-2 border-black mt-4 pt-2 text-[10px] font-heading font-black tracking-widest text-black text-center uppercase">
                  {informeParaVisualizar.rodapeTexto || 'BERÇO DO OFICIALATO PAULISTA'}
                </div>
              </div>

              {/* Páginas de Serviços e Fotos */}
              {informeParaVisualizar.paginas.map((pag, idx) => (
                <div key={pag.id} className="bg-white p-8 rounded-lg border border-slate-300 shadow-sm w-full max-w-[210mm] mx-auto font-sans">
                  <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-4 font-heading text-[10px] font-black uppercase">
                    <span>PÁGINA {idx + 2} • {pag.tituloServico}</span>
                    <span>DATA: {pag.dataServico}</span>
                  </div>

                  <p className="text-xs text-slate-700 mb-4 leading-relaxed font-medium bg-slate-50 p-2.5 rounded border border-slate-200">
                    {pag.descricao}
                  </p>

                  {pag.tipoGrid === 'antes_depois' || pag.layoutDedicado === 'antes_depois' ? (
                    <LayoutAntesDepois
                      pagina={pag}
                      onUpdatePagina={() => {}}
                      onUploadFoto={() => {}}
                      uploadingFotoKey={null}
                      dragOverFotoKey={null}
                      setDragOverFotoKey={() => {}}
                      onBaixarFoto={baixarFoto}
                      modoEdicao={false}
                    />
                  ) : (
                    <div className={`grid gap-3 mb-4 ${pag.tipoGrid === '1' ? 'grid-cols-1' : pag.tipoGrid === '3' ? 'grid-cols-3' : pag.tipoGrid === '4' ? 'grid-cols-2' : 'grid-cols-2'}`}>
                      {pag.fotos.map((f) => (
                        <div key={f.id} className="border border-slate-300 rounded overflow-hidden bg-slate-50 relative">
                          {f.tipoBadge && f.tipoBadge !== 'nenhum' && (
                            <div className="absolute top-1.5 left-1.5 z-10">
                              <BadgeFotoColorido
                                tipoBadge={f.tipoBadge}
                                badgeTexto={f.badgeTexto}
                                badgeCor={f.badgeCor}
                                tamanho="sm"
                              />
                            </div>
                          )}
                          <img src={f.url} alt={f.legenda} className="w-full h-52 sm:h-60 object-cover" />
                          <div className="p-2 text-[11px] font-bold text-slate-800 text-center border-t border-slate-200">
                            {f.legenda}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {pag.anotacao && (
                    <div className="border-2 border-black rounded-lg p-2.5 text-xs font-bold text-black text-center bg-slate-50">
                      {pag.anotacao}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="bg-white px-5 py-3 rounded-b-xl border-t border-slate-300 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Consulta segura • Dados preservados em armazenamento persistente
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onCarregarInformeArquivado(informeParaVisualizar);
                    setInformeParaVisualizar(null);
                    setSubAba('edicao');
                    setTimeout(() => setModalPdfAberto(true), 250);
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                  title="Carregar este informe arquivado e abrir visualizador para impressão e PDF"
                >
                  <Printer size={14} />
                  <span>Imprimir (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onCarregarInformeArquivado(informeParaVisualizar);
                    setInformeParaVisualizar(null);
                    setSubAba('edicao');
                    setMensagemSucesso(`Informe "${informeParaVisualizar.titulo}" carregado para edição.`);
                    setTimeout(() => setMensagemSucesso(null), 3500);
                  }}
                  className="bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  ✏️ Carregar na Edição
                </button>
                <button
                  type="button"
                  onClick={() => setInformeParaVisualizar(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Informe */}
      {informeParaExcluir && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Excluir Informe Arquivado
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mês de Referência: <strong>{informeParaExcluir.mesAno}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInformeParaExcluir(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-slate-700 mb-5 leading-relaxed">
              Tem certeza de que deseja excluir permanentemente o informe{' '}
              <strong>"{informeParaExcluir.titulo} - {informeParaExcluir.mesAno}"</strong> do arquivo histórico?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setInformeParaExcluir(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onExcluirInformeArquivado(informeParaExcluir.id);
                  setInformeParaExcluir(null);
                  setMensagemSucesso('🗑️ Informe excluído do arquivo com sucesso!');
                  setTimeout(() => setMensagemSucesso(null), 4000);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Limpar Histórico de Informes */}
      {modalLimparAberto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Limpar Histórico de Informes
                  </h3>
                  <p className="text-xs text-slate-500">
                    Total arquivado: <strong>{informesArquivados.length} informe(s)</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalLimparAberto(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-slate-700 mb-5 leading-relaxed">
              Deseja realmente apagar todos os informes mensais arquivados? Esta ação não poderá ser revertida.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModalLimparAberto(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onLimparHistoricoInformes();
                  setModalLimparAberto(false);
                  setMensagemSucesso('🗑️ Histórico de informes limpo com sucesso!');
                  setTimeout(() => setMensagemSucesso(null), 4000);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm cursor-pointer"
              >
                Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Novo Informe ou Restaurar Padrão */}
      {modalNovoAberto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-[#1a2b4c]">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <FileText size={20} className="text-[#1a2b4c]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Opções de Informe
                  </h3>
                  <p className="text-xs text-slate-500">
                    Começar do zero ou restaurar modelo institucional
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalNovoAberto(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-slate-700 mb-5 leading-relaxed">
              Você pode iniciar um relatório completamente em branco ou restaurar o modelo oficial pré-formatado da Manutenção da APMBB:
            </p>

            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={handleNovoEmBranco}
                className="w-full text-left p-3.5 rounded-lg border border-slate-300 hover:border-[#1a2b4c] hover:bg-blue-50/30 transition cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-[#1a2b4c]">
                    📄 Criar Novo Informe em Branco
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Limpa os textos e deixa 1 página pronta para novos registros
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-[#1a2b4c] transition" />
              </button>

              <button
                type="button"
                onClick={handleRestaurarModeloPadrao}
                className="w-full text-left p-3.5 rounded-lg border border-slate-300 hover:border-[#b89535] hover:bg-amber-50/30 transition cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-[#b89535]">
                    🏛️ Restaurar Modelo Padrão da 3ª Cia
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Recarrega o modelo oficial com fachada, equipe e páginas exemplo
                  </div>
                </div>
                <RotateCcw size={16} className="text-slate-400 group-hover:text-[#b89535] transition" />
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setModalNovoAberto(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Excluir Página de Fotos */}
      {paginaParaExcluirId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Excluir Página de Fotos
                  </h3>
                  <p className="text-xs text-slate-500">
                    Esta ação removerá a página e suas fotos associadas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPaginaParaExcluirId(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-slate-700 mb-5 leading-relaxed">
              Tem certeza de que deseja excluir esta página do relatório atual?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPaginaParaExcluirId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  handleRemovePagina(paginaParaExcluirId);
                  setPaginaParaExcluirId(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm cursor-pointer"
              >
                Sim, Excluir Página
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visualizador e Gerador de PDF Oficial */}
      <ModalVisualizadorPDF
        isOpen={modalPdfAberto}
        onClose={() => setModalPdfAberto(false)}
        targetElement={documentoRef.current}
        titulo={`Informe Mensal • ${informeAtual.titulo || '3ª Cia Manutenção'}`}
        subtitulo={`Relatório oficial da APMBB • Período: ${informeAtual.mesAno || 'Mensal'}`}
        nomeArquivo={`Informe_Mensal_APMBB_${(informeAtual.mesAno || 'Mensal').replace(/[\s/]+/g, '_')}.pdf`}
        orientacao="p"
      />

      {/* Modal de Gestão de Histórico e Auditoria do Relatório */}
      <ModalHistoricoAuditoria
        isOpen={modalHistoricoAberto}
        onClose={() => setModalHistoricoAberto(false)}
        informe={informeAtual}
        onUpdateHistorico={(novoHist) => handleUpdateField('historico', novoHist)}
        usuarioLogadoNome={usuarioLogado?.nome || 'Operador'}
      />
    </div>
  );
};
