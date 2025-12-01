/**
 * 파일 관련 API
 * - 파일 업로드, 메타데이터 조회, 다운로드 등
 */

import { apiClient } from './client';
import { FILE_ENDPOINTS, type FileTargetType } from './endpoints';
import { Attachment } from '@/types/post';
import { getAccessToken } from '@/utils/auth';

export function composeFileTargetId(
  targetType: FileTargetType,
  userId?: string | number | null,
  postId?: string | number | null
): number {
  const prefix = targetType === 'POST' ? '1' : '2';
  const userPart = userId !== undefined && userId !== null ? String(userId) : '0';
  const postPart = postId !== undefined && postId !== null ? String(postId) : '0';
  const numeric = Number(`${prefix}${userPart}${postPart}`);

  return Number.isNaN(numeric) ? 0 : numeric;
}

/**
 * 파일 업로드 파라미터
 */
export interface UploadFileParams {
  file: File;
  targetType: FileTargetType;
  targetId: number | string;
  onProgress?: (progress: number) => void;
}

/**
 * 여러 파일 업로드 파라미터
 */
export interface UploadFilesParams {
  files: File[];
  targetType: FileTargetType;
  targetId: number | string;
  onProgress?: (progress: number) => void;
}

export interface TempUploadResponseFile {
  id: number; // 파일 ID (attachmentId로 사용)
  url: string;
  originalFilename: string;
  contentType: string;
  size: number;
  ownerUserId: number;
  downloadUrl: string;
}

export interface TempUploadResponse {
  tempId: string;
  files: TempUploadResponseFile[];
}

export interface UploadTempFilesParams {
  files: File[];
  tempId?: string;
  onProgress?: (progress: number) => void;
}

/**
 * 파일 업로드 (단일)
 * @param params 업로드 파라미터
 * @returns 업로드된 파일 정보 배열 (API는 항상 배열로 반환)
 */
export async function uploadFile(params: UploadFileParams): Promise<Attachment> {
  const { file, targetType, targetId, onProgress } = params;
  const formData = new FormData();
  formData.append('file', file);

  const result = await apiClient.upload<Attachment[]>(
    FILE_ENDPOINTS.UPLOAD(targetType, targetId),
    formData,
    (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    }
  );

  // API는 배열로 반환하므로 첫 번째 항목 반환
  const attachment = result[0];

  // 호환성을 위한 필드 매핑
  return {
    ...attachment,
    fileName: attachment.originalFilename,
    fileUrl: attachment.url,
    fileSize: attachment.size,
    mimeType: attachment.contentType,
  };
}

/**
 * 여러 파일 업로드
 * @param params 업로드 파라미터
 * @returns 업로드된 파일 정보 배열
 */
export async function uploadFiles(params: UploadFilesParams): Promise<Attachment[]> {
  const { files, targetType, targetId, onProgress } = params;
  const formData = new FormData();

  // 여러 파일을 'files' 필드에 추가
  files.forEach(file => {
    formData.append('files', file);
  });

  const result = await apiClient.upload<Attachment[]>(
    FILE_ENDPOINTS.UPLOAD(targetType, targetId),
    formData,
    (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    }
  );

  // 호환성을 위한 필드 매핑
  return result.map(attachment => ({
    ...attachment,
    fileName: attachment.originalFilename,
    fileUrl: attachment.url,
    fileSize: attachment.size,
    mimeType: attachment.contentType,
  }));
}

/**
 * 임시 파일 업로드 (게시글 초안용)
 */
export async function uploadTempFiles(params: UploadTempFilesParams): Promise<{
  tempId: string;
  attachments: Attachment[];
}> {
  const { files, tempId, onProgress } = params;
  const formData = new FormData();

  files.forEach((file) => {
    formData.append('files', file);
  });

  if (tempId) {
    formData.append('tempId', tempId);
  }

  const result = await apiClient.upload<TempUploadResponse>(
    FILE_ENDPOINTS.TEMP_UPLOAD,
    formData,
    (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    }
  );

  const attachments = (result.files || []).map((file) => ({
    id: file.id, // 응답의 id 필드를 그대로 사용 (attachmentId)
    url: file.url,
    originalFilename: file.originalFilename,
    contentType: file.contentType,
    size: file.size,
    ownerUserId: file.ownerUserId,
    downloadUrl: file.downloadUrl,
    // 프론트엔드 호환성을 위한 계산된 필드
    fileName: file.originalFilename,
    fileUrl: file.url,
    fileSize: file.size,
    mimeType: file.contentType,
  }));

  return { tempId: result.tempId, attachments };
}

/**
 * 파일 메타데이터 조회
 * @param fileId 파일 ID
 * @returns 파일 메타데이터
 */
export async function getFileMetadata(fileId: number): Promise<Attachment> {
  const attachment = await apiClient.get<Attachment>(FILE_ENDPOINTS.METADATA(fileId));

  // 호환성을 위한 필드 매핑
  return {
    ...attachment,
    fileName: attachment.originalFilename,
    fileUrl: attachment.url,
    fileSize: attachment.size,
    mimeType: attachment.contentType,
  };
}

