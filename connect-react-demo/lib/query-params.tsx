
import { z } from "zod";

export const appSlug = z.string().optional();
export const componentType = z.string().optional();
export const componentKeySlug = z.string().optional();
export const propNames = z.string().optional();
export const hideOptionalProps = z.string().optional();
export const enableDebugging = z.string().optional();
export const tab = z.string().optional();

export const queryParamSchema = z.object({
  app: appSlug,
  component: componentKeySlug,
  propNames,
  hideOptionalProps,
  enableDebugging,
  type: componentType,
  tab,
});
