import { Request, Response } from "express";

import { AuthService } from "./auth.service";

export class AuthController {
  private service = new AuthService();

  async login(req: Request, res: Response) {
    const result = await this.service.login(req.body);

    return res.status(200).json(result);
  }
}