import { z } from 'zod';
import { monthSchema } from '../common/index.js';

/** GET /finance/reports/revenue?month= and /clients?month= */
export const monthlyReportQuerySchema = z.object({ month: monthSchema });
export type MonthlyReportQuery = z.infer<typeof monthlyReportQuerySchema>;
