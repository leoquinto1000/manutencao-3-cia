import React, { useState } from 'react';
import { InformeMensal, HistoricoModificacaoInforme, StatusInformeMensal } from '../../types';
import {
  History,
  X,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  FileText,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { gerarId } from '../../utils';

interface ModalHistoricoAuditoriaProps {
  isOpen: boolean;
  onClose: () => void;
  informe: InformeMensal;
  onUpdateHistorico: (historico: HistoricoModificacaoInforme[]) => void;
  usuarioLogadoNome?: string;
}

export const ModalHistoricoAuditoria: React.FC<ModalHistoricoAuditoriaProps> = ({
  isOpen,
  onClose,
  informe,
  onUpdateHistorico,
  usuarioLogadoNome = 'Operador',
}) => {
  const [novaNota, setNovaNota] = useState<string>('');
  const [novoAutor, setNovoAutor] = useState<string>(usuarioLogadoNome);

  if (!isOpen) return null;

  const historico = informe.historico || [];

  const handleAdicionarRegistroManual = () => {
    if (!novaNota.trim()) return;
    const novoItem: HistoricoModificacaoInforme = {
      id: gerarId(),
      dataHora: new Date().toLocaleString('pt-BR'),
      usuario: novoAutor.trim() || usuarioLogadoNome,
      acao: 'Anotação de Auditoria / Despacho',
      detalhe: novaNota.trim(),
    };
    onUpdateHistorico([novoItem, ...historico]);
    setNovaNota('');
  };

  const getStatusBadge = (status?: StatusInformeMensal) => {
    switch (status) {
      case 'Aprovado':
        return (
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1">
            <CheckCircle2 size={12} /> Aprovado / Homologado
          </span>
        );
      case 'Em Revisão':
        return (
          <span className="bg-blue-100 text-blue-800 border border-blue-300 px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1">
            <Clock size={12} /> Em Revisão
          </span>
        );
      case 'Arquivado':
        return (
          <span className="bg-purple-100 text-purple-800 border border-purple-300 px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1">
            <ShieldCheck size={12} /> Arquivado Definitivo
          </span>
        );
      case 'Rascunho':
      default:
        return (
          <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1">
            <AlertCircle size={12} /> Rascunho em Elaboração
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#1a2b4c] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <History size={20} className="text-[#c9a84e]" />
            <div>
              <h3 className="text-sm font-bold">
                Gestão e Histórico de Auditoria do Informe
              </h3>
              <p className="text-[11px] text-slate-300">
                {informe.titulo} • Mês: {informe.mesAno || 'Mensal'} • Versão {informe.versao || 1}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-md hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Resumo da Gestão */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Situação Atual:
            </span>
            {getStatusBadge(informe.status)}
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Última Atualização:
            </span>
            <span className="font-semibold text-slate-800">
              {informe.ultimaAtualizacao || 'Hoje'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Responsável:
            </span>
            <span className="font-semibold text-slate-800">
              {informe.autorUltimaAtualizacao || usuarioLogadoNome}
            </span>
          </div>
        </div>

        {/* Lista de Registros / Timeline */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock size={13} className="text-[#1a2b4c]" />
              <span>Linha do Tempo das Modificações:</span>
            </h4>

            {historico.length === 0 ? (
              <div className="text-center p-6 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-slate-500 text-xs">
                Nenhum evento registrado ainda neste relatório.
              </div>
            ) : (
              <div className="relative border-l-2 border-[#1a2b4c]/20 ml-3 space-y-4">
                {historico.map((item, idx) => (
                  <div key={item.id || idx} className="relative pl-5 group">
                    {/* Marcador do ponto da linha */}
                    <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-[#1a2b4c] border-2 border-white shadow-2xs" />
                    <div className="bg-slate-50 group-hover:bg-slate-100 p-3 rounded-lg border border-slate-200 transition">
                      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-xs text-[#1a2b4c]">
                          {item.acao}
                        </span>
                        <span className="text-[10.5px] text-slate-500 font-medium">
                          {item.dataHora}
                        </span>
                      </div>
                      {item.usuario && (
                        <div className="text-[11px] text-slate-600 font-semibold mb-1 flex items-center gap-1">
                          <User size={11} className="text-slate-400" />
                          <span>{item.usuario}</span>
                        </div>
                      )}
                      {item.detalhe && (
                        <p className="text-xs text-slate-700 leading-relaxed bg-white p-2 rounded border border-slate-200/80">
                          {item.detalhe}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Adicionar Despacho / Registro Manual */}
          <div className="pt-3 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Plus size={13} className="text-emerald-600" />
              <span>Inserir Despacho ou Anotação no Histórico:</span>
            </h4>
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={novoAutor}
                  onChange={(e) => setNovoAutor(e.target.value)}
                  placeholder="Nome / Posto ou Graduação..."
                  className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-[#1a2b4c] outline-none"
                />
              </div>
              <textarea
                rows={2}
                value={novaNota}
                onChange={(e) => setNovaNota(e.target.value)}
                placeholder="Descreva a alteração, aprovação, parecer ou motivo do despacho..."
                className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-[#1a2b4c] outline-none resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAdicionarRegistroManual}
                  disabled={!novaNota.trim()}
                  className="px-3 py-1.5 bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-xs font-bold rounded shadow-2xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={13} />
                  <span>Gravar no Histórico</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition border border-slate-300 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
