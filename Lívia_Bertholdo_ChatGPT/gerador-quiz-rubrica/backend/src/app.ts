import express from "express";
import cors from "cors";

import { authRoutes } from "./modules/auth/auth.routes";

import { errorMiddleware } from "./shared/middlewares/errorMiddleware";

import { questionRoutes } from "./modules/questions/question.routes";

import { alternativeRoutes } from "./modules/alternatives/alternative.routes";

import { quizRoutes } from "./modules/quizzes/quiz.routes";

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", (_, res) => {
  return res.status(200).json({
    message: "API Gerador de Quiz funcionando",
  });
});

app.use("/auth", authRoutes);

app.use(
  "/questions",
  questionRoutes
);

app.use(
  "/alternatives",
  alternativeRoutes
);

app.use(
  "/quizzes",
  quizRoutes
);

app.use(errorMiddleware);

export { app };