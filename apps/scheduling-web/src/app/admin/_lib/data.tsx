'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type {
  Appointment as ApiAppointment,
  CreateProductInput,
  CreateStockItemInput,
  Member,
  PaymentMethod,
  Product as ApiProduct,
  ProfessionalService,
  ScheduleDay,
  Service as CatalogService,
  StockItem as ApiStockItem,
  UpdateProductInput,
} from '@org/contracts';
import { useSession } from '../../_lib/session';
import { initials } from './format';
import { DEFAULT_HOURS } from './mock-data';
import type { Appointment, Barber, Product, Service, ShopHours, StockItem } from './types';

export type TeamMember = Member;
export type NewMemberInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'employee' | 'manager';
  commissionRate: number | null;
};

export type SiteSettings = { online: boolean; precos: boolean; escolher: boolean; produtos: boolean };
export type SchedulingRules = { whatsappReminder: boolean; minLeadMinutes: number; horizonDays: number };

type NewAppointmentInput = {
  clientName: string;
  clientPhone: string;
  serviceId: string;
  barberId: string;
  /** minutos desde 00:00 */
  start: number;
  /** deslocamento em dias a partir de hoje */
  date: number;
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Dia (deslocamento a partir de hoje) -> `YYYY-MM-DD` no fuso do navegador. */
function isoDay(offset: number): string {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Dia + minutos desde 00:00 -> instante (ISO). */
function instantAt(offset: number, minutes: number): string {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() + offset);
  d.setMinutes(minutes);
  return d.toISOString();
}

/** Agendamento da API -> formato usado pelas telas (dia em deslocamento, hora em minutos). */
function fromApi(a: ApiAppointment): Appointment {
  const start = new Date(a.startAt);
  const end = new Date(a.endAt);
  return {
    id: a.id,
    date: Math.round((startOfDay(start).getTime() - startOfDay(new Date()).getTime()) / 86_400_000),
    barberId: a.professionalId,
    clientName: a.clientName,
    clientPhone: a.clientPhone,
    serviceId: a.services[0]?.serviceId ?? '',
    start: start.getHours() * 60 + start.getMinutes(),
    status: a.status === 'done' ? 'done' : 'confirmed',
    durationMinutes: Math.round((end.getTime() - start.getTime()) / 60_000),
    price: a.services.reduce((sum, s) => sum + s.price, 0),
  };
}

type AdminDataValue = {
  /** carregando a equipe/catálogo da API */
  loading: boolean;
  loadError: string | null;
  /** equipe real (dono, gerentes e profissionais) */
  team: TeamMember[];
  /** catálogo real de serviços (só nome) */
  catalog: CatalogService[];
  /** preço/duração de cada profissional por serviço */
  offers: ProfessionalService[];
  /** jornada semanal de cada profissional, por id */
  schedules: Record<string, ScheduleDay[]>;
  /**
   * Visões derivadas no formato antigo (Barber/Service), para as telas ainda
   * não integradas (Agenda, Dashboard, Financeiro...). Saem quando elas forem.
   */
  barbers: Barber[];
  services: Service[];
  appointments: Appointment[];
  /** consumíveis internos (API) */
  stockItems: ApiStockItem[];
  /** produtos à venda (API) */
  productItems: ApiProduct[];
  /** visões no formato antigo, para Dashboard e Meu Site */
  products: Product[];
  stock: StockItem[];
  commissionPct: Record<string, number>;
  commissionPaid: Record<string, boolean>;
  remindersSent: boolean;
  cashClosedAt: string | null;
  site: SiteSettings;
  rules: SchedulingRules;
  hours: ShopHours[];
  toastMessage: string | null;

  getBarber: (id: string) => Barber | undefined;
  getService: (id: string) => Service | undefined;

  showToast: (message: string) => void;
  dismissToast: () => void;

  /** carrega (da API) os agendamentos de um dia */
  loadDay: (dateOffset: number) => Promise<void>;
  /** horários livres (minutos desde 00:00) do profissional/serviço no dia, sem a regra de 1h de antecedência */
  fetchSlots: (barberId: string, serviceId: string, dateOffset: number) => Promise<number[]>;
  createAppointment: (input: NewAppointmentInput, rescheduleId?: string) => Promise<void>;
  completeAppointment: (id: string, amount: number, paymentMethod: PaymentMethod) => Promise<void>;
  cancelAppointment: (id: string) => Promise<void>;
  sendPendingReminders: () => void;

  createService: (name: string) => Promise<void>;
  removeService: (id: string) => Promise<void>;
  saveOffer: (professionalId: string, serviceId: string, price: number, durationMinutes: number) => Promise<void>;
  removeOffer: (professionalId: string, serviceId: string) => Promise<void>;
  createMember: (input: NewMemberInput) => Promise<void>;
  saveSchedule: (professionalId: string, days: ScheduleDay[]) => Promise<void>;

  createStockItem: (input: CreateStockItemInput) => Promise<void>;
  adjustStock: (id: string, delta: number) => Promise<void>;
  removeStockItem: (id: string) => Promise<void>;
  createProduct: (input: CreateProductInput) => Promise<void>;
  updateProduct: (id: string, patch: UpdateProductInput) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;

  setCommissionPct: (memberId: string, pct: number) => void;
  payCommission: (barberId: string) => void;

  closeCash: () => void;
  reopenCash: () => void;

  toggleSiteSetting: (key: keyof SiteSettings) => void;
  toggleRule: (key: 'whatsappReminder') => void;
  updateRules: (patch: Partial<SchedulingRules>) => void;

  toggleHourOpen: (day: number) => void;
  updateHourRange: (day: number, patch: Partial<Pick<ShopHours, 'from' | 'to'>>) => void;
};

const AdminDataContext = createContext<AdminDataValue | null>(null);

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const { api, me, isManagement } = useSession();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [catalog, setCatalog] = useState<CatalogService[]>([]);
  const [offers, setOffers] = useState<ProfessionalService[]>([]);
  const [schedules, setSchedules] = useState<Record<string, ScheduleDay[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stockItems, setStockItems] = useState<ApiStockItem[]>([]);
  const [productItems, setProductItems] = useState<ApiProduct[]>([]);
  const [commissionPaid, setCommissionPaid] = useState<Record<string, boolean>>({});
  const [remindersSent, setRemindersSent] = useState(false);
  const [cashClosedAt, setCashClosedAt] = useState<string | null>(null);
  const [site, setSite] = useState<SiteSettings>({ online: true, precos: true, escolher: true, produtos: false });
  const [rules, setRules] = useState<SchedulingRules>({ whatsappReminder: true, minLeadMinutes: 0, horizonDays: 30 });
  const [hours, setHours] = useState<ShopHours[]>(DEFAULT_HOURS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(message);
    toastTimer.current = setTimeout(() => setToastMessage(null), 3000);
  }, []);
  const dismissToast = useCallback(() => setToastMessage(null), []);

  const load = useCallback(async () => {
    if (!me) return;
    try {
      const members = isManagement ? await api<TeamMember[]>('/members') : [me];
      const [catalogRows, allOffers, weeks, stockRows, productRows] = await Promise.all([
        api<CatalogService[]>('/services'),
        isManagement ? api<ProfessionalService[]>('/services/offers') : api<ProfessionalService[]>(`/members/${me.id}/services`),
        Promise.all(members.map((m) => api<ScheduleDay[]>(`/members/${m.id}/schedule`))),
        api<ApiStockItem[]>('/stock-items'),
        isManagement ? api<ApiProduct[]>('/products') : Promise.resolve([] as ApiProduct[]),
      ]);
      setStockItems(stockRows);
      setProductItems(productRows);
      setTeam(members);
      setCatalog(catalogRows);
      setOffers(allOffers);
      setSchedules(Object.fromEntries(members.map((m, i) => [m.id, weeks[i]])));
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  }, [api, me, isManagement]);

  useEffect(() => {
    void load();
  }, [load]);

  const barbers = useMemo<Barber[]>(
    () => team.map((m) => toBarber(m, schedules[m.id] ?? [])),
    [team, schedules],
  );
  const services = useMemo<Service[]>(
    () =>
      catalog.map((c) => {
        const offer = offers.find((o) => o.serviceId === c.id);
        return {
          id: c.id,
          name: c.name,
          category: 'Outros' as const,
          duration: offer?.durationMinutes ?? 30,
          price: offer?.price ?? 0,
          active: offers.some((o) => o.serviceId === c.id),
        };
      }),
    [catalog, offers],
  );
  const stock = useMemo<StockItem[]>(
    () => stockItems.map((i) => ({ id: i.id, name: i.name, kind: 'Insumo' as const, qty: i.quantity, min: i.minQuantity, unit: i.unit, lot: 1 })),
    [stockItems],
  );
  const products = useMemo<Product[]>(
    () => productItems.map((p) => ({ id: p.id, name: p.name, category: p.category ?? '—', price: p.price, cost: p.cost, stockId: '' })),
    [productItems],
  );
  const commissionPct = useMemo<Record<string, number>>(
    () => Object.fromEntries(team.map((m) => [m.id, m.role === 'employee' ? (m.commissionRate ?? 0) : 0])),
    [team],
  );

  const getBarber = useCallback((id: string) => barbers.find((b) => b.id === id), [barbers]);
  const getService = useCallback((id: string) => services.find((s) => s.id === id), [services]);

  const loadDay = useCallback(
    async (dateOffset: number) => {
      const rows = await api<ApiAppointment[]>(`/agenda?date=${isoDay(dateOffset)}`);
      const day = rows.filter((r) => r.status !== 'cancelled').map(fromApi);
      setAppointments((prev) => [...prev.filter((a) => a.date !== dateOffset), ...day]);
    },
    [api],
  );

  // a agenda de hoje alimenta o Dashboard; as demais telas pedem o dia que exibem
  useEffect(() => {
    if (me) void loadDay(0).catch(() => undefined);
  }, [me, loadDay]);

  const fetchSlots = useCallback(
    async (barberId: string, serviceId: string, dateOffset: number) => {
      const query = new URLSearchParams({ professionalId: barberId, serviceIds: serviceId, date: isoDay(dateOffset) });
      const starts = await api<string[]>(`/agenda/slots?${query.toString()}`);
      return starts.map((iso) => {
        const d = new Date(iso);
        return d.getHours() * 60 + d.getMinutes();
      });
    },
    [api],
  );

  const createAppointment = useCallback(
    async (input: NewAppointmentInput, rescheduleId?: string) => {
      await api('/agenda/appointments', {
        method: 'POST',
        body: {
          professionalId: input.barberId,
          serviceIds: [input.serviceId],
          clientName: input.clientName.trim(),
          clientPhone: input.clientPhone,
          startAt: instantAt(input.date, input.start),
        },
      });
      // remarcar = criar o novo e só então cancelar o antigo (nunca perde o horário)
      if (rescheduleId) {
        const old = appointments.find((a) => a.id === rescheduleId);
        await api(`/agenda/${rescheduleId}/cancel`, { method: 'PATCH', body: {} });
        if (old && old.date !== input.date) await loadDay(old.date);
      }
      await loadDay(input.date);
    },
    [api, appointments, loadDay],
  );

  const completeAppointment = useCallback(
    async (id: string, amount: number, paymentMethod: PaymentMethod) => {
      const target = appointments.find((a) => a.id === id);
      await api(`/agenda/${id}/done`, { method: 'PATCH', body: { amount, paymentMethod } });
      if (target) await loadDay(target.date);
    },
    [api, appointments, loadDay],
  );

  const cancelAppointment = useCallback(
    async (id: string) => {
      const target = appointments.find((a) => a.id === id);
      await api(`/agenda/${id}/cancel`, { method: 'PATCH', body: {} });
      if (target) await loadDay(target.date);
    },
    [api, appointments, loadDay],
  );

  const sendPendingReminders = useCallback(() => setRemindersSent(true), []);

  const createService = useCallback(
    async (name: string) => {
      const created = await api<CatalogService>('/services', { method: 'POST', body: { name } });
      setCatalog((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    },
    [api],
  );

  const removeService = useCallback(
    async (id: string) => {
      await api<void>(`/services/${id}`, { method: 'DELETE' });
      setCatalog((prev) => prev.filter((s) => s.id !== id));
      setOffers((prev) => prev.filter((o) => o.serviceId !== id));
    },
    [api],
  );

  const saveOffer = useCallback(
    async (professionalId: string, serviceId: string, price: number, durationMinutes: number) => {
      const saved = await api<ProfessionalService>(`/members/${professionalId}/services`, {
        method: 'PUT',
        body: { serviceId, price, durationMinutes },
      });
      setOffers((prev) => [...prev.filter((o) => !(o.professionalId === professionalId && o.serviceId === serviceId)), saved]);
    },
    [api],
  );

  const removeOffer = useCallback(
    async (professionalId: string, serviceId: string) => {
      await api<void>(`/members/${professionalId}/services/${serviceId}`, { method: 'DELETE' });
      setOffers((prev) => prev.filter((o) => !(o.professionalId === professionalId && o.serviceId === serviceId)));
    },
    [api],
  );

  const createMember = useCallback(
    async (input: NewMemberInput) => {
      const created = await api<TeamMember>('/members/employees', { method: 'POST', body: input });
      setTeam((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setSchedules((prev) => ({ ...prev, [created.id]: [] }));
    },
    [api],
  );

  const saveSchedule = useCallback(
    async (professionalId: string, days: ScheduleDay[]) => {
      const saved = await api<ScheduleDay[]>(`/members/${professionalId}/schedule`, { method: 'PUT', body: { days } });
      setSchedules((prev) => ({ ...prev, [professionalId]: saved }));
    },
    [api],
  );

  const sortByName = <T extends { name: string }>(rows: T[]) => [...rows].sort((a, b) => a.name.localeCompare(b.name));

  const createStockItem = useCallback(
    async (input: CreateStockItemInput) => {
      const created = await api<ApiStockItem>('/stock-items', { method: 'POST', body: input });
      setStockItems((prev) => sortByName([...prev, created]));
    },
    [api],
  );

  const adjustStock = useCallback(
    async (id: string, delta: number) => {
      const updated = await api<ApiStockItem>(`/stock-items/${id}/quantity`, { method: 'PATCH', body: { delta } });
      setStockItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    },
    [api],
  );

  const removeStockItem = useCallback(
    async (id: string) => {
      await api<void>(`/stock-items/${id}`, { method: 'DELETE' });
      setStockItems((prev) => prev.filter((i) => i.id !== id));
    },
    [api],
  );

  const createProduct = useCallback(
    async (input: CreateProductInput) => {
      const created = await api<ApiProduct>('/products', { method: 'POST', body: input });
      setProductItems((prev) => sortByName([...prev, created]));
    },
    [api],
  );

  const updateProduct = useCallback(
    async (id: string, patch: UpdateProductInput) => {
      const updated = await api<ApiProduct>(`/products/${id}`, { method: 'PATCH', body: patch });
      setProductItems((prev) => prev.map((p) => (p.id === id ? updated : p)));
    },
    [api],
  );

  const removeProduct = useCallback(
    async (id: string) => {
      await api<void>(`/products/${id}`, { method: 'DELETE' });
      setProductItems((prev) => prev.filter((p) => p.id !== id));
    },
    [api],
  );

  const setCommissionPct = useCallback(
    (memberId: string, pct: number) => {
      const rate = Math.max(0, Math.min(80, pct));
      const previous = team;
      setTeam((prev) => prev.map((m) => (m.id === memberId && m.role === 'employee' ? { ...m, commissionRate: rate } : m)));
      api<TeamMember>(`/members/employees/${memberId}`, { method: 'PATCH', body: { commissionRate: rate } }).catch(() => {
        setTeam(previous);
        showToast('Não foi possível salvar a comissão');
      });
    },
    [api, team, showToast],
  );

  const payCommission = useCallback((barberId: string) => {
    setCommissionPaid((prev) => ({ ...prev, [barberId]: true }));
  }, []);

  const closeCash = useCallback(() => {
    const now = new Date();
    setCashClosedAt(String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'));
  }, []);
  const reopenCash = useCallback(() => setCashClosedAt(null), []);

  const toggleSiteSetting = useCallback((key: keyof SiteSettings) => {
    setSite((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleRule = useCallback((key: 'whatsappReminder') => {
    setRules((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const updateRules = useCallback((patch: Partial<SchedulingRules>) => {
    setRules((prev) => ({ ...prev, ...patch }));
  }, []);

  const toggleHourOpen = useCallback((day: number) => {
    setHours((prev) => prev.map((h) => (h.day === day ? { ...h, open: !h.open } : h)));
  }, []);

  const updateHourRange = useCallback((day: number, patch: Partial<Pick<ShopHours, 'from' | 'to'>>) => {
    setHours((prev) => prev.map((h) => (h.day === day ? { ...h, ...patch } : h)));
  }, []);

  const value = useMemo<AdminDataValue>(
    () => ({
      loading,
      loadError,
      team,
      catalog,
      offers,
      schedules,
      barbers,
      services,
      appointments,
      stockItems,
      productItems,
      products,
      stock,
      commissionPct,
      commissionPaid,
      remindersSent,
      cashClosedAt,
      site,
      rules,
      hours,
      toastMessage,
      getBarber,
      getService,
      showToast,
      dismissToast,
      loadDay,
      fetchSlots,
      createAppointment,
      completeAppointment,
      cancelAppointment,
      sendPendingReminders,
      createService,
      removeService,
      saveOffer,
      removeOffer,
      createMember,
      saveSchedule,
      createStockItem,
      adjustStock,
      removeStockItem,
      createProduct,
      updateProduct,
      removeProduct,
      setCommissionPct,
      payCommission,
      closeCash,
      reopenCash,
      toggleSiteSetting,
      toggleRule,
      updateRules,
      toggleHourOpen,
      updateHourRange,
    }),
    [
      loading,
      loadError,
      team,
      catalog,
      offers,
      schedules,
      barbers,
      services,
      appointments,
      stockItems,
      productItems,
      products,
      stock,
      commissionPct,
      commissionPaid,
      remindersSent,
      cashClosedAt,
      site,
      rules,
      hours,
      toastMessage,
      getBarber,
      getService,
      showToast,
      dismissToast,
      loadDay,
      fetchSlots,
      createAppointment,
      completeAppointment,
      cancelAppointment,
      sendPendingReminders,
      createService,
      removeService,
      saveOffer,
      removeOffer,
      createMember,
      saveSchedule,
      createStockItem,
      adjustStock,
      removeStockItem,
      createProduct,
      updateProduct,
      removeProduct,
      setCommissionPct,
      payCommission,
      closeCash,
      reopenCash,
      toggleSiteSetting,
      toggleRule,
      updateRules,
      toggleHourOpen,
      updateHourRange,
    ],
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData(): AdminDataValue {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error('useAdminData deve ser usado dentro de <AdminDataProvider>');
  return ctx;
}

const ROLE_TEXT = { owner: 'Dono', manager: 'Gerente', employee: 'Profissional' } as const;

/** Visão antiga (Barber) de um membro da equipe, para as telas ainda não integradas. */
function toBarber(member: TeamMember, week: ScheduleDay[]): Barber {
  const worked = week.map((d) => d.weekday);
  const first = week[0];
  const withBreak = week.find((d) => d.breakStartMinute != null && d.breakEndMinute != null);
  const names = member.name.trim().split(/\s+/);
  return {
    id: member.id,
    name: member.name,
    short: names[0] ?? member.name,
    initials: initials(member.name),
    role: ROLE_TEXT[member.role],
    start: week.length ? Math.min(...week.map((d) => d.startMinute)) : (first?.startMinute ?? 540),
    end: week.length ? Math.max(...week.map((d) => d.endMinute)) : (first?.endMinute ?? 1080),
    brk: [withBreak?.breakStartMinute ?? 0, withBreak?.breakEndMinute ?? 0],
    off: ([0, 1, 2, 3, 4, 5, 6] as const).filter((d) => !worked.includes(d)),
    revenue: 0,
    email: member.email,
    since: new Date(member.createdAt).getFullYear(),
  };
}
