import { z } from "zod";

/**
 * Method for validating zod schema with interface
 * @see https://github.com/colinhacks/zod/issues/372#issuecomment-1280054492
 */
export type Implements<Model> = {
  [key in keyof Model]-?: undefined extends Model[key]
    ? null extends Model[key]
      ? z.ZodNullable<z.ZodOptional<z.ZodType<Model[key]>>>
    : z.ZodOptional<z.ZodType<Model[key]>>
    : null extends Model[key] ? z.ZodNullable<z.ZodType<Model[key]>>
    : z.ZodType<Model[key]>;
};

/**
 * Utility function for implementing zod schema with interface
 * @see https://github.com/colinhacks/zod/issues/372#issuecomment-1280054492
 */
export function implement<Model = never>() {
  return {
    with: <
      Schema extends
        & Implements<Model>
        & {
          [unknownKey in Exclude<keyof Schema, keyof Model>]: never;
        },
    >(
      schema: Schema,
    ) => z.object(schema),
  };
}
