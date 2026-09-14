import React, { useRef, useState } from 'react';
import { NFInstance, MaterialItem, Supplier, PesquisaPrecoItem } from '../../types';
import { formatMoeda, parseMoeda, gerarId } from '../../utils';
import { Plus, Trash2, Minus, FileCode, Printer, FileText } from 'lucide-react';
import { ModalVisualizadorPDF } from './ModalVisualizadorPDF';
import { imprimirEmNovaJanela } from '../../utils/pdfPrintHelper';

interface TabelaComposicaoProps {
  nf: NFInstance;
  onUpdateNF: (updatedNF: NFInstance) => void;
  pesquisas?: PesquisaPrecoItem[];
  onChangePesquisas?: (pesquisas: PesquisaPrecoItem[]) => void;
}

export const TabelaComposicao: React.FC<TabelaComposicaoProps> = ({
  nf,
  onUpdateNF,
  pesquisas,
  onChangePesquisas,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [modalPdfAberto, setModalPdfAberto] = useState<boolean>(false);
  const totalEmpresas = nf.totalEmpresas || 3;

  // Helpers to manipulate items
  const handleUpdateItem = (id: string, field: keyof MaterialItem, value: any) => {
    const updatedItems = nf.items.map((item) => {
      if (item.id !== id) return item;
      return { ...item, [field]: value };
    });
    onUpdateNF({ ...nf, items: updatedItems });

    // Sincroniza alterações estruturais (descrição, unidade, quantidade) com as folhas de pesquisa
    if (onChangePesquisas && pesquisas && pesquisas.length > 0) {
      const updatedPesquisas = pesquisas.map((p) => {
        if (p.materialId === id) {
          const updated = { ...p };
          if (field === 'desc') updated.materialDesc = String(value);
          if (field === 'unid') updated.unid = String(value);
          if (field === 'qtd') {
            const q = typeof value === 'number' ? value : (parseFloat(value) || 0);
            updated.qtd = q;
            updated.precoTotal = q * (Number(updated.precoUnitario) || 0);
          }
          return updated;
        }
        return p;
      });
      onChangePesquisas(updatedPesquisas);
    }
  };

  const handleUpdateCompanyPrice = (itemId: string, companyNum: number, price: number) => {
    const updatedItems = nf.items.map((item) => {
      if (item.id !== itemId) return item;
      const prices = { ...(item.companyPrices || {}) };
      prices[companyNum] = price;

      // recalculate minimum price
      const validPrices = Object.values(prices).filter((p): p is number => typeof p === 'number' && p > 0);
      const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : price;

      return {
        ...item,
        companyPrices: prices,
        unitPrice: minPrice,
      };
    });
    onUpdateNF({ ...nf, items: updatedItems });

    // Sincroniza o preço alterado na planilha com a folha de pesquisa correspondente
    if (onChangePesquisas && pesquisas && pesquisas.length > 0) {
      const targetItem = nf.items.find((it) => it.id === itemId);
      const matDesc = targetItem?.desc?.trim().toLowerCase();

      const updatedPesquisas = pesquisas.map((p) => {
        const isMatch =
          p.materialId === itemId ||
          (matDesc && p.materialDesc?.trim().toLowerCase() === matDesc);
        const compMatch =
          p.empresaNum === companyNum || p.pesquisaIndice === companyNum;

        if (isMatch && compMatch) {
          const numPrice = typeof price === 'number' ? price : (parseFloat(price) || 0);
          return {
            ...p,
            precoUnitario: numPrice,
            precoTotal: (Number(p.qtd) || 0) * numPrice,
          };
        }
        return p;
      });
      onChangePesquisas(updatedPesquisas);
    }
  };

  const handleAddItem = () => {
    const newItem: MaterialItem = {
      id: gerarId(),
      desc: 'Novo Material',
      unid: 'UN',
      qtd: 1,
      unitPrice: 0,
      companyPrices: { 1: 0 },
    };
    onUpdateNF({ ...nf, items: [...nf.items, newItem] });
  };

  const handleRemoveItem = (id: string) => {
    onUpdateNF({ ...nf, items: nf.items.filter((item) => item.id !== id) });
  };

  const handleAddEmpresa = () => {
    const newTotal = totalEmpresas + 1;
    let updatedSuppliers = [...(nf.suppliers || [])];
    if (updatedSuppliers.length < newTotal) {
      updatedSuppliers.push({
        id: gerarId(),
        num: newTotal,
        name: `Empresa ${newTotal}`,
        razaoSocial: `Empresa ${newTotal} Comercial Ltda`,
        cnpj: '',
        endereco: 'São Paulo - SP',
        contato: '-',
      });
    }
    onUpdateNF({ ...nf, totalEmpresas: newTotal, suppliers: updatedSuppliers });
  };

  const handleRemoveEmpresa = () => {
    if (totalEmpresas <= 1) {
      alert('É necessário manter no mínimo 1 empresa.');
      return;
    }
    const newTotal = totalEmpresas - 1;
    onUpdateNF({ ...nf, totalEmpresas: newTotal });
  };

  const handleUpdateSupplierDirect = (compNum: number, field: keyof Supplier, value: string) => {
    let currentSuppliers = [...(nf.suppliers || [])];
    const supIndex = currentSuppliers.findIndex((s) => s.num === compNum);
    if (supIndex >= 0) {
      const currentSup = currentSuppliers[supIndex];
      const updatedSup = { ...currentSup, [field]: value };
      if (
        field === 'name' &&
        (!currentSup.razaoSocial || currentSup.razaoSocial === currentSup.name || currentSup.razaoSocial.startsWith('Empresa '))
      ) {
        updatedSup.razaoSocial = value;
      }
      currentSuppliers[supIndex] = updatedSup;
    } else {
      currentSuppliers.push({
        id: `sup-${compNum}-${Date.now()}`,
        num: compNum,
        name: field === 'name' ? value : `Empresa ${compNum}`,
        razaoSocial: field === 'razaoSocial' ? value : (field === 'name' ? value : `Empresa ${compNum}`),
        cnpj: field === 'cnpj' ? value : '',
        endereco: field === 'endereco' ? value : 'São Paulo - SP',
        contato: field === 'contato' ? value : '-',
      });
    }

    onUpdateNF({ ...nf, suppliers: currentSuppliers });

    if (onChangePesquisas && pesquisas && pesquisas.length > 0) {
      const updatedPesquisas = pesquisas.map((p) => {
        if (p.nfId === nf.id && (p.empresaNum === compNum || p.pesquisaIndice === compNum)) {
          const updated = { ...p };
          if (field === 'name') updated.empresaNome = value;
          if (field === 'contato') updated.contato = value;
          return updated;
        }
        return p;
      });
      onChangePesquisas(updatedPesquisas);
    }
  };

  // Calculations
  const subtotalMenorPreco = nf.items.reduce((acc, item) => {
    const qtd = item.qtd || 0;
    const unit = item.unitPrice || 0;
    return acc + qtd * unit;
  }, 0);

  const subtotalUnitarios = nf.items.reduce((acc, item) => acc + (item.unitPrice || 0), 0);
  const desconto = nf.descontoAplicado || 0;
  const totalParcial = Math.max(0, subtotalMenorPreco - desconto);

  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <div className="no-print bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAddItem}
            className="flex items-center gap-1 bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-xs font-semibold px-3 py-2 rounded transition shadow-sm"
          >
            <Plus size={14} />
            <span>Novo Material</span>
          </button>
          <button
            onClick={handleAddEmpresa}
            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded border border-slate-300 transition"
          >
            <Plus size={14} />
            <span>Adicionar Empresa ({totalEmpresas + 1})</span>
          </button>
          {totalEmpresas > 1 && (
            <button
              onClick={handleRemoveEmpresa}
              className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold px-3 py-2 rounded border border-red-200 transition"
            >
              <Minus size={14} />
              <span>Remover Empresa ({totalEmpresas})</span>
            </button>
          )}

          {/* Botões de Impressão e PDF */}
          <button
            onClick={() => setModalPdfAberto(true)}
            className="flex items-center gap-1.5 bg-[#c9a84e] hover:bg-[#b8973f] text-[#1a2b4c] text-xs font-bold px-3 py-2 rounded transition shadow-sm cursor-pointer ml-1"
            title="Abrir pré-visualização e gerar arquivo PDF oficial"
          >
            <FileText size={14} />
            <span>Visualizar & Gerar PDF</span>
          </button>

          <button
            onClick={() => {
              if (sheetRef.current) {
                imprimirEmNovaJanela(sheetRef.current, `Planilha de Composição de Preços - ${nf?.label || 'NF'}`);
              } else {
                window.print();
              }
            }}
            className="flex items-center gap-1.5 bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-xs font-semibold px-3 py-2 rounded transition shadow-sm"
            title="Imprimir diretamente em nova janela (sem bloqueios)"
          >
            <Printer size={14} />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Official Sheet Paper */}
      <div ref={sheetRef} className="sheet-paper bg-white">
        {/* Official Header */}
        <div className="text-center font-bold uppercase mb-6 leading-snug border-b-2 border-black pb-3">
          <h2 className="text-sm tracking-wide">SECRETARIA DA SEGURANÇA PÚBLICA</h2>
          <h3 className="text-xs mt-0.5 tracking-wide">POLÍCIA MILITAR DO ESTADO DE SÃO PAULO</h3>
          <h4 className="text-[11px] mt-0.5 tracking-wide">
            ACADEMIA DE POLÍCIA MILITAR DO ESTADO DE SÃO PAULO
          </h4>
          <h4 className="text-[11px] mt-0.5 tracking-wide font-black text-[#1a2b4c]">
            PLANILHA DE COMPOSIÇÃO DE PREÇOS
          </h4>
          <span className="text-[10px] font-normal block mt-1 text-slate-700">
            Decreto nº 67.888 DE 17 DE AGOSTO DE 2023
          </span>
        </div>

        {/* Main Price Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[10px] text-center border border-black font-sans">
            <thead>
              <tr className="bg-slate-100 font-bold text-slate-900">
                <th rowSpan={2} className="no-print border border-black p-1.5 w-8">
                  Ação
                </th>
                <th rowSpan={2} className="border border-black p-1.5 text-left min-w-[200px]">
                  DESCRIÇÃO DO MATERIAL
                </th>
                <th rowSpan={2} className="border border-black p-1.5 w-14">
                  UNID. FORN.
                </th>
                <th rowSpan={2} className="border border-black p-1.5 w-12">
                  QTD
                </th>

                {/* Menor Preço (Empresa 1 ou Melhor Cotação) */}
                <th colSpan={2} className="border border-black p-1.5 bg-menor-preco font-black">
                  <div>MENOR PREÇO</div>
                  <div className="text-[9px] uppercase tracking-wider font-extrabold text-slate-900">
                    {((nf.suppliers || []).find((s) => s.num === 1) || (nf.suppliers && nf.suppliers[0]))?.name || 'EMPRESA 1'}
                  </div>
                </th>

                {/* Additional Companies */}
                {Array.from({ length: totalEmpresas - 1 }).map((_, idx) => {
                  const compNum = idx + 2;
                  const sup = (nf.suppliers || []).find((s) => s.num === compNum) || (nf.suppliers && nf.suppliers[compNum - 1]);
                  const compName = sup ? sup.name : `EMPRESA ${compNum}`;

                  return (
                    <th key={compNum} colSpan={2} className="border border-black p-1.5 bg-slate-100">
                      <div>EMPRESA {compNum}</div>
                      <div className="text-[8.5px] font-normal text-slate-600 truncate max-w-[130px] mx-auto">
                        {compName}
                      </div>
                    </th>
                  );
                })}
              </tr>
              <tr className="bg-slate-100 font-bold text-slate-900 text-[9px]">
                <th className="border border-black p-1 bg-menor-preco">PREÇO UNITÁRIO</th>
                <th className="border border-black p-1 bg-menor-preco">PREÇO TOTAL</th>

                {Array.from({ length: totalEmpresas - 1 }).map((_, idx) => (
                  <React.Fragment key={idx}>
                    <th className="border border-black p-1">PREÇO UNITÁRIO</th>
                    <th className="border border-black p-1">PREÇO TOTAL</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {nf.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={4 + totalEmpresas * 2}
                    className="border border-black p-6 text-slate-400 italic"
                  >
                    Nenhum material cadastrado nesta nota. Use o botão <strong>"Novo Material"</strong> ou a aba <strong>"Extrair NF"</strong>.
                  </td>
                </tr>
              ) : (
                nf.items.map((item) => {
                  const qtd = item.qtd || 0;
                  const unitMenor = item.unitPrice || 0;
                  const totalMenor = qtd * unitMenor;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="no-print border border-black p-1 text-center">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-0.5 rounded"
                          title="Remover este item"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                      <td className="border border-black p-1 text-left font-medium">
                        <input
                          type="text"
                          value={item.desc}
                          onChange={(e) => handleUpdateItem(item.id, 'desc', e.target.value)}
                          className="w-full px-1 py-0.5 bg-transparent border-0 focus:ring-1 focus:ring-black rounded text-[10px]"
                        />
                      </td>
                      <td className="border border-black p-1 text-center">
                        <input
                          type="text"
                          value={item.unid}
                          onChange={(e) => handleUpdateItem(item.id, 'unid', e.target.value)}
                          className="w-full text-center px-0.5 py-0.5 bg-transparent border-0 focus:ring-1 focus:ring-black rounded uppercase font-mono text-[10px]"
                        />
                      </td>
                      <td className="border border-black p-1 text-center">
                        <input
                          type="number"
                          step="any"
                          value={item.qtd}
                          onChange={(e) =>
                            handleUpdateItem(item.id, 'qtd', parseFloat(e.target.value) || 0)
                          }
                          className="w-full text-center px-0.5 py-0.5 bg-transparent border-0 focus:ring-1 focus:ring-black rounded font-semibold text-[10px]"
                        />
                      </td>

                      {/* Menor Preço columns (Gold) */}
                      <td className="border border-black p-1 bg-menor-preco font-mono font-bold">
                        <input
                          type="number"
                          step="0.01"
                          value={item.companyPrices?.[1] ?? item.unitPrice}
                          onChange={(e) =>
                            handleUpdateCompanyPrice(item.id, 1, parseFloat(e.target.value) || 0)
                          }
                          className="w-full text-center px-0.5 py-0.5 bg-transparent border-0 focus:ring-1 focus:ring-black rounded font-mono font-bold text-[10px]"
                        />
                      </td>
                      <td className="border border-black p-1 bg-menor-preco font-mono font-bold">
                        {formatMoeda(totalMenor)}
                      </td>

                      {/* Additional Companies columns */}
                      {Array.from({ length: totalEmpresas - 1 }).map((_, idx) => {
                        const compNum = idx + 2;
                        const cPrice = item.companyPrices?.[compNum] ?? 0;
                        const cTotal = qtd * cPrice;

                        return (
                          <React.Fragment key={compNum}>
                            <td className="border border-black p-1 font-mono">
                              <input
                                type="number"
                                step="0.01"
                                value={cPrice === 0 ? '' : cPrice}
                                placeholder="0,00"
                                onChange={(e) =>
                                  handleUpdateCompanyPrice(
                                    item.id,
                                    compNum,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-full text-center px-0.5 py-0.5 bg-transparent border-0 focus:ring-1 focus:ring-black rounded font-mono text-[10px]"
                              />
                            </td>
                            <td className="border border-black p-1 font-mono text-slate-700">
                              {cTotal > 0 ? formatMoeda(cTotal) : '-'}
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              {/* Row 1: Subtotais */}
              <tr className="font-bold bg-slate-50">
                <td className="no-print border border-black"></td>
                <td colSpan={3} rowSpan={3} className="border border-black p-2 text-left align-middle text-[11px]">
                  Subtotal / Totais
                </td>
                <td className="border border-black p-1 bg-menor-preco font-mono font-bold">
                  {formatMoeda(subtotalUnitarios)}
                </td>
                <td className="border border-black p-1 bg-menor-preco font-mono font-bold">
                  {formatMoeda(subtotalMenorPreco)}
                </td>
                {Array.from({ length: (totalEmpresas - 1) * 2 }).map((_, idx) => (
                  <td key={idx} className="border border-black p-1 bg-slate-50"></td>
                ))}
              </tr>

              {/* Row 2: Desconto Aplicado (Pink) */}
              <tr>
                <td className="no-print border border-black"></td>
                <td className="border border-black p-1 bg-desconto text-[9px] font-bold">
                  <input
                    type="text"
                    value={nf.labelDesconto || 'Desconto Aplicado'}
                    onChange={(e) => onUpdateNF({ ...nf, labelDesconto: e.target.value })}
                    className="w-full text-center bg-transparent border-0 focus:ring-1 focus:ring-red-500 rounded font-bold text-[9px]"
                  />
                </td>
                <td className="border border-black p-1 bg-desconto font-mono font-bold">
                  <div className="flex items-center justify-center">
                    <span className="text-[9px] mr-0.5">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={nf.descontoAplicado ?? 0}
                      onChange={(e) =>
                        onUpdateNF({ ...nf, descontoAplicado: parseFloat(e.target.value) || 0 })
                      }
                      className="w-16 text-center bg-transparent border-0 focus:ring-1 focus:ring-red-500 rounded font-mono font-bold text-[10px]"
                    />
                  </div>
                </td>
                {Array.from({ length: (totalEmpresas - 1) * 2 }).map((_, idx) => (
                  <td key={idx} className="border border-black p-1"></td>
                ))}
              </tr>

              {/* Row 3: Total Parcial */}
              <tr className="font-bold">
                <td className="no-print border border-black"></td>
                <td className="border border-black p-1 bg-desconto text-[9.5px]">
                  Total Parcial
                </td>
                <td className="border border-black p-1 bg-desconto font-mono font-black text-[11px]">
                  {formatMoeda(totalParcial)}
                </td>
                {Array.from({ length: (totalEmpresas - 1) * 2 }).map((_, idx) => (
                  <td key={idx} className="border border-black p-1"></td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Suppliers Footer Table */}
        <div className="mt-8 border-t border-black pt-4">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-[11px] font-bold uppercase text-slate-800">
              Identificação dos Fornecedores / Cotações
            </h5>
            <span className="no-print text-[10px] text-slate-500 italic">
              (Sincronizado com a aba Fornecedores e editável diretamente)
            </span>
          </div>
          <table className="w-full border-collapse text-[9.5px] border border-black font-sans">
            <thead>
              <tr className="bg-slate-100 font-bold text-slate-900">
                <th className="border border-black p-1.5 text-center w-24">NÚMERO</th>
                <th className="border border-black p-1.5 text-left w-2/5">EMPRESA / RAZÃO SOCIAL / CNPJ</th>
                <th className="border border-black p-1.5 text-left w-2/5">ENDEREÇO</th>
                <th className="border border-black p-1.5 text-center w-1/4">CONTATO</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: totalEmpresas }).map((_, idx) => {
                const compNum = idx + 1;
                const sup =
                  (nf.suppliers || []).find((s) => s.num === compNum) ||
                  (nf.suppliers || [])[idx] || {
                    id: `temp-${compNum}`,
                    num: compNum,
                    name: `Empresa ${compNum}`,
                    razaoSocial: `Empresa ${compNum}`,
                    cnpj: '',
                    endereco: '-',
                    contato: '-',
                  };

                return (
                  <tr key={sup.id || compNum}>
                    <td className="border border-black p-1.5 text-center font-bold bg-slate-50">
                      Empresa {compNum}
                    </td>
                    <td className="border border-black p-1.5 text-left">
                      <div className="space-y-0.5">
                        <input
                          type="text"
                          value={sup.name || ''}
                          onChange={(e) => handleUpdateSupplierDirect(compNum, 'name', e.target.value)}
                          placeholder={`Nome / Fantasia da Empresa ${compNum}...`}
                          className="w-full font-bold text-slate-900 bg-transparent border border-transparent hover:border-slate-300 focus:border-black focus:bg-white rounded text-[10px] px-1 py-0.5 print:border-0 print:p-0"
                          title="Nome da empresa (sincronizado com a aba Fornecedores)"
                        />
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={sup.razaoSocial || ''}
                            onChange={(e) => handleUpdateSupplierDirect(compNum, 'razaoSocial', e.target.value)}
                            placeholder="Razão Social (opcional)..."
                            className="flex-1 text-[8.5px] text-slate-700 bg-transparent border border-transparent hover:border-slate-300 focus:border-black focus:bg-white rounded px-1 py-0.5 print:border-0 print:p-0"
                            title="Razão Social"
                          />
                          <input
                            type="text"
                            value={sup.cnpj || ''}
                            onChange={(e) => handleUpdateSupplierDirect(compNum, 'cnpj', e.target.value)}
                            placeholder="CNPJ: 00.000.000/0000-00"
                            className="w-36 text-[8.5px] text-slate-600 font-mono bg-transparent border border-transparent hover:border-slate-300 focus:border-black focus:bg-white rounded px-1 py-0.5 print:border-0 print:p-0"
                            title="CNPJ"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="border border-black p-1.5 text-left">
                      <input
                        type="text"
                        value={sup.endereco || ''}
                        onChange={(e) => handleUpdateSupplierDirect(compNum, 'endereco', e.target.value)}
                        placeholder="Endereço, Bairro, Cidade - UF"
                        className="w-full text-[9px] text-slate-800 bg-transparent border border-transparent hover:border-slate-300 focus:border-black focus:bg-white rounded px-1 py-0.5 print:border-0 print:p-0"
                        title="Endereço da empresa"
                      />
                    </td>
                    <td className="border border-black p-1.5 text-center font-mono">
                      <input
                        type="text"
                        value={sup.contato || ''}
                        onChange={(e) => handleUpdateSupplierDirect(compNum, 'contato', e.target.value)}
                        placeholder="Telefone / Contato..."
                        className="w-full text-center font-mono text-[9px] text-slate-800 bg-transparent border border-transparent hover:border-slate-300 focus:border-black focus:bg-white rounded px-1 py-0.5 print:border-0 print:p-0"
                        title="Contato da empresa"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Official Signature Area */}
        <div className="mt-10 text-center font-sans">
          <input
            type="text"
            value={nf.cidadeData || 'SÃO PAULO, 27 DE AGOSTO DE 2026'}
            onChange={(e) => onUpdateNF({ ...nf, cidadeData: e.target.value })}
            className="text-center font-semibold text-[11px] uppercase tracking-wider bg-transparent border-0 focus:ring-1 focus:ring-black rounded mb-6 w-80 mx-auto block"
          />

          <div className="inline-block border-t border-black min-w-[320px] pt-1.5">
            <input
              type="text"
              value={nf.responsavelNome || 'ANDRÉ EMÍDIO FROES'}
              onChange={(e) => onUpdateNF({ ...nf, responsavelNome: e.target.value })}
              className="text-center font-bold text-xs uppercase tracking-wide bg-transparent border-0 focus:ring-1 focus:ring-black rounded w-full block"
            />
            <input
              type="text"
              value={nf.responsavelCargo || '1º Ten PM 3ª Cia/Ex'}
              onChange={(e) => onUpdateNF({ ...nf, responsavelCargo: e.target.value })}
              className="text-center text-[10.5px] text-slate-700 bg-transparent border-0 focus:ring-1 focus:ring-black rounded w-full block mt-0.5"
            />
          </div>
        </div>
      </div>

      {/* Modal Visualizador e Gerador de PDF */}
      <ModalVisualizadorPDF
        isOpen={modalPdfAberto}
        onClose={() => setModalPdfAberto(false)}
        targetElement={sheetRef.current}
        titulo={`Planilha de Composição de Preços • ${nf?.label || 'NF'}`}
        subtitulo="Documento oficial com comparativo das empresas cotadas e menor preço apurado"
        nomeArquivo={`Composicao_Precos_${(nf?.label || 'NF').replace(/\s+/g, '_')}.pdf`}
        orientacao="p"
      />
    </div>
  );
};
