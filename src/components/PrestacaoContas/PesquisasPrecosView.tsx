import React, { useRef, useState } from 'react';
import { PesquisaPrecoItem, NFInstance } from '../../types';
import { formatMoeda, parseMoeda, gerarId } from '../../utils';
import { RefreshCw, Plus, Trash2, Upload, Image as ImageIcon, Check, Printer, Link, ExternalLink, Eye, FileText, Download, Building2 } from 'lucide-react';
import { ModalVisualizadorPDF } from './ModalVisualizadorPDF';
import { imprimirEmNovaJanela } from '../../utils/pdfPrintHelper';

interface PesquisasPrecosViewProps {
  pesquisas: PesquisaPrecoItem[];
  onChangePesquisas: (pesquisas: PesquisaPrecoItem[]) => void;
  nfs: NFInstance[];
  onChangeNFs?: (nfs: NFInstance[]) => void;
}

export const PesquisasPrecosView: React.FC<PesquisasPrecosViewProps> = ({
  pesquisas,
  onChangePesquisas,
  nfs,
  onChangeNFs,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [modalPdfAberto, setModalPdfAberto] = useState<boolean>(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // Sync / generate 3 price research sheets per item across all NFs
  const handleSincronizar = () => {
    const novasPesquisas: PesquisaPrecoItem[] = [];

    let itemGeralIndex = 1;
    nfs.forEach((nf) => {
      nf.items.forEach((item) => {
        // Generate 3 sheets per item (one for each supplier)
        for (let pIdx = 1; pIdx <= 3; pIdx++) {
          // Check if we already had an image for this material and index
          const existing = pesquisas.find(
            (p) => p.materialDesc === item.desc && p.pesquisaIndice === pIdx
          );

          const sup = nf.suppliers?.[pIdx - 1];
          const empNome = sup ? `${sup.name}` : `Empresa ${pIdx}`;
          const unitPrice =
            item.companyPrices?.[pIdx] ||
            (pIdx === 1 ? item.unitPrice : item.unitPrice * (1 + pIdx * 0.05));

          novasPesquisas.push({
            id: existing ? existing.id : gerarId(),
            nfId: nf.id,
            materialId: item.id,
            materialDesc: item.desc,
            unid: item.unid,
            qtd: item.qtd,
            numeroItem: itemGeralIndex,
            pesquisaIndice: pIdx,
            empresaNum: pIdx,
            empresaNome: existing ? existing.empresaNome : empNome,
            cnpj: existing?.cnpj || sup?.cnpj || '',
            supplierId: existing?.supplierId || sup?.id,
            dataCotacao: existing ? existing.dataCotacao : '27/08/2026',
            contato: existing ? existing.contato : sup?.contato || '-',
            precoUnitario: existing ? existing.precoUnitario : unitPrice,
            precoTotal: existing ? existing.precoTotal : item.qtd * unitPrice,
            imagemComprovante: existing?.imagemComprovante,
            linkOuObservacao: existing?.linkOuObservacao || '',
          });
        }
        itemGeralIndex++;
      });
    });

    onChangePesquisas(novasPesquisas);
    setMensagemSucesso(`✅ ${novasPesquisas.length} folhas A4 de pesquisa sincronizadas com sucesso!`);
    setTimeout(() => setMensagemSucesso(null), 4000);
  };

  // Relacionar a cotação a uma das empresas cadastradas no catálogo
  const handleRelacionarFornecedor = (
    pesquisaId: string,
    supplier: { id: string; num: number; name: string; contato: string; cnpj?: string }
  ) => {
    const targetPesquisa = pesquisas.find((p) => p.id === pesquisaId);
    if (!targetPesquisa) return;

    const updatedPesquisas = pesquisas.map((p) => {
      if (p.id !== pesquisaId) return p;
      return {
        ...p,
        supplierId: supplier.id,
        empresaNum: supplier.num,
        empresaNome: supplier.name,
        cnpj: supplier.cnpj || p.cnpj || '',
        contato: supplier.contato && supplier.contato !== '-' ? supplier.contato : p.contato,
      };
    });

    onChangePesquisas(updatedPesquisas);

    // Sincroniza imediatamente com a Planilha de Composição (NFs)
    if (onChangeNFs && nfs && nfs.length > 0) {
      const targetNfId = targetPesquisa.nfId;
      const targetMatId = targetPesquisa.materialId;
      const targetMatDesc = targetPesquisa.materialDesc?.trim().toLowerCase();

      const updatedNFs = nfs.map((nf) => {
        if (targetNfId && nf.id !== targetNfId) return nf;

        const newTotal = Math.max(nf.totalEmpresas || 3, supplier.num);

        const updatedItems = nf.items.map((it) => {
          const isMatch =
            (targetMatId && it.id === targetMatId) ||
            (targetMatDesc && it.desc?.trim().toLowerCase() === targetMatDesc);

          if (!isMatch) return it;

          const prices = { ...(it.companyPrices || {}) };
          if (targetPesquisa.precoUnitario > 0) {
            prices[supplier.num] = targetPesquisa.precoUnitario;
          }

          const validPrices = Object.values(prices).filter(
            (pr): pr is number => typeof pr === 'number' && pr > 0
          );
          const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : it.unitPrice;

          return {
            ...it,
            companyPrices: prices,
            unitPrice: minPrice,
          };
        });

        let updatedSuppliers = nf.suppliers ? [...nf.suppliers] : [];
        const supIdx = supplier.num - 1;
        if (updatedSuppliers[supIdx]) {
          updatedSuppliers[supIdx] = {
            ...updatedSuppliers[supIdx],
            name: supplier.name,
            contato: supplier.contato || updatedSuppliers[supIdx].contato,
          };
        }

        return {
          ...nf,
          totalEmpresas: newTotal,
          items: updatedItems,
          suppliers: updatedSuppliers,
        };
      });

      onChangeNFs(updatedNFs);
    }
  };

  const handleUpdate = (id: string, field: keyof PesquisaPrecoItem, val: any) => {
    const targetPesquisa = pesquisas.find((p) => p.id === id);

    const updatedPesquisas = pesquisas.map((p) => {
      if (p.id !== id) return p;
      const updated = { ...p, [field]: val };
      if (field === 'precoUnitario' || field === 'qtd') {
        const u = typeof updated.precoUnitario === 'number' ? updated.precoUnitario : (parseFloat(updated.precoUnitario) || 0);
        const q = typeof updated.qtd === 'number' ? updated.qtd : (parseFloat(updated.qtd) || 0);
        updated.precoTotal = q * u;
      }
      return updated;
    });

    onChangePesquisas(updatedPesquisas);

    // Sincroniza imediatamente com a Planilha de Composição (NFs)
    if (onChangeNFs && nfs && nfs.length > 0 && targetPesquisa) {
      const compNum = targetPesquisa.empresaNum || targetPesquisa.pesquisaIndice || 1;
      const targetNfId = targetPesquisa.nfId;
      const targetMatId = targetPesquisa.materialId;
      const targetMatDesc = targetPesquisa.materialDesc?.trim().toLowerCase();

      const updatedNFs = nfs.map((nf) => {
        // Verifica se esta NF contém o item alvo
        const containsItem = nf.items.some(
          (it) =>
            (targetMatId && it.id === targetMatId) ||
            (targetMatDesc && it.desc?.trim().toLowerCase() === targetMatDesc)
        );

        if (targetNfId && nf.id !== targetNfId && !containsItem) {
          return nf;
        }

        let hasUpdatedItem = false;
        const updatedItems = nf.items.map((it) => {
          const isMatch =
            (targetMatId && it.id === targetMatId) ||
            (targetMatDesc && it.desc?.trim().toLowerCase() === targetMatDesc);

          if (!isMatch) return it;
          hasUpdatedItem = true;

          const updatedItem = { ...it };

          if (field === 'precoUnitario') {
            const numPrice = typeof val === 'number' ? val : (parseFloat(val) || 0);
            const prices = { ...(it.companyPrices || {}) };
            prices[compNum] = numPrice;

            // Recalcula o menor preço unitário válido entre as empresas cotadas
            const validPrices = Object.values(prices).filter(
              (p): p is number => typeof p === 'number' && p > 0
            );
            const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : numPrice;

            updatedItem.companyPrices = prices;
            updatedItem.unitPrice = minPrice;
          } else if (field === 'qtd') {
            updatedItem.qtd = typeof val === 'number' ? val : (parseFloat(val) || 0);
          } else if (field === 'unid') {
            updatedItem.unid = String(val);
          } else if (field === 'materialDesc') {
            updatedItem.desc = String(val);
          }

          return updatedItem;
        });

        // Sincroniza também o fornecedor se alterado
        let updatedSuppliers = nf.suppliers ? [...nf.suppliers] : [];
        const existingSupIdx = updatedSuppliers.findIndex((s) => s.num === compNum);
        
        if (hasUpdatedItem && (field === 'empresaNome' || field === 'cnpj' || field === 'contato')) {
          if (existingSupIdx >= 0) {
            updatedSuppliers[existingSupIdx] = {
              ...updatedSuppliers[existingSupIdx],
              ...(field === 'empresaNome' ? { name: String(val) } : {}),
              ...(field === 'cnpj' ? { cnpj: String(val) } : {}),
              ...(field === 'contato' ? { contato: String(val) } : {}),
            };
          } else {
            updatedSuppliers.push({
              id: String(Date.now() + Math.random()),
              num: compNum,
              name: field === 'empresaNome' ? String(val) : `Empresa ${compNum}`,
              razaoSocial: field === 'empresaNome' ? String(val) : `Empresa ${compNum}`,
              cnpj: field === 'cnpj' ? String(val) : '',
              endereco: '-',
              contato: field === 'contato' ? String(val) : '-',
            });
            // Ordena pelos números
            updatedSuppliers.sort((a, b) => a.num - b.num);
          }
        }

        return {
          ...nf,
          items: updatedItems,
          suppliers: updatedSuppliers,
        };
      });

      onChangeNFs(updatedNFs);
    }
  };

  const handleRemove = (id: string) => {
    onChangePesquisas(pesquisas.filter((p) => p.id !== id));
  };

  const handleImageUpload = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      handleUpdate(id, 'imagemComprovante', e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePasteImage = (id: string, e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          handleImageUpload(id, blob);
        }
        break;
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="no-print bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 max-w-[794px] mx-auto">
        <div>
          <h2 className="text-sm font-bold text-[#1a2b4c]">Pesquisas de Preços & Cotações</h2>
          <p className="text-xs text-slate-500">
            Folhas individuais A4 com comprovante de cotação / orçamentos por item.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSincronizar}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-md transition shadow-sm"
            title="Sincronizar itens e gerar 3 folhas por material"
          >
            <RefreshCw size={14} />
            <span>Sincronizar Folhas</span>
          </button>
          
          <button
            onClick={() => setModalPdfAberto(true)}
            disabled={pesquisas.length === 0}
            className="flex items-center gap-1.5 bg-[#c9a84e] hover:bg-[#b8973f] disabled:opacity-50 text-[#1a2b4c] text-xs font-bold px-3 py-2 rounded-md transition shadow-sm cursor-pointer"
            title="Abrir pré-visualização completa e gerar arquivo PDF oficial"
          >
            <FileText size={14} />
            <span>Visualizar & Gerar PDF</span>
          </button>

          <button
            onClick={() => {
              if (containerRef.current) {
                imprimirEmNovaJanela(containerRef.current, 'Pesquisas de Preços - PMESP');
              } else {
                window.print();
              }
            }}
            disabled={pesquisas.length === 0}
            className="flex items-center gap-1.5 bg-[#1a2b4c] hover:bg-[#2c4373] disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded-md transition shadow-sm"
            title="Imprimir diretamente em nova janela (sem bloqueios)"
          >
            <Printer size={14} />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {mensagemSucesso && (
        <div className="no-print bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold px-4 py-2.5 rounded-lg max-w-[794px] mx-auto flex items-center justify-between shadow-2xs">
          <span>{mensagemSucesso}</span>
          <button onClick={() => setMensagemSucesso(null)} className="text-emerald-600 hover:text-emerald-900 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Pages Container */}
      <div ref={containerRef} className="main-print-container space-y-6">
      {pesquisas.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg border border-slate-300 max-w-[794px] mx-auto text-slate-500">
          <ImageIcon className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-sm font-semibold text-slate-700 mb-1">
            Nenhuma pesquisa de preço gerada ainda.
          </p>
          <p className="text-xs text-slate-500 mb-4">
            Clique no botão acima para criar automaticamente 3 folhas A4 em branco com os dados dos materiais lançados nas planilhas.
          </p>
          <button
            onClick={handleSincronizar}
            className="bg-[#1a2b4c] hover:bg-[#2c4373] text-white text-xs font-semibold px-4 py-2 rounded-md transition"
          >
            Gerar Folhas de Pesquisa
          </button>
        </div>
      ) : (
        pesquisas.map((item, idx) => {
          const nfDaPesquisa = nfs.find((n) => n.id === item.nfId) || nfs[0];
          const empresasCadastradas = nfDaPesquisa?.suppliers || [];
          const matchedSup = empresasCadastradas.find(
            (s) =>
              s.id === item.supplierId ||
              s.num === item.empresaNum ||
              (s.name && s.name.trim().toLowerCase() === item.empresaNome.trim().toLowerCase())
          );

          return (
          <div key={item.id} className="relative group max-w-[794px] mx-auto">
            {/* Delete button (no-print) */}
            <button
              onClick={() => handleRemove(item.id)}
              className="no-print absolute top-2 right-2 z-10 bg-red-600 hover:bg-red-700 text-white text-xs p-1.5 rounded shadow opacity-80 group-hover:opacity-100 transition"
              title="Excluir esta folha de pesquisa"
            >
              <Trash2 size={14} />
            </button>

            {/* A4 Sheet Container */}
            <div className="pesquisa-page bg-white overflow-hidden">
              {/* Header Table */}
              <table className="w-full table-fixed border-collapse border-b-2 border-black font-sans text-xs">
                <colgroup>
                  <col style={{ width: '105px' }} />
                  <col style={{ width: '325px' }} />
                  <col style={{ width: '130px' }} />
                  <col style={{ width: '234px' }} />
                </colgroup>
                <tbody>
                  <tr className="border-b-2 border-black">
                    <td className="p-2 border-r-2 border-black font-bold text-center bg-slate-50 truncate">
                      ITEM {String(item.numeroItem).padStart(2, '0')}
                    </td>
                    <td className="p-2 font-bold text-center uppercase tracking-wide bg-slate-50 truncate" colSpan={3}>
                      PESQUISA DE PREÇO • COTAÇÃO Nº {item.pesquisaIndice}
                    </td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="p-2 border-r border-black font-bold bg-slate-50 text-[11px] truncate">
                      MATERIAL:
                    </td>
                    <td className="p-1.5 border-r border-black font-medium text-[11px]" colSpan={2}>
                      <input
                        type="text"
                        value={item.materialDesc}
                        onChange={(e) => handleUpdate(item.id, 'materialDesc', e.target.value)}
                        className="w-full font-bold bg-transparent border-0 focus:ring-1 focus:ring-black rounded truncate"
                        title="Descrição do material cotado"
                      />
                    </td>
                    <td className="p-1.5 text-center font-semibold">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-[11px] font-bold text-slate-700">QTD:</span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={item.qtd}
                          onChange={(e) =>
                            handleUpdate(item.id, 'qtd', parseFloat(e.target.value) || 0)
                          }
                          className="w-14 text-center font-bold text-xs bg-transparent border border-transparent hover:border-slate-300 focus:border-black focus:bg-white rounded px-1 py-0.5 print:border-0"
                          title="Quantidade cotada"
                        />
                        <input
                          type="text"
                          value={item.unid}
                          onChange={(e) => handleUpdate(item.id, 'unid', e.target.value)}
                          className="w-12 text-center font-mono uppercase text-xs bg-transparent border border-transparent hover:border-slate-300 focus:border-black focus:bg-white rounded px-0.5 py-0.5 print:border-0"
                          title="Unidade de fornecimento"
                        />
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="p-2 border-r border-black font-bold bg-slate-50 text-[11px] truncate">
                      FORNECEDOR:
                    </td>
                    <td className="p-1.5 border-r border-black">
                      <div className="flex items-center gap-1.5 w-full">
                        <input
                          type="text"
                          value={item.empresaNome}
                          onChange={(e) => handleUpdate(item.id, 'empresaNome', e.target.value)}
                          placeholder="Nome do fornecedor / empresa..."
                          className="flex-1 min-w-0 font-bold bg-transparent border border-transparent hover:border-slate-300 focus:border-black focus:bg-white rounded text-[11px] px-1 py-0.5 truncate"
                          title="Nome do fornecedor / empresa"
                        />
                        {empresasCadastradas.length > 0 && (
                          <div className="no-print shrink-0">
                            <select
                              value={matchedSup ? matchedSup.id : ''}
                              onChange={(e) => {
                                const chosenId = e.target.value;
                                if (!chosenId) return;
                                const sup = empresasCadastradas.find((s) => s.id === chosenId);
                                if (sup) {
                                  handleRelacionarFornecedor(item.id, sup);
                                }
                              }}
                              className="text-[10px] max-w-[135px] bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded px-1.5 py-0.5 cursor-pointer transition shadow-2xs truncate"
                              title="Relacionar esta cotação a uma das empresas cadastradas no catálogo"
                            >
                              <option value="">🏢 Vincular...</option>
                              {empresasCadastradas.map((s) => (
                                <option key={s.id} value={s.id}>
                                  Emp. {s.num}: {s.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-1.5 border-r border-black text-center text-[10.5px]">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-semibold text-slate-700">DATA:</span>
                        <input
                          type="text"
                          value={item.dataCotacao}
                          onChange={(e) => handleUpdate(item.id, 'dataCotacao', e.target.value)}
                          className="w-20 text-center font-medium bg-transparent border-0 focus:ring-1 focus:ring-black rounded text-[10.5px]"
                        />
                      </div>
                    </td>
                    <td className="p-1.5 text-center text-xs font-mono font-bold bg-slate-50">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-bold text-[10px] text-slate-700 whitespace-nowrap">
                          VALOR UNIT.:
                        </span>
                        <span className="text-slate-500 font-mono text-xs">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.precoUnitario === 0 ? '' : item.precoUnitario}
                          onChange={(e) =>
                            handleUpdate(item.id, 'precoUnitario', parseFloat(e.target.value) || 0)
                          }
                          className="w-20 text-center font-mono font-bold text-xs bg-white border border-slate-300 hover:border-slate-400 focus:border-[#1a2b4c] focus:ring-1 focus:ring-[#1a2b4c] rounded px-1 py-0.5 shadow-xs transition print:border-0 print:bg-transparent print:shadow-none print:p-0 print:w-auto"
                          placeholder="0,00"
                          title="Clique para editar o valor unitário da pesquisa de preços"
                        />
                      </div>
                    </td>
                  </tr>

                  {/* Linha: Link ou Observação da Cotação */}
                  <tr className="border-b-2 border-black bg-slate-50/40">
                    <td className="p-2 border-r border-black font-bold bg-slate-50 text-[10px] truncate">
                      <div className="flex items-center gap-1 text-[#1a2b4c]">
                        <Link size={11} className="shrink-0 text-slate-600" />
                        <span className="whitespace-nowrap">LINK / OBS:</span>
                      </div>
                    </td>
                    <td className="p-1.5 border-r border-black" colSpan={2}>
                      <div className="flex items-center gap-1.5 w-full">
                        <input
                          type="text"
                          value={item.linkOuObservacao || ''}
                          onChange={(e) => handleUpdate(item.id, 'linkOuObservacao', e.target.value)}
                          placeholder="Cole aqui o link (URL) ou observação do local onde a cotação foi realizada..."
                          className="flex-1 min-w-0 text-[10.5px] text-slate-800 bg-white border border-slate-300 hover:border-slate-400 focus:border-[#1a2b4c] focus:ring-1 focus:ring-[#1a2b4c] rounded px-2 py-0.5 transition shadow-2xs print:border-0 print:bg-transparent print:p-0 print:shadow-none truncate"
                        />
                        {item.linkOuObservacao && (item.linkOuObservacao.startsWith('http://') || item.linkOuObservacao.startsWith('https://') || item.linkOuObservacao.startsWith('www.')) && (
                          <a
                            href={item.linkOuObservacao.startsWith('www.') ? `https://${item.linkOuObservacao}` : item.linkOuObservacao}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="no-print inline-flex items-center gap-1 text-[9.5px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded shrink-0 transition"
                            title="Abrir o link da cotação no navegador"
                          >
                            <ExternalLink size={10} />
                            <span>Abrir</span>
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="p-1.5 text-center text-xs font-mono font-bold bg-slate-50/80">
                      <div className="flex items-center justify-center gap-1 text-[10.5px]">
                        <span className="font-bold text-slate-600 whitespace-nowrap">
                          TOTAL:
                        </span>
                        <span className="text-slate-900 font-mono font-bold">
                          R$ {((Number(item.precoUnitario) || 0) * (Number(item.qtd) || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Comprovante / Print Body Area - Proporção exata para Folha A4 */}
              <div
                onPaste={(e) => handlePasteImage(item.id, e)}
                tabIndex={0}
                className="flex-1 min-h-0 relative flex items-center justify-center bg-slate-50 hover:bg-slate-100/70 transition p-2 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-400 overflow-hidden"
              >
                {item.imagemComprovante ? (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <img
                      src={item.imagemComprovante}
                      alt="Comprovante de Cotação"
                      className="max-h-[680px] print:max-h-[190mm] max-w-full object-contain mx-auto shadow-sm border border-slate-200"
                    />
                    <div className="no-print mt-1.5 flex items-center gap-2">
                      <button
                        onClick={() => handleUpdate(item.id, 'imagemComprovante', '')}
                        className="bg-red-500 hover:bg-red-600 text-white text-[11px] px-2.5 py-0.5 rounded shadow"
                      >
                        Remover Imagem
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4 text-slate-400 select-none">
                    <ImageIcon className="mx-auto mb-2 text-slate-300" size={48} />
                    <p className="text-sm font-bold text-slate-600">
                      Cole aqui o Print da Cotação (Ctrl+V)
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      (Site da loja, tela do carrinho, orçamento em PDF ou WhatsApp)
                    </p>

                    <div className="no-print mt-3 inline-block">
                      <label className="flex items-center gap-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded cursor-pointer transition">
                        <Upload size={13} />
                        <span>Carregar Arquivo de Imagem</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleImageUpload(item.id, e.target.files[0]);
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Table */}
              <table className="w-full table-fixed border-collapse border-t-2 border-black font-sans text-xs">
                <tbody>
                  <tr>
                    <td className="p-2 text-left border-r-2 border-black bg-slate-50 w-[35%] align-top">
                      <span className="font-bold text-[10px] uppercase block text-slate-600">
                        CNPJ DO FORNECEDOR:
                      </span>
                      <input
                        type="text"
                        value={item.cnpj !== undefined ? item.cnpj : (matchedSup?.cnpj || '')}
                        onChange={(e) => handleUpdate(item.id, 'cnpj', e.target.value)}
                        placeholder="00.000.000/0000-00"
                        className="w-full font-mono font-semibold text-[11px] text-slate-900 bg-transparent border-0 focus:ring-1 focus:ring-black rounded mt-0.5 truncate"
                        title="CNPJ do Fornecedor / Empresa Cotada"
                      />
                    </td>
                    <td className="p-2 text-left bg-slate-50 w-[65%] align-top">
                      <span className="font-bold text-[10px] uppercase block text-slate-600">
                        INFORMAÇÕES DE CONTATO DO FORNECEDOR:
                      </span>
                      <input
                        type="text"
                        value={item.contato}
                        onChange={(e) => handleUpdate(item.id, 'contato', e.target.value)}
                        placeholder="Telefone, WhatsApp, e-mail ou endereço..."
                        className="w-full font-mono text-[11px] text-slate-800 bg-transparent border-0 focus:ring-1 focus:ring-black rounded mt-0.5 truncate"
                        title="Telefone, e-mail ou contato do fornecedor"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          );
        })
      )}
      </div>

      {/* Modal Visualizador e Gerador de PDF */}
      <ModalVisualizadorPDF
        isOpen={modalPdfAberto}
        onClose={() => setModalPdfAberto(false)}
        targetElement={containerRef.current}
        titulo="Pesquisas de Preços & Cotações • PMESP"
        subtitulo="Documento oficial das folhas individuais de pesquisa e comprovação de preços"
        nomeArquivo={`Pesquisas_Precos_${new Date().toISOString().slice(0, 10)}.pdf`}
        orientacao="p"
      />
    </div>
  );
};
