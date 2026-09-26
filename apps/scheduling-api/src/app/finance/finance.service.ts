import { HttpStatus, Injectable } from '@nestjs/common';
import type {
  CommissionLine,
  RevenueLine,
  CreateExpenseInput,
  Expense,
  UpdateExpenseInput,
} from '@org/contracts';
import { AppException } from '../common/app.exception';
import { dayRange, monthRange } from '../common/tenant-time';
import {
  AppointmentsRepository,
  ExpenseEntriesRepository,
  type ExpenseEntryEntity,
} from '../database';

const round2 = (n: number) => Math.round(n * 100) / 100;

const toExpense = (e: ExpenseEntryEntity): Expense => ({
  id: e.id,
  description: e.description,
  category: e.category,
  amount: Number(e.amount),
  date: e.date,
  recurring: e.recurring,
});

/**
 * Manual financial records. There is no payment gateway: revenue is what the
 * counter informed when completing an appointment, expenses are typed in.
 */
@Injectable()
export class FinanceService {
  constructor(
    private readonly expenses: ExpenseEntriesRepository,
    private readonly appointments: AppointmentsRepository,
  ) {}

  async listExpenses(tenantId: string) {
    return (await this.expenses.list(tenantId)).map(toExpense);
  }

  async createExpense(tenantId: string, input: CreateExpenseInput) {
    return toExpense(
      await this.expenses.create({
        tenantId,
        description: input.description,
        category: input.category ?? null,
        amount: String(input.amount),
        date: input.date,
        recurring: input.recurring,
      }),
    );
  }

  async updateExpense(tenantId: string, id: string, input: UpdateExpenseInput) {
    await this.expenseOrFail(tenantId, id);
    await this.expenses.update(tenantId, id, {
      ...(input.description !== undefined && { description: input.description }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.amount !== undefined && { amount: String(input.amount) }),
      ...(input.date !== undefined && { date: input.date }),
      ...(input.recurring !== undefined && { recurring: input.recurring }),
    });
    return toExpense(await this.expenseOrFail(tenantId, id));
  }

  async removeExpense(tenantId: string, id: string): Promise<void> {
    if (!(await this.expenses.delete(tenantId, id))) {
      throw new AppException('errors.expense.notFound', HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Daily closing (not real time): every non-cancelled service of the day per
   * professional, times their commission rate. It only shows what is owed —
   * whether it was paid is not tracked.
   */
  async commissions(tenantId: string, date: string): Promise<CommissionLine[]> {
    const { from, to } = dayRange(date);
    const rows = await this.appointments.commissionBase(tenantId, from, to);
    return rows.map((r) => {
      const total = Number(r.servicesTotal ?? 0);
      const rate = r.commissionRate === null ? null : Number(r.commissionRate);
      return {
        professionalId: r.professionalId,
        professionalName: r.professionalName,
        servicesDone: Number(r.servicesDone),
        servicesTotal: round2(total),
        commissionRate: rate,
        commission: rate === null ? 0 : round2((total * rate) / 100),
      };
    });
  }

  /** Payments received on the day's completed appointments. */
  async revenues(tenantId: string, date: string): Promise<RevenueLine[]> {
    const { from, to } = dayRange(date);
    const rows = await this.appointments.listRevenues(tenantId, from, to);
    return rows.map((r) => ({
      id: r.id,
      time: r.startAt.toISOString(),
      clientName: r.clientName,
      professionalName: r.professionalName,
      services: r.services ?? '',
      amount: Number(r.amount),
      paymentMethod: r.paymentMethod,
    }));
  }

  async monthlyRevenue(tenantId: string, month: string) {
    const { from, to } = monthRange(month);
    return { month, total: await this.appointments.revenueTotal(tenantId, from, to) };
  }

  async monthlyClients(tenantId: string, month: string) {
    const { from, to } = monthRange(month);
    return {
      month,
      clients: await this.appointments.distinctClients(tenantId, from, to),
    };
  }

  private async expenseOrFail(tenantId: string, id: string) {
    const expense = await this.expenses.find(tenantId, id);
    if (!expense) {
      throw new AppException('errors.expense.notFound', HttpStatus.NOT_FOUND);
    }
    return expense;
  }
}
