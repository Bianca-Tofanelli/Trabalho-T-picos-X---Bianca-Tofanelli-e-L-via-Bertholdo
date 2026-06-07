import { Router } from "express";

import { AlternativeController } from "./alternative.controller";

import { authMiddleware } from "../auth/middleware/authMiddleware";
import { roleMiddleware } from "../auth/middleware/roleMiddleware";

const alternativeRoutes =
  Router();

const controller =
  new AlternativeController();

alternativeRoutes.use(
  authMiddleware
);

alternativeRoutes.use(
  roleMiddleware([
    "PROFESSOR",
  ])
);

alternativeRoutes.post(
  "/",
  controller.create.bind(
    controller
  )
);

alternativeRoutes.get(
  "/question/:questionId",
  controller.findByQuestion.bind(
    controller
  )
);

alternativeRoutes.put(
  "/:id",
  controller.update.bind(
    controller
  )
);

alternativeRoutes.delete(
  "/:id",
  controller.delete.bind(
    controller
  )
);

export { alternativeRoutes };