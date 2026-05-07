import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  AiAnalysis,
  CreateExamAnalysisPayload,
  ExamAnalysisDocument,
  ExamCategory,
  FileUploadResult,
} from "./types";

export interface NoSqlDocumentRepository<T> {
  insert(document: T): Promise<T>;
}

export interface FileUploader {
  uploadFile(params: {
    filePath: string;
    content: ArrayBuffer | Uint8Array;
    contentType: string;
  }): Promise<FileUploadResult>;
}

export class SupabaseStorageUploader implements FileUploader {
  private readonly client: SupabaseClient;
  private readonly bucketName: string;

  constructor(supabaseUrl: string, serviceRoleKey: string, bucketName: string) {
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase storage uploader requires URL and service role key.");
    }

    this.client = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
      },
    });
    this.bucketName = bucketName;
  }

  async uploadFile(params: {
    filePath: string;
    content: ArrayBuffer | Uint8Array;
    contentType: string;
  }): Promise<FileUploadResult> {
    const { filePath, content, contentType } = params;
    const { error: uploadError } = await this.client.storage
      .from(this.bucketName)
      .upload(filePath, content, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Error uploading exam file: ${uploadError.message}`);
    }

    const { data: signedUrlData, error: signedUrlError } = await this.client.storage
      .from(this.bucketName)
      .createSignedUrl(filePath, 60 * 60);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw new Error(`Error generating signed file URL: ${signedUrlError?.message ?? "missing signedUrl"}`);
    }

    return {
      fileUrl: signedUrlData.signedUrl,
      filePath,
    };
  }
}

export class SupabaseExamAnalysisRepository implements NoSqlDocumentRepository<ExamAnalysisDocument> {
  private readonly client: SupabaseClient;
  private readonly tableName: string;

  constructor(supabaseUrl: string, serviceRoleKey: string, tableName = "exam_analysis_documents") {
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase repository requires URL and service role key.");
    }

    this.client = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
      },
    });
    this.tableName = tableName;
  }

  async insert(document: ExamAnalysisDocument): Promise<ExamAnalysisDocument> {
    const response = await this.client
      .from(this.tableName)
      .insert(document)
      .select()
      .single();

    const { data, error } = response as {
      data: ExamAnalysisDocument | null;
      error: { message: string } | null;
    };

    if (error) {
      throw new Error(`Error persisting exam analysis document: ${error.message}`);
    }

    if (!data) {
      throw new Error("No data returned when persisting exam analysis document.");
    }

    return data;
  }
}

export class ExamAnalysisService {
  constructor(
    private readonly fileUploader: FileUploader,
    private readonly documentRepository: NoSqlDocumentRepository<ExamAnalysisDocument>,
  ) {}

  async saveExamAnalysis(payload: CreateExamAnalysisPayload): Promise<ExamAnalysisDocument> {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const filePath = `exam-files/${payload.userId}/${id}-${payload.fileName}`;

    const uploadResult = await this.fileUploader.uploadFile({
      filePath,
      content: payload.fileContent,
      contentType: payload.contentType,
    });

    const document: ExamAnalysisDocument = {
      id,
      userId: payload.userId,
      title: payload.title,
      examDate: payload.examDate,
      category: payload.category,
      fileUrl: uploadResult.fileUrl,
      fileName: payload.fileName,
      aiAnalysis: payload.aiAnalysis,
      createdAt,
      updatedAt: createdAt,
    };

    return this.documentRepository.insert(document);
  }
}

export function buildCreateExamAnalysisPayload(params: {
  userId: string;
  title: string;
  examDate: string;
  category: ExamCategory;
  fileName: string;
  fileContent: ArrayBuffer | Uint8Array;
  contentType: string;
  aiAnalysis: AiAnalysis;
}): CreateExamAnalysisPayload {
  return {
    userId: params.userId,
    title: params.title,
    examDate: params.examDate,
    category: params.category,
    fileName: params.fileName,
    fileContent: params.fileContent,
    contentType: params.contentType,
    aiAnalysis: params.aiAnalysis,
  };
}
