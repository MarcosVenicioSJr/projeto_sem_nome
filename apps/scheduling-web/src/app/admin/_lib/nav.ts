import type { IconName } from './icons';

export type ModuleId =
  | 'dashboard'
  | 'agenda'
  | 'servicos'
  | 'produtos'
  | 'estoque'
  | 'equipe'
  | 'financeiro'
  | 'relatorios'
  | 'site'
  | 'configuracoes';

export type ModuleMeta = {
  id: ModuleId;
  href: string;
  label: string;
  short: string;
  group: string;
  sub: string;
  icon: IconName;
};

export const MODULES: ModuleMeta[] = [
  { id: 'dashboard', href: '/admin/dashboard', label: 'Dashboard', short: 'Início', group: 'Operação', sub: 'Resumo do dia e pendências', icon: 'dashboard' },
  { id: 'agenda', href: '/admin/agenda', label: 'Agenda', short: 'Agenda', group: 'Operação', sub: 'Atendimentos por barbeiro', icon: 'agenda' },
  { id: 'servicos', href: '/admin/servicos', label: 'Serviços', short: 'Serviços', group: 'Catálogo', sub: 'Cardápio, duração e preço', icon: 'servicos' },
  { id: 'produtos', href: '/admin/produtos', label: 'Produtos', short: 'Produtos', group: 'Catálogo', sub: 'Itens à venda no balcão', icon: 'produtos' },
  { id: 'estoque', href: '/admin/estoque', label: 'Estoque', short: 'Estoque', group: 'Catálogo', sub: 'Saldo, mínimo e entradas', icon: 'estoque' },
  { id: 'equipe', href: '/admin/equipe', label: 'Equipe', short: 'Equipe', group: 'Gestão', sub: 'Profissionais, horários e comissões', icon: 'equipe' },
  { id: 'financeiro', href: '/admin/financeiro', label: 'Financeiro', short: 'Caixa', group: 'Gestão', sub: 'Caixa do dia e resultado do mês', icon: 'financeiro' },
  { id: 'relatorios', href: '/admin/relatorios', label: 'Relatórios', short: 'Relatórios', group: 'Gestão', sub: 'Desempenho do mês', icon: 'relatorios' },
  { id: 'site', href: '/admin/site', label: 'Meu Site', short: 'Site', group: 'Presença', sub: 'Página pública de agendamento', icon: 'site' },
  { id: 'configuracoes', href: '/admin/configuracoes', label: 'Configurações', short: 'Ajustes', group: 'Sistema', sub: 'Barbearia, horários, regras e acessos', icon: 'config' },
];

export const BOTTOM_NAV_IDS: ModuleId[] = ['dashboard', 'agenda', 'financeiro', 'equipe'];

export function moduleGroups(): Array<{ label: string; items: ModuleMeta[] }> {
  const groups: Array<{ label: string; items: ModuleMeta[] }> = [];
  for (const mod of MODULES) {
    let group = groups.find((g) => g.label === mod.group);
    if (!group) {
      group = { label: mod.group, items: [] };
      groups.push(group);
    }
    group.items.push(mod);
  }
  return groups;
}

export function moduleForPath(pathname: string): ModuleMeta | undefined {
  return MODULES.find((m) => pathname === m.href || pathname.startsWith(m.href + '/'));
}
