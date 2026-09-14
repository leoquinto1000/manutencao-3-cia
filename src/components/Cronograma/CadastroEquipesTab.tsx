import React, { useState } from 'react';
import { EquipeManutencao, MembroEquipe } from '../../types';
import { gerarId } from '../../utils';
import {
  Users,
  UserPlus,
  Shield,
  Edit2,
  Trash2,
  Plus,
  Phone,
  CheckCircle2,
  Wrench,
  Sparkles,
  Tag,
  Briefcase,
  GraduationCap,
  MessageCircle,
} from 'lucide-react';

interface CadastroEquipesTabProps {
  equipes: EquipeManutencao[];
  onChangeEquipes: (equipes: EquipeManutencao[]) => void;
  membros: MembroEquipe[];
  onChangeMembros: (membros: MembroEquipe[]) => void;
}

export const CadastroEquipesTab: React.FC<CadastroEquipesTabProps> = ({
  equipes,
  onChangeEquipes,
  membros,
  onChangeMembros,
}) => {
  // Estado para modal / form de Equipe
  const [modalEquipeAberta, setModalEquipeAberta] = useState(false);
  const [equipeEmEdicao, setEquipeEmEdicao] = useState<EquipeManutencao | null>(null);
  const [nomeEquipe, setNomeEquipe] = useState('');
  const [encarregadoEquipe, setEncarregadoEquipe] = useState('');
  const [especialidadeEquipe, setEspecialidadeEquipe] = useState('');
  const [membrosEquipeSelecionados, setMembrosEquipeSelecionados] = useState<string[]>([]);
  const [corBadgeEquipe, setCorBadgeEquipe] = useState<string>('blue');

  // Estado para modal / form de Militar
  const [modalMilitarAberta, setModalMilitarAberta] = useState(false);
  const [militarEmEdicao, setMilitarEmEdicao] = useState<MembroEquipe | null>(null);
  const [graduacaoMilitar, setGraduacaoMilitar] = useState('Cb PM');
  const [nomeGuerraMilitar, setNomeGuerraMilitar] = useState('');
  const [nomeCompletoMilitar, setNomeCompletoMilitar] = useState('');
  const [reMilitar, setReMilitar] = useState('');
  const [anoCursoMilitar, setAnoCursoMilitar] = useState('4º Ano');
  const [especialidadeMilitar, setEspecialidadeMilitar] = useState('');
  const [telefoneMilitar, setTelefoneMilitar] = useState('');

  // Helper para formatar link do WhatsApp
  const obterLinkWhatsapp = (telefone: string) => {
    const apenasDigitos = telefone.replace(/\D/g, '');
    if (!apenasDigitos) return null;
    // Se não tiver código de país (55), adiciona
    const numeroCompleto = apenasDigitos.startsWith('55')
      ? apenasDigitos
      : `55${apenasDigitos}`;
    return `https://wa.me/${numeroCompleto}`;
  };

  // Abrir form para nova equipe
  const abrirNovaEquipe = () => {
    setEquipeEmEdicao(null);
    setNomeEquipe('');
    setEncarregadoEquipe(membros[0]?.nomeGuerra || '');
    setEspecialidadeEquipe('');
    setMembrosEquipeSelecionados([]);
    setCorBadgeEquipe('blue');
    setModalEquipeAberta(true);
  };

  // Abrir edição de equipe
  const abrirEditarEquipe = (eq: EquipeManutencao) => {
    setEquipeEmEdicao(eq);
    setNomeEquipe(eq.nome);
    setEncarregadoEquipe(eq.encarregado);
    setEspecialidadeEquipe(eq.especialidade);
    setMembrosEquipeSelecionados(eq.membros || []);
    setCorBadgeEquipe(eq.corBadge || 'blue');
    setModalEquipeAberta(true);
  };

  // Salvar Equipe
  const handleSalvarEquipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeEquipe.trim()) return;

    if (equipeEmEdicao) {
      onChangeEquipes(
        equipes.map((eq) =>
          eq.id === equipeEmEdicao.id
            ? {
                ...eq,
                nome: nomeEquipe.trim(),
                encarregado: encarregadoEquipe.trim(),
                especialidade: especialidadeEquipe.trim(),
                membros: membrosEquipeSelecionados,
                corBadge: corBadgeEquipe,
              }
            : eq
        )
      );
    } else {
      const nova: EquipeManutencao = {
        id: gerarId(),
        nome: nomeEquipe.trim(),
        encarregado: encarregadoEquipe.trim(),
        especialidade: especialidadeEquipe.trim(),
        membros: membrosEquipeSelecionados,
        corBadge: corBadgeEquipe,
      };
      onChangeEquipes([...equipes, nova]);
    }

    setModalEquipeAberta(false);
  };

  const handleExcluirEquipe = (id: string) => {
    const eq = equipes.find((e) => e.id === id);
    if (confirm(`Deseja realmente remover a equipe "${eq?.nome || id}"?`)) {
      onChangeEquipes(equipes.filter((e) => e.id !== id));
    }
  };

  // Toggle militar na equipe
  const toggleMembroNaEquipe = (nomeGuerra: string) => {
    if (membrosEquipeSelecionados.includes(nomeGuerra)) {
      setMembrosEquipeSelecionados(membrosEquipeSelecionados.filter((m) => m !== nomeGuerra));
    } else {
      setMembrosEquipeSelecionados([...membrosEquipeSelecionados, nomeGuerra]);
    }
  };

  // Abrir form para novo militar
  const abrirNovoMilitar = () => {
    setMilitarEmEdicao(null);
    setGraduacaoMilitar('Cb PM');
    setNomeGuerraMilitar('');
    setNomeCompletoMilitar('');
    setReMilitar('');
    setAnoCursoMilitar('4º Ano');
    setEspecialidadeMilitar('');
    setTelefoneMilitar('');
    setModalMilitarAberta(true);
  };

  // Abrir edição militar
  const abrirEditarMilitar = (m: MembroEquipe) => {
    setMilitarEmEdicao(m);
    setGraduacaoMilitar(m.graduacao);
    setNomeGuerraMilitar(m.nomeGuerra);
    setNomeCompletoMilitar(m.nomeCompleto || '');
    setReMilitar(m.re || '');
    setAnoCursoMilitar(m.anoCurso || '4º Ano');
    setEspecialidadeMilitar(m.especialidade);
    setTelefoneMilitar(m.telefone || '');
    setModalMilitarAberta(true);
  };

  // Salvar Militar
  const handleSalvarMilitar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeGuerraMilitar.trim()) return;

    const nomeFormatado = nomeGuerraMilitar.startsWith(graduacaoMilitar)
      ? nomeGuerraMilitar
      : `${graduacaoMilitar} ${nomeGuerraMilitar}`;

    if (militarEmEdicao) {
      onChangeMembros(
        membros.map((m) =>
          m.id === militarEmEdicao.id
            ? {
                ...m,
                graduacao: graduacaoMilitar,
                nomeGuerra: nomeFormatado,
                nomeCompleto: nomeCompletoMilitar.trim(),
                re: reMilitar.trim(),
                anoCurso: anoCursoMilitar.trim(),
                especialidade: especialidadeMilitar.trim(),
                telefone: telefoneMilitar.trim(),
              }
            : m
        )
      );
    } else {
      const novo: MembroEquipe = {
        id: gerarId(),
        graduacao: graduacaoMilitar,
        nomeGuerra: nomeFormatado,
        nomeCompleto: nomeCompletoMilitar.trim(),
        re: reMilitar.trim(),
        anoCurso: anoCursoMilitar.trim(),
        especialidade: especialidadeMilitar.trim(),
        telefone: telefoneMilitar.trim(),
        ativo: true,
      };
      onChangeMembros([...membros, novo]);
    }

    setModalMilitarAberta(false);
  };

  const handleExcluirMilitar = (id: string) => {
    if (confirm('Deseja realmente remover este militar do cadastro?')) {
      onChangeMembros(membros.filter((m) => m.id !== id));
    }
  };

  const getCorBadgeClass = (cor?: string) => {
    switch (cor) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'amber':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'purple':
        return 'bg-purple-50 text-purple-800 border-purple-300';
      case 'rose':
        return 'bg-rose-50 text-rose-800 border-rose-300';
      case 'blue':
      default:
        return 'bg-blue-50 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Seção 1: Equipes de Manutenção */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-[#1a2b4c] flex items-center gap-2">
              <Users size={18} className="text-[#c9a84e]" />
              Equipes de Manutenção da 3ª Cia
            </h3>
            <p className="text-xs text-slate-500">
              Grupos de trabalho escalados para execuções das ordens de serviço diárias
            </p>
          </div>
          <button
            type="button"
            onClick={abrirNovaEquipe}
            className="px-3.5 py-2 text-xs font-bold bg-[#1a2b4c] hover:bg-[#2c4373] text-white rounded-md shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus size={15} />
            <span>Cadastrar Nova Equipe</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {equipes.map((eq) => (
            <div
              key={eq.id}
              className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs hover:shadow-sm transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getCorBadgeClass(
                      eq.corBadge
                    )}`}
                  >
                    {eq.nome}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => abrirEditarEquipe(eq)}
                      title="Editar Equipe"
                      className="text-slate-400 hover:text-blue-600 p-1 rounded transition"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleExcluirEquipe(eq.id)}
                      title="Excluir Equipe"
                      className="text-slate-400 hover:text-red-600 p-1 rounded transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Shield size={13} className="text-blue-600 shrink-0" />
                    <span className="font-semibold text-slate-900">Encarregado:</span>
                    <span className="font-bold text-[#1a2b4c]">{eq.encarregado}</span>
                  </div>

                  {eq.especialidade && (
                    <div className="flex items-start gap-1.5 text-slate-600">
                      <Wrench size={13} className="text-slate-400 shrink-0 mt-0.5" />
                      <span>{eq.especialidade}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Militares Componentes ({eq.membros?.length || 0}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {eq.membros && eq.membros.length > 0 ? (
                      eq.membros.map((membro, idx) => (
                        <span
                          key={idx}
                          className="bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium px-2 py-0.5 rounded"
                        >
                          {membro}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-xs italic">
                        Nenhum militar vinculado ainda.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {equipes.length === 0 && (
            <div className="col-span-full py-8 text-center text-slate-400 text-xs">
              Nenhuma equipe cadastrada no momento. Clique em "Cadastrar Nova Equipe" acima.
            </div>
          )}
        </div>
      </div>

      {/* Seção 2: Efetivo de Manutenção Cadastrado (Militares) */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-[#1a2b4c] flex items-center gap-2">
              <Shield size={18} className="text-[#c9a84e]" />
              Efetivo de Manutenção (Militares da 3ª Cia)
            </h3>
            <p className="text-xs text-slate-500">
              Oficiais, praças e cadetes designados para as atividades de reparo e conservação
            </p>
          </div>
          <button
            type="button"
            onClick={abrirNovoMilitar}
            className="px-3.5 py-2 text-xs font-bold bg-[#c9a84e] hover:bg-[#b5953e] text-[#1a2b4c] rounded-md shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <UserPlus size={15} />
            <span>Cadastrar Militar</span>
          </button>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5">Graduação & Nome de Guerra</th>
                <th className="px-3 py-2.5">Ano do Curso</th>
                <th className="px-3 py-2.5">RE</th>
                <th className="px-3 py-2.5">Especialidade / Foco</th>
                <th className="px-3 py-2.5">Telefone / Contato (WhatsApp)</th>
                <th className="px-3 py-2.5 text-center">Status</th>
                <th className="px-3 py-2.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {membros.map((m) => {
                const linkWhats = m.telefone ? obterLinkWhatsapp(m.telefone) : null;
                return (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-3 py-2 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#1a2b4c] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {m.graduacao}
                        </span>
                        <span>{m.nomeGuerra}</span>
                      </div>
                      {m.nomeCompleto && (
                        <div className="text-[11px] text-slate-500 font-normal pl-8">
                          {m.nomeCompleto}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {m.anoCurso ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <GraduationCap size={11} className="text-amber-600" />
                          {m.anoCurso}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-600">
                      {m.re || '-'}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {m.especialidade || 'Manutenção Geral'}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px]">{m.telefone || '-'}</span>
                        {linkWhats && (
                          <a
                            href={linkWhats}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-2xs transition"
                            title={`Conversar com ${m.nomeGuerra} no WhatsApp`}
                          >
                            <MessageCircle size={11} />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Ativo
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => abrirEditarMilitar(m)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                          title="Editar Militar"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleExcluirMilitar(m.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                          title="Excluir Militar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Equipe */}
      {modalEquipeAberta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-[#1a2b4c] flex items-center gap-2">
                <Users size={18} className="text-[#c9a84e]" />
                {equipeEmEdicao ? 'Editar Equipe de Manutenção' : 'Cadastrar Nova Equipe'}
              </h3>
              <button
                onClick={() => setModalEquipeAberta(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarEquipe} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nome da Equipe: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nomeEquipe}
                  onChange={(e) => setNomeEquipe(e.target.value)}
                  placeholder="Ex: Equipe Delta - Serralheria & Solda"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c] font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Encarregado / Líder:
                  </label>
                  <select
                    value={encarregadoEquipe}
                    onChange={(e) => setEncarregadoEquipe(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c] bg-white font-medium"
                  >
                    {membros.map((m) => (
                      <option key={m.id} value={m.nomeGuerra}>
                        {m.nomeGuerra} ({m.especialidade})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Cor / Identificador:
                  </label>
                  <select
                    value={corBadgeEquipe}
                    onChange={(e) => setCorBadgeEquipe(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c] bg-white font-medium"
                  >
                    <option value="blue">🔵 Azul (Elétrica / Rede)</option>
                    <option value="emerald">🟢 Verde (Hidráulica)</option>
                    <option value="amber">🟡 Âmbar (Pintura / Obras)</option>
                    <option value="purple">🟣 Roxo (Geral)</option>
                    <option value="rose">🔴 Vermelho (Urgências)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Especialidade / Foco de Atuação:
                </label>
                <input
                  type="text"
                  value={especialidadeEquipe}
                  onChange={(e) => setEspecialidadeEquipe(e.target.value)}
                  placeholder="Ex: Reparos elétricos, troca de lâmpadas, tomadas e disjuntores..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Selecione os Militares Integrantes da Equipe:
                </label>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-md p-2 space-y-1 bg-slate-50">
                  {membros.map((m) => {
                    const estaNaEquipe = membrosEquipeSelecionados.includes(m.nomeGuerra);
                    return (
                      <label
                        key={m.id}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-white cursor-pointer transition text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={estaNaEquipe}
                          onChange={() => toggleMembroNaEquipe(m.nomeGuerra)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-bold text-slate-800">{m.nomeGuerra}</span>
                        <span className="text-slate-500 text-[11px]">({m.especialidade})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalEquipeAberta(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#1a2b4c] hover:bg-[#2c4373] text-white rounded-md shadow-sm"
                >
                  Salvar Equipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Militar */}
      {modalMilitarAberta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-[#1a2b4c] flex items-center gap-2">
                <Shield size={18} className="text-[#c9a84e]" />
                {militarEmEdicao ? 'Editar Militar' : 'Cadastrar Novo Militar'}
              </h3>
              <button
                onClick={() => setModalMilitarAberta(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarMilitar} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Posto / Graduação:</label>
                  <select
                    value={graduacaoMilitar}
                    onChange={(e) => setGraduacaoMilitar(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c] bg-white font-medium"
                  >
                    <option value="Cap PM">Cap PM</option>
                    <option value="1º Ten PM">1º Ten PM</option>
                    <option value="2º Ten PM">2º Ten PM</option>
                    <option value="Cad PM">Cad PM</option>
                    <option value="Subten PM">Subten PM</option>
                    <option value="1º Sgt PM">1º Sgt PM</option>
                    <option value="2º Sgt PM">2º Sgt PM</option>
                    <option value="3º Sgt PM">3º Sgt PM</option>
                    <option value="Cb PM">Cb PM</option>
                    <option value="Sd PM">Sd PM</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nome de Guerra: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nomeGuerraMilitar}
                    onChange={(e) => setNomeGuerraMilitar(e.target.value)}
                    placeholder="Ex: Ribeiro ou Cb PM Ribeiro"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c] font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome Completo:</label>
                <input
                  type="text"
                  value={nomeCompletoMilitar}
                  onChange={(e) => setNomeCompletoMilitar(e.target.value)}
                  placeholder="Nome completo do militar..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">RE / Matrícula:</label>
                  <input
                    type="text"
                    value={reMilitar}
                    onChange={(e) => setReMilitar(e.target.value)}
                    placeholder="Ex: 154.321-4"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <GraduationCap size={13} className="text-amber-600" />
                    Ano no Curso de Formação:
                  </label>
                  <select
                    value={anoCursoMilitar}
                    onChange={(e) => setAnoCursoMilitar(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c] bg-white font-medium"
                  >
                    <option value="1º Ano">1º Ano (CFO / CFSd)</option>
                    <option value="2º Ano">2º Ano (CFO)</option>
                    <option value="3º Ano">3º Ano (CFO)</option>
                    <option value="4º Ano">4º Ano (CFO / Formando)</option>
                    <option value="Efetivo Permanente">Efetivo Permanente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Phone size={13} className="text-slate-500" />
                    Telefone (com DDD p/ WhatsApp):
                  </label>
                  <input
                    type="text"
                    value={telefoneMilitar}
                    onChange={(e) => setTelefoneMilitar(e.target.value)}
                    placeholder="Ex: (11) 98765-4321"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Especialidade Principal:</label>
                  <input
                    type="text"
                    value={especialidadeMilitar}
                    onChange={(e) => setEspecialidadeMilitar(e.target.value)}
                    placeholder="Ex: Eletricista, Encanador, Pintura..."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#1a2b4c]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalMilitarAberta(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#1a2b4c] hover:bg-[#2c4373] text-white rounded-md shadow-sm"
                >
                  Salvar Militar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
