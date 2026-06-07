import { Request, Response } from "express";

import { QuestionService } from "./question.service";

export class QuestionController {
  private service =
    new QuestionService();

  async create(
    req: Request,
    res: Response
  ) {
    const result =
      await this.service.create(req.body);

    return res.status(201).json(result);
  }

  async findAll(
    req: Request,
    res: Response
  ) {
    const page =
      Number(req.query.page) || 1;

    const limit =
      Number(req.query.limit) || 10;

    const result =
      await this.service.findAll(
        {
          quizId:
            req.query.quizId as string,
          type:
            req.query.type as any,
        },
        page,
        limit
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

  async duplicate(
    req: Request,
    res: Response
  ) {
    const result =
      await this.service.duplicate(
        String(req.params.id)
      );

    return res.status(201).json(result);
  }
}