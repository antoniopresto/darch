import { createSchema } from '@darch/schema';

const addessSchema = createSchema({
  name: 'string',
  names: 'string',
  namesOptional: '[string]?',
});

addessSchema.parse({});
