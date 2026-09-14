import React, { useRef, useState } from 'react';
import { BalanceteState, BalanceteDespesa, NFInstance } from '../../types';
import { formatMoeda, parseMoeda, gerarId } from '../../utils';
import { RefreshCw, Plus, Trash2, Upload, Printer, FileText } from 'lucide-react';
import { ModalVisualizadorPDF } from './ModalVisualizadorPDF';
import { imprimirEmNovaJanela } from '../../utils/pdfPrintHelper';

interface BalanceteGlobalViewProps {
  balancete: BalanceteState;
  onChangeBalancete: (updated: BalanceteState) => void;
  nfs: NFInstance[];
}

export const BalanceteGlobalView: React.FC<BalanceteGlobalViewProps> = ({
  balancete,
  onChangeBalancete,
  nfs,
}) => {
  const balanceteRef = useRef<HTMLDivElement>(null);
  const [modalPdfAberto, setModalPdfAberto] = useState<boolean>(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // Sync expenses from all NFs
  const handlePuxarDespesas = () => {
    const novasDespesas: BalanceteDespesa[] = [];

    nfs.forEach((nf) => {
      const subtotal = nf.items.reduce((acc, it) => acc + (it.qtd || 0) * (it.unitPrice || 0), 0);
      const desc = nf.descontoAplicado || 0;
      const totalNF = Math.max(0, subtotal - desc);

      const supName = nf.suppliers?.[0]?.name ? ` (${nf.suppliers[0].name})` : '';
      novasDespesas.push({
        id: gerarId(),
        descricao: `${nf.label}${supName}`,
        valor: totalNF,
      });
    });

    onChangeBalancete({
      ...balancete,
      despesas: novasDespesas,
      valorBensTotal: balancete.valorAdiantamento,
    });

    setMensagemSucesso(`✅ ${novasDespesas.length} despesas importadas das NFs para o Balancete com sucesso!`);
    setTimeout(() => setMensagemSucesso(null), 3500);
  };

  const handleAddDespesa = () => {
    const nova: BalanceteDespesa = {
      id: gerarId(),
      descricao: 'Nova Despesa / Material Diversos',
      valor: 0,
    };
    onChangeBalancete({
      ...balancete,
      despesas: [...balancete.despesas, nova],
    });
  };

  const handleUpdateDespesa = (id: string, field: keyof BalanceteDespesa, val: any) => {
    onChangeBalancete({
      ...balancete,
      despesas: balancete.despesas.map((d) => (d.id === id ? { ...d, [field]: val } : d)),
    });
  };

  const handleRemoveDespesa = (id: string) => {
    onChangeBalancete({
      ...balancete,
      despesas: balancete.despesas.filter((d) => d.id !== id),
    });
  };

  const totalDespesas = balancete.despesas.reduce((acc, d) => acc + (d.valor || 0), 0);
  const adiantamentoMenosRecolhimento =
    (balancete.valorAdiantamento || 0) - (balancete.valorRecolhido || 0);

  const handleUploadBrasao = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      onChangeBalancete({ ...balancete, brasaoUrl: e.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="no-print bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 max-w-[794px] mx-auto">
        <div>
          <h2 className="text-sm font-bold text-[#1a2b4c]">Balancete de Prestação de Contas</h2>
          <p className="text-xs text-slate-500">
            Formulário oficial contábil da PMESP para comprovação de despesas de adiantamento.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePuxarDespesas}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition shadow-sm"
            title="Importar valores totais das NFs cadastradas"
          >
            <RefreshCw size={13} />
            <span>Puxar Despesas das NFs</span>
          </button>
          <button
            onClick={handleAddDespesa}
            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded border border-slate-300 transition"
          >
            <Plus size={13} />
            <span>Inserir Despesa</span>
          </button>
          <button
            onClick={() => setModalPdfAberto(true)}
            className="flex items-center gap-1.5 bg-[#c9a84e] hover:bg-[#b8973f] text-[#1a2b4c] text-xs font-bold px-3 py-1.5 rounded transition shadow-sm cursor-pointer"
            title="Abrir pré-visualização e gerar arquivo PDF oficial"
          >
            <FileText size={13} />
            <span>Visualizar & Gerar PDF</span>
          </button>
          <button
            onClick={() => {
              if (balanceteRef.current) {
                imprimirEmNovaJanela(balanceteRef.current, 'Balancete de Prestação de Contas - PMESP');
              } else {
                window.print();
              }
            }}
            className="flex items-center gap-1.5 bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-xs font-semibold px-3 py-1.5 rounded transition shadow-sm"
            title="Imprimir diretamente em nova janela (sem bloqueios)"
          >
            <Printer size={13} />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {mensagemSucesso && (
        <div className="no-print bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold px-4 py-2 rounded-lg max-w-[794px] mx-auto flex items-center justify-between shadow-2xs">
          <span>{mensagemSucesso}</span>
          <button onClick={() => setMensagemSucesso(null)} className="text-emerald-600 hover:text-emerald-900 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Official A4 Sheet */}
      <div ref={balanceteRef} className="balancete-page bg-white">
        {/* Top Grid */}
        <div className="grid grid-cols-[100px_1fr_180px] gap-3.5 items-start mb-5">
          {/* Coat of arms */}
          <div className="text-center relative group">
            <img
              src={balancete.brasaoUrl}
              alt="Brasão do Estado"
              className="w-20 mx-auto block grayscale opacity-85 object-contain"
            />
            <div className="no-print mt-1">
              <label className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-1 py-0.5 rounded cursor-pointer border border-slate-300 inline-block">
                Trocar
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleUploadBrasao(e.target.files[0]);
                      e.target.value = '';
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* Center Box */}
          <div className="border-[2.5px] border-black text-center p-1.5 font-bold text-xs leading-tight">
            SEGURANÇA PÚBLICA<br />
            <span className="font-normal text-[9px] block my-0.5">SECRETARIA</span>
            ACADEMIA DE POLICIA MILITAR DO BARRO BRANCO<br />
            <span className="font-normal text-[9px] block my-0.5">UNIDADE DE DESPESA</span>
          </div>

          {/* Right Mini Tables */}
          <div className="text-[9px] font-bold">
            <table className="w-full border-collapse border-[2.5px] border-black text-center mb-1">
              <thead>
                <tr>
                  <th className="border border-black p-0.5">COD DOC</th>
                  <th className="border border-black p-0.5">U G</th>
                  <th className="border border-black p-0.5">Nº LOTE</th>
                  <th className="border border-black p-0.5">Nº SEQ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-1">&nbsp;</td>
                  <td className="border border-black p-1">&nbsp;</td>
                  <td className="border border-black p-1">&nbsp;</td>
                  <td className="border border-black p-1">&nbsp;</td>
                </tr>
              </tbody>
            </table>

            <table className="w-full border-collapse border-[2.5px] border-black text-center">
              <thead>
                <tr>
                  <th colSpan={2} className="border border-black p-0.5">CGC</th>
                  <th className="border border-black p-0.5">TIPO CREDOR</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={2} className="border border-black p-0.5 font-bold">
                    <input
                      type="text"
                      value={balancete.uge}
                      onChange={(e) => onChangeBalancete({ ...balancete, uge: e.target.value })}
                      className="w-full text-center bg-transparent border-0 focus:ring-1 focus:ring-black font-bold text-[9px]"
                    />
                  </td>
                  <td className="border border-black p-0.5">&nbsp;</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Document Title */}
        <h2 className="text-center text-base font-bold my-3 tracking-wide uppercase">
          BALANCETE DE PRESTAÇÃO DE CONTAS
        </h2>

        {/* Info Rows */}
        <div className="flex items-end mb-4 text-xs font-bold">
          <div className="flex-1">
            <input
              type="text"
              value={balancete.responsavelHeader}
              onChange={(e) =>
                onChangeBalancete({ ...balancete, responsavelHeader: e.target.value })
              }
              className="w-full font-bold underline text-xs bg-transparent border-0 focus:ring-1 focus:ring-black rounded"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 mb-3 text-xs font-bold">
          <div className="w-32 text-center">
            <input
              type="text"
              value={balancete.elemento}
              onChange={(e) => onChangeBalancete({ ...balancete, elemento: e.target.value })}
              className="w-full text-center font-bold text-sm underline bg-transparent border-0 focus:ring-1 focus:ring-black rounded"
            />
            <div className="text-[9px] font-normal text-slate-700 mt-0.5">ELEMENTO</div>
          </div>
          <div className="flex-1 text-center">
            <input
              type="text"
              value={balancete.discriminacao}
              onChange={(e) => onChangeBalancete({ ...balancete, discriminacao: e.target.value })}
              className="w-full text-center font-bold text-sm underline bg-transparent border-0 focus:ring-1 focus:ring-black rounded"
            />
            <div className="text-[9px] font-normal text-slate-700 mt-0.5">DISCRIMINAÇÃO</div>
          </div>
        </div>

        <div className="flex items-end justify-between mb-3 text-xs font-bold">
          <div className="w-40 text-center">
            <input
              type="text"
              value={balancete.mesReferencia}
              onChange={(e) => onChangeBalancete({ ...balancete, mesReferencia: e.target.value })}
              className="w-full text-center font-bold underline bg-transparent border-0 focus:ring-1 focus:ring-black rounded text-xs"
            />
            <div className="text-[9px] font-normal text-slate-700 mt-0.5">MÊS DE REFERÊNCIA</div>
          </div>

          <table className="border-collapse border-[2.5px] border-black text-center text-[9px] font-bold">
            <thead>
              <tr>
                <th className="border border-black px-2 py-0.5">CÓDIGO DO SERVIDOR</th>
                <th className="border border-black px-2 py-0.5">NÚMERO DO EMPENHO</th>
                <th className="border border-black px-2 py-0.5">DATA CONTABILIZAÇÃO</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-0.5">
                  <input
                    type="text"
                    value={balancete.servidorCodigo}
                    onChange={(e) =>
                      onChangeBalancete({ ...balancete, servidorCodigo: e.target.value })
                    }
                    className="w-28 text-center bg-transparent border-0 focus:ring-1 focus:ring-black rounded text-[9px]"
                  />
                </td>
                <td className="border border-black p-0.5">
                  <input
                    type="text"
                    value={balancete.empenhoNumero}
                    onChange={(e) =>
                      onChangeBalancete({ ...balancete, empenhoNumero: e.target.value })
                    }
                    className="w-28 text-center bg-transparent border-0 focus:ring-1 focus:ring-black rounded text-[9px]"
                  />
                </td>
                <td className="border border-black p-0.5">
                  <input
                    type="text"
                    value={balancete.dataContabilizacao}
                    onChange={(e) =>
                      onChangeBalancete({ ...balancete, dataContabilizacao: e.target.value })
                    }
                    className="w-24 text-center bg-transparent border-0 focus:ring-1 focus:ring-black rounded text-[9px]"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-3 text-xs font-bold">
          <div className="w-48 text-center">
            <input
              type="text"
              value={balancete.dataRecebimento}
              onChange={(e) =>
                onChangeBalancete({ ...balancete, dataRecebimento: e.target.value })
              }
              className="w-full text-center font-bold underline bg-transparent border-0 focus:ring-1 focus:ring-black rounded text-xs"
            />
            <div className="text-[9px] font-normal text-slate-700 mt-0.5">DATA DO RECEBIMENTO</div>
          </div>
        </div>

        {/* Expenses Table */}
        <table className="w-full border-collapse border-[2.5px] border-black text-xs mb-0 font-sans">
          <thead>
            <tr>
              <th className="border border-black p-2 text-center font-bold text-xs w-[75%]">
                DESPESAS DOCUMENTADAS
              </th>
              <th className="border border-black p-2 text-center font-bold text-xs w-[25%]">
                VALOR
              </th>
              <th className="no-print border border-black p-1 text-center w-8">Ação</th>
            </tr>
          </thead>
          <tbody>
            {balancete.despesas.length === 0 ? (
              <tr>
                <td colSpan={3} className="border border-black p-6 text-center text-slate-400 italic">
                  Nenhuma despesa lançada. Clique em "Puxar Despesas das NFs" acima.
                </td>
              </tr>
            ) : (
              balancete.despesas.map((desp) => (
                <tr key={desp.id}>
                  <td className="border border-black p-1.5">
                    <input
                      type="text"
                      value={desp.descricao}
                      onChange={(e) => handleUpdateDespesa(desp.id, 'descricao', e.target.value)}
                      className="w-full font-medium bg-transparent border-0 focus:ring-1 focus:ring-black rounded text-xs"
                    />
                  </td>
                  <td className="border border-black p-1.5 text-right font-mono font-bold">
                    <div className="flex items-center justify-end">
                      <span className="text-[10px] mr-1">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={desp.valor}
                        onChange={(e) =>
                          handleUpdateDespesa(desp.id, 'valor', parseFloat(e.target.value) || 0)
                        }
                        className="w-28 text-right bg-transparent border-0 focus:ring-1 focus:ring-black rounded font-mono font-bold text-xs"
                      />
                    </div>
                  </td>
                  <td className="no-print border border-black p-1 text-center">
                    <button
                      onClick={() => handleRemoveDespesa(desp.id)}
                      className="text-red-500 hover:text-red-700 p-0.5"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="font-bold">
              <td className="border border-black p-2 text-right">TOTAL</td>
              <td className="border border-black p-2 text-right font-mono font-black text-sm bg-slate-50">
                {formatMoeda(totalDespesas)}
              </td>
              <td className="no-print border border-black"></td>
            </tr>
          </tfoot>
        </table>

        {/* Summary Table */}
        <table className="w-full border-collapse border-[2.5px] border-black border-t-0 text-center font-bold text-[10px] mb-4">
          <thead>
            <tr>
              <th className="border border-black p-1.5 w-[30%]">DATA RECOLHIMENTO</th>
              <th className="border border-black p-1.5 w-[25%]">VALOR DO ADIANTAMENTO</th>
              <th className="border border-black p-1.5 w-[20%]">VALOR RECOLHIDO</th>
              <th className="border border-black p-1.5 w-[25%]">ADIANTAMENTO - RECOLHIMENTO</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-2 align-bottom">
                <input
                  type="text"
                  value={balancete.dataRecolhimento}
                  onChange={(e) =>
                    onChangeBalancete({ ...balancete, dataRecolhimento: e.target.value })
                  }
                  className="w-full text-center bg-transparent border-0 focus:ring-1 focus:ring-black text-[11px]"
                />
              </td>
              <td className="border border-black p-2 text-xs font-mono">
                <input
                  type="number"
                  step="0.01"
                  value={balancete.valorAdiantamento}
                  onChange={(e) =>
                    onChangeBalancete({
                      ...balancete,
                      valorAdiantamento: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-24 text-center font-bold bg-transparent border-0 focus:ring-1 focus:ring-black font-mono text-xs"
                />
              </td>
              <td className="border border-black p-2 text-xs font-mono">
                <input
                  type="number"
                  step="0.01"
                  value={balancete.valorRecolhido}
                  onChange={(e) =>
                    onChangeBalancete({
                      ...balancete,
                      valorRecolhido: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-20 text-center font-bold bg-transparent border-0 focus:ring-1 focus:ring-black font-mono text-xs"
                />
              </td>
              <td className="border border-black p-2 text-xs font-mono font-black bg-slate-50">
                {adiantamentoMenosRecolhimento.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer Demonstration & Signatures */}
        <table className="w-full border-collapse border-[2.5px] border-black text-center text-[9.5px] font-bold mt-auto">
          <tbody>
            <tr>
              <td rowSpan={2} className="border border-black p-2 align-middle w-[20%]">
                DEMONSTRAÇÃO<br />DO VALOR<br />DOS BENS
              </td>
              <td className="border border-black p-1 text-left w-[25%]">
                BENS DE DIVERSAS<br />NATUREZAS<br /><br /><span className="font-normal">R$</span>
              </td>
              <td className="border border-black p-1 text-left w-[25%]">
                BENS DE NATUREZA<br />INDUSTRIAL<br /><br /><span className="font-normal">R$</span>
              </td>
              <td className="border border-black p-1 align-middle text-xs w-[30%] bg-slate-50">
                TOTAL<br /><br />
                <span className="font-mono font-bold text-xs">
                  {formatMoeda(balancete.valorBensTotal || balancete.valorAdiantamento)}
                </span>
              </td>
            </tr>
            <tr>
              <td colSpan={3} className="p-0 border-0">
                <table className="w-full border-collapse text-center">
                  <thead>
                    <tr>
                      <th className="border-t border-r border-black p-1 w-1/2 text-[9px]">
                        RESPONSÁVEL PELO ADIANTAMENTO
                      </th>
                      <th className="border-t border-r border-black p-1 w-1/4 text-[9px]">DIRETOR</th>
                      <th className="border-t border-black p-1 w-1/4 text-[9px]">CONTABILIDADE</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border-r border-black pt-8 pb-3 px-2">
                        <input
                          type="text"
                          value={balancete.responsavelAssinatura}
                          onChange={(e) =>
                            onChangeBalancete({
                              ...balancete,
                              responsavelAssinatura: e.target.value,
                            })
                          }
                          className="w-full text-center font-bold text-[10px] bg-transparent border-0 focus:ring-1 focus:ring-black uppercase"
                        />
                        <input
                          type="text"
                          value={balancete.cargoAssinatura}
                          onChange={(e) =>
                            onChangeBalancete({ ...balancete, cargoAssinatura: e.target.value })
                          }
                          className="w-full text-center font-normal text-[8.5px] text-slate-600 bg-transparent border-0 focus:ring-1 focus:ring-black"
                        />
                      </td>
                      <td className="border-r border-black pt-8 pb-3 text-slate-400">___/___/___</td>
                      <td className="pt-8 pb-3 text-slate-400">___/___/___</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Modal Visualizador e Gerador de PDF */}
      <ModalVisualizadorPDF
        isOpen={modalPdfAberto}
        onClose={() => setModalPdfAberto(false)}
        targetElement={balanceteRef.current}
        titulo="Balancete de Prestação de Contas • PMESP"
        subtitulo="Formulário oficial contábil da APMBB para comprovação de despesas de adiantamento"
        nomeArquivo={`Balancete_Prestacao_Contas_${new Date().toISOString().slice(0, 10)}.pdf`}
        orientacao="p"
      />
    </div>
  );
};
