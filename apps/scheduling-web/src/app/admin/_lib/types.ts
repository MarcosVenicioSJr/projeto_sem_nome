/**
 * Tipos do domínio do portal administrativo (Barber Admin).
 * Nesta fase os dados vêm de `mock-data.ts`; quando a API expuser os
 * recursos reais, estes tipos devem migrar para `@org/contracts`.
 */

export type AppointmentStatus = 'pending' | 'confirmed' | 'done';

export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = domingo

export type Barber = {
  id: string;
  name: string;
  short: string;
  initials: string;
  role: string;
  /** minutos desde 00:00 */
  start: number;
  /** minutos desde 00:00 */
  end: number;
  /** intervalo [início, fim] em minutos desde 00:00 */
  brk: [number, number];
  /** dias da semana de folga */
  off: WeekDay[];
  /** faturamento do mês, em R$ */
  revenue: number;
  email: string;
  since: number;
};

export type ServiceCategory = 'Cabelo' | 'Barba' | 'Combos' | 'Outros';

export type Service = {
  id: string;
  name: string;
  category: ServiceCategory;
  /** duração em minutos */
  duration: number;
  price: number;
  active: boolean;
};

export type Appointment = {
  id: string;
  /** deslocamento em dias a partir de hoje (0 = hoje, -1 = ontem, 1 = amanhã) */
  date: number;
  barberId: string;
  clientName: string;
  clientPhone?: string;
  serviceId: string;
  /** minutos desde 00:00 */
  start: number;
  status: AppointmentStatus;
};

export type StockKind = 'Venda' | 'Insumo';

export type StockItem = {
  id: string;
  name: string;
  kind: StockKind;
  qty: number;
  min: number;
  unit: string;
  /** quantidade de um lote de reposição */
  lot: number;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stockId: string;
};

export type StockMovement = {
  id: string;
  time: string;
  description: string;
  qty: string;
};

export type CashEntry = {
  time: string;
  description: string;
  method: 'Pix' | 'Crédito' | 'Débito' | 'Dinheiro';
  value: number;
  by: string;
};

export type ShopHours = {
  day: WeekDay;
  label: string;
  open: boolean;
  from: string;
  to: string;
};
