import type { Appointment, Barber, Product, Service, ShopHours, StockItem, StockMovement } from './types';

/**
 * Dados de demonstração do portal administrativo. Servem para desenvolver e
 * testar a UI antes de a API expor os recursos reais (agendamentos, estoque,
 * caixa, etc). Os nomes e valores replicam o protótipo de referência
 * (`design_handoff_portal_admin/reference/Barber Admin.dc.html`).
 */

export const BARBERS: Barber[] = [
  { id: 'b1', name: 'Rafael Costa', short: 'Rafael', initials: 'RC', role: 'Barbeiro sênior', start: 480, end: 1140, brk: [735, 795], off: [0], revenue: 9840, email: 'rafael@navalhadeouro.com.br', since: 2019 },
  { id: 'b2', name: 'Diego Almeida', short: 'Diego', initials: 'DA', role: 'Barbeiro', start: 480, end: 1200, brk: [720, 780], off: [0, 1], revenue: 8720, email: 'diego@navalhadeouro.com.br', since: 2021 },
  { id: 'b3', name: 'Thiago Moura', short: 'Thiago', initials: 'TM', role: 'Barbeiro', start: 600, end: 1200, brk: [750, 780], off: [0, 1], revenue: 6150, email: 'thiago@navalhadeouro.com.br', since: 2022 },
  { id: 'b4', name: 'Lucas Ferreira', short: 'Lucas', initials: 'LF', role: 'Barbeiro júnior', start: 480, end: 1080, brk: [780, 840], off: [0], revenue: 5380, email: 'lucas@navalhadeouro.com.br', since: 2024 },
];

export const SERVICES: Service[] = [
  { id: 's1', name: 'Corte masculino', category: 'Cabelo', duration: 45, price: 60, active: true },
  { id: 's2', name: 'Barba', category: 'Barba', duration: 30, price: 40, active: true },
  { id: 's3', name: 'Corte + barba', category: 'Combos', duration: 75, price: 90, active: true },
  { id: 's4', name: 'Pezinho / acabamento', category: 'Cabelo', duration: 15, price: 20, active: true },
  { id: 's5', name: 'Sobrancelha', category: 'Outros', duration: 15, price: 20, active: true },
  { id: 's6', name: 'Corte infantil', category: 'Cabelo', duration: 30, price: 45, active: true },
  { id: 's7', name: 'Pigmentação de barba', category: 'Barba', duration: 45, price: 70, active: true },
  { id: 's8', name: 'Hidratação capilar', category: 'Outros', duration: 30, price: 50, active: false },
];

