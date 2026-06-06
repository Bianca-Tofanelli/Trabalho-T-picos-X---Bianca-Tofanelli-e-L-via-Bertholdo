import { Request, Response, NextFunction } from "express";

import jwt from "jsonwebtoken";

import { AppError } from "../../../shared/errors/AppError";

interface JwtPayload {
  sub: string;
  role: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      role: string;
    };
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError(
      "Token não informado",
      401
    );
  }

  const [, token] = authHeader.split(" ");

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };

    next();
  } catch {
    throw new AppError(
      "Token inválido",
      401
    );
  }
}