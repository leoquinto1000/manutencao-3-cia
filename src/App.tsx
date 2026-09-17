/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  NFInstance,
  PesquisaPrecoItem,
  BalanceteState,
  TextoParteState,
  MaterialUsado,
  InformeMensal,
  ProjetoSalvo,
  MissaoDiaria,
  EquipeManutencao,
  MembroEquipe,
  EmpresaCadastrada,
} from './types';
import {
  DADOS_INICIAIS_NF1,
  DADOS_INICIAIS_BALANCETE,
  DADOS_INICIAIS_TEXTOPARTE,
  DADOS_INICIAIS_MATERIAIS_USADOS,
  DADOS_INICIAIS_INFORME,
  DADOS_INICIAIS_MISSOES,
  MISSOES_OFICIAIS_HISTORICAS,
  DADOS_INICIAIS_EQUIPES,
  DADOS_INICIAIS_MEMBROS,
  DADOS_INICIAIS_BANCO_FORNECEDORES,
  gerarId,
} from './utils';
import {
  carregarDadosFirestore,
  salvarDadosFirestore,
  escutarDadosFirestore,
  excluirInformeArquivadoFirestore,
  DadosSistemaFirestore,
} from './firebase';
import { salvarItemIndexedDB, carregarItemIndexedDB } from './utils/indexedDbStorage';
import { Header } from './components/Header';
import { PrestacaoContasView } from './components/PrestacaoContas/PrestacaoContasView';
import { MateriaisUsadosView } from './components/MateriaisUsados/MateriaisUsadosView';
import { InformeMensalView } from './components/InformeMensal/InformeMensalView';
import { CronogramaView } from './components/Cronograma/CronogramaView';

