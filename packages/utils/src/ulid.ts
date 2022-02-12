import { ulid as _ulid } from 'ulid';

export function ulid(seedTime?: number): string {
  return _ulid(seedTime);
}
