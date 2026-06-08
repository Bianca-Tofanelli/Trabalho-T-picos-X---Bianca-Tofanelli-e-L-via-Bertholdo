import {
  Request,
  Response,
} from "express";

import { CorrectionService } from "./correction.service";

export class CorrectionController {
  private service =
    new CorrectionService();

  async correctAnswer(
    req: Request,
    res: Response
  ) {
    const result =
      await this.service.correctAnswer(
        String(req.params.id),
        req.body.score
      );

    return res
      .status(200)
      .json(result);
  }
}