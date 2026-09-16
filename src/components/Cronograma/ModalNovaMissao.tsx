import React, { useState, useEffect } from 'react';
import { MissaoDiaria, EquipeManutencao, MembroEquipe } from '../../types';
import { gerarId, formatarDataISO, adicionarDiasISO, baixarFoto, comprimirImagemParaArmazenamento } from '../../utils';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  FileText,
  Package,
  CheckSquare,
  ArrowRight,
  X,
  Plus,
  Shield,
  UserCheck,
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon,
  Download,
} from 'lucide-react';

interface ModalNovaMissaoProps {
  aberto: boolean;
  onFechar: () => void;
  onSalvar: (missao: MissaoDiaria) => void;
  missaoEmEdicao?: MissaoDiaria | null;
  dataSugerida?: string;
  equipes: EquipeManutencao[];
  membros: MembroEquipe[];
}

export const ModalNovaMissao: React.FC<ModalNovaMissaoProps> = ({
  aberto,
  onFechar,
  onSalvar,
  missaoEmEdicao,
  dataSugerida,
  equipes,
  membros,
}) => {
  const hoje = formatarDataISO();
  const dataInicial = missaoEmEdicao ? missaoEmEdicao.data : dataSugerida || hoje;

  const [data, setData] = useState(dataInicial);
  const [titulo, setTitulo] = useState(missaoEmEdicao?.titulo || '');
  const [descricao, setDescricao] = useState(missaoEmEdicao?.descricao || '');
  const [local, setLocal] = useState(missaoEmEdicao?.local || 'Alojamento da 3ª Cia');
  const [prioridade, setPrioridade] = useState<'Urgente' | 'Alta' | 'Média' | 'Baixa'>(
    missaoEmEdicao?.prioridade || 'Alta'
  );
  const [equipeId, setEquipeId] = useState(missaoEmEdicao?.equipeId || '');
  const [membrosDesignados, setMembrosDesignados] = useState(
    missaoEmEdicao?.membrosDesignados || ''
  );
  const [turno, setTurno] = useState<'Manhã (07h15)' | 'Tarde (9º e 10º tempos)' | 'Integral'>(
    (missaoEmEdicao?.turno as any) === 'Manhã'
      ? 'Manhã (07h15)'
      : (missaoEmEdicao?.turno as any) === 'Tarde'
      ? 'Tarde (9º e 10º tempos)'
      : (missaoEmEdicao?.turno as any) || 'Manhã (07h15)'
  );
  const [concluida, setConcluida] = useState(missaoEmEdicao?.concluida || false);
  const [adiadaParaProximoDia, setAdiadaParaProximoDia] = useState(
    missaoEmEdicao?.adiadaParaProximoDia || false
  );
  const [materiaisNecessarios, setMateriaisNecessarios] = useState(
    missaoEmEdicao?.materiaisNecessarios || ''
  );
  const [observacoes, setObservacoes] = useState(missaoEmEdicao?.observacoes || '');
  const [fotoAntesUrl, setFotoAntesUrl] = useState<string>(missaoEmEdicao?.fotoAntesUrl || '');
  const [fotoDepoisUrl, setFotoDepoisUrl] = useState<string>(missaoEmEdicao?.fotoDepoisUrl || '');

  // Sincroniza e reseta o formulário quando o modal abre ou a missão em edição muda
  useEffect(() => {
    if (aberto) {
      if (missaoEmEdicao) {
        setData(missaoEmEdicao.data);
        setTitulo(missaoEmEdicao.titulo || '');
        setDescricao(missaoEmEdicao.descricao || '');
        setLocal(missaoEmEdicao.local || 'Alojamento da 3ª Cia');
        setPrioridade(missaoEmEdicao.prioridade || 'Alta');
        setEquipeId(missaoEmEdicao.equipeId || '');
        setMembrosDesignados(missaoEmEdicao.membrosDesignados || '');
        setTurno(
          (missaoEmEdicao.turno as any) === 'Manhã'
            ? 'Manhã (07h15)'
            : (missaoEmEdicao.turno as any) === 'Tarde'
            ? 'Tarde (9º e 10º tempos)'
            : (missaoEmEdicao.turno as any) || 'Manhã (07h15)'
        );
        setConcluida(missaoEmEdicao.concluida || false);
        setAdiadaParaProximoDia(missaoEmEdicao.adiadaParaProximoDia || false);
        setMateriaisNecessarios(missaoEmEdicao.materiaisNecessarios || '');
        setObservacoes(missaoEmEdicao.observacoes || '');
        setFotoAntesUrl(missaoEmEdicao.fotoAntesUrl || '');
        setFotoDepoisUrl(missaoEmEdicao.fotoDepoisUrl || '');
      } else {
        setData(dataSugerida || formatarDataISO());
        setTitulo('');
        setDescricao('');
        setLocal('Alojamento da 3ª Cia');
        setPrioridade('Alta');
        setEquipeId('');
        setMembrosDesignados('');
        setTurno('Manhã (07h15)');
        setConcluida(false);
        setAdiadaParaProximoDia(false);
        setMateriaisNecessarios('');
        setObservacoes('');
        setFotoAntesUrl('');
        setFotoDepoisUrl('');
      }
    }
  }, [aberto, missaoEmEdicao, dataSugerida]);

  if (!aberto) return null;

  const handleCarregarFoto = async (tipo: 'antes' | 'depois', file: File) => {
    try {
      const dataUrl = await comprimirImagemParaArmazenamento(file);
      if (tipo === 'antes') setFotoAntesUrl(dataUrl);
      else setFotoDepoisUrl(dataUrl);
    } catch (err) {
      console.error('Erro ao processar foto na missão:', err);
    }
  };

  // Adicionar ou remover policial dos executores escalados
  const toggleMilitarEscalado = (nomeGuerra: string) => {
    const atuais = membrosDesignados
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    let novos: string[];
    if (atuais.includes(nomeGuerra)) {
      novos = atuais.filter((n) => n !== nomeGuerra);
    } else {
      novos = [...atuais, nomeGuerra];
    }
    setMembrosDesignados(novos.join(', '));
  };

  const handleTrocaEquipe = (eId: string) => {
    setEquipeId(eId);
    if (!eId) return;
    const eq = equipes.find((e) => e.id === eId);
    if (eq && eq.membros && eq.membros.length > 0) {
      // Se não havia policiais digitados ou usuário quer puxar os da equipe
      if (!membrosDesignados.trim()) {
        setMembrosDesignados(eq.membros.join(', '));
      }
    }
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    const equipeObj = equipes.find((e) => e.id === equipeId);
    const equipeNome = equipeObj ? equipeObj.nome : '';

    const novaMissao: MissaoDiaria = {
      id: missaoEmEdicao?.id || gerarId(),
      data,
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      local: local.trim(),
      prioridade,
      equipeId: equipeId || undefined,
      equipeNome: equipeNome || undefined,
      membrosDesignados: membrosDesignados.trim(),
      turno,
      concluida,
      dataConclusao: concluida ? (missaoEmEdicao?.dataConclusao || data) : undefined,
      adiadaParaProximoDia,
      proximaData: adiadaParaProximoDia ? adicionarDiasISO(data, 1) : undefined,
      materiaisNecessarios: materiaisNecessarios.trim(),
      observacoes: observacoes.trim(),
      fotoAntesUrl: fotoAntesUrl || undefined,
      fotoDepoisUrl: fotoDepoisUrl || undefined,
      informePaginaId: missaoEmEdicao?.informePaginaId,
    };

    onSalvar(novaMissao);
    onFechar();
  };

  const locaisSugeridos = [
    'Alojamento da 3ª Cia',
    'Alojamento dos Cabos e Soldados - 3ª Cia',
    'Vestiário dos Cadetes - Bloco B',
    'Sanitários Coletivos - Piso 1',
    'Sanitários Coletivos - Piso 2',
    'Corredor Principal e Sala de Instrução',
    'Reserva de Armas - 3ª Cia',
    'Guarda do Quartel / Entrada',
    'Oficina e Depósito de Manutenção',
  ];

  const policiaisSelecionados = membrosDesignados
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full p-4 sm:p-5 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col my-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1a2b4c] text-[#c9a84e] flex items-center justify-center font-bold">
              <CheckSquare size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1a2b4c]">
                {missaoEmEdicao ? 'Editar Determinação / Missão' : 'Nova Missão Diária de Manutenção'}
              </h3>
              <p className="text-xs text-slate-500">
                Ordem de serviço diária da 3ª Cia Escola • APMBB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSalvar} className="flex-1 overflow-y-auto pr-1 text-xs flex flex-col justify-between">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3">
            {/* COLUNA 1: IDENTIFICAÇÃO, TEMPO & EFETIVO */}
            <div className="space-y-2.5">
              {/* Título da Missão */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Missão / Determinação Principal: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Troca de chuveiro queimado e revisão da fiação..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c] font-semibold text-slate-900"
                />
              </div>

              {/* Grid: Data, Turno, Prioridade */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1 text-[11px]">
                    <Calendar size={12} className="text-blue-600" />
                    Data:
                  </label>
                  <input
                    type="date"
                    required
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c] font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1 text-[11px]">
                    <Clock size={12} className="text-amber-600" />
                    Turno:
                  </label>
                  <select
                    value={turno}
                    onChange={(e) => setTurno(e.target.value as any)}
                    className="w-full px-1.5 py-1 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c] bg-white font-medium text-slate-800 text-[11px]"
                  >
                    <option value="Manhã (07h15)">Manhã (07h15)</option>
                    <option value="Tarde (9º e 10º tempos)">Tarde (9º e 10º tempos)</option>
                    <option value="Integral">Integral</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1 text-[11px]">
                    <AlertTriangle size={12} className="text-red-500" />
                    Prioridade:
                  </label>
                  <select
                    value={prioridade}
                    onChange={(e) => setPrioridade(e.target.value as any)}
                    className={`w-full px-1.5 py-1 border rounded-md font-bold text-[11px] ${
                      prioridade === 'Urgente'
                        ? 'border-red-300 bg-red-50 text-red-700'
                        : prioridade === 'Alta'
                        ? 'border-amber-300 bg-amber-50 text-amber-800'
                        : prioridade === 'Média'
                        ? 'border-blue-300 bg-blue-50 text-blue-800'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    }`}
                  >
                    <option value="Urgente">🚨 Urgente</option>
                    <option value="Alta">🔴 Alta</option>
                    <option value="Média">🔵 Média</option>
                    <option value="Baixa">🟢 Baixa</option>
                  </select>
                </div>
              </div>

              {/* Local / Setor */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin size={13} className="text-[#c9a84e]" />
                  Local / Alojamento / Setor:
                </label>
                <input
                  type="text"
                  list="modal-locais-sugeridos"
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  placeholder="Informe onde será realizado o serviço..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c]"
                />
                <datalist id="modal-locais-sugeridos">
                  {locaisSugeridos.map((l, i) => (
                    <option key={i} value={l} />
                  ))}
                </datalist>
              </div>

              {/* Policiais Designados para a Missão */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px]">
                    <Shield size={13} className="text-[#1a2b4c]" />
                    Policiais Designados (Executores):
                  </label>
                  <span className="text-[10px] font-medium text-slate-500">
                    {policiaisSelecionados.length} selecionado(s)
                  </span>
                </div>

                <input
                  type="text"
                  value={membrosDesignados}
                  onChange={(e) => setMembrosDesignados(e.target.value)}
                  placeholder="Ex: Cb PM Ribeiro, Sd PM Santana, Cad PM Cristian..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c] bg-white text-slate-900 font-semibold text-xs"
                />

                {/* Seletor Dinâmico de Policiais Cadastrados */}
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 mb-1">
                    Selecione rápido dentre os policiais cadastrados:
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-white rounded border border-slate-200">
                    {membros.map((m) => {
                      const estaEscalado = policiaisSelecionados.some(
                        (p) => p.toLowerCase() === m.nomeGuerra.toLowerCase()
                      );
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleMilitarEscalado(m.nomeGuerra)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition flex items-center gap-1 border cursor-pointer ${
                            estaEscalado
                              ? 'bg-[#1a2b4c] text-white border-[#1a2b4c] shadow-2xs'
                              : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {estaEscalado && <UserCheck size={10} className="text-[#c9a84e]" />}
                          <span>{m.nomeGuerra}</span>
                          <span
                            className={`text-[8px] font-extrabold uppercase px-1 py-0.2 rounded ${
                              m.tipoEfetivo === 'apoio'
                                ? estaEscalado
                                  ? 'bg-amber-400 text-slate-950'
                                  : 'bg-amber-50 text-amber-900 border border-amber-300'
                                : estaEscalado
                                ? 'bg-blue-300 text-blue-950'
                                : 'bg-blue-50 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {m.tipoEfetivo === 'apoio' ? 'Apoio' : 'Fixo'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Equipe Vinculada (Opcional) */}
                <div className="pt-1.5 border-t border-slate-200/80 flex items-center justify-between gap-2">
                  <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 shrink-0">
                    <Users size={12} className="text-slate-500" />
                    Vincular Equipe:
                  </label>
                  <select
                    value={equipeId}
                    onChange={(e) => handleTrocaEquipe(e.target.value)}
                    className="px-2 py-1 border border-slate-300 rounded text-xs bg-white font-medium text-slate-800 flex-1 max-w-[200px]"
                  >
                    <option value="">Sem Equipe Fixa</option>
                    {equipes.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* COLUNA 2: INSTRUÇÕES, MATERIAIS, STATUS & REGISTRO FOTOGRÁFICO */}
            <div className="space-y-2.5">
              {/* Detalhes da Determinação */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <FileText size={13} className="text-slate-500" />
                  Determinações e Instruções de Execução:
                </label>
                <textarea
                  rows={2}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva o procedimento, normas técnicas ou orientações do oficial..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c]"
                />
              </div>

              {/* Materiais e Observações lado a lado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Package size={13} className="text-[#c9a84e]" />
                    Materiais & Ferramentas:
                  </label>
                  <input
                    type="text"
                    value={materiaisNecessarios}
                    onChange={(e) => setMateriaisNecessarios(e.target.value)}
                    placeholder="Ex: Chuveiro, alicate, fita..."
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Obs. / Parecer Encarregado:
                  </label>
                  <input
                    type="text"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Ex: Aguardando secagem..."
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c]"
                  />
                </div>
              </div>

              {/* Checklist de Status: Concluída e Ir para o Próximo Dia */}
              <div className="grid grid-cols-2 gap-2.5">
                <label className="flex items-start gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={concluida}
                    onChange={(e) => {
                      setConcluida(e.target.checked);
                      if (e.target.checked) setAdiadaParaProximoDia(false);
                    }}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">
                      Missão Concluída
                    </span>
                    <span className="text-[10px] text-slate-500 leading-tight block">
                      Serviço realizado com êxito no dia.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={adiadaParaProximoDia}
                    onChange={(e) => {
                      setAdiadaParaProximoDia(e.target.checked);
                      if (e.target.checked) setConcluida(false);
                    }}
                    className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-900 flex items-center gap-1 text-xs">
                      Próximo Dia
                      <ArrowRight size={12} className="text-amber-600" />
                    </span>
                    <span className="text-[10px] text-slate-500 leading-tight block">
                      Transfere / agenda para amanhã.
                    </span>
                  </div>
                </label>
              </div>

              {/* Registro Fotográfico (Antes & Depois) */}
              <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Camera size={13} className="text-[#1a2b4c]" />
                  <span className="font-bold text-slate-800 text-xs">
                    Registro Fotográfico (Informe Mensal)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {/* Foto Antes */}
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="block text-[11px] font-bold text-slate-700 mb-1">
                      1. Foto do Antes
                    </span>
                    {fotoAntesUrl ? (
                      <div className="relative rounded overflow-hidden h-20 border border-slate-300 bg-white group/foto">
                        <img src={fotoAntesUrl} alt="Antes" className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => baixarFoto(fotoAntesUrl, 'missao-foto-antes.jpg')}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded shadow text-xs cursor-pointer"
                            title="Baixar foto do Antes"
                          >
                            <Download size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFotoAntesUrl('')}
                            className="bg-red-600 hover:bg-red-700 text-white p-1 rounded shadow text-xs cursor-pointer"
                            title="Remover foto"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <label className="cursor-pointer px-2 py-1 bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-[10.5px] font-bold rounded flex items-center justify-center gap-1 transition">
                          <Camera size={12} />
                          <span>Câmera</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleCarregarFoto('antes', file);
                            }}
                          />
                        </label>
                        <label className="cursor-pointer px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[10.5px] font-semibold rounded flex items-center justify-center gap-1 transition">
                          <Upload size={12} />
                          <span>Galeria</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleCarregarFoto('antes', file);
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Foto Depois */}
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="block text-[11px] font-bold text-slate-700 mb-1">
                      2. Foto do Depois
                    </span>
                    {fotoDepoisUrl ? (
                      <div className="relative rounded overflow-hidden h-20 border border-slate-300 bg-white group/foto">
                        <img src={fotoDepoisUrl} alt="Depois" className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => baixarFoto(fotoDepoisUrl, 'missao-foto-depois.jpg')}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded shadow text-xs cursor-pointer"
                            title="Baixar foto do Depois"
                          >
                            <Download size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFotoDepoisUrl('')}
                            className="bg-red-600 hover:bg-red-700 text-white p-1 rounded shadow text-xs cursor-pointer"
                            title="Remover foto"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <label className="cursor-pointer px-2 py-1 bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-[10.5px] font-bold rounded flex items-center justify-center gap-1 transition">
                          <Camera size={12} />
                          <span>Câmera</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleCarregarFoto('depois', file);
                            }}
                          />
                        </label>
                        <label className="cursor-pointer px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[10.5px] font-semibold rounded flex items-center justify-center gap-1 transition">
                          <Upload size={12} />
                          <span>Galeria</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleCarregarFoto('depois', file);
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé Fixo do Modal */}
          <div className="flex justify-end gap-2 pt-2.5 mt-2 border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={onFechar}
              className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 text-xs font-bold bg-[#1a2b4c] hover:bg-[#2c4373] text-white rounded-md shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckSquare size={14} />
              <span>{missaoEmEdicao ? 'Salvar Alterações' : 'Cadastrar Missão'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