export const APPOINTMENTS: Appointment[] = [
  { id: 'a1', date: 0, barberId: 'b1', clientName: 'Felipe Nogueira', serviceId: 's3', start: 540, status: 'done' },
  { id: 'a2', date: 0, barberId: 'b1', clientName: 'Bruno Carvalho', serviceId: 's1', start: 630, status: 'done' },
  { id: 'a3', date: 0, barberId: 'b1', clientName: 'Eduardo Lima', serviceId: 's2', start: 690, status: 'done' },
  { id: 'a4', date: 0, barberId: 'b1', clientName: 'João Pedro Martins', clientPhone: '(11) 99421-0032', serviceId: 's3', start: 810, status: 'confirmed' },
  { id: 'a5', date: 0, barberId: 'b1', clientName: 'Samuel Araújo', serviceId: 's1', start: 900, status: 'confirmed' },
  { id: 'a6', date: 0, barberId: 'b1', clientName: 'Henrique Barros', serviceId: 's3', start: 960, status: 'pending' },
  { id: 'a7', date: 0, barberId: 'b1', clientName: 'Gustavo Ribeiro', serviceId: 's1', start: 1050, status: 'confirmed' },
  { id: 'a8', date: 0, barberId: 'b2', clientName: 'Rodrigo Pacheco', clientPhone: '(11) 98266-3390', serviceId: 's1', start: 510, status: 'done' },
  { id: 'a9', date: 0, barberId: 'b2', clientName: 'Vinícius Prado', serviceId: 's2', start: 570, status: 'done' },
  { id: 'a10', date: 0, barberId: 'b2', clientName: 'Pedro Henrique Dias', serviceId: 's6', start: 615, status: 'done' },
  { id: 'a11', date: 0, barberId: 'b2', clientName: 'Leonardo Vieira', serviceId: 's1', start: 660, status: 'done' },
  { id: 'a12', date: 0, barberId: 'b2', clientName: 'Marcelo Tavares', clientPhone: '(11) 98107-5521', serviceId: 's1', start: 840, status: 'confirmed' },
  { id: 'a13', date: 0, barberId: 'b2', clientName: 'Matheus Rocha', serviceId: 's7', start: 900, status: 'confirmed' },
  { id: 'a14', date: 0, barberId: 'b2', clientName: 'Caio Menezes', serviceId: 's1', start: 990, status: 'pending' },
  { id: 'a15', date: 0, barberId: 'b2', clientName: 'André Luiz Souza', serviceId: 's3', start: 1080, status: 'confirmed' },
  { id: 'a16', date: 0, barberId: 'b3', clientName: 'Otávio Freitas', serviceId: 's1', start: 600, status: 'done' },
  { id: 'a17', date: 0, barberId: 'b3', clientName: 'Daniel Moreira', serviceId: 's3', start: 660, status: 'done' },
  { id: 'a18', date: 0, barberId: 'b3', clientName: 'Fábio Castro', serviceId: 's2', start: 780, status: 'done' },
  { id: 'a19', date: 0, barberId: 'b3', clientName: 'Ricardo Antunes', serviceId: 's1', start: 930, status: 'confirmed' },
  { id: 'a20', date: 0, barberId: 'b3', clientName: 'Luan Batista', serviceId: 's2', start: 990, status: 'pending' },
  { id: 'a21', date: 0, barberId: 'b3', clientName: 'André Luiz Souza', serviceId: 's4', start: 1140, status: 'confirmed' },
  { id: 'a22', date: 0, barberId: 'b4', clientName: 'Igor Santana', serviceId: 's1', start: 540, status: 'done' },
  { id: 'a23', date: 0, barberId: 'b4', clientName: 'Paulo Sérgio Ramos', serviceId: 's4', start: 600, status: 'done' },
  { id: 'a24', date: 0, barberId: 'b4', clientName: 'Wesley Cardoso', serviceId: 's3', start: 660, status: 'done' },
  { id: 'a25', date: 0, barberId: 'b4', clientName: 'Nathan Oliveira', serviceId: 's1', start: 870, status: 'confirmed' },
  { id: 'a26', date: 0, barberId: 'b4', clientName: 'Bruno Carvalho', serviceId: 's5', start: 930, status: 'confirmed' },
  { id: 'a27', date: 0, barberId: 'b4', clientName: 'Samuel Araújo', serviceId: 's8', start: 1020, status: 'pending' },
  { id: 'a28', date: 1, barberId: 'b1', clientName: 'Rodrigo Pacheco', serviceId: 's1', start: 540, status: 'confirmed' },
  { id: 'a29', date: 1, barberId: 'b1', clientName: 'Henrique Barros', serviceId: 's3', start: 600, status: 'pending' },
  { id: 'a30', date: 1, barberId: 'b2', clientName: 'Matheus Rocha', serviceId: 's1', start: 660, status: 'confirmed' },
  { id: 'a31', date: 1, barberId: 'b4', clientName: 'Caio Menezes', serviceId: 's2', start: 900, status: 'pending' },
  { id: 'a32', date: -1, barberId: 'b1', clientName: 'Luan Batista', serviceId: 's1', start: 600, status: 'done' },
  { id: 'a33', date: -1, barberId: 'b2', clientName: 'Ricardo Antunes', serviceId: 's3', start: 540, status: 'done' },
  { id: 'a34', date: -1, barberId: 'b3', clientName: 'Gustavo Ribeiro', serviceId: 's1', start: 720, status: 'done' },
];

