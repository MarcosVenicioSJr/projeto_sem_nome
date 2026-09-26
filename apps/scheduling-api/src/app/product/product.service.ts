import { HttpStatus, Injectable } from '@nestjs/common';
import type {
  CreateProductInput,
  Product,
  UpdateProductInput,
} from '@org/contracts';
import { AppException } from '../common/app.exception';
import { ProductsRepository, type ProductEntity } from '../database';

const toProduct = (e: ProductEntity): Product => ({
  id: e.id,
  name: e.name,
  category: e.category,
  price: Number(e.price),
  cost: Number(e.cost),
  quantity: Number(e.quantity),
});

/** Items for sale, with their own quantity. */
@Injectable()
export class ProductService {
  constructor(private readonly products: ProductsRepository) {}

  async list(tenantId: string) {
    return (await this.products.list(tenantId)).map(toProduct);
  }

  async create(tenantId: string, input: CreateProductInput) {
    return toProduct(
      await this.products.create({
        tenantId,
        name: input.name,
        category: input.category ?? null,
        price: String(input.price),
        cost: String(input.cost),
        quantity: String(input.quantity),
      }),
    );
  }

  async update(tenantId: string, id: string, input: UpdateProductInput) {
    await this.findOrFail(tenantId, id);
    await this.products.update(tenantId, id, {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.price !== undefined && { price: String(input.price) }),
      ...(input.cost !== undefined && { cost: String(input.cost) }),
      ...(input.quantity !== undefined && { quantity: String(input.quantity) }),
    });
    return toProduct(await this.findOrFail(tenantId, id));
  }

  async remove(tenantId: string, id: string): Promise<void> {
    if (!(await this.products.delete(tenantId, id))) {
      throw new AppException('errors.product.notFound', HttpStatus.NOT_FOUND);
    }
  }

  private async findOrFail(tenantId: string, id: string) {
    const product = await this.products.find(tenantId, id);
    if (!product) {
      throw new AppException('errors.product.notFound', HttpStatus.NOT_FOUND);
    }
    return product;
  }
}
