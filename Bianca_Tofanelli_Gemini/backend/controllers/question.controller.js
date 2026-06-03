// controllers/question.controller.js
import { PrismaClient } from '@prisma/client';
import { validateQuestionDetails } from '../utils/questionValidator.js';

const prisma = new PrismaClient();

// Criar Questão
export async function createQuestion(req, res) {
  const { content, type, details, rubricId } = req.body;
  const professorId = req.user.userId; // Injetado pelo middleware de autenticação

  try {
    validateQuestionDetails(type, details);

    const question = await prisma.question.create({
      data: { content, type, details, professorId, rubricId }
    });

    return res.status(201).json(question);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

// Listar Questões do Professor
export async function listQuestions(req, res) {
  const professorId = req.user.userId;

  try {
    const questions = await prisma.question.findMany({
      where: { professorId },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(questions);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar questões.' });
  }
}

// Editar Questão
export async function updateQuestion(req, res) {
  const { id } = req.params;
  const { content, type, details, rubricId } = req.body;
  const professorId = req.user.userId;

  try {
    // Garante que a questão pertence ao professor logado
    const existingQuestion = await prisma.question.findFirst({
      where: { id, professorId }
    });

    if (!existingQuestion) {
      return res.status(404).json({ error: 'Questão não encontrada ou acesso negado.' });
    }

    validateQuestionDetails(type, details);

    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: { content, type, details, rubricId }
    });

    return res.json(updatedQuestion);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

// Excluir Questão
export async function deleteQuestion(req, res) {
  const { id } = req.params;
  const professorId = req.user.userId;

  try {
    const existingQuestion = await prisma.question.findFirst({
      where: { id, professorId }
    });

    if (!existingQuestion) {
      return res.status(404).json({ error: 'Questão não encontrada ou acesso negado.' });
    }

    await prisma.question.delete({ where: { id } });
    return res.json({ message: 'Questão excluída com sucesso.' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao excluir questão. Ela pode estar vinculada a um Quiz ativo.' });
  }
}