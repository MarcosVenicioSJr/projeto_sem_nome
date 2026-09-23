import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientEntity } from '../entities/client.entity';

/** Services depend on THIS class, never on TypeORM's `Repository` directly. */
@Injectable()
export class ClientsRepository {
  constructor(
    @InjectRepository(ClientEntity)
    private readonly repo: Repository<ClientEntity>,
  ) {}

  findById(id: string): Promise<ClientEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<ClientEntity | null> {
    return this.repo.findOne({ where: { email } });
  }

  existsByEmail(email: string): Promise<boolean> {
    return this.repo.existsBy({ email });
  }

  create(data: Partial<ClientEntity>): Promise<ClientEntity> {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, patch: Partial<ClientEntity>): Promise<void> {
    await this.repo.update({ id }, patch);
  }
}
