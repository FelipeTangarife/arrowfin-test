import type { ErrorRequestHandler, RequestHandler } from "express";
import { SymbolNotFoundError } from "../services/candle.service";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const notFoundHandler: RequestHandler = (req) => {
  throw new HttpError(404, "ROUTE_NOT_FOUND", `Route ${req.method} ${req.path} not found`);
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
  } else if (err instanceof SymbolNotFoundError) {
    res.status(404).json({ error: { code: "SYMBOL_NOT_FOUND", message: err.message } });
  } else {
    console.error(err);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong" } });
  }
};
