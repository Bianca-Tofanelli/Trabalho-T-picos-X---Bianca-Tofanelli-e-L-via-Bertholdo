import { Router } from "express";

import { AuthController } from "./auth.controller";

import { authMiddleware } from "./middleware/authMiddleware";

const authRoutes = Router();

const controller =
  new AuthController();

authRoutes.post(
  "/login",
  controller.login.bind(controller)
);

authRoutes.post(
  "/refresh",
  controller.refresh.bind(controller)
);

authRoutes.post(
  "/logout",
  controller.logout.bind(controller)
);

authRoutes.get(
  "/me",
  authMiddleware,
  controller.me.bind(controller)
);

export { authRoutes };