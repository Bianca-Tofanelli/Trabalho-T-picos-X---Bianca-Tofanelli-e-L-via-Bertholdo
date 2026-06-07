import { Request, Response } from "express";

import { AnswerService } from "./answer.service";

export class AnswerController {
  private service =
    new AnswerService();

  async create(
    req: Request,
    res: Response
  ) {
    const result =
      await this.service.create(
        req.body,
        req.user!.id
      );

    return res.status(201).json(result);
  }

  async update(
    req: Request,
    res: Response
  ) {
    const result =
      await this.service.update(
        String(req.params.id),
        req.body,
        req.user!.id
      );

    return res.status(200).json(result);
  }

  async findByAttempt(
    req: Request,
    res: Response
  ) {
    const result =
      await this.service.findByAttempt(
        String(req.params.attemptId)
      );

    return res.status(200).json(result);
  }
}