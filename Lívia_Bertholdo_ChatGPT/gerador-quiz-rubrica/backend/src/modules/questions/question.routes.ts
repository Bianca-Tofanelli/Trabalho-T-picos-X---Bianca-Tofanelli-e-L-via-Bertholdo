import { Router } from "express";

import { QuestionController } from "./question.controller";

import { authMiddleware } from "../auth/middleware/authMiddleware";
import { roleMiddleware } from "../auth/middleware/roleMiddleware";

const questionRoutes = Router();

const controller =
  new QuestionController();

questionRoutes.use(
  authMiddleware
);

questionRoutes.use(
  roleMiddleware([
    "PROFESSOR",
  ])
);

questionRoutes.post(
  "/",
  controller.create.bind(
    controller
  )
);

questionRoutes.get(
  "/",
  controller.findAll.bind(
    controller
  )
);

questionRoutes.post(
  "/:id/duplicate",
  controller.duplicate.bind(
    controller
  )
);

questionRoutes.get(
  "/:id",
  controller.findById.bind(
    controller
  )
);

questionRoutes.put(
  "/:id",
  controller.update.bind(
    controller
  )
);

questionRoutes.delete(
  "/:id",
  controller.delete.bind(
    controller
  )
);

export { questionRoutes };