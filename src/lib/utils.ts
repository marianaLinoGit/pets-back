export const nowIso = () => new Date().toISOString();

export const toBool = (v: unknown) =>
	v === 1 || v === true || v === "1" || v === "true";

export const int = (s: string | null | undefined, d: number) => {
	const n = s ? parseInt(s, 10) : NaN;
	return Number.isFinite(n) ? n : d;
};

export const offsetOrDefault = (m?: number) =>
	typeof m === "number" ? m : -180;

export const isoFromLocal = (
	date: string,
	time: string,
	offsetMinutes?: number,
) => {
	const [y, mo, d] = date.split("-").map((x) => parseInt(x, 10));
	const [hh, mm] = time.split(":").map((x) => parseInt(x, 10));
	const off = offsetOrDefault(offsetMinutes);
	const utcH = hh - Math.trunc(off / 60);
	const utcM = mm - (off % 60);
	const dt = new Date(Date.UTC(y, mo - 1, d, utcH, utcM, 0));
	return dt.toISOString();
};

export const nextBirthdayFromDate = (
	birthDate: string,
	offsetMinutes?: number,
) => {
	const [y, m, d] = birthDate.split("-").map((x) => parseInt(x, 10));
	const off = offsetOrDefault(offsetMinutes);
	const now = new Date();
	const year = now.getUTCFullYear();
	const baseH = 12 - Math.trunc(off / 60);
	const baseM = -(off % 60);
	let target = new Date(Date.UTC(year, m - 1, d, baseH, baseM, 0));
	if (target < now) {
		target = new Date(Date.UTC(year + 1, m - 1, d, baseH, baseM, 0));
	}
	return target.toISOString();
};
