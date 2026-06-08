import { Router } from "express";

import { QuizController } from "./quiz.controller";

import { authMiddleware } from "../auth/middleware/authMiddleware";
import { roleMiddleware } from "../auth/middleware/roleMiddleware";

const quizRoutes = Router();

const controller =
  new QuizController();

quizRoutes.use(
  authMiddleware
);

quizRoutes.use(
  roleMiddleware([
    "PROFESSOR",
  ])
);

quizRoutes.post(
  "/",
  controller.create.bind(
    controller
  )
);

quizRoutes.get(
  "/",
  controller.findAll.bind(
    controller
  )
);

quizRoutes.patch(
  "/:id/publish",
  controller.publish.bind(
    controller
  )
);

quizRoutes.patch(
  "/:id/close",
  controller.close.bind(
    controller
  )
);

quizRoutes.patch(
  "/:id/release-answer-key",
  controller.releaseAnswerKey.bind(
    controller
  )
);

quizRoutes.get(
  "/:id",
  controller.findById.bind(
    controller
  )
);

quizRoutes.put(
  "/:id",
  controller.update.bind(
    controller
  )
);

quizRoutes.delete(
  "/:id",
  controller.delete.bind(
    controller
  )
);

export { quizRoutes };