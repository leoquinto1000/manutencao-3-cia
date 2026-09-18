import React, { useState, useMemo, useEffect } from 'react';
import { MaterialUsado, NFInstance, Ferramenta, ItemListaCompras, UserRole, PermissoesAcesso, NivelAcessoDef } from '../../types';
import { EstoqueMateriaisTab } from './EstoqueMateriaisTab';
import { ControleSaidasTab } from './ControleSaidasTab';
import { ControleFerramentasTab } from './ControleFerramentasTab';
import { ListaComprasTab } from './ListaComprasTab';
import { DADOS_INICIAIS_FERRAMENTAS, DADOS_INICIAIS_LISTA_COMPRAS } from '../../utils';
import { obterPermissoesRole } from '../../utils/permissoes';
import {
  Package,
  Boxes,
  ClipboardList,
  Wrench,
  ShoppingCart,
} from 'lucide-react';

interface MateriaisUsadosViewProps {
  materiais: MaterialUsado[];
  onChangeMateriais: (materiais: MaterialUsado[]) => void;
  nfs: NFInstance[];
  usuarioRole?: UserRole;
  permissoes?: PermissoesAcesso;
  niveisAcesso?: NivelAcessoDef[];
}

export const MateriaisUsadosView: React.FC<MateriaisUsadosViewProps> = ({
  materiais,
  onChangeMateriais,
  nfs,
  usuarioRole,
  permissoes,
  niveisAcesso,
}) => {
  const perms = useMemo(() => {
    return permissoes || obterPermissoesRole(usuarioRole, niveisAcesso);
  }, [permissoes, usuarioRole, niveisAcesso]);

  const canVerEstoque = perms.materiaisEstoque;
  const canVerSaidas = perms.materiaisSaidas;
  const canVerFerramentas = perms.materiaisFerramentas;
  const canVerCompras = perms.materiaisCompras;

  const [subAbaAtiva, setSubAbaAtiva] = useState<'estoque' | 'saidas' | 'ferramentas' | 'compras'>(() => {
    if (canVerEstoque) return 'estoque';
    if (canVerSaidas) return 'saidas';
    if (canVerFerramentas) return 'ferramentas';
    if (canVerCompras) return 'compras';
    return 'estoque';
  });
  const [materialPreSelecionado, setMaterialPreSelecionado] = useState<{
    nome: string;
    unidade: string;
  } | null>(null);

  // Garante que se o perfil não tiver acesso à sub-aba ativa, redireciona para a primeira permitida
  useEffect(() => {
    const permitidas: ('estoque' | 'saidas' | 'ferramentas' | 'compras')[] = [];
    if (canVerEstoque) permitidas.push('estoque');
    if (canVerSaidas) permitidas.push('saidas');
    if (canVerFerramentas) permitidas.push('ferramentas');
    if (canVerCompras) permitidas.push('compras');

    if (permitidas.length > 0 && !permitidas.includes(subAbaAtiva)) {
      setSubAbaAtiva(permitidas[0]);
    }
  }, [canVerEstoque, canVerSaidas, canVerFerramentas, canVerCompras, subAbaAtiva]);

  // Estado das Ferramentas da Cia com persistência local
  const [ferramentas, setFerramentas] = useState<Ferramenta[]>(() => {
    try {
      const saved = localStorage.getItem('pmesp_ferramentas');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DADOS_INICIAIS_FERRAMENTAS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('pmesp_ferramentas', JSON.stringify(ferramentas));
    } catch (e) {
      console.error(e);
    }
  }, [ferramentas]);

  // Estado da Lista de Compras / Necessidades com persistência local
  const [itensCompras, setItensCompras] = useState<ItemListaCompras[]>(() => {
    try {
      const saved = localStorage.getItem('pmesp_lista_compras');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DADOS_INICIAIS_LISTA_COMPRAS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('pmesp_lista_compras', JSON.stringify(itensCompras));
    } catch (e) {
      console.error(e);
    }
  }, [itensCompras]);

  // Contagem para badges do menu
  const contagens = useMemo(() => {
    // Itens únicos das NFs
    const itensMap = new Set<string>();
    nfs.forEach((nf) => {
      nf.items.forEach((it) => {
        const chave = it.desc.trim().toLowerCase();
        if (chave) itensMap.add(chave);
      });
    });

    // Ferramentas cauteladas
    const cauteladas = ferramentas.filter((f) => f.situacao === 'Cautelada').length;

    // Compras pendentes
    const comprasPendentes = itensCompras.filter((it) => it.status !== 'Comprado').length;

    return {
      estoque: itensMap.size,
      saidas: materiais.length,
      ferramentas: ferramentas.length,
      ferramentasCauteladas: cauteladas,
      compras: comprasPendentes,
    };
  }, [nfs, materiais, ferramentas, itensCompras]);

  const handleLancarSaida = (materialNome: string, unidade: string) => {
    setMaterialPreSelecionado({ nome: materialNome, unidade });
    setSubAbaAtiva('saidas');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-start gap-5">
        {/* Menu Lateral Esquerdo */}
        <aside className="no-print w-full md:w-64 lg:w-72 shrink-0 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-md bg-[#1a2b4c] text-[#c9a84e] flex items-center justify-center font-bold">
                <Boxes size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1a2b4c]">
                  Controle de Materiais
                </h3>
                <p className="text-[11px] text-slate-500">
                  Almoxarifado & Equipamentos
                </p>
              </div>
            </div>

            {/* Menu de Navegação Vertical */}
            <nav className="mt-3 space-y-1.5" aria-label="Menu Controle de Materiais">
              {/* 1. Materiais em Estoque */}
              {canVerEstoque && (
                <button
                  type="button"
                  onClick={() => setSubAbaAtiva('estoque')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition text-left cursor-pointer ${
                    subAbaAtiva === 'estoque'
                      ? 'bg-[#1a2b4c] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Package
                      size={16}
                      className={subAbaAtiva === 'estoque' ? 'text-[#c9a84e]' : 'text-slate-400'}
                    />
                    <div>
                      <div className="font-bold">Materiais em Estoque</div>
                      <div
                        className={`text-[10px] font-normal ${
                          subAbaAtiva === 'estoque' ? 'text-slate-200' : 'text-slate-400'
                        }`}
                      >
                        Entradas das NFs & Saldos
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      subAbaAtiva === 'estoque'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {contagens.estoque}
                  </span>
                </button>
              )}

              {/* 2. Controle de Saída */}
              {canVerSaidas && (
                <button
                  type="button"
                  onClick={() => setSubAbaAtiva('saidas')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition text-left cursor-pointer ${
                    subAbaAtiva === 'saidas'
                      ? 'bg-[#1a2b4c] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ClipboardList
                      size={16}
                      className={subAbaAtiva === 'saidas' ? 'text-[#c9a84e]' : 'text-slate-400'}
                    />
                    <div>
                      <div className="font-bold">Controle de Saída</div>
                      <div
                        className={`text-[10px] font-normal ${
                          subAbaAtiva === 'saidas' ? 'text-slate-200' : 'text-slate-400'
                        }`}
                      >
                        Saída & Aplicação Diária
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      subAbaAtiva === 'saidas'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {contagens.saidas}
                  </span>
                </button>
              )}

              {/* 3. Controle de Ferramentas (logo abaixo do Controle de Saída) */}
              {canVerFerramentas && (
                <button
                  type="button"
                  onClick={() => setSubAbaAtiva('ferramentas')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition text-left cursor-pointer ${
                    subAbaAtiva === 'ferramentas'
                      ? 'bg-[#1a2b4c] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Wrench
                      size={16}
                      className={subAbaAtiva === 'ferramentas' ? 'text-[#c9a84e]' : 'text-slate-400'}
                    />
                    <div>
                      <div className="font-bold">Controle de Ferramentas</div>
                      <div
                        className={`text-[10px] font-normal ${
                          subAbaAtiva === 'ferramentas' ? 'text-slate-200' : 'text-slate-400'
                        }`}
                      >
                        Cautelas & Equipamentos
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      subAbaAtiva === 'ferramentas'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                    title={`${contagens.ferramentas} ferramentas (${contagens.ferramentasCauteladas} cauteladas)`}
                  >
                    {contagens.ferramentas}
                  </span>
                </button>
              )}

              {/* 4. Lista de Compras */}
              {canVerCompras && (
                <button
                  type="button"
                  onClick={() => setSubAbaAtiva('compras')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition text-left cursor-pointer ${
                    subAbaAtiva === 'compras'
                      ? 'bg-[#1a2b4c] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingCart
                      size={16}
                      className={subAbaAtiva === 'compras' ? 'text-[#c9a84e]' : 'text-slate-400'}
                    />
                    <div>
                      <div className="font-bold">Lista de Compras</div>
                      <div
                        className={`text-[10px] font-normal ${
                          subAbaAtiva === 'compras' ? 'text-slate-200' : 'text-slate-400'
                        }`}
                      >
                        Necessidades & Planejamento
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      subAbaAtiva === 'compras'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {contagens.compras}
                  </span>
                </button>
              )}
            </nav>
          </div>
        </aside>

        {/* Conteúdo Principal à Direita */}
        <div className="flex-1 min-w-0 w-full">
          {subAbaAtiva === 'estoque' && (
            <EstoqueMateriaisTab
              nfs={nfs}
              materiaisUsados={materiais}
              onLancarSaida={handleLancarSaida}
            />
          )}

          {subAbaAtiva === 'saidas' && (
            <ControleSaidasTab
              materiais={materiais}
              onChangeMateriais={onChangeMateriais}
              nfs={nfs}
              materialPreSelecionado={materialPreSelecionado}
              onLimparPreSelecao={() => setMaterialPreSelecionado(null)}
            />
          )}

          {subAbaAtiva === 'ferramentas' && (
            <ControleFerramentasTab
              ferramentas={ferramentas}
              onChangeFerramentas={setFerramentas}
            />
          )}

          {canVerCompras && subAbaAtiva === 'compras' && (
            <ListaComprasTab
              itensCompras={itensCompras}
              onChangeItensCompras={setItensCompras}
            />
          )}
        </div>
      </div>
    </div>
  );
};