export default function App() {
  const [abaPrincipal, setAbaPrincipal] = useState<'prestacao' | 'materiais' | 'informe' | 'cronograma'>('prestacao');

  // Estado de Sincronização em Nuvem com o Firebase Firestore (manutencao-3-cia)
  const [statusFirebase, setStatusFirebase] = useState<'carregando' | 'conectado' | 'salvando' | 'erro-permissao' | 'offline'>('carregando');
  const [ultimaSincronizacao, setUltimaSincronizacao] = useState<string | null>(null);
  const isCarregadoInicialmente = useRef(false);
  const snapshotUltimoSalvo = useRef<string>('');

  // Load state from localStorage or use initial military templates
  const [nfs, setNfs] = useState<NFInstance[]>(() => {
    try {
      const saved = localStorage.getItem('pmesp_nfs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [DADOS_INICIAIS_NF1];
  });

  const [pesquisas, setPesquisas] = useState<PesquisaPrecoItem[]>(() => {
    try {
      const saved = localStorage.getItem('pmesp_pesquisas');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [balancete, setBalancete] = useState<BalanceteState>(() => {
    try {
      const saved = localStorage.getItem('pmesp_balancete');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...DADOS_INICIAIS_BALANCETE, ...parsed };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DADOS_INICIAIS_BALANCETE;
  });

  const [textoParte, setTextoParte] = useState<TextoParteState>(() => {
    try {
      const saved = localStorage.getItem('pmesp_textoparte');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...DADOS_INICIAIS_TEXTOPARTE, ...parsed };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DADOS_INICIAIS_TEXTOPARTE;
  });

  const [materiaisUsados, setMateriaisUsados] = useState<MaterialUsado[]>(() => {
    try {
      const saved = localStorage.getItem('pmesp_materiais_usados');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DADOS_INICIAIS_MATERIAIS_USADOS;
  });

  const [informeAtual, setInformeAtual] = useState<InformeMensal>(() => {
    try {
      const saved = localStorage.getItem('pmesp_informe_atual');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...DADOS_INICIAIS_INFORME, ...parsed };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DADOS_INICIAIS_INFORME;
  });

  const [informesArquivados, setInformesArquivados] = useState<InformeMensal[]>(() => {
    try {
      const saved = localStorage.getItem('pmesp_informes_arquivados');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [arquivosSalvos, setArquivosSalvos] = useState<ProjetoSalvo[]>(() => {
    try {
      const saved = localStorage.getItem('pmesp_projetos_arquivados');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Preserva integralmente as missões salvas sem resetar ao atualizar a versão
  const sincronizarMissoesHistoricas = (lista: MissaoDiaria[]): MissaoDiaria[] => {
    if (!Array.isArray(lista) || lista.length === 0) {
      return MISSOES_OFICIAIS_HISTORICAS;
    }
    return lista;
  };

  // Estado das Missões do Cronograma
  const [missoes, setMissoes] = useState<MissaoDiaria[]>(() => {
    try {
      const saved = localStorage.getItem('pmesp_missoes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return sincronizarMissoesHistoricas(parsed);
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DADOS_INICIAIS_MISSOES;
  });

  // Preserva o efetivo cadastrado ou modificado sem sobrescrever
  const sincronizarEfetivoOficial = (lista: MembroEquipe[]): MembroEquipe[] => {
    if (!Array.isArray(lista) || lista.length === 0) {
      return DADOS_INICIAIS_MEMBROS;
    }
    return lista;
  };

  // Preserva as equipes de manutenção cadastradas sem resetar
  const sincronizarEquipesOficiais = (lista: EquipeManutencao[]): EquipeManutencao[] => {
    if (!Array.isArray(lista) || lista.length === 0) return DADOS_INICIAIS_EQUIPES;
    return lista;
  };

  // Estado das Equipes de Manutenção
  const [equipes, setEquipes] = useState<EquipeManutencao[]>(() => {
    try {
      const saved = localStorage.getItem('pmesp_equipes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return sincronizarEquipesOficiais(parsed);
      }
    } catch (e) {
      console.error(e);
    }
    return DADOS_INICIAIS_EQUIPES;
  });

  // Estado dos Militares Cadastrados
  const [membros, setMembros] = useState<MembroEquipe[]>(() => {
    try {
      const saved = localStorage.getItem('pmesp_membros');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return sincronizarEfetivoOficial(parsed);
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DADOS_INICIAIS_MEMBROS;
  });

  // Banco Geral de Fornecedores Cadastrados
  const [bancoFornecedores, setBancoFornecedores] = useState<EmpresaCadastrada[]>(() => {
    try {
      const saved = localStorage.getItem('pmesp_banco_fornecedores');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DADOS_INICIAIS_BANCO_FORNECEDORES;
  });

  // LocalStorage synchronizations
  useEffect(() => {
    try {
      localStorage.setItem('pmesp_nfs', JSON.stringify(nfs));
    } catch (e) {}
  }, [nfs]);

  useEffect(() => {
    try {
      localStorage.setItem('pmesp_pesquisas', JSON.stringify(pesquisas));
    } catch (e) {}
  }, [pesquisas]);

  useEffect(() => {
    try {
      localStorage.setItem('pmesp_balancete', JSON.stringify(balancete));
    } catch (e) {}
  }, [balancete]);

  useEffect(() => {
    try {
      localStorage.setItem('pmesp_textoparte', JSON.stringify(textoParte));
    } catch (e) {}
  }, [textoParte]);

  useEffect(() => {
    try {
      localStorage.setItem('pmesp_materiais_usados', JSON.stringify(materiaisUsados));
    } catch (e) {}
  }, [materiaisUsados]);

  // Carregamento inicial de segurança via IndexedDB (garante fotos preservadas mesmo que localStorage estoure a cota de 5MB)
  useEffect(() => {
    let isAtivo = true;
    async function carregarCacheLocal() {
      try {
        const [missoesDB, informeDB, arquivadosDB, projetosDB] = await Promise.all([
          carregarItemIndexedDB<MissaoDiaria[]>('pmesp_missoes'),
          carregarItemIndexedDB<InformeMensal>('pmesp_informe_atual'),
          carregarItemIndexedDB<InformeMensal[]>('pmesp_informes_arquivados'),
          carregarItemIndexedDB<ProjetoSalvo[]>('pmesp_projetos_arquivados'),
        ]);

        if (!isAtivo) return;

        if (Array.isArray(missoesDB) && missoesDB.length > 0) {
          setMissoes((atuais) => {
            const fotosNoDB = missoesDB.some((m) => m.fotoAntesUrl || m.fotoDepoisUrl);
            const fotosNosAtuais = atuais.some((m) => m.fotoAntesUrl || m.fotoDepoisUrl);
            if (fotosNoDB && !fotosNosAtuais) {
              return sincronizarMissoesHistoricas(missoesDB);
            }
            return sincronizarMissoesHistoricas(atuais);
          });
        }

        if (informeDB && typeof informeDB === 'object') {
          setInformeAtual((atual) => {
            const fotosNoDB =
              (informeDB.paginas || []).some((p) => (p.fotos || []).length > 0) ||
              !!informeDB.capaUrl;
            const fotosNoAtual =
              (atual.paginas || []).some((p) => (p.fotos || []).length > 0) ||
              !!atual.capaUrl;
            if (fotosNoDB && !fotosNoAtual) {
              return { ...DADOS_INICIAIS_INFORME, ...informeDB };
            }
            return atual;
          });
        }

        // Garante que informes arquivados no IndexedDB sejam recuperados sem perder nada
        if (Array.isArray(arquivadosDB) && arquivadosDB.length > 0) {
          setInformesArquivados((atuais) => {
            const map = new Map<string, InformeMensal>();
            for (const inf of arquivadosDB) {
              if (inf && inf.id) map.set(inf.id, inf);
            }
            for (const inf of atuais) {
              if (inf && inf.id && !map.has(inf.id)) {
                map.set(inf.id, inf);
              }
            }
            return Array.from(map.values());
          });
        }

        // Garante que projetos/arquivos salvos no IndexedDB sejam recuperados
        if (Array.isArray(projetosDB) && projetosDB.length > 0) {
          setArquivosSalvos((atuais) => {
            const map = new Map<number, ProjetoSalvo>();
            for (const proj of projetosDB) {
              if (proj && proj.id_arquivo) map.set(proj.id_arquivo, proj);
            }
            for (const proj of atuais) {
              if (proj && proj.id_arquivo && !map.has(proj.id_arquivo)) {
                map.set(proj.id_arquivo, proj);
              }
            }
            return Array.from(map.values());
          });
        }
      } catch (e) {
        console.warn('Aviso no carregamento do IndexedDB:', e);
      }
    }
    carregarCacheLocal();
    return () => {
      isAtivo = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('pmesp_informe_atual', JSON.stringify(informeAtual));
    } catch (e) {}
    salvarItemIndexedDB('pmesp_informe_atual', informeAtual);
  }, [informeAtual]);

  useEffect(() => {
    try {
      localStorage.setItem('pmesp_informes_arquivados', JSON.stringify(informesArquivados));
    } catch (e) {}
    salvarItemIndexedDB('pmesp_informes_arquivados', informesArquivados);
  }, [informesArquivados]);

  useEffect(() => {
    try {
      localStorage.setItem('pmesp_projetos_arquivados', JSON.stringify(arquivosSalvos));
    } catch (e) {}
    salvarItemIndexedDB('pmesp_projetos_arquivados', arquivosSalvos);
  }, [arquivosSalvos]);

  useEffect(() => {
    try {
      localStorage.setItem('pmesp_missoes', JSON.stringify(missoes));
    } catch (e) {}
    salvarItemIndexedDB('pmesp_missoes', missoes);
  }, [missoes]);

  useEffect(() => {
    try {
      localStorage.setItem('pmesp_equipes', JSON.stringify(equipes));
    } catch (e) {}
    salvarItemIndexedDB('pmesp_equipes', equipes);
  }, [equipes]);

  useEffect(() => {
    try {
      localStorage.setItem('pmesp_membros', JSON.stringify(membros));
    } catch (e) {}
    salvarItemIndexedDB('pmesp_membros', membros);
  }, [membros]);

  useEffect(() => {
    try {
      localStorage.setItem('pmesp_banco_fornecedores', JSON.stringify(bancoFornecedores));
    } catch (e) {}
    salvarItemIndexedDB('pmesp_banco_fornecedores', bancoFornecedores);
  }, [bancoFornecedores]);

  // Sincronização Inicial com o Firebase Firestore (manutencao-3-cia)
  useEffect(() => {
    let isMounted = true;
    setStatusFirebase('carregando');

    carregarDadosFirestore()
      .then((dados) => {
        if (!isMounted) return;
        if (dados) {
          // Documento existe no Firestore: preenche todos os módulos com os dados reais salvos no banco
          const nfsFinais = Array.isArray(dados.nfs) && dados.nfs.length > 0 ? dados.nfs : [DADOS_INICIAIS_NF1];
          const pesquisasFinais = Array.isArray(dados.pesquisas) ? dados.pesquisas : [];
          const balanceteFinal = { ...DADOS_INICIAIS_BALANCETE, ...(dados.balancete || {}) };
          const textoParteFinal = { ...DADOS_INICIAIS_TEXTOPARTE, ...(dados.textoParte || {}) };
          const materiaisFinal = Array.isArray(dados.materiaisUsados) ? dados.materiaisUsados : [];
          const informeFinal = dados.informeAtual ? { ...DADOS_INICIAIS_INFORME, ...dados.informeAtual } : DADOS_INICIAIS_INFORME;
          const informesArquivadosFinais = Array.isArray(dados.informesArquivados) ? dados.informesArquivados : [];
          const arquivosSalvosFinais = Array.isArray(dados.arquivosSalvos) ? dados.arquivosSalvos : [];
          const missoesFinais = Array.isArray(dados.missoes) && dados.missoes.length > 0 ? dados.missoes : DADOS_INICIAIS_MISSOES;
          const equipesFinais = Array.isArray(dados.equipes) && dados.equipes.length > 0 ? dados.equipes : DADOS_INICIAIS_EQUIPES;
          const membrosFinais = Array.isArray(dados.membros) && dados.membros.length > 0 ? dados.membros : DADOS_INICIAIS_MEMBROS;
          const bancoFornecedoresFinal = Array.isArray(dados.bancoFornecedores) ? dados.bancoFornecedores : [];

          setNfs(nfsFinais);
          setPesquisas(pesquisasFinais);
          setBalancete(balanceteFinal);
          setTextoParte(textoParteFinal);
          setMateriaisUsados(materiaisFinal);
          setInformeAtual(informeFinal);
          setInformesArquivados(informesArquivadosFinais);
          setArquivosSalvos(arquivosSalvosFinais);
          setMissoes(missoesFinais);
          setEquipes(equipesFinais);
          setMembros(membrosFinais);
          setBancoFornecedores(bancoFornecedoresFinal);

          // Espelha no cache local seguro (IndexedDB e localStorage) para resiliência offline e carregamento instantâneo
          try {
            localStorage.setItem('pmesp_nfs', JSON.stringify(nfsFinais));
            localStorage.setItem('pmesp_pesquisas', JSON.stringify(pesquisasFinais));
            localStorage.setItem('pmesp_balancete', JSON.stringify(balanceteFinal));
            localStorage.setItem('pmesp_textoparte', JSON.stringify(textoParteFinal));
            localStorage.setItem('pmesp_materiais_usados', JSON.stringify(materiaisFinal));
            localStorage.setItem('pmesp_informe_atual', JSON.stringify(informeFinal));
            localStorage.setItem('pmesp_informes_arquivados', JSON.stringify(informesArquivadosFinais));
            localStorage.setItem('pmesp_projetos_arquivados', JSON.stringify(arquivosSalvosFinais));
            localStorage.setItem('pmesp_missoes', JSON.stringify(missoesFinais));
            localStorage.setItem('pmesp_equipes', JSON.stringify(equipesFinais));
            localStorage.setItem('pmesp_membros', JSON.stringify(membrosFinais));
            localStorage.setItem('pmesp_banco_fornecedores', JSON.stringify(bancoFornecedoresFinal));
            salvarItemIndexedDB('pmesp_informe_atual', informeFinal);
            salvarItemIndexedDB('pmesp_informes_arquivados', informesArquivadosFinais);
            salvarItemIndexedDB('pmesp_projetos_arquivados', arquivosSalvosFinais);
            salvarItemIndexedDB('pmesp_missoes', missoesFinais);
          } catch (e) {}

          // Registra snapshot exato dos dados carregados do banco para impedir sobrescrita no boot
          snapshotUltimoSalvo.current = JSON.stringify({
            nfs: nfsFinais,
            pesquisas: pesquisasFinais,
            balancete: balanceteFinal,
            textoParte: textoParteFinal,
            materiaisUsados: materiaisFinal,
            informeAtual: informeFinal,
            informesArquivados: informesArquivadosFinais,
            arquivosSalvos: arquivosSalvosFinais,
            missoes: missoesFinais,
            equipes: equipesFinais,
            membros: membrosFinais,
            bancoFornecedores: bancoFornecedoresFinal,
          });

          if (dados.ultimaAtualizacao) {
            try {
              setUltimaSincronizacao(new Date(dados.ultimaAtualizacao).toLocaleTimeString('pt-BR'));
            } catch (e) {}
          }
          setStatusFirebase('conectado');
          isCarregadoInicialmente.current = true;
        } else {
          // Banco realmente vazio (primeira inicialização do sistema): grava os dados iniciais com segurança
          const payloadInicial = {
            nfs,
            pesquisas,
            balancete,
            textoParte,
            materiaisUsados,
            informeAtual,
            informesArquivados,
            arquivosSalvos,
            missoes,
            equipes,
            membros,
            bancoFornecedores,
          };
          salvarDadosFirestore(payloadInicial)
            .then(() => {
              if (!isMounted) return;
              snapshotUltimoSalvo.current = JSON.stringify(payloadInicial);
              setStatusFirebase('conectado');
              setUltimaSincronizacao(new Date().toLocaleTimeString('pt-BR'));
              isCarregadoInicialmente.current = true;
            })
            .catch((err: any) => {
              if (!isMounted) return;
              if (err?.code === 'permission-denied') {
                setStatusFirebase('erro-permissao');
              } else {
                setStatusFirebase('offline');
              }
            });
        }
      })
      .catch((err: any) => {
        if (!isMounted) return;
        console.warn('Alerta na conexão com o Firestore:', err);
        if (err?.code === 'permission-denied') {
          setStatusFirebase('erro-permissao');
        } else {
          setStatusFirebase('offline');
        }
        // NÃO define isCarregadoInicialmente como true em caso de falha de conexão!
        // Isso impede que modelos locais sobrescrevam os dados reais salvos no banco.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-Save debounced para o Firestore quando houver modificação real de dados
  useEffect(() => {
    // 1. Só salva após a carga do banco de dados estar 100% concluída
    if (!isCarregadoInicialmente.current) return;
    // 2. Não salva em caso de erro de permissão ou modo offline
    if (statusFirebase === 'erro-permissao' || statusFirebase === 'offline') return;

    const payloadAtual = {
      nfs,
      pesquisas,
      balancete,
      textoParte,
      materiaisUsados,
      informeAtual,
      informesArquivados,
      arquivosSalvos,
      missoes,
      equipes,
      membros,
      bancoFornecedores,
    };
    const estadoAtualStr = JSON.stringify(payloadAtual);

    // 3. Se os dados forem idênticos ao que veio do banco de dados, NÃO salva (protege contra reset de versão)
    if (estadoAtualStr === snapshotUltimoSalvo.current) {
      return;
    }

    const timer = setTimeout(() => {
      setStatusFirebase('salvando');
      salvarDadosFirestore(payloadAtual)
        .then(() => {
          snapshotUltimoSalvo.current = estadoAtualStr;
          setStatusFirebase('conectado');
          setUltimaSincronizacao(new Date().toLocaleTimeString('pt-BR'));
        })
        .catch((err: any) => {
          console.error('Erro ao auto-salvar no Firestore:', err);
          if (err?.code === 'permission-denied') {
            setStatusFirebase('erro-permissao');
          } else {
            setStatusFirebase('offline');
          }
        });
    }, 1200);

    return () => clearTimeout(timer);
  }, [
    nfs,
    pesquisas,
    balancete,
    textoParte,
    materiaisUsados,
    informeAtual,
    informesArquivados,
    arquivosSalvos,
    missoes,
    equipes,
    membros,
    bancoFornecedores,
    statusFirebase,
  ]);

  // Sincronização manual imediata solicitada pelo usuário
  const handleSincronizarManual = async () => {
    setStatusFirebase('salvando');
    try {
      const payloadAtual = {
        nfs,
        pesquisas,
        balancete,
        textoParte,
        materiaisUsados,
        informeAtual,
        informesArquivados,
        arquivosSalvos,
        missoes,
        equipes,
        membros,
        bancoFornecedores,
      };
      await salvarDadosFirestore(payloadAtual);
      snapshotUltimoSalvo.current = JSON.stringify(payloadAtual);
      setStatusFirebase('conectado');
      setUltimaSincronizacao(new Date().toLocaleTimeString('pt-BR'));
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'permission-denied') {
        setStatusFirebase('erro-permissao');
      } else {
        setStatusFirebase('offline');
      }
    }
  };

  // Project Archiving Handlers
  const handleSalvarProjetoAtual = (tituloCustom?: string | any) => {
    const tituloString = typeof tituloCustom === 'string' ? tituloCustom.trim() : '';
    const nomePadrao = `Prestação: ${nfs[0]?.label || 'NF 1'} - ${new Date().toLocaleDateString('pt-BR')}`;
    const titulo = tituloString || nomePadrao;

    const novoArquivo: ProjetoSalvo = {
      id_arquivo: Date.now(),
      titulo: titulo.trim(),
      dataHora: new Date().toLocaleString('pt-BR'),
      nfs: JSON.parse(JSON.stringify(nfs)),
      pesquisas: JSON.parse(JSON.stringify(pesquisas)),
      balancete: JSON.parse(JSON.stringify(balancete)),
      textoParte: JSON.parse(JSON.stringify(textoParte)),
    };

    setArquivosSalvos((prev) => {
      const novaLista = [novoArquivo, ...prev];
      try {
        localStorage.setItem('pmesp_projetos_arquivados', JSON.stringify(novaLista));
      } catch (e) {}
      salvarItemIndexedDB('pmesp_projetos_arquivados', novaLista);
      salvarDadosFirestore({ arquivosSalvos: novaLista }).catch(console.error);
      return novaLista;
    });
  };

  const handleCarregarProjeto = (
    projeto: ProjetoSalvo,
    modulos: { nf: boolean; pesquisas: boolean; balancete: boolean; textoParte: boolean }
  ) => {
    if (modulos.nf && projeto.nfs && projeto.nfs.length > 0) {
      setNfs(JSON.parse(JSON.stringify(projeto.nfs)));
    }
    if (modulos.pesquisas && projeto.pesquisas) {
      setPesquisas(JSON.parse(JSON.stringify(projeto.pesquisas)));
    }
    if (modulos.balancete && projeto.balancete) {
      setBalancete(JSON.parse(JSON.stringify(projeto.balancete)));
    }
    if (modulos.textoParte && projeto.textoParte) {
      setTextoParte(JSON.parse(JSON.stringify(projeto.textoParte)));
    }
  };

  const handleRenomearProjeto = (id_arquivo: number, novoTitulo: string) => {
    setArquivosSalvos((prev) => {
      const novaLista = prev.map((p) => (p.id_arquivo === id_arquivo ? { ...p, titulo: novoTitulo } : p));
      try {
        localStorage.setItem('pmesp_projetos_arquivados', JSON.stringify(novaLista));
      } catch (e) {}
      salvarItemIndexedDB('pmesp_projetos_arquivados', novaLista);
      salvarDadosFirestore({ arquivosSalvos: novaLista }).catch(console.error);
      return novaLista;
    });
  };

  const handleDuplicarProjeto = (id_arquivo: number) => {
    const alvo = arquivosSalvos.find((p) => p.id_arquivo === id_arquivo);
    if (!alvo) return;
    const duplicado: ProjetoSalvo = {
      ...JSON.parse(JSON.stringify(alvo)),
      id_arquivo: Date.now(),
      titulo: `${alvo.titulo} (Cópia)`,
      dataHora: new Date().toLocaleString('pt-BR'),
    };
    setArquivosSalvos((prev) => {
      const novaLista = [duplicado, ...prev];
      try {
        localStorage.setItem('pmesp_projetos_arquivados', JSON.stringify(novaLista));
      } catch (e) {}
      salvarItemIndexedDB('pmesp_projetos_arquivados', novaLista);
      salvarDadosFirestore({ arquivosSalvos: novaLista }).catch(console.error);
      return novaLista;
    });
  };

  const handleCriarNovoProjetoEmBranco = () => {
    setNfs([JSON.parse(JSON.stringify(DADOS_INICIAIS_NF1))]);
    setPesquisas([]);
    setBalancete({
      periodo: 'AGOSTO / 2026',
      responsavelNome: 'ANDRÉ EMÍDIO FROES',
      responsavelCargo: '1º Ten PM 3ª Cia/Ex',
      cidadeData: 'SÃO PAULO, 27 DE AGOSTO DE 2026',
      linhas: [],
    });
    setTextoParte({
      numeroParte: '001/3CIA/2026',
      data: '27 de agosto de 2026',
      assunto: 'Prestação de contas referente a aquisição de materiais para manutenção predial.',
      conteudo: '',
      responsavelNome: 'ANDRÉ EMÍDIO FROES',
      responsavelCargo: '1º Ten PM 3ª Cia/Ex',
    });
  };

  const handleExcluirProjeto = (id_arquivo: number) => {
    setArquivosSalvos((prev) => {
      const novaLista = prev.filter((p) => p.id_arquivo !== id_arquivo);
      try {
        localStorage.setItem('pmesp_projetos_arquivados', JSON.stringify(novaLista));
      } catch (e) {}
      salvarItemIndexedDB('pmesp_projetos_arquivados', novaLista);
      salvarDadosFirestore({ arquivosSalvos: novaLista }).catch(console.error);
      return novaLista;
    });
  };

  const handleLimparHistoricoProjetos = () => {
    setArquivosSalvos([]);
    try {
      localStorage.setItem('pmesp_projetos_arquivados', JSON.stringify([]));
    } catch (e) {}
    salvarItemIndexedDB('pmesp_projetos_arquivados', []);
    salvarDadosFirestore({ arquivosSalvos: [] }).catch(console.error);
  };

  const handleImportarBackupJSON = (projetos: ProjetoSalvo[]) => {
    setArquivosSalvos((prev) => {
      const novaLista = [...projetos, ...prev];
      try {
        localStorage.setItem('pmesp_projetos_arquivados', JSON.stringify(novaLista));
      } catch (e) {}
      salvarItemIndexedDB('pmesp_projetos_arquivados', novaLista);
      salvarDadosFirestore({ arquivosSalvos: novaLista }).catch(console.error);
      return novaLista;
    });
  };

  // Monthly Report Archiving Handlers
  const handleArquivarInforme = (informe: InformeMensal, idExistenteParaAtualizar?: string) => {
    const idFinal =
      idExistenteParaAtualizar ||
      (informe.id && informesArquivados.some((x) => x.id === informe.id) ? informe.id : gerarId());

    const arquivado: InformeMensal = {
      ...JSON.parse(JSON.stringify(informe)),
      id: idFinal,
      criadoEm: informe.criadoEm || new Date().toLocaleDateString('pt-BR'),
    };

    setInformesArquivados((prev) => {
      const filtrados = prev.filter((x) => x.id !== idFinal);
      const novaLista = [arquivado, ...filtrados];
      try {
        localStorage.setItem('pmesp_informes_arquivados', JSON.stringify(novaLista));
      } catch (e) {}
      salvarItemIndexedDB('pmesp_informes_arquivados', novaLista);
      salvarDadosFirestore({ informesArquivados: novaLista }).catch(console.error);
      return novaLista;
    });
  };

  const handleCarregarInformeArquivado = (informe: InformeMensal) => {
    setInformeAtual(JSON.parse(JSON.stringify(informe)));
  };

  const handleExcluirInformeArquivado = (id: string) => {
    setInformesArquivados((prev) => {
      const novaLista = prev.filter((inf) => inf.id !== id);
      try {
        localStorage.setItem('pmesp_informes_arquivados', JSON.stringify(novaLista));
      } catch (e) {}
      salvarItemIndexedDB('pmesp_informes_arquivados', novaLista);
      salvarDadosFirestore({ informesArquivados: novaLista }).catch(console.error);
      excluirInformeArquivadoFirestore(id).catch(console.error);
      return novaLista;
    });
  };

  const handleLimparHistoricoInformes = () => {
    setInformesArquivados([]);
    try {
      localStorage.setItem('pmesp_informes_arquivados', JSON.stringify([]));
    } catch (e) {}
    salvarItemIndexedDB('pmesp_informes_arquivados', []);
    salvarDadosFirestore({ informesArquivados: [] }).catch(console.error);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans">
      <Header
        abaAtiva={abaPrincipal}
        onTrocarAba={setAbaPrincipal}
        statusFirebase={statusFirebase}
        ultimaSincronizacao={ultimaSincronizacao}
        onSincronizarManual={handleSincronizarManual}
      />

      <main className="main-print-container flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6">
        {abaPrincipal === 'prestacao' && (
          <PrestacaoContasView
            nfs={nfs}
            onChangeNFs={setNfs}
            pesquisas={pesquisas}
            onChangePesquisas={setPesquisas}
            balancete={balancete}
            onChangeBalancete={setBalancete}
            textoParte={textoParte}
            onChangeTextoParte={setTextoParte}
            arquivos={arquivosSalvos}
            onSalvarProjetoAtual={handleSalvarProjetoAtual}
            onCarregarProjeto={handleCarregarProjeto}
            onRenomearProjeto={handleRenomearProjeto}
            onDuplicarProjeto={handleDuplicarProjeto}
            onCriarNovoProjetoEmBranco={handleCriarNovoProjetoEmBranco}
            onExcluirProjeto={handleExcluirProjeto}
            onLimparHistorico={handleLimparHistoricoProjetos}
            onImportarBackupJSON={handleImportarBackupJSON}
            bancoFornecedores={bancoFornecedores}
            onChangeBancoFornecedores={setBancoFornecedores}
          />
        )}

        {abaPrincipal === 'materiais' && (
          <MateriaisUsadosView
            materiais={materiaisUsados}
            onChangeMateriais={setMateriaisUsados}
            nfs={nfs}
          />
        )}

        {abaPrincipal === 'informe' && (
          <InformeMensalView
            informeAtual={informeAtual}
            onChangeInformeAtual={setInformeAtual}
            informesArquivados={informesArquivados}
            onArquivarInforme={handleArquivarInforme}
            onCarregarInformeArquivado={handleCarregarInformeArquivado}
            onExcluirInformeArquivado={handleExcluirInformeArquivado}
            onLimparHistoricoInformes={handleLimparHistoricoInformes}
            membros={membros}
          />
        )}

        {abaPrincipal === 'cronograma' && (
          <CronogramaView
            missoes={missoes}
            onChangeMissoes={setMissoes}
            equipes={equipes}
            onChangeEquipes={setEquipes}
            membros={membros}
            onChangeMembros={setMembros}
            informeAtual={informeAtual}
            onChangeInformeAtual={setInformeAtual}
            onNavegarParaInforme={() => setAbaPrincipal('informe')}
          />
        )}
      </main>
    </div>
  );
}
