import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { ZodType } from 'zod';
import { isZodDto } from './zod.dto';

/**
 * Registered once as a global pipe (APP_PIPE). For every handler argument it
 * checks whether the declared type was built with `createZodDto()` and, if so,
 * parses/coerces the value against that schema. Anything else passes through.
 * On failure the raw ZodError propagates and AllExceptionsFilter localizes it.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    const schema: ZodType | undefined = isZodDto(metadata.metatype)
      ? metadata.metatype.zodSchema
      : undefined;

    return schema ? schema.parse(value) : value;
  }
}
