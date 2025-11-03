import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { asyncHandler } from '../middleware/errorHandler';

export class UserController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.createUser(req.body, req.user!.id);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  });

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const { role, department, active } = req.query;
    const users = await userService.getAllUsers({
      role: role as any,
      department: department as string,
      active: active === 'true' ? true : active === 'false' ? false : undefined,
    });

    res.json({
      success: true,
      data: users,
    });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getUserById(req.params.id);

    res.json({
      success: true,
      data: user,
    });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.updateUser(req.params.id, req.body);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await userService.deleteUser(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  });

  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    await userService.changePassword(req.user!.id, oldPassword, newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  });
}

export const userController = new UserController();
