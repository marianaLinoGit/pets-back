import { z } from "../lib/z";

export const SpeciesEnum = z.enum(["dog", "cat", "dog_cat", "other"]);

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export const ISO_DATETIME =
	/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+\-]\d{2}:\d{2})$/;
export const HHMM = /^(\d{2}):(\d{2})$/;

export const DateOnly = z.string().regex(ISO_DATE);
export const DateTime = z.string().regex(ISO_DATETIME);
export const TimeHHmm = z.string().regex(HHMM);
