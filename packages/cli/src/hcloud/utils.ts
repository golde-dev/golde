import { z } from "zod";

/**
 * Hetzner label key. Must start with a letter; allows letters, digits, dot,
 * underscore, hyphen.
 *
 * Note: Hetzner additionally accepts a single optional "prefix/" segment of
 * up to 253 characters (e.g. `example.com/key`). We keep the simpler form
 * since it covers the common case; users with prefixed labels can extend the
 * regex later.
 */
export const labelKeySchema = z
  .string()
  .min(1)
  .max(63)
  .regex(
    /^[A-Za-z][A-Za-z0-9._-]*$/,
    {
      message: "Hetzner label key must start with a letter and contain only [A-Za-z0-9._-]",
    },
  );

export const labelValueSchema = z
  .string()
  .max(63)
  .regex(
    /^[A-Za-z0-9._-]*$/,
    {
      message: "Hetzner label value may contain only [A-Za-z0-9._-]",
    },
  );

export const labelsSchema = z
  .record(labelKeySchema, labelValueSchema)
  .optional();
