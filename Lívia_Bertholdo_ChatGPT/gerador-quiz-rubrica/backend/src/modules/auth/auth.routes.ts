import { Router } from "express";

import { AuthController } from "./auth.controller";

const authRoutes = Router();

const controller = new AuthController();

authRoutes.post(
  "/login",
  controller.login.bind(controller)
);

export { authRoutes };