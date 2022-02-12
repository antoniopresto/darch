import { inspectObject } from './inspectObject';

export class RuntimeError extends Error {
  name = 'RuntimeError';

  details;

  constructor(message: string, details: any, skipStackLines = 0, depth = 2) {
    super(message);
    this.details = details;

    if (details) {
      const stack = (this.stack || '').split('\n');

      const newStack = [
        message,
        ...stack.slice(0, 1).filter((e) => e === '\n'),
        `Details: ${inspectObject(details, { tabSize: 0, depth })}`,
        ...stack.slice(1 + skipStackLines),
      ];

      this.stack = newStack.join('\n');
    }
  }
}
