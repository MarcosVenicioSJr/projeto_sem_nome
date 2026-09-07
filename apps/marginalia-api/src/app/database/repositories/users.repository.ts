import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';

/**
 * Repository pattern: services depend on THIS class, never on TypeORM's
 * `Repository<UserEntity>` directly. It isolates the ORM and gives queries a
 * domain vocabulary.
 */
@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  findById(id: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByUsername(username: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { username } });
  }

  existsByUsername(username: string): Promise<boolean> {
    return this.repo.existsBy({ username });
  }

  existsByEmail(email: string): Promise<boolean> {
    return this.repo.existsBy({ email });
  }

  create(data: Partial<UserEntity>): Promise<UserEntity> {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, patch: Partial<UserEntity>): Promise<void> {
    await this.repo.update({ id }, patch);
  }
}
