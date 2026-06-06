import { Request, Response, NextFunction } from "express";

import { AppError } from "../../../shared/errors/AppError";

export function roleMiddleware(
  allowedRoles: string[]
) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      throw new AppError(
        "Usuário não autenticado",
        401
      );
    }

    if (
      !allowedRoles.includes(req.user.role)
    ) {
      throw new AppError(
        "Acesso negado",
        403
      );
    }

    next();
  };
}