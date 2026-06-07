import { Request, Response } from "express";

import { AlternativeService } from "./alternative.service";

export class AlternativeController {
  private service =
    new AlternativeService();

  async create(
    req: Request,
    res: Response
  ) {
    const result =
      await this.service.create(req.body);

    return res.status(201).json(result);
  }

  async findByQuestion(
    req: Request,
    res: Response
  ) {
    const result =
      await this.service.findByQuestion(
        String(req.params.questionId)
      );

    return res.status(200).json(result);
  }

  async update(
    req: Request,
    res: Response
  ) {
    const result =
      await this.service.update(
        String(req.params.id),
        req.body
      );

    return res.status(200).json(result);
  }

  async delete(
    req: Request,
    res: Response
  ) {
    await this.service.delete(
      String(req.params.id)
    );

    return res.status(204).send();
  }
}