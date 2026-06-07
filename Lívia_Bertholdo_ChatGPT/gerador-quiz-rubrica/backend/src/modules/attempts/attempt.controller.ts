import {
  Request,
  Response,
} from "express";

import { AttemptService } from "./attempt.service";

export class AttemptController {
  private service =
    new AttemptService();

  async start(
    req: Request,
    res: Response
  ) {
    const result =
      await this.service.start(
        String(req.params.quizId),
        req.user!.id
      );

    return res.status(201).json(result);
  }

  async finish(
    req: Request,
    res: Response
  ) {
    const result =
      await this.service.finish(
        String(req.params.id),
        req.user!.id
      );

    return res.status(200).json(result);
  }

  async findById(
    req: Request,
    res: Response
  ) {
    const result =
      await this.service.findById(
        String(req.params.id)
      );

    return res.status(200).json(result);
  }
}