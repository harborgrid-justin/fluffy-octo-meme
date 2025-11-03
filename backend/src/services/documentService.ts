// BE-012: Document Upload/Attachment Service
import { v4 as uuidv4 } from 'uuid';
import { Document } from '../types';
import { dataStore } from './dataStore';
import { AppError } from '../middleware/errorHandler';

export class DocumentService {
  async uploadDocument(data: {
    entityType: string;
    entityId: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
    description?: string;
    tags?: string[];
  }, uploadedBy: string): Promise<Document> {
    const document: Document = {
      id: uuidv4(),
      ...data,
      uploadedBy,
      uploadedAt: new Date(),
    };

    return dataStore.create<Document>('documents', document);
  }

  async getDocuments(entityType: string, entityId: string): Promise<Document[]> {
    return dataStore.findMany<Document>(
      'documents',
      doc => doc.entityType === entityType && doc.entityId === entityId
    ).sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }

  async getDocumentById(id: string): Promise<Document> {
    const document = dataStore.findById<Document>('documents', id);
    if (!document) {
      throw new AppError(404, 'Document not found');
    }
    return document;
  }

  async deleteDocument(id: string): Promise<void> {
    const success = dataStore.delete<Document>('documents', id);
    if (!success) {
      throw new AppError(404, 'Document not found');
    }
    // In production, also delete the file from storage
  }

  async searchDocuments(query: {
    entityType?: string;
    tags?: string[];
    uploadedBy?: string;
  }): Promise<Document[]> {
    let documents = dataStore.findAll<Document>('documents');

    if (query.entityType) {
      documents = documents.filter(doc => doc.entityType === query.entityType);
    }

    if (query.uploadedBy) {
      documents = documents.filter(doc => doc.uploadedBy === query.uploadedBy);
    }

    if (query.tags && query.tags.length > 0) {
      documents = documents.filter(doc =>
        doc.tags && query.tags!.some(tag => doc.tags!.includes(tag))
      );
    }

    return documents.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }
}

export const documentService = new DocumentService();
