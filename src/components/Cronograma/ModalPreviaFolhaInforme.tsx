import React, { useRef } from 'react';
import { MissaoDiaria } from '../../types';
import { imprimirEmNovaJanela } from '../../utils/pdfPrintHelper';
import { baixarFoto } from '../../utils';
import { Printer, ExternalLink, X, CheckCircle2, AlertCircle, Download } from 'lucide-react';

interface ModalPreviaFolhaInformeProps {
  aberto: boolean;
  onFechar: () => void;
  missao: MissaoDiaria | null;
  onNavegarParaInforme?: () => void;
}

export const ModalPreviaFolhaInforme: React.FC<ModalPreviaFolhaInformeProps> = ({
  aberto,
  onFechar,
  missao,
  onNavegarParaInforme,
}) => {
  const folhaRef = useRef<HTMLDivElement>(null);

  if (!aberto || !missao) return null;

  const formatarDataCurta = (dataISO: string) => {
    try {
      const [ano, mes, dia] = dataISO.split('-');
      return `${dia}/${mes}/${ano}`;
    } catch {
      return dataISO;
    }
  };

  const handleImprimirFolha = () => {
    if (folhaRef.current) {
      imprimirEmNovaJanela(
        folhaRef.current,
        `INFORME MENSAL - ${missao.titulo.toUpperCase()}`
      );
    } else {
      window.print();
    }
  };

  const fotoAntes = missao.fotoAntesUrl;
  const fotoDepois = missao.fotoDepoisUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-100 rounded-xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-300 my-auto">
        {/* Barra superior de ações */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-300">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#1a2b4c] text-white text-[11px] font-black px-2 py-0.5 rounded tracking-wide uppercase">
                Padrão Oficial APMBB
              </span>
              <h3 className="text-sm sm:text-base font-bold text-[#1a2b4c]">
                Folha do Informe Mensal de Manutenção
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Esta folha foi gerada automaticamente para o relatório fotográfico mensal da 3ª Cia.
            </p>
          </div>

          <div className="flex items-center gap-2 justify-end flex-wrap">
            {(fotoAntes || fotoDepois) && (
              <button
                type="button"
                onClick={() => {
                  if (fotoAntes) {
                    baixarFoto(fotoAntes, `missao-${missao.numeroOrdem || missao.id}-ANTES.jpg`);
                  }
                  if (fotoDepois) {
                    setTimeout(() => {
                      baixarFoto(fotoDepois!, `missao-${missao.numeroOrdem || missao.id}-DEPOIS.jpg`);
                    }, 300);
                  }
                }}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                title="Salvar fotos no computador ou celular"
              >
                <Download size={14} />
                <span>Salvar Foto(s)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleImprimirFolha}
              className="px-3 py-1.5 bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-sm cursor-pointer transition"
              title="Imprimir esta folha em padrão oficial A4"
            >
              <Printer size={14} />
              <span>Imprimir Folha A4</span>
            </button>

            {onNavegarParaInforme && (
              <button
                type="button"
                onClick={() => {
                  onFechar();
                  onNavegarParaInforme();
                }}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 text-xs font-bold rounded flex items-center gap-1.5 transition cursor-pointer"
                title="Abrir o documento completo no Informe Mensal"
              >
                <ExternalLink size={14} />
                <span>Ver no Informe Mensal</span>
              </button>
            )}

            <button
              type="button"
              onClick={onFechar}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Status de fotos */}
        {(!fotoAntes || !fotoDepois) && (
          <div className="mb-3 bg-amber-50 border border-amber-300 rounded p-2 text-xs text-amber-900 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-amber-600" />
            <span>
              {!fotoAntes && !fotoDepois
                ? 'Nenhuma foto (Antes/Depois) foi registrada ainda para esta missão.'
                : !fotoAntes
                ? 'Foto do ANTES ainda pendente. Registre a foto para completar a folha.'
                : 'Foto do DEPOIS ainda pendente. Registre após a conclusão para completar o comparativo.'}
            </span>
          </div>
        )}

        {/* Folha padrão A4 do Informe Mensal (Visualização Idêntica à Impressão) */}
        <div className="bg-white border border-slate-300 rounded-sm shadow-md overflow-x-auto p-4 sm:p-8 max-w-[210mm] mx-auto">
          <div ref={folhaRef} className="apmbb-page bg-white max-w-[194mm] mx-auto p-4 sm:p-6 text-black">
            {/* Top Header Institucional */}
            <div className="flex justify-between items-center border-b-2 border-black pb-1.5 mb-5 font-heading">
              <div className="text-[11px] font-black text-black tracking-wide uppercase">
                ACADEMIA DE POLÍCIA MILITAR DO BARRO BRANCO - O003
              </div>
              <div className="text-[11px] font-black text-black tracking-wide text-right uppercase leading-tight">
                MANUTENÇÃO 3ª CIA<br />CIA ES
              </div>
            </div>

            {/* Títulos do Serviço */}
            <div className="text-center mb-6">
              <h2 className="font-heading text-lg font-extrabold text-[#1a2b4c] text-center w-full uppercase tracking-wide">
                {missao.titulo || 'SERVIÇO DE MANUTENÇÃO PREDIAL'}
              </h2>
              <div className="font-heading text-xs font-bold text-[#b89535] text-center uppercase tracking-wider mt-0.5">
                <span>{formatarDataCurta(missao.data)}</span>
              </div>
              <p className="text-xs text-slate-700 text-center w-full max-w-xl mx-auto block mt-1">
                {missao.local ? `${missao.local} — ` : ''}
                {missao.descricao || missao.titulo}.{' '}
                {missao.membrosDesignados
                  ? `Executores: ${missao.membrosDesignados}.`
                  : missao.equipeNome
                  ? `Equipe: ${missao.equipeNome}.`
                  : 'Efetivo da 3ª Cia Escola.'}
              </p>
            </div>

            {/* Grid de 2 Fotos: Antes & Depois */}
            <div className="grid grid-cols-2 gap-4 my-4">
              {/* Card 1: ANTES */}
              <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 flex flex-col items-center">
                <div className="relative w-full h-64 bg-slate-100 flex items-center justify-center">
                  {fotoAntes ? (
                    <img
                      src={fotoAntes}
                      alt="Situação Inicial (Antes)"
                      className="w-full h-full object-cover block"
                    />
                  ) : (
                    <div className="text-center p-4 text-slate-400 text-xs flex flex-col items-center gap-1">
                      <span className="font-bold text-slate-500">Foto do Antes</span>
                      <span>(Pendente de captura pelo policial)</span>
                    </div>
                  )}
                </div>
                <div className="w-full bg-slate-50 border-t border-slate-200 p-2 text-center flex flex-col items-center gap-1">
                  <span className="font-heading text-[11.5px] font-bold text-slate-800 block uppercase">
                    SITUAÇÃO INICIAL (ANTES DO SERVIÇO)
                  </span>
                  {fotoAntes && (
                    <button
                      type="button"
                      onClick={() => baixarFoto(fotoAntes, `missao-${missao.numeroOrdem || missao.id}-ANTES.jpg`)}
                      className="no-print mt-0.5 text-[10.5px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1 cursor-pointer transition"
                      title="Baixar esta foto no aparelho"
                    >
                      <Download size={11} />
                      <span>Baixar Foto (Antes)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Card 2: DEPOIS */}
              <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 flex flex-col items-center">
                <div className="relative w-full h-64 bg-slate-100 flex items-center justify-center">
                  {fotoDepois ? (
                    <img
                      src={fotoDepois}
                      alt="Serviço Concluído (Depois)"
                      className="w-full h-full object-cover block"
                    />
                  ) : (
                    <div className="text-center p-4 text-slate-400 text-xs flex flex-col items-center gap-1">
                      <span className="font-bold text-slate-500">Foto do Depois</span>
                      <span>(Pendente de captura pelo policial)</span>
                    </div>
                  )}
                </div>
                <div className="w-full bg-slate-50 border-t border-slate-200 p-2 text-center flex flex-col items-center gap-1">
                  <span className="font-heading text-[11.5px] font-bold text-slate-800 block uppercase">
                    SERVIÇO CONCLUÍDO (DEPOIS DA INTERVENÇÃO)
                  </span>
                  {fotoDepois && (
                    <button
                      type="button"
                      onClick={() => baixarFoto(fotoDepois, `missao-${missao.numeroOrdem || missao.id}-DEPOIS.jpg`)}
                      className="no-print mt-0.5 text-[10.5px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 cursor-pointer transition"
                      title="Baixar esta foto no aparelho"
                    >
                      <Download size={11} />
                      <span>Baixar Foto (Depois)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Caixa de Anotação Oficial */}
            <div className="mt-6 flex justify-center">
              <div className="border-2 border-black rounded-lg px-4 py-2.5 bg-white text-xs font-semibold text-black inline-flex items-center gap-2 max-w-2xl w-full">
                <span className="shrink-0 font-bold">Anotação:</span>
                <span>
                  {missao.observacoes ||
                    'Intervenção de manutenção predial executada com êxito conforme determinação da 3ª Cia Escola.'}
                </span>
              </div>
            </div>

            {/* Rodapé Oficial da APMBB */}
            <div className="border-t-2 border-black pt-2 mt-6 text-center font-heading text-[11px] font-black tracking-widest text-black uppercase">
              BERÇO DO OFICIALATO PAULISTA
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
