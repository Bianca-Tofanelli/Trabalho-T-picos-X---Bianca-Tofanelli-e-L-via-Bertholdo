import { Router } from "express";

import { AttemptController } from "./attempt.controller";

import { authMiddleware } from "../auth/middleware/authMiddleware";
import { roleMiddleware } from "../auth/middleware/roleMiddleware";

const attemptRoutes = Router();

const controller =
  new AttemptController();

attemptRoutes.use(
  authMiddleware
);

attemptRoutes.use(
  roleMiddleware([
    "ALUNO",
  ])
);

attemptRoutes.post(
  "/start/:quizId",
  controller.start.bind(
    controller
  )
);

attemptRoutes.patch(
  "/:id/finish",
  controller.finish.bind(
    controller
  )
);

attemptRoutes.get(
  "/:id",
  controller.findById.bind(
    controller
  )
);

export { attemptRoutes };