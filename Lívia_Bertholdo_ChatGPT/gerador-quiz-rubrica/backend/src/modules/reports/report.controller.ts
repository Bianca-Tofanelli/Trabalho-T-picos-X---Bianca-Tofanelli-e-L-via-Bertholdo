import {
  Request,
  Response,
} from "express";

import { ReportService } from "./report.service";

import { ReportCsvService } from "./report.csv.service";

export class ReportController {
  private service =
    new ReportService();

  private csvService =
    new ReportCsvService();

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

  async questionPerformance(
    req: Request,
    res: Response
  ) {
    const result =
      await this.service.questionPerformance(
        String(req.params.quizId)
      );

    return res
      .status(200)
      .json(result);
  }

  async exportCsv(
    req: Request,
    res: Response
  ) {
    const csv =
      await this.csvService.generateQuizCsv(
        String(req.params.quizId)
      );

    res.header(
      "Content-Type",
      "text/csv"
    );

    res.attachment(
      "relatorio.csv"
    );

    return res.send(csv);
  }
}