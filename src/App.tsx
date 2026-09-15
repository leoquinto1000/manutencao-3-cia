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
  DADOS_INICIAIS_EQUIPES,
  DADOS_INICIAIS_MEMBROS,
  DADOS_INICIAIS_BANCO_FORNECEDORES,
  gerarId,
} from './utils';
import {
  carregarDadosFirestore,
  salvarDadosFirestore,
  escutarDadosFirestore,
  DadosSistemaFirestore,
} from './firebase';
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

  // Estado das Missões do Cronograma
  const [missoes, setMissoes] = useState<MissaoDiaria[]>(() => {
    try {
      const saved = localStorage.getItem('pmesp_missoes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DADOS_INICIAIS_MISSOES;
  });

  // Estado das Equipes de Manutenção
  const [equipes, setEquipes] = useState<EquipeManutencao[]>(() => {
    try {
      const saved = localStorage.getItem('pmesp_equipes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
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
          return parsed.map((m: any) => {
            let ano = m.anoCurso;
            if (ano === '1º Ano' || ano === '1º Ano (CFO / CFSd)') ano = '1°CFO';
            else if (ano === '2º Ano' || ano === '2º Ano (CFO)' || ano === '2º Ano CFO') ano = '2°CFO';
            else if (ano === '3º Ano' || ano === '3º Ano (CFO)' || ano === '3º Ano CFO') ano = '3°CFO';
            else if (ano === '4º Ano' || ano === '4º Ano (CFO / Formando)') ano = '4°CFO';
            else if (ano === 'Quadro Efetivo (Permanente)' || ano === 'Quadro de Oficiais') ano = 'Efetivo Permanente';
            const tipoEfetivo =
              m.tipoEfetivo === 'fixo' || m.tipoEfetivo === 'apoio'
                ? m.tipoEfetivo
                : m.anoCurso?.includes('CFO')
                ? 'apoio'
                : 'fixo';
            return {
              ...m,
              anoCurso: ano || '1°CFO',
              pelotao: m.pelotao || 'A',
              tipoEfetivo,
            };
          });
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

  useEffect(() => {
    try {
      localStorage.setItem('pmesp_informe_atual', JSON.stringify(informeAtual));
    } catch (e) {}
  }, [informeAtual]);

  useEffect(() => {
    try {
      localStorage.setItem('pmesp_informes_arquivados', JSON.stringify(informesArquivados));
    } catch (e) {}
  }, [informesArquivados]);

  useEffect(() => {
    try {
      localStorage.setItem('pmesp_projetos_arquivados', JSON.stringify(arquivosSalvos));
    } catch (e) {}
  }, [arquivosSalvos]);

  useEffect(() => {
    try {
      localStorage.setItem('pmesp_missoes', JSON.stringify(missoes));
    } catch (e) {}
  }, [missoes]);

  useEffect(() => {
    try {
      localStorage.setItem('pmesp_equipes', JSON.stringify(equipes));
    } catch (e) {}
  }, [equipes]);

  useEffect(() => {
    try {
      localStorage.setItem('pmesp_membros', JSON.stringify(membros));
    } catch (e) {}
  }, [membros]);

  useEffect(() => {
    try {
      localStorage.setItem('pmesp_banco_fornecedores', JSON.stringify(bancoFornecedores));
    } catch (e) {}
  }, [bancoFornecedores]);

  // Sincronização Inicial com o Firebase Firestore (manutencao-3-cia)
  useEffect(() => {
    let isMounted = true;
    setStatusFirebase('carregando');

    carregarDadosFirestore()
      .then((dados) => {
        if (!isMounted) return;
        if (dados) {
          // Documento existe no Firestore: preenche todos os módulos
          if (Array.isArray(dados.nfs) && dados.nfs.length > 0) setNfs(dados.nfs);
          if (Array.isArray(dados.pesquisas)) setPesquisas(dados.pesquisas);
          if (dados.balancete) setBalancete(dados.balancete);
          if (dados.textoParte) setTextoParte(dados.textoParte);
          if (Array.isArray(dados.materiaisUsados)) setMateriaisUsados(dados.materiaisUsados);
          if (dados.informeAtual) setInformeAtual(dados.informeAtual);
          if (Array.isArray(dados.informesArquivados)) setInformesArquivados(dados.informesArquivados);
          if (Array.isArray(dados.arquivosSalvos)) setArquivosSalvos(dados.arquivosSalvos);
          if (Array.isArray(dados.missoes)) setMissoes(dados.missoes);
          if (Array.isArray(dados.equipes)) setEquipes(dados.equipes);
          if (Array.isArray(dados.membros) && dados.membros.length > 0) setMembros(dados.membros);
          if (Array.isArray(dados.bancoFornecedores)) setBancoFornecedores(dados.bancoFornecedores);

          if (dados.ultimaAtualizacao) {
            try {
              setUltimaSincronizacao(new Date(dados.ultimaAtualizacao).toLocaleTimeString('pt-BR'));
            } catch (e) {}
          }
          setStatusFirebase('conectado');
        } else {
          // Primeira vez que o app conecta a este banco: inicializa o documento com os dados atuais
          salvarDadosFirestore({
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
          })
            .then(() => {
              if (!isMounted) return;
              setStatusFirebase('conectado');
              setUltimaSincronizacao(new Date().toLocaleTimeString('pt-BR'));
            })
            .catch((err: any) => {
              if (!isMounted) return;
              if (err?.code === 'permission-denied') {
                setStatusFirebase('erro-permissao');
              } else {
                setStatusFirebase('conectado');
              }
            });
        }
        isCarregadoInicialmente.current = true;
      })
      .catch((err: any) => {
        if (!isMounted) return;
        console.warn('Erro na carga inicial do Firestore:', err);
        if (err?.code === 'permission-denied') {
          setStatusFirebase('erro-permissao');
        } else {
          setStatusFirebase('offline');
        }
        isCarregadoInicialmente.current = true;
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-Save debounced para o Firestore quando houver modificação de dados
  useEffect(() => {
    if (!isCarregadoInicialmente.current) return;
    if (statusFirebase === 'erro-permissao') return;

    const timer = setTimeout(() => {
      setStatusFirebase('salvando');
      salvarDadosFirestore({
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
      })
        .then(() => {
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
  ]);

  // Sincronização manual imediata solicitada pelo usuário
  const handleSincronizarManual = async () => {
    setStatusFirebase('salvando');
    try {
      await salvarDadosFirestore({
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
      });
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
  const handleSalvarProjetoAtual = (tituloCustom?: string) => {
    const nomePadrao = `Prestação: ${nfs[0]?.label || 'NF 1'} - ${new Date().toLocaleDateString('pt-BR')}`;
    const titulo = (tituloCustom && tituloCustom.trim()) || nomePadrao;

    const novoArquivo: ProjetoSalvo = {
      id_arquivo: Date.now(),
      titulo: titulo.trim(),
      dataHora: new Date().toLocaleString('pt-BR'),
      nfs: JSON.parse(JSON.stringify(nfs)),
      pesquisas: JSON.parse(JSON.stringify(pesquisas)),
      balancete: JSON.parse(JSON.stringify(balancete)),
      textoParte: JSON.parse(JSON.stringify(textoParte)),
    };

    setArquivosSalvos((prev) => [novoArquivo, ...prev]);
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
    setArquivosSalvos((prev) =>
      prev.map((p) => (p.id_arquivo === id_arquivo ? { ...p, titulo: novoTitulo } : p))
    );
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
    setArquivosSalvos((prev) => [duplicado, ...prev]);
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
    setArquivosSalvos((prev) => prev.filter((p) => p.id_arquivo !== id_arquivo));
  };

  const handleLimparHistoricoProjetos = () => {
    setArquivosSalvos([]);
  };

  const handleImportarBackupJSON = (projetos: ProjetoSalvo[]) => {
    setArquivosSalvos((prev) => [...projetos, ...prev]);
  };

  // Monthly Report Archiving Handlers
  const handleArquivarInforme = (informe: InformeMensal) => {
    const arquivado: InformeMensal = {
      ...informe,
      id: gerarId(),
      criadoEm: new Date().toLocaleDateString('pt-BR'),
    };
    setInformesArquivados([arquivado, ...informesArquivados]);
  };

  const handleCarregarInformeArquivado = (informe: InformeMensal) => {
    setInformeAtual(JSON.parse(JSON.stringify(informe)));
  };

  const handleExcluirInformeArquivado = (id: string) => {
    setInformesArquivados((prev) => prev.filter((inf) => inf.id !== id));
  };

  const handleLimparHistoricoInformes = () => {
    setInformesArquivados([]);
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