export const STOCK: StockItem[] = [
  { id: 'e1', name: 'Pomada matte 120g', kind: 'Venda', qty: 4, min: 6, unit: 'un', lot: 12 },
  { id: 'e2', name: 'Óleo para barba 30ml', kind: 'Venda', qty: 11, min: 5, unit: 'un', lot: 12 },
  { id: 'e3', name: 'Shampoo 250ml', kind: 'Venda', qty: 7, min: 4, unit: 'un', lot: 6 },
  { id: 'e4', name: 'Balm pós-barba', kind: 'Venda', qty: 3, min: 4, unit: 'un', lot: 6 },
  { id: 'e5', name: 'Cera modeladora', kind: 'Venda', qty: 9, min: 5, unit: 'un', lot: 12 },
  { id: 'e6', name: 'Pente de madeira', kind: 'Venda', qty: 14, min: 5, unit: 'un', lot: 10 },
  { id: 'e7', name: 'Lâminas descartáveis', kind: 'Insumo', qty: 2, min: 3, unit: 'cx', lot: 5 },
  { id: 'e8', name: 'Espuma de barbear', kind: 'Insumo', qty: 6, min: 4, unit: 'un', lot: 6 },
  { id: 'e9', name: 'Toalhas descartáveis', kind: 'Insumo', qty: 4, min: 3, unit: 'pct', lot: 4 },
];

export const PRODUCTS: Product[] = [
  { id: 'p1', name: 'Pomada matte 120g', category: 'Finalizador', price: 45, cost: 19, stockId: 'e1' },
  { id: 'p2', name: 'Óleo para barba 30ml', category: 'Barba', price: 39, cost: 14, stockId: 'e2' },
  { id: 'p3', name: 'Shampoo 250ml', category: 'Cabelo', price: 42, cost: 18, stockId: 'e3' },
  { id: 'p4', name: 'Balm pós-barba', category: 'Barba', price: 35, cost: 13, stockId: 'e4' },
  { id: 'p5', name: 'Cera modeladora', category: 'Finalizador', price: 38, cost: 15, stockId: 'e5' },
  { id: 'p6', name: 'Pente de madeira', category: 'Acessório', price: 25, cost: 8, stockId: 'e6' },
];

export const STOCK_MOVEMENTS: StockMovement[] = [
  { id: 'm1', time: 'Hoje 10:12', description: 'Saída · Lâminas descartáveis', qty: '−1 cx' },
  { id: 'm2', time: 'Hoje 09:40', description: 'Venda · Pomada matte 120g', qty: '−1 un' },
  { id: 'm3', time: 'Ontem 18:05', description: 'Venda · Óleo para barba 30ml', qty: '−2 un' },
  { id: 'm4', time: '20/09 11:30', description: 'Entrada · Shampoo 250ml', qty: '+6 un' },
];

export const PAYMENT_METHODS = ['Pix', 'Crédito', 'Débito', 'Dinheiro'] as const;

export const INITIAL_COMMISSION_PCT: Record<string, number> = { b1: 40, b2: 45, b3: 40, b4: 50 };

export const SERVICE_CATEGORIES = ['Cabelo', 'Barba', 'Combos', 'Outros'] as const;

export const DEFAULT_HOURS: ShopHours[] = [1, 2, 3, 4, 5, 6, 0].map((day) => ({
  day: day as ShopHours['day'],
  label: ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'][day],
  open: day !== 0,
  from: '08:00',
  to: day === 6 ? '18:00' : '20:00',
}));

export const TOP_SERVICES_REPORT: Array<[string, number]> = [
  ['Corte masculino', 212],
  ['Corte + barba', 148],
  ['Barba', 96],
  ['Pezinho / acabamento', 71],
  ['Sobrancelha', 44],
  ['Corte infantil', 38],
];

export const MONTH_REVENUE = 31480;
export const MONTH_EXPENSES = 6940;
export const AVERAGE_TICKET_MONTH = 71.4;