/**
 * 파일 다운로드 URL 가져오기 (토큰 포함)
 * @param fileId 파일 ID
 * @returns 다운로드 URL (토큰 쿼리 파라미터 포함)
 */
export function getDownloadUrl(fileId: number | string): string {
  const id = typeof fileId === 'string' ? parseInt(fileId) : fileId;

  // API 베이스 URL이 상대 경로면 절대 경로로 변환
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const downloadPath = FILE_ENDPOINTS.DOWNLOAD(id);

  // 토큰 가져오기
  const token = getAccessToken();

  // URL 구성
  let url: string;
  if (baseUrl.startsWith('http')) {
    url = `${baseUrl}${downloadPath}`;
  } else {
    url = `${window.location.origin}${baseUrl}${downloadPath}`;
  }

  // 토큰이 있으면 쿼리 파라미터로 추가
  if (token) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}token=${encodeURIComponent(token)}`;
  }

  return url;
}

/**
 * 이미지를 fetch로 가져와서 blob URL 생성 (Authorization 헤더 사용)
 * @param imageUrl 원본 이미지 URL
 * @returns blob URL 또는 원본 URL (S3 URL인 경우)
 */
export async function getImageBlobUrl(imageUrl: string): Promise<string> {
  console.log('[getImageBlobUrl] 이미지 URL:', imageUrl);
  
  // 상대 경로인 경우 절대 경로로 변환
  let absoluteUrl = imageUrl;
  if (imageUrl.startsWith('/')) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    if (baseUrl.startsWith('http')) {
      absoluteUrl = `${baseUrl}${imageUrl}`;
    } else {
      absoluteUrl = `${window.location.origin}${baseUrl}${imageUrl}`;
    }
  } else if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    // 상대 경로인 경우
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    if (baseUrl.startsWith('http')) {
      absoluteUrl = `${baseUrl}/${imageUrl}`;
    } else {
      absoluteUrl = `${window.location.origin}${baseUrl}/${imageUrl}`;
    }
  }

  // S3 URL 등 외부 URL인 경우
  if (absoluteUrl.startsWith('http://') || absoluteUrl.startsWith('https://')) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const apiBase = baseUrl.startsWith('http') ? baseUrl : `${window.location.origin}${baseUrl}`;
    
    // API URL이 아니면 (S3 등) 인증 헤더와 함께 fetch 시도
    if (!absoluteUrl.includes(apiBase) && !absoluteUrl.includes('/api/')) {
      console.log('[getImageBlobUrl] S3 URL 감지, 인증 헤더와 함께 fetch 시도:', absoluteUrl);
      
      // S3 URL도 인증이 필요할 수 있으므로 Authorization 헤더 포함
      try {
        const token = getAccessToken();
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(absoluteUrl, { 
          headers,
          mode: 'cors',
          credentials: 'omit'
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          console.log('[getImageBlobUrl] S3 URL fetch 성공 (인증 포함), blob URL 생성:', blobUrl);
          return blobUrl;
        } else {
          console.warn('[getImageBlobUrl] S3 URL fetch 실패 (status:', response.status, '), 원본 URL 사용');
        }
      } catch (error) {
        console.warn('[getImageBlobUrl] S3 URL fetch 실패 (CORS/인증 등), 원본 URL 사용:', error);
      }
      
      // fetch 실패 시 원본 URL 반환 (브라우저가 직접 시도)
      return absoluteUrl;
    }
  }

  // API를 통해 제공되는 이미지는 fetch로 가져오기
  try {
    const token = getAccessToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('[getImageBlobUrl] API URL fetch 시도:', absoluteUrl);
    const response = await fetch(absoluteUrl, { headers });
    if (!response.ok) {
      throw new Error(`이미지 로드 실패: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    console.log('[getImageBlobUrl] 이미지 로드 성공, blob URL 생성:', blobUrl);
    return blobUrl;
  } catch (error) {
    console.error('[getImageBlobUrl] 이미지 fetch 실패:', error);
    // 실패 시 원본 URL 반환 (브라우저가 직접 시도)
    return absoluteUrl;
  }
}

/**
 * 파일 다운로드 (Blob 반환)
 * @param fileId 파일 ID
 * @returns 파일 Blob
 */
export async function downloadFile(fileId: number): Promise<Blob> {
  const token = getAccessToken();
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const downloadPath = FILE_ENDPOINTS.DOWNLOAD(fileId);
  const url = baseUrl.startsWith('http') 
    ? `${baseUrl}${downloadPath}` 
    : `${window.location.origin}${baseUrl}${downloadPath}`;

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`파일 다운로드 실패: ${response.status} ${response.statusText}`);
  }
  return await response.blob();
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
 * @param mimeType MIME 타입 (또는 contentType)
 * @returns 이미지 여부
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType?.startsWith('image/') || false;
}

/**
 * 파일 서비스 객체
 */
export const fileService = {
  uploadFile,
  uploadFiles,
  uploadTempFiles,
  getFileMetadata,
  downloadFile,
  getDownloadUrl,
  formatFileSize,
  isImageFile,
};

export default fileService;
