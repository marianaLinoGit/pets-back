import { z } from "../../lib/z";

export const SpeciesEnum = z.enum(["dog", "cat", "other"]);
export const okArray = z.array(z.any());
export const okObj = z.any();
