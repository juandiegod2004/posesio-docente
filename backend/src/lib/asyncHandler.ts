import type { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/** Envuelve un handler async para que sus rechazos lleguen al errorHandler central. */
export const asyncHandler = (handler: AsyncRouteHandler): RequestHandler => {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
};
