import type { ZodType, infer as ZodInfer } from 'zod';

/**
 * Builds a DTO class that carries its Zod schema as static metadata.
 * The global ZodValidationPipe reads `.zodSchema` off the parameter's type
 * and validates automatically - so controllers never instantiate a pipe.
 *
 *   class CreateUserDto extends createZodDto(createUserSchema) {}
 *   // controller:  create(@Body() dto: CreateUserDto) { ... }
 *
 * The returned type is a single constructor whose instances are typed as
 * `z.infer<typeof schema>`, so `dto` is fully typed with no class boilerplate.
 */
export function createZodDto<TSchema extends ZodType>(schema: TSchema) {
  class ZodDto {
    static readonly zodSchema = schema;
  }
  return ZodDto as unknown as {
    new (): ZodInfer<TSchema>;
    readonly zodSchema: TSchema;
  };
}

export interface ZodDtoStatic {
  zodSchema: ZodType;
}

export const isZodDto = (metatype: unknown): metatype is ZodDtoStatic =>
  typeof metatype === 'function' && 'zodSchema' in metatype;
