/**
 * 파일 업로드 컴포넌트
 * - 드래그 앤 드롭 지원
 * - 파일 선택 지원
 * - 업로드 진행률 표시
 * - 미리보기 (이미지)
 * - 파일 삭제
 */

import React, { useState, useRef, useCallback } from 'react';
import { uploadTempFiles, formatFileSize, isImageFile } from '@/api/files';
import { Attachment } from '@/types/post';
import { useToast } from '@/components/Toast/ToastProvider';

export interface FileUploadProps {
  /** 업로드된 파일 목록 */
  attachments: Attachment[];
  /** 파일 목록 변경 콜백 */
  onChange: (attachments: Attachment[]) => void;
  /** 임시 업로드 ID (같은 tempId로 묶인 파일들은 같은 그룹으로 관리) */
  tempId?: string | number;
  /** 임시 업로드 ID 변경 콜백 */
  onTempIdChange?: (tempId: string | number) => void;
  /** 최대 파일 개수 */
  maxFiles?: number;
  /** 최대 파일 크기 (바이트) */
  maxFileSize?: number;
  /** 허용할 파일 타입 (MIME 타입, 예: "image/*", "application/pdf") */
  accept?: string;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 클래스명 */
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  attachments,
  onChange,
  tempId,
  onTempIdChange,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  accept,
  disabled = false,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, number>>(new Map()); // 파일명 -> 진행률
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  /**
   * 파일 업로드 처리
   */
  const handleUpload = useCallback(
    async (files: File[]) => {
      if (disabled) return;

      // 최대 파일 개수 체크
      if (attachments.length + files.length > maxFiles) {
        toast.show({
          title: `최대 ${maxFiles}개의 파일만 업로드할 수 있습니다.`,
          variant: 'warning',
        });
        return;
      }

      // 파일 크기 체크
      const oversizedFiles = files.filter((file) => file.size > maxFileSize);
      if (oversizedFiles.length > 0) {
        toast.show({
          title: `파일 크기는 ${formatFileSize(maxFileSize)}를 초과할 수 없습니다.`,
          variant: 'warning',
        });
        return;
      }

      // 파일 업로드
      const newUploadingFiles = new Map(uploadingFiles);

      for (const file of files) {
        newUploadingFiles.set(file.name, 0);
      }
      setUploadingFiles(newUploadingFiles);

      try {
        // 임시 업로드 API 사용 (여러 파일을 한 번에 업로드)
        const { tempId: nextTempId, attachments: uploadedAttachments } = await uploadTempFiles({
          files,
          tempId: tempId ? String(tempId) : undefined,
          onProgress: (progress) => {
            // 전체 진행률을 각 파일에 동일하게 적용 (간단한 구현)
            setUploadingFiles((prev) => {
              const next = new Map(prev);
              files.forEach((file) => {
                next.set(file.name, progress);
              });
              return next;
            });
          },
        });

        console.log('[FileUpload] uploadTempFiles 응답 받음:', {
          nextTempId: nextTempId,
          nextTempIdType: typeof nextTempId,
          uploadedAttachments: uploadedAttachments,
          uploadedIds: uploadedAttachments.map((a) => a.id),
        });

        // tempId 업데이트
        if (onTempIdChange && nextTempId) {
          console.log('[FileUpload] tempId 업데이트:', {
            previousTempId: tempId,
            previousTempIdType: typeof tempId,
            newTempId: nextTempId,
            newTempIdType: typeof nextTempId,
          });
          onTempIdChange(nextTempId);
        }

        // 업로드 완료 후 목록 업데이트
        const newAttachments = [...attachments, ...uploadedAttachments];
        console.log('[FileUpload] 파일 업로드 완료:', {
          uploadedFiles: uploadedAttachments,
          uploadedIds: uploadedAttachments.map((a) => a.id),
          previousAttachments: attachments,
          previousIds: attachments.map((a) => a.id),
          newAttachments: newAttachments,
          newIds: newAttachments.map((a) => a.id),
        });
        onChange(newAttachments);

        // 업로드 중인 파일 목록에서 제거
        setUploadingFiles(new Map());

        toast.show({
          title: `${files.length}개의 파일이 업로드되었습니다.`,
          variant: 'success',
        });
      } catch (error: any) {
        console.error('File upload error:', error);
        const message = error?.response?.data?.message || '파일 업로드에 실패했습니다.';
        toast.show({
          title: message,
          variant: 'error',
        });
        setUploadingFiles(new Map());
      }
    },
    [
      attachments,
      disabled,
      maxFiles,
      maxFileSize,
      onChange,
      toast,
      uploadingFiles,
      tempId,
      onTempIdChange,
    ],
  );

