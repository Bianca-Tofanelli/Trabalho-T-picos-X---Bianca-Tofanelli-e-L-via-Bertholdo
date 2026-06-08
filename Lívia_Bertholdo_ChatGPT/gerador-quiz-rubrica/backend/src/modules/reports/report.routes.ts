import { Router } from "express";

import { ReportController } from "./report.controller";

import { authMiddleware } from "../auth/middleware/authMiddleware";

import { roleMiddleware } from "../auth/middleware/roleMiddleware";

const reportRoutes =
  Router();

const controller =
  new ReportController();

reportRoutes.use(
  authMiddleware
);

reportRoutes.use(
  roleMiddleware([
    "PROFESSOR",
  ])
);

reportRoutes.get(
  "/quiz/:quizId/metrics",
  controller.quizMetrics.bind(
    controller
  )
);

reportRoutes.get(
  "/quiz/:quizId/questions",
  controller.questionPerformance.bind(
    controller
  )
);

reportRoutes.get(
  "/quiz/:quizId/csv",
  controller.exportCsv.bind(
    controller
  )
);

export {
  reportRoutes,
};