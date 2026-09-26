import { HttpStatus, Injectable } from '@nestjs/common';
import type {
  AccessTokenPayload,
  Me,
  UpdateProfileInput,
} from '@org/contracts';
import { AppException } from '../common/app.exception';
import { MembersRepository } from '../database';
import { toMember } from './user.mapper';

/** The authenticated caller's own account, resolved from the token. */
@Injectable()
export class UserService {
  constructor(private readonly members: MembersRepository) {}

  async findMe({ sub }: AccessTokenPayload): Promise<Me> {
    const member = await this.members.findById(sub);
    if (!member) {
      throw new AppException('errors.user.notFound', HttpStatus.NOT_FOUND);
    }
    return toMember(member);
  }

  async updateProfile(
    caller: AccessTokenPayload,
    input: UpdateProfileInput,
  ): Promise<Me> {
    const me = await this.findMe(caller);
    if (
      input.email &&
      input.email !== me.email &&
      (await this.members.existsByEmail(input.email))
    ) {
      throw new AppException('errors.auth.emailTaken', HttpStatus.CONFLICT);
    }
    await this.members.update(me.id, input);
    return this.findMe(caller);
  }
}
