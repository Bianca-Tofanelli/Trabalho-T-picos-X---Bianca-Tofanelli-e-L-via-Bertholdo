import express from "express";
import cors from "cors";

import { authRoutes } from "./modules/auth/auth.routes";

import { errorMiddleware } from "./shared/middlewares/errorMiddleware";

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", (_, res) => {
  return res.status(200).json({
    message: "API Gerador de Quiz funcionando",
  });
});

app.use("/auth", authRoutes);

app.use(errorMiddleware);

export { app };