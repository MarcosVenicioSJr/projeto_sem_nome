import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';

@Injectable()
export class RefreshTokensRepository {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly repo: Repository<RefreshTokenEntity>,
  ) {}

  create(data: Partial<RefreshTokenEntity>): Promise<RefreshTokenEntity> {
    return this.repo.save(this.repo.create(data));
  }

  findActiveByHash(tokenHash: string): Promise<RefreshTokenEntity | null> {
    return this.repo.findOne({ where: { tokenHash, revokedAt: IsNull() } });
  }

  /** Log out one device (spec §4.4). */
  async revoke(id: string): Promise<void> {
    await this.repo.update({ id }, { revokedAt: new Date() });
  }

  /** Password change -> drop every session (spec §5). */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.repo.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }
}
