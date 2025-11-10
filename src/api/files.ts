/**
 * 파일 관련 API
 * - 첨부파일 업로드, 삭제, 다운로드 등
 */

import { apiClient } from './client';
import { ATTACHMENT_ENDPOINTS } from './endpoints';
import { Attachment } from '@/types/post';

/**
 * 파일 업로드 응답
 */
export interface UploadFileResponse {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

/**
 * 파일 업로드
 * @param file 업로드할 파일
 * @param onProgress 업로드 진행률 콜백 (0-100)
 * @returns 업로드된 파일 정보
 */
export async function uploadFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<Attachment> {
  const formData = new FormData();
  formData.append('file', file);

  return apiClient.upload<Attachment>(
    ATTACHMENT_ENDPOINTS.UPLOAD,
    formData,
    (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    }
  );
}

/**
 * 여러 파일 업로드
 * @param files 업로드할 파일 배열
 * @param onProgress 전체 진행률 콜백 (0-100)
 * @returns 업로드된 파일 정보 배열
 */
export async function uploadFiles(
  files: File[],
  onProgress?: (progress: number) => void
): Promise<Attachment[]> {
  const results: Attachment[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const attachment = await uploadFile(file, (fileProgress) => {
      // 전체 진행률 계산: (완료된 파일 개수 + 현재 파일 진행률) / 전체 파일 개수
      const totalProgress = Math.round(((i + fileProgress / 100) / files.length) * 100);
      onProgress?.(totalProgress);
    });
    results.push(attachment);
  }

  return results;
}

/**
 * 파일 삭제
 * @param attachmentId 삭제할 첨부파일 ID
 */
export async function deleteFile(attachmentId: string): Promise<void> {
  return apiClient.delete(ATTACHMENT_ENDPOINTS.DELETE(attachmentId));
}

/**
 * 파일 다운로드 URL 가져오기
 * @param attachmentId 첨부파일 ID
 * @returns 다운로드 URL
 */
export function getDownloadUrl(attachmentId: string): string {
  // API 베이스 URL이 상대 경로면 절대 경로로 변환
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const downloadPath = ATTACHMENT_ENDPOINTS.DOWNLOAD(attachmentId);

  // 절대 URL인 경우 그대로 사용
  if (baseUrl.startsWith('http')) {
    return `${baseUrl}${downloadPath}`;
  }

  // 상대 경로인 경우 현재 origin과 결합
  return `${window.location.origin}${baseUrl}${downloadPath}`;
}

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환
 * @param bytes 바이트 단위 파일 크기
 * @returns 읽기 쉬운 형식 (예: "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * 파일이 이미지인지 확인
 * @param mimeType MIME 타입
 * @returns 이미지 여부
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * 파일 서비스 객체
 */
export const fileService = {
  uploadFile,
  uploadFiles,
  deleteFile,
  getDownloadUrl,
  formatFileSize,
  isImageFile,
};

export default fileService;
