import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from './roles.decorator';

function contextFor(role: string | undefined): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({ user: role ? { role } : undefined }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  const requires = (roles: string[] | undefined) =>
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) =>
      key === ROLES_KEY ? roles : undefined,
    );

  it('allows any authenticated role when no @Roles is set', () => {
    requires(undefined);
    expect(guard.canActivate(contextFor('employee'))).toBe(true);
  });

  it('allows a matching role', () => {
    requires(['owner']);
    expect(guard.canActivate(contextFor('owner'))).toBe(true);
  });

  it('forbids a non-matching role', () => {
    requires(['owner']);
    expect(() => guard.canActivate(contextFor('employee'))).toThrow();
    try {
      guard.canActivate(contextFor('employee'));
    } catch (e) {
      expect(e).toMatchObject({ key: 'errors.auth.forbidden' });
    }
  });
});
