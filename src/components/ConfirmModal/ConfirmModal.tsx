import React from "react";
import { Modal } from "@/components/Modal/Modal";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger";
  isLoading?: boolean;
}

/**
 * ConfirmModal 컴포넌트
 *
 * 사용자의 확인이 필요한 중요한 액션(삭제 등)에 사용하는 확인 대화상자
 *
 * 사용 예:
 * ```tsx
 * <ConfirmModal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={handleDelete}
 *   title="게시글 삭제"
 *   message="정말로 이 게시글을 삭제하시겠습니까?"
 *   variant="danger"
 * />
 * ```
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "확인",
  cancelText = "취소",
  variant = "default",
  isLoading = false,
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal open={open} onClose={onClose} size="sm" closeOnBackdrop={!isLoading}>
      <div className="space-y-4">
        {/* 제목 */}
        <h3 className="text-lg font-semibold text-[color:var(--color-fg-primary)]">
          {title}
        </h3>

        {/* 메시지 */}
        <p className="text-sm text-[color:var(--color-fg-secondary)] whitespace-pre-wrap">
          {message}
        </p>

        {/* 버튼 그룹 */}
        <div className="flex gap-2 justify-end pt-2">
          {/* 취소 버튼 */}
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-[var(--radius-md)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-elev-1)] text-[color:var(--color-fg-primary)] hover:bg-[color:var(--color-bg-elev-2)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {cancelText}
          </button>

          {/* 확인 버튼 */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-[var(--radius-md)] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              variant === "danger"
                ? "bg-[color:var(--color-error)] text-white hover:bg-[color:var(--color-error)]/90"
                : "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent)]/90"
            }`}
          >
            {isLoading ? "처리 중..." : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
