import { RuntimeError } from '@darch/utils/lib/RuntimeError';

export type ValidationCustomMessage = string | ((value: any, originalError: Error) => string | Error);
export type FieldTypeParser<Type> = (input: any, customMessage?: ValidationCustomMessage) => Type;

export function parseValidationError(
  input: any,
  customMessage: ValidationCustomMessage | undefined,
  originalError: (Error & { [K: string]: any }) | string
) {
  if (typeof originalError === 'object') {
    if (!customMessage && typeof originalError === 'object' && Array.isArray(originalError.issues)) {
      const customIssue = originalError.issues.find((err) => typeof err?.params?.getMessage === 'function');

      if (typeof customIssue?.params?.getMessage === 'function') {
        customMessage = () => customIssue.params.getMessage(input, error);
      }
    }
  }

  const error = typeof originalError === 'string' ? new Error(originalError) : originalError;

  if (typeof customMessage === 'string') {
    return new RuntimeError(customMessage, { input });
  }

  if (typeof customMessage === 'function') {
    const _customError = customMessage(input, error);
    if (!_customError) return error;

    if ('string' === typeof _customError) {
      return new RuntimeError(_customError, { input });
    } else {
      return _customError;
    }
  }

  if (typeof originalError === 'object' && originalError?.issues?.length === 1) {
    return new RuntimeError(originalError.issues[0].message, { input });
  }

  return error;
}
