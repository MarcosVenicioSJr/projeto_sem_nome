import { HttpStatus, Injectable } from '@nestjs/common';
import type { UpdatePreferencesInput, UpdateProfileInput } from '@org/contracts';
import { AppException } from '../common/app.exception';
import { UsersRepository } from '../database';
import { toUser } from './user.mapper';

@Injectable()
export class UserService {
  constructor(private readonly users: UsersRepository) {}

  async findById(id: string) {
    const user = await this.users.findById(id);
    if (!user) {
      throw new AppException('errors.user.notFound', HttpStatus.NOT_FOUND);
    }
    return toUser(user);
  }

  async updateProfile(id: string, input: UpdateProfileInput) {
    await this.ensureExists(id);
    await this.users.update(id, input);
    return this.findById(id);
  }

  async updatePreferences(id: string, input: UpdatePreferencesInput) {
    await this.ensureExists(id);
    await this.users.update(id, { favoriteGenres: input.favoriteGenres });
    return this.findById(id);
  }

  private async ensureExists(id: string): Promise<void> {
    if (!(await this.users.findById(id))) {
      throw new AppException('errors.user.notFound', HttpStatus.NOT_FOUND);
    }
  }
}
