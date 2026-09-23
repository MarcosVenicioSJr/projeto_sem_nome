import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ROLE,
  type AccessTokenPayload,
  type Me,
  type UpdateProfileInput,
} from '@org/contracts';
import { AppException } from '../common/app.exception';
import { ClientsRepository, MembersRepository } from '../database';
import { toClient, toMember } from './user.mapper';

/** The authenticated caller's own account, resolved by role from the token. */
@Injectable()
export class UserService {
  constructor(
    private readonly members: MembersRepository,
    private readonly clients: ClientsRepository,
  ) {}

  async findMe({ sub, role }: AccessTokenPayload): Promise<Me> {
    if (role !== ROLE.CLIENT) {
      const member = await this.members.findById(sub);
      if (!member) throw this.notFound();
      return toMember(member);
    }
    const client = await this.clients.findById(sub);
    if (!client) throw this.notFound();
    return toClient(client);
  }

  async updateProfile(
    caller: AccessTokenPayload,
    input: UpdateProfileInput,
  ): Promise<Me> {
    const me = await this.findMe(caller);
    if (input.email && input.email !== me.email) {
      const taken =
        me.role === ROLE.CLIENT
          ? await this.clients.existsByEmail(input.email)
          : await this.members.existsByEmail(input.email);
      if (taken) {
        throw new AppException('errors.auth.emailTaken', HttpStatus.CONFLICT);
      }
    }
    if (me.role === ROLE.CLIENT) {
      await this.clients.update(me.id, input);
    } else {
      await this.members.update(me.id, input);
    }
    return this.findMe(caller);
  }

  private notFound() {
    return new AppException('errors.user.notFound', HttpStatus.NOT_FOUND);
  }
}
