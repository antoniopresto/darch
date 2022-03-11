import type { Schema } from './Schema';

export function isSchemaValidationError(input: any): input is Error & { fieldErrors: string[] } {
  return input?.isSchemaValidationError === true;
}

export function isSchema(input: any): input is Schema<any> {
  return input?.__isDarchSchema === true;
}
