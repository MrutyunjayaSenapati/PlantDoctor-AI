import { type Request, type Response, type NextFunction } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const user = (req as any).user?.email ?? "anonymous";

  console.log(`[REQ] ${req.method} ${req.path} — ${user}`);

  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    const duration = Date.now() - start;
    console.log(`[REQ] ${res.statusCode} ${req.method} ${req.path} — ${duration}ms`);
    return originalJson(body);
  };

  next();
}
