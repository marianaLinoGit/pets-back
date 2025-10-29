export const requireApiKey = async (c: any, next: any) => {
	const expected = c.env.API_KEY || "";
	if (!expected) return next();
	const key = c.req.header("x-api-key");
	if (key !== expected) return c.json({ error: "unauthorized" }, 401);
	await next();
};
