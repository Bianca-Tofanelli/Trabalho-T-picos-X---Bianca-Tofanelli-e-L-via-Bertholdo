import {
  Request,
  Response,
} from "express";

import { ReportService } from "./report.service";

export class ReportController {
  private service =
    new ReportService();

  async quizMetrics(
    req: Request,
    res: Response
  ) {
    const result =
      await this.service.quizMetrics(
        String(req.params.quizId)
      );

    return res
      .status(200)
      .json(result);
  }
}