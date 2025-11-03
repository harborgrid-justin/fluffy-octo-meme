// BE-016: Comment/Collaboration Service
import { v4 as uuidv4 } from 'uuid';
import { Comment } from '../types';
import { dataStore } from './dataStore';
import { AppError } from '../middleware/errorHandler';

export class CommentService {
  async createComment(data: {
    entityType: string;
    entityId: string;
    parentId?: string;
    content: string;
  }, userId: string, username: string): Promise<Comment> {
    const comment: Comment = {
      id: uuidv4(),
      ...data,
      userId,
      username,
      edited: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return dataStore.create<Comment>('comments', comment);
  }

  async getComments(entityType: string, entityId: string): Promise<Comment[]> {
    return dataStore.findMany<Comment>(
      'comments',
      c => c.entityType === entityType && c.entityId === entityId
    ).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getCommentById(id: string): Promise<Comment> {
    const comment = dataStore.findById<Comment>('comments', id);
    if (!comment) {
      throw new AppError(404, 'Comment not found');
    }
    return comment;
  }

  async updateComment(id: string, content: string, userId: string): Promise<Comment> {
    const comment = await this.getCommentById(id);

    if (comment.userId !== userId) {
      throw new AppError(403, 'You can only edit your own comments');
    }

    const updatedComment = dataStore.update<Comment>('comments', id, {
      content,
      edited: true,
      updatedAt: new Date(),
    });

    if (!updatedComment) {
      throw new AppError(404, 'Comment not found');
    }

    return updatedComment;
  }

  async deleteComment(id: string, userId: string): Promise<void> {
    const comment = await this.getCommentById(id);

    if (comment.userId !== userId) {
      throw new AppError(403, 'You can only delete your own comments');
    }

    // Delete all replies as well
    const replies = dataStore.findMany<Comment>('comments', c => c.parentId === id);
    replies.forEach(reply => {
      dataStore.delete<Comment>('comments', reply.id);
    });

    const success = dataStore.delete<Comment>('comments', id);
    if (!success) {
      throw new AppError(404, 'Comment not found');
    }
  }

  async getReplies(parentId: string): Promise<Comment[]> {
    return dataStore.findMany<Comment>(
      'comments',
      c => c.parentId === parentId
    ).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}

export const commentService = new CommentService();
