import React, { useState, useMemo } from 'react';
import { MembroEquipe } from '../../types';
import { formatarAnoPelotao } from './CadastroEquipesTab';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  FileSpreadsheet,
  Search,
  UserCheck,
  UserX,
  Filter,
  GraduationCap,
  Save,
  X,
  Plus,
  Clock,
  Printer,
  Handshake,
} from 'lucide-react';

interface ResultadoEfetivoTabProps {
  membros: MembroEquipe[];
  onChangeMembros: (membros: MembroEquipe[]) => void;
  onNavegarParaPauta?: () => void;
}

const PRESETS_IMPEDIMENTO = [
  'Dispensa Médica',
  'LTS / Atestado',
  'Escala de Guarda / Ronda',
  'Serviço Externo',
  'Instrução / Prova Externa',
  'Férias / Licença',
  'Afastamento Administrativo',
];

export const ResultadoEfetivoTab: React.FC<ResultadoEfetivoTabProps> = ({
  membros,
  onChangeMembros,
  onNavegarParaPauta,
}) => {
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'fixo' | 'apoio'>('todos');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'impedidos' | 'disponiveis'>('todos');
  const [filtroPelotao, setFiltroPelotao] = useState('todos');

  // Estado para modal / edição de impedimento rápido
  const [militarEditandoImpedimento, setMilitarEditandoImpedimento] = useState<MembroEquipe | null>(null);
  const [textoImpedimento, setTextoImpedimento] = useState('');

  // Verificação de impedimento ativo
  const temImpedimentoAtivo = (m: MembroEquipe) => {
    return Boolean(
      m.impedimento &&
      m.impedimento.trim().length > 0 &&
      m.impedimento.toLowerCase() !== 'sem impedimento' &&
      m.impedimento.toLowerCase() !== 'nenhum' &&
      m.impedimento.toLowerCase() !== 'apto'
    );
  };

  // Contadores e métricas globais
  const metricas = useMemo(() => {
    const total = membros.length;
    const fixos = membros.filter((m) => m.tipoEfetivo !== 'apoio');
    const apoio = membros.filter((m) => m.tipoEfetivo === 'apoio');

    const impedidos = membros.filter(temImpedimentoAtivo);
    const impedidosFixos = fixos.filter(temImpedimentoAtivo);
    const impedidosApoio = apoio.filter(temImpedimentoAtivo);

    const disponiveis = total - impedidos.length;
    const disponiveisFixos = fixos.length - impedidosFixos.length;
    const disponiveisApoio = apoio.length - impedidosApoio.length;

    return {
      total,
      totalFixos: fixos.length,
      totalApoio: apoio.length,
      disponiveis,
      disponiveisFixos,
      disponiveisApoio,
      impedidos: impedidos.length,
      impedidosFixos: impedidosFixos.length,
      impedidosApoio: impedidosApoio.length,
    };
  }, [membros]);

  // Lista filtrada para a tabela
  const membrosFiltrados = useMemo(() => {
    return membros.filter((m) => {
      // Filtro de Tipo (Fixo vs Apoio)
      const ehApoio = m.tipoEfetivo === 'apoio';
      if (filtroTipo === 'fixo' && ehApoio) return false;
      if (filtroTipo === 'apoio' && !ehApoio) return false;

      // Filtro de Status
      const comImpedimento = temImpedimentoAtivo(m);
      if (filtroStatus === 'impedidos' && !comImpedimento) return false;
      if (filtroStatus === 'disponiveis' && comImpedimento) return false;

      // Filtro de Pelotão
      if (filtroPelotao !== 'todos' && m.pelotao !== filtroPelotao) return false;

      // Busca por texto
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const nomeGuerra = (m.nomeGuerra || '').toLowerCase();
        const nomeCompleto = (m.nomeCompleto || '').toLowerCase();
        const grad = (m.graduacao || '').toLowerCase();
        const cfoPelotao = formatarAnoPelotao(m.anoCurso, m.pelotao).toLowerCase();
        const origem = (m.origemApoio || '').toLowerCase();
        const funcao = (m.funcaoApoio || m.especialidade || '').toLowerCase();
        const re = (m.re || '').toLowerCase();
        const imp = (m.impedimento || '').toLowerCase();

        return (
          nomeGuerra.includes(termo) ||
          nomeCompleto.includes(termo) ||
          grad.includes(termo) ||
          cfoPelotao.includes(termo) ||
          origem.includes(termo) ||
          funcao.includes(termo) ||
          re.includes(termo) ||
          imp.includes(termo)
        );
      }

      return true;
    });
  }, [membros, filtroTipo, filtroStatus, filtroPelotao, busca]);

  // Abertura do modal de edição de impedimento
  const abrirEdicaoImpedimento = (militar: MembroEquipe) => {
    setMilitarEditandoImpedimento(militar);
    setTextoImpedimento(militar.impedimento || '');
  };

  // Salvar alteração de impedimento
  const salvarImpedimento = () => {
    if (!militarEditandoImpedimento) return;

    const valorLimpo = textoImpedimento.trim();
    const novosMembros = membros.map((m) => {
      if (m.id === militarEditandoImpedimento.id) {
        return {
          ...m,
          impedimento: valorLimpo,
        };
      }
      return m;
    });

    onChangeMembros(novosMembros);
    setMilitarEditandoImpedimento(null);
    setTextoImpedimento('');
  };

  // Limpar impedimento direto
  const limparImpedimentoDireto = (militarId: string) => {
    const novosMembros = membros.map((m) => {
      if (m.id === militarId) {
        return {
          ...m,
          impedimento: '',
        };
      }
      return m;
    });

    onChangeMembros(novosMembros);
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho do Resultado */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#1a2b4c] text-[#c9a84e] p-1.5 rounded-md">
                <GraduationCap size={20} />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-[#1a2b4c]">
                Resultado — Efetivo de Manutenção & Policiais em Apoio
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Relação consolidada do <strong>Efetivo Fixo (Militares da 3ª Cia)</strong> e dos <strong>Policiais que prestam apoio</strong>, seus respectivos <strong>CFO/Pelotão/Origem</strong> e controle de <strong>Impedimentos</strong>.
            </p>
          </div>

          {onNavegarParaPauta && (
            <button
              type="button"
              onClick={onNavegarParaPauta}
              className="px-3.5 py-2 text-xs font-bold bg-[#1a2b4c] hover:bg-[#2c4373] text-white rounded-md shadow-xs transition flex items-center gap-2 self-start sm:self-auto cursor-pointer"
              title="Ir para a Pauta Oficial PMESP (Tabela)"
            >
              <FileSpreadsheet size={15} className="text-[#c9a84e]" />
              <span>Ver Pauta Oficial PMESP</span>
            </button>
          )}
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total do Efetivo
              </div>
              <div className="text-xl font-extrabold text-[#1a2b4c] mt-0.5">
                {metricas.total}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {metricas.totalFixos} Fixo (3ª Cia) • {metricas.totalApoio} em Apoio
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-[#1a2b4c]">
              <Shield size={20} />
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Aptos / Disponíveis
              </div>
              <div className="text-xl font-extrabold text-emerald-700 mt-0.5">
                {metricas.disponiveis}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium">
                {metricas.disponiveisFixos} Fixo • {metricas.disponiveisApoio} Apoio
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 size={20} />
            </div>
          </div>

          <div
            className={`border rounded-lg p-3 flex items-center justify-between ${
              metricas.impedidos > 0
                ? 'bg-red-50 border-red-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div>
              <div className="text-[11px] font-bold text-red-800 uppercase tracking-wider flex items-center gap-1">
                <span>Com Impedimento</span>
                {metricas.impedidos > 0 && (
                  <span className="animate-pulse w-2 h-2 rounded-full bg-red-600 inline-block" />
                )}
              </div>
              <div className="text-xl font-extrabold text-red-700 mt-0.5">
                {metricas.impedidos}
              </div>
              <div className="text-[11px] text-red-700 font-medium">
                {metricas.impedidos > 0
                  ? `${metricas.impedidosFixos} Fixo • ${metricas.impedidosApoio} Apoio (Constam na Pauta)`
                  : 'Nenhum impedimento registrado'}
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-700">
              <AlertTriangle size={20} />
            </div>
          </div>
        </div>

        {/* Aviso Institucional sobre a Pauta Oficial */}
        <div className="mt-4 bg-amber-50/80 border border-amber-300/80 rounded-lg p-3 flex items-start gap-2.5 text-xs text-amber-950">
          <AlertTriangle size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Regra de Integração PMESP:</strong> Todos os militares (do <strong>Efetivo Fixo da 3ª Cia</strong> e <strong>Policiais que prestam apoio</strong>) que possuírem <strong>Impedimento</strong> registrado nesta subaba aparecerão automaticamente listados no <strong>rodapé da Pauta Oficial PMESP (Tabela)</strong> de missões diárias para despacho do Oficial de Dia e Comando da Subunidade.
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Campo de Busca */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar por Nome, CFO, Pelotão, Apoio ou Impedimento..."
            className="w-full pl-9 pr-8 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c] focus:border-[#1a2b4c] bg-white"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtros rápidos: Tipo (Fixo vs Apoio), Status e Pelotão */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro Tipo de Efetivo */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFiltroTipo('todos')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                filtroTipo === 'todos'
                  ? 'bg-[#1a2b4c] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({metricas.total})
            </button>
            <button
              type="button"
              onClick={() => setFiltroTipo('fixo')}
              className={`px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1 ${
                filtroTipo === 'fixo'
                  ? 'bg-[#1a2b4c] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield size={11} className={filtroTipo === 'fixo' ? 'text-[#c9a84e]' : 'text-slate-400'} />
              <span>Fixo 3ª Cia ({metricas.totalFixos})</span>
            </button>
            <button
              type="button"
              onClick={() => setFiltroTipo('apoio')}
              className={`px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1 ${
                filtroTipo === 'apoio'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-amber-900'
              }`}
            >
              <Handshake size={11} className={filtroTipo === 'apoio' ? 'text-white' : 'text-amber-600'} />
              <span>Apoio ({metricas.totalApoio})</span>
            </button>
          </div>

          {/* Filtro Status (Impedidos vs Aptos) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFiltroStatus('todos')}
              className={`px-2 py-1 rounded transition cursor-pointer ${
                filtroStatus === 'todos'
                  ? 'bg-slate-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('impedidos')}
              className={`px-2 py-1 rounded transition cursor-pointer flex items-center gap-1 ${
                filtroStatus === 'impedidos'
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-red-700'
              }`}
            >
              <span>Impedidos ({metricas.impedidos})</span>
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('disponiveis')}
              className={`px-2 py-1 rounded transition cursor-pointer ${
                filtroStatus === 'disponiveis'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-emerald-800'
              }`}
            >
              Aptos ({metricas.disponiveis})
            </button>
          </div>

          {/* Filtro Pelotão */}
          <select
            value={filtroPelotao}
            onChange={(e) => setFiltroPelotao(e.target.value)}
            className="text-xs font-semibold px-2 py-1.5 border border-slate-300 rounded-md bg-white text-slate-700 focus:ring-1 focus:ring-[#1a2b4c]"
          >
            <option value="todos">Todos Pelotões</option>
            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((pel) => (
              <option key={pel} value={pel}>
                Pelotão {pel}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela Oficial do Resultado */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#1a2b4c] text-white font-bold">
                <th className="py-3 px-3 w-10 text-center border-b border-[#1a2b4c]">#</th>
                <th className="py-3 px-4 border-b border-[#1a2b4c]">
                  Graduação & Nome de Guerra
                </th>
                <th className="py-3 px-4 border-b border-[#1a2b4c] w-48 text-center">
                  CFO / Pelotão / Origem
                </th>
                <th className="py-3 px-3 border-b border-[#1a2b4c] w-36 text-center">
                  Vínculo / Função
                </th>
                <th className="py-3 px-4 border-b border-[#1a2b4c]">
                  Impedimento
                </th>
                <th className="py-3 px-3 border-b border-[#1a2b4c] w-28 text-center">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {membrosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <GraduationCap className="mx-auto text-slate-300 mb-2" size={36} />
                    <p className="font-bold text-sm text-slate-700">
                      Nenhum militar encontrado para os filtros selecionados
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Verifique se há militares cadastrados no Efetivo Fixo ou Policiais de Apoio na aba Equipes.
                    </p>
                  </td>
                </tr>
              ) : (
                membrosFiltrados.map((militar, idx) => {
                  const ehApoio = militar.tipoEfetivo === 'apoio';
                  const temImpedimento = temImpedimentoAtivo(militar);
                  const anoPelotao = formatarAnoPelotao(militar.anoCurso, militar.pelotao);

                  return (
                    <tr
                      key={militar.id}
                      className={`hover:bg-slate-50/80 transition ${
                        temImpedimento ? 'bg-red-50/30' : ''
                      }`}
                    >
                      {/* Índice */}
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Graduação & Nome de Guerra */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                              temImpedimento
                                ? 'bg-red-100 text-red-800'
                                : ehApoio
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-slate-100 text-[#1a2b4c]'
                            }`}
                          >
                            {ehApoio ? <Handshake size={14} /> : <Shield size={14} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="bg-[#1a2b4c] text-white text-[10px] font-bold px-1.5 py-0.2 rounded font-mono">
                                {militar.graduacao || 'PM'}
                              </span>
                              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                {militar.nomeGuerra}
                              </span>
                              {ehApoio ? (
                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                  Apoio
                                </span>
                              ) : (
                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-300">
                                  Fixo 3ª Cia
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              {militar.re && (
                                <span className="font-mono">RE: {militar.re}</span>
                              )}
                              {militar.nomeCompleto && (
                                <span className="text-slate-400 truncate max-w-[200px]">
                                  • {militar.nomeCompleto}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* CFO / Pelotão / Origem */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          {anoPelotao !== '-' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#1a2b4c]/10 text-[#1a2b4c] border border-[#1a2b4c]/20">
                              <GraduationCap size={12} className="text-[#c9a84e]" />
                              <span>{anoPelotao}</span>
                            </span>
                          )}
                          {ehApoio && militar.origemApoio && (
                            <span className="text-[10.5px] text-slate-600 font-semibold mt-0.5">
                              Origem: {militar.origemApoio}
                            </span>
                          )}
                          {!ehApoio && militar.pelotao && anoPelotao === '-' && (
                            <span className="text-[11px] font-semibold text-slate-700">
                              Pelotão {militar.pelotao}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Vínculo / Função */}
                      <td className="py-3 px-3 text-center">
                        {ehApoio ? (
                          <div className="text-[11px]">
                            <span className="font-semibold text-amber-950 block">
                              {militar.funcaoApoio || militar.especialidade || 'Reforço Geral'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {militar.periodoApoio || 'Escala de Apoio'}
                            </span>
                          </div>
                        ) : (
                          <div className="text-[11px]">
                            <span className="font-semibold text-slate-800 block">
                              {militar.funcao || militar.especialidade || 'Manutenção Predial'}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-bold">
                              Efetivo Permanente
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Impedimento */}
                      <td className="py-3 px-4">
                        {temImpedimento ? (
                          <div className="flex items-start gap-2 bg-red-50 border border-red-300 p-2 rounded-md">
                            <AlertTriangle size={15} className="text-red-600 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-bold text-red-900 text-xs">
                                {militar.impedimento}
                              </div>
                              <div className="text-[10px] text-red-700 font-medium">
                                ⚠️ Consta no rodapé da Pauta Oficial PMESP (Tabela)
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-xs">
                            <CheckCircle2 size={14} className="text-emerald-600" />
                            <span>Apto / Sem Impedimento</span>
                          </div>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => abrirEdicaoImpedimento(militar)}
                            className="p-1.5 rounded text-slate-600 hover:text-[#1a2b4c] hover:bg-slate-100 transition cursor-pointer font-semibold text-xs flex items-center gap-1"
                            title="Editar / Alterar Impedimento"
                          >
                            <Edit2 size={13} />
                            <span className="hidden sm:inline">Editar</span>
                          </button>

                          {temImpedimento && (
                            <button
                              type="button"
                              onClick={() => limparImpedimentoDireto(militar.id)}
                              className="p-1.5 rounded text-emerald-700 hover:bg-emerald-50 transition cursor-pointer text-xs font-bold"
                              title="Tornar Apto (Limpar Impedimento)"
                            >
                              ✓ Apto
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: Edição Rápida de Impedimento do Militar                            */}
      {/* ========================================================================= */}
      {militarEditandoImpedimento && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            {/* Cabeçalho do Modal */}
            <div className="bg-[#1a2b4c] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-[#c9a84e]" />
                <div>
                  <h3 className="text-sm font-bold">Impedimento do Militar</h3>
                  <p className="text-[11px] text-slate-300">
                    {militarEditandoImpedimento.graduacao} {militarEditandoImpedimento.nomeGuerra}
                    {' • '}
                    {militarEditandoImpedimento.tipoEfetivo === 'apoio'
                      ? 'Policial em Apoio'
                      : 'Efetivo Fixo (3ª Cia)'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMilitarEditandoImpedimento(null)}
                className="text-slate-300 hover:text-white p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo do Impedimento / Afastamento:
                </label>
                <input
                  type="text"
                  value={textoImpedimento}
                  onChange={(e) => setTextoImpedimento(e.target.value)}
                  placeholder="Ex: Dispensa Médica, Escala de Guarda, LTS..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#1a2b4c] focus:border-[#1a2b4c] font-medium"
                  autoFocus
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Se deixar em branco, o militar será considerado <strong>Apto / Sem Impedimento</strong>.
                </p>
              </div>

              {/* Sugestões Rápidas (Presets) */}
              <div>
                <span className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase">
                  Motivos Comuns (Clique para preencher):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS_IMPEDIMENTO.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTextoImpedimento(preset)}
                      className={`text-[11px] px-2.5 py-1 rounded-md border font-semibold transition cursor-pointer ${
                        textoImpedimento === preset
                          ? 'bg-[#1a2b4c] text-white border-[#1a2b4c]'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTextoImpedimento('')}
                    className="text-[11px] px-2.5 py-1 rounded-md border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold transition cursor-pointer"
                  >
                    ✓ Limpar (Apto)
                  </button>
                </div>
              </div>

              {/* Informação */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-600">
                ⚠️ Ao confirmar um impedimento, este militar constará automaticamente no <strong>rodapé da Pauta Oficial PMESP (Tabela)</strong>.
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setMilitarEditandoImpedimento(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-md transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvarImpedimento}
                className="px-4 py-1.5 text-xs font-bold bg-[#1a2b4c] hover:bg-[#2c4373] text-white rounded-md shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Save size={13} />
                <span>Salvar Impedimento</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
