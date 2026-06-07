import { Request, Response } from "express";

import { AuthService } from "./auth.service";

export class AuthController {
  private service = new AuthService();

  async login(
    req: Request,
    res: Response
  ) {
    const result =
      await this.service.login(req.body);

    return res.status(200).json(result);
  }

  async refresh(
    req: Request,
    res: Response
  ) {
    const result =
      await this.service.refresh(req.body);

    return res.status(200).json(result);
  }

  async logout(
    req: Request,
    res: Response
  ) {
    const { refreshToken } = req.body;

    await this.service.logout(
      refreshToken
    );

    return res.status(204).send();
  }
}