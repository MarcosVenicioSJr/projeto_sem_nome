import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { VerificationCodeEntity } from '../entities/verification-code.entity';
import type { VerificationPurpose } from '../enums';

@Injectable()
export class VerificationCodesRepository {
  constructor(
    @InjectRepository(VerificationCodeEntity)
    private readonly repo: Repository<VerificationCodeEntity>,
  ) {}

  /** Invalidate previous active codes and create a new one (spec §3: 1 active). */
  async issue(data: {
    userId: string;
    codeHash: string;
    purpose: VerificationPurpose;
    expiresAt: Date;
  }): Promise<VerificationCodeEntity> {
    await this.repo.update(
      { userId: data.userId, purpose: data.purpose, consumedAt: IsNull() },
      { consumedAt: new Date() },
    );
    return this.repo.save(this.repo.create(data));
  }

  activeFor(
    userId: string,
    purpose: VerificationPurpose,
  ): Promise<VerificationCodeEntity | null> {
    return this.repo.findOne({
      where: { userId, purpose, consumedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async registerAttempt(id: string, attemptsCount: number): Promise<void> {
    await this.repo.update({ id }, { attemptsCount });
  }

  async consume(id: string): Promise<void> {
    await this.repo.update({ id }, { consumedAt: new Date() });
  }
}
