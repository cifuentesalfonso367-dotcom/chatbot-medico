export enum ExamCategory {
  BLOOD_TEST = "BLOOD_TEST",
  IMAGING = "IMAGING",
  URINALYSIS = "URINALYSIS",
  CARDIOLOGY = "CARDIOLOGY",
  OTHER = "OTHER",
}

export interface AiAnalysis {
  simplifiedAnalysis: string;
  structuredData: Record<string, unknown>;
}

export interface ExamAnalysisDocument {
  id: string;
  userId: string;
  title: string;
  examDate: string;
  category: ExamCategory;
  fileUrl: string;
  fileName: string;
  aiAnalysis: AiAnalysis;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExamAnalysisPayload {
  userId: string;
  title: string;
  examDate: string;
  category: ExamCategory;
  fileName: string;
  fileContent: ArrayBuffer;
  contentType: string;
  aiAnalysis: AiAnalysis;
}

export interface FileUploadResult {
  fileUrl: string;
  filePath: string;
}

export const examAnalysisCollectionSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    userId: { type: "string" },
    title: { type: "string" },
    examDate: { type: "string", format: "date-time" },
    category: {
      type: "string",
      enum: [
        ExamCategory.BLOOD_TEST,
        ExamCategory.IMAGING,
        ExamCategory.URINALYSIS,
        ExamCategory.CARDIOLOGY,
        ExamCategory.OTHER,
      ],
    },
    fileUrl: { type: "string", format: "uri" },
    fileName: { type: "string" },
    aiAnalysis: {
      type: "object",
      properties: {
        simplifiedAnalysis: { type: "string" },
        structuredData: { type: "object" },
      },
      required: ["simplifiedAnalysis", "structuredData"],
      additionalProperties: true,
    },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
  required: [
    "id",
    "userId",
    "title",
    "examDate",
    "category",
    "fileUrl",
    "fileName",
    "aiAnalysis",
    "createdAt",
    "updatedAt",
  ],
  additionalProperties: false,
} as const;
