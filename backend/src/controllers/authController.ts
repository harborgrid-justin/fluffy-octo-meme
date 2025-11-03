import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { asyncHandler } from '../middleware/errorHandler';

export class AuthController {
  login = asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const result = await authService.login(username, password);

    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  });

  register = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: result,
    });
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshTokens(refreshToken);

    res.json({
      success: true,
      data: tokens,
    });
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);

    res.json({
      success: true,
      message: 'Logout successful',
    });
  });

  logoutAll = asyncHandler(async (req: Request, res: Response) => {
    await authService.logoutAll(req.user!.id);

    res.json({
      success: true,
      message: 'Logged out from all devices',
    });
  });
}

export const authController = new AuthController();
