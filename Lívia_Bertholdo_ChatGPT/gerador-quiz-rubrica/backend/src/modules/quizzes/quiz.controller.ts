import { Request, Response } from "express";

import { QuizService } from "./quiz.service";

export class QuizController {
  private service =
    new QuizService();

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

  async findAll(
    req: Request,
    res: Response
  ) {
    const result =
      await this.service.findAll();

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

  async publish(
    req: Request,
    res: Response
  ) {
    const result =
      await this.service.publish(
        String(req.params.id)
      );

    return res.status(200).json(result);
  }

  async close(
    req: Request,
    res: Response
  ) {
    const result =
      await this.service.close(
        String(req.params.id)
      );

    return res.status(200).json(result);
  }
}