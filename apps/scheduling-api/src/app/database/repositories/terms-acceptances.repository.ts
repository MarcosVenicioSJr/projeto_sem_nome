import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TermsAcceptanceEntity } from '../entities/terms-acceptance.entity';

@Injectable()
export class TermsAcceptancesRepository {
  constructor(
    @InjectRepository(TermsAcceptanceEntity)
    private readonly repo: Repository<TermsAcceptanceEntity>,
  ) {}

  record(data: Partial<TermsAcceptanceEntity>): Promise<TermsAcceptanceEntity> {
    return this.repo.save(this.repo.create(data));
  }

  latestForUser(userId: string): Promise<TermsAcceptanceEntity | null> {
    return this.repo.findOne({
      where: { userId },
      order: { acceptedAt: 'DESC' },
    });
  }
}
