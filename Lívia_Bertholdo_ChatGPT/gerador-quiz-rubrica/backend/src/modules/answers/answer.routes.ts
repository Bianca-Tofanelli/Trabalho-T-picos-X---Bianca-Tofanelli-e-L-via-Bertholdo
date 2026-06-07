import { Router } from "express";

import { AnswerController } from "./answer.controller";

import { authMiddleware } from "../auth/middleware/authMiddleware";
import { roleMiddleware } from "../auth/middleware/roleMiddleware";

const answerRoutes = Router();

const controller =
  new AnswerController();

answerRoutes.use(
  authMiddleware
);

answerRoutes.use(
  roleMiddleware([
    "ALUNO",
  ])
);

answerRoutes.post(
  "/",
  controller.create.bind(
    controller
  )
);

answerRoutes.put(
  "/:id",
  controller.update.bind(
    controller
  )
);

answerRoutes.get(
  "/attempt/:attemptId",
  controller.findByAttempt.bind(
    controller
  )
);

export { answerRoutes };