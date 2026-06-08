import { Router } from "express";

import { CorrectionController } from "./correction.controller";

import { authMiddleware } from "../auth/middleware/authMiddleware";

import { roleMiddleware } from "../auth/middleware/roleMiddleware";

const correctionRoutes =
  Router();

const controller =
  new CorrectionController();

correctionRoutes.use(
  authMiddleware
);

correctionRoutes.use(
  roleMiddleware([
    "PROFESSOR",
  ])
);

correctionRoutes.patch(
  "/answer/:id",
  controller.correctAnswer.bind(
    controller
  )
);

export {
  correctionRoutes,
};