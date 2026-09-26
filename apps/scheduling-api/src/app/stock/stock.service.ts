import { HttpStatus, Injectable } from '@nestjs/common';
import type {
  AdjustQuantityInput,
  CreateStockItemInput,
  StockItem,
  UpdateStockItemInput,
} from '@org/contracts';
import { AppException } from '../common/app.exception';
import { StockItemsRepository, type StockItemEntity } from '../database';

const toStockItem = (e: StockItemEntity): StockItem => {
  const quantity = Number(e.quantity);
  const minQuantity = Number(e.minQuantity);
  return {
    id: e.id,
    name: e.name,
    quantity,
    unit: e.unit,
    minQuantity,
    lowStock: quantity <= minQuantity,
  };
};

/** Internal consumables. Manual control, no link to appointments. */
@Injectable()
export class StockService {
  constructor(private readonly items: StockItemsRepository) {}

  async list(tenantId: string) {
    return (await this.items.list(tenantId)).map(toStockItem);
  }

  async create(tenantId: string, input: CreateStockItemInput) {
    return toStockItem(
      await this.items.create({
        tenantId,
        name: input.name,
        unit: input.unit,
        quantity: String(input.quantity),
        minQuantity: String(input.minQuantity),
      }),
    );
  }

  async update(tenantId: string, id: string, input: UpdateStockItemInput) {
    await this.findOrFail(tenantId, id);
    await this.items.update(tenantId, id, {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.unit !== undefined && { unit: input.unit }),
      ...(input.quantity !== undefined && { quantity: String(input.quantity) }),
      ...(input.minQuantity !== undefined && {
        minQuantity: String(input.minQuantity),
      }),
    });
    return toStockItem(await this.findOrFail(tenantId, id));
  }

  async adjust(tenantId: string, id: string, input: AdjustQuantityInput) {
    await this.findOrFail(tenantId, id);
    if (!(await this.items.adjust(tenantId, id, input.delta))) {
      throw new AppException('errors.stock.negative', HttpStatus.CONFLICT);
    }
    return toStockItem(await this.findOrFail(tenantId, id));
  }

  async remove(tenantId: string, id: string): Promise<void> {
    if (!(await this.items.delete(tenantId, id))) {
      throw new AppException('errors.stock.notFound', HttpStatus.NOT_FOUND);
    }
  }

  private async findOrFail(tenantId: string, id: string) {
    const item = await this.items.find(tenantId, id);
    if (!item) {
      throw new AppException('errors.stock.notFound', HttpStatus.NOT_FOUND);
    }
    return item;
  }
}
