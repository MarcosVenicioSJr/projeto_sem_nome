'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  APPOINTMENTS,
  BARBERS,
  DEFAULT_HOURS,
  INITIAL_COMMISSION_PCT,
  PRODUCTS,
  SERVICES,
  STOCK,
  STOCK_MOVEMENTS,
} from './mock-data';
import type { Appointment, AppointmentStatus, Barber, Product, Service, ShopHours, StockItem, StockMovement } from './types';

export type SiteSettings = { online: boolean; precos: boolean; escolher: boolean; produtos: boolean };
export type SchedulingRules = { whatsappReminder: boolean; minLeadMinutes: number; horizonDays: number };

type NewAppointmentInput = {
  clientName: string;
  clientPhone?: string;
  serviceId: string;
  barberId: string;
  start: number;
  date: number;
};

type AdminDataValue = {
  barbers: Barber[];
  services: Service[];
  appointments: Appointment[];
  products: Product[];
  stock: StockItem[];
  stockMovements: StockMovement[];
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

  createAppointment: (input: NewAppointmentInput, rescheduleId?: string) => Appointment;
  setAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  sendPendingReminders: () => void;

  toggleServiceActive: (id: string) => void;
  createService: (input: Omit<Service, 'id' | 'active'>) => void;

  registerStockEntry: (id: string) => void;

  setCommissionPct: (barberId: string, pct: number) => void;
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
  const [appointments, setAppointments] = useState<Appointment[]>(APPOINTMENTS);
  const [services, setServices] = useState<Service[]>(SERVICES);
  const [stock, setStock] = useState<StockItem[]>(STOCK);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(STOCK_MOVEMENTS);
  const [commissionPct, setCommissionPctState] = useState<Record<string, number>>(INITIAL_COMMISSION_PCT);
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

  const getBarber = useCallback((id: string) => BARBERS.find((b) => b.id === id), []);
  const getService = useCallback((id: string) => services.find((s) => s.id === id), [services]);

  const createAppointment = useCallback(
    (input: NewAppointmentInput, rescheduleId?: string): Appointment => {
      const appt: Appointment = {
        id: 'n' + Date.now(),
        date: input.date,
        barberId: input.barberId,
        clientName: input.clientName.trim(),
        clientPhone: input.clientPhone?.trim() || undefined,
        serviceId: input.serviceId,
        start: input.start,
        status: 'confirmed',
      };
      setAppointments((prev) => [...prev.filter((a) => a.id !== rescheduleId), appt]);
      return appt;
    },
    [],
  );

  const setAppointmentStatus = useCallback((id: string, status: AppointmentStatus) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }, []);

  const sendPendingReminders = useCallback(() => setRemindersSent(true), []);

  const toggleServiceActive = useCallback((id: string) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
  }, []);

  const createService = useCallback((input: Omit<Service, 'id' | 'active'>) => {
    setServices((prev) => [...prev, { ...input, id: 's' + Date.now(), active: true }]);
  }, []);

  const registerStockEntry = useCallback(
    (id: string) => {
      const item = stock.find((s) => s.id === id);
      if (!item) return;
      setStock((prev) => prev.map((s) => (s.id === id ? { ...s, qty: s.qty + s.lot } : s)));
      setStockMovements((prev) => [
        { id: 'm' + Date.now(), time: 'Agora', description: 'Entrada · ' + item.name, qty: '+' + item.lot + ' ' + item.unit },
        ...prev,
      ]);
    },
    [stock],
  );

  const setCommissionPct = useCallback((barberId: string, pct: number) => {
    setCommissionPctState((prev) => ({ ...prev, [barberId]: Math.max(0, Math.min(80, pct)) }));
  }, []);

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
      barbers: BARBERS,
      services,
      appointments,
      products: PRODUCTS,
      stock,
      stockMovements,
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
      createAppointment,
      setAppointmentStatus,
      sendPendingReminders,
      toggleServiceActive,
      createService,
      registerStockEntry,
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
      services,
      appointments,
      stock,
      stockMovements,
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
      createAppointment,
      setAppointmentStatus,
      sendPendingReminders,
      toggleServiceActive,
      createService,
      registerStockEntry,
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
