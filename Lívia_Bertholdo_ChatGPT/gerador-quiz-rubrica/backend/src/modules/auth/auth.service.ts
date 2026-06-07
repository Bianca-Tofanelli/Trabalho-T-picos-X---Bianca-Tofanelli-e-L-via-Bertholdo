import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { AuthRepository } from "./auth.repository";

import { LoginDTO } from "./types/login.dto";
import { RefreshTokenDTO } from "./types/refresh-token.dto";

import { AppError } from "../../shared/errors/AppError";

export class AuthService {
  private repository = new AuthRepository();

  async login(data: LoginDTO) {
    const user = await this.repository.findUserByEmail(
      data.email
    );

    if (!user) {
      throw new AppError(
        "Email ou senha inválidos",
        401
      );
    }

    const passwordMatch = await bcrypt.compare(
      data.password,
      user.passwordHash
    );

    if (!passwordMatch) {
      throw new AppError(
        "Email ou senha inválidos",
        401
      );
    }

    const accessToken = jwt.sign(
      {
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      {
        subject: user.id,
        expiresIn: "15m",
      }
    );

    const refreshToken = jwt.sign(
      {},
      process.env.JWT_REFRESH_SECRET as string,
      {
        subject: user.id,
        expiresIn: "7d",
      }
    );

    await this.repository.saveRefreshToken(
      refreshToken,
      user.id,
      new Date(
        Date.now() +
          7 * 24 * 60 * 60 * 1000
      )
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async refresh(data: RefreshTokenDTO) {
    const storedToken =
      await this.repository.findRefreshToken(
        data.refreshToken
      );

    if (!storedToken) {
      throw new AppError(
        "Refresh token inválido",
        401
      );
    }

    if (
      storedToken.expiresAt.getTime() <
      Date.now()
    ) {
      throw new AppError(
        "Refresh token expirado",
        401
      );
    }

    const decoded = jwt.verify(
      data.refreshToken,
      process.env.JWT_REFRESH_SECRET as string
    ) as { sub: string };

    const accessToken = jwt.sign(
      {},
      process.env.JWT_SECRET as string,
      {
        subject: decoded.sub,
        expiresIn: "15m",
      }
    );

    return {
      accessToken,
    };
  }

  async logout(refreshToken: string) {
    const token =
      await this.repository.findRefreshToken(
        refreshToken
      );

    if (!token) {
      return;
    }

    await this.repository.deleteRefreshToken(
      refreshToken
    );
  }
}