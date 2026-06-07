import { Router } from "express";

import { RubricController } from "./rubric.controller";

import { authMiddleware } from "../auth/middleware/authMiddleware";
import { roleMiddleware } from "../auth/middleware/roleMiddleware";

const rubricRoutes = Router();

const controller =
  new RubricController();

rubricRoutes.use(
  authMiddleware
);

rubricRoutes.use(
  roleMiddleware([
    "PROFESSOR",
  ])
);

rubricRoutes.post(
  "/",
  controller.create.bind(
    controller
  )
);

rubricRoutes.get(
  "/",
  controller.findAll.bind(
    controller
  )
);

rubricRoutes.get(
  "/:id",
  controller.findById.bind(
    controller
  )
);

rubricRoutes.put(
  "/:id",
  controller.update.bind(
    controller
  )
);

rubricRoutes.delete(
  "/:id",
  controller.delete.bind(
    controller
  )
);

export { rubricRoutes };