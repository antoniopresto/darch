import { SchemaFieldInput, SchemaDefinitionInput } from './fields/_parseFields';

// for back compatibility
export type { SchemaDefinitionInput };
export type DarchSchemaDefinition = SchemaDefinitionInput;
export type FieldDefinitionConfig = SchemaFieldInput;