  /**
   * 파일 선택 핸들러
   */
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        handleUpload(files);
      }
      // input 초기화 (같은 파일 재선택 가능하도록)
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleUpload],
  );

  /**
   * 드래그 오버 핸들러
   */
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled],
  );

  /**
   * 드래그 리브 핸들러
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  /**
   * 드롭 핸들러
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleUpload(files);
      }
    },
    [disabled, handleUpload],
  );

  /**
   * 파일 삭제 핸들러
   */
  const handleRemove = useCallback(
    (attachmentId: number | string) => {
      onChange(attachments.filter((a) => String(a.id) !== String(attachmentId)));
    },
    [attachments, onChange],
  );

  /**
   * 파일 선택 버튼 클릭
   */
  const handleButtonClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  return (
    <div className={className}>
      {/* 드래그 앤 드롭 영역 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-[var(--radius-md)]
          transition-colors duration-200
          ${
            isDragging
              ? 'border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10'
              : 'border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-1)]'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onClick={handleButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />

        <div className="p-8 text-center">
          <div className="text-4xl mb-3">📎</div>
          <p className="text-[color:var(--color-fg-primary)] font-medium mb-1">
            파일을 드래그하거나 클릭하여 선택하세요
          </p>
          <p className="text-sm text-[color:var(--color-fg-muted)]">
            최대 {maxFiles}개, 파일당 최대 {formatFileSize(maxFileSize)}
          </p>
        </div>
      </div>

      {/* 업로드 중인 파일 목록 */}
      {uploadingFiles.size > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-[color:var(--color-fg-muted)]">업로드 중...</p>
          {Array.from(uploadingFiles.entries()).map(([fileName, progress]) => (
            <div
              key={fileName}
              className="bg-[color:var(--color-bg-elev-2)] rounded-[var(--radius-md)] p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[color:var(--color-fg-primary)] truncate">
                  {fileName}
                </span>
                <span className="text-xs text-[color:var(--color-fg-muted)] ml-2">{progress}%</span>
              </div>
              <div className="w-full bg-[color:var(--color-bg-elev-1)] rounded-full h-2">
                <div
                  className="bg-[color:var(--color-accent)] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 업로드된 파일 목록 */}
      {attachments.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-[color:var(--color-fg-muted)]">
            첨부파일 ({attachments.length})
          </p>
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 bg-[color:var(--color-bg-elev-2)] rounded-[var(--radius-md)] p-3 group hover:bg-[color:var(--color-bg-elev-1)] transition-colors"
            >
              {/* 파일 아이콘 또는 이미지 미리보기 */}
              <div className="flex-shrink-0 w-10 h-10 rounded overflow-hidden bg-[color:var(--color-bg-elev-1)] flex items-center justify-center">
                {isImageFile(attachment.mimeType || attachment.contentType) ? (
                  <img
                    src={attachment.fileUrl || attachment.url}
                    alt={attachment.fileName || attachment.originalFilename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl">📄</span>
                )}
              </div>

              {/* 파일 정보 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[color:var(--color-fg-primary)] truncate">
                  {attachment.fileName || attachment.originalFilename}
                </p>
                <p className="text-xs text-[color:var(--color-fg-muted)]">
                  {formatFileSize(attachment.fileSize || attachment.size)}
                </p>
              </div>

              {/* 삭제 버튼 */}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(attachment.id);
                  }}
                  className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-[color:var(--color-error)] hover:text-white text-[color:var(--color-fg-muted)] flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="파일 삭제"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
