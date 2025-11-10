import { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

/**
 * 로딩 스켈레톤 UI 컴포넌트
 */
export default function Skeleton({
  variant = 'rectangular',
  width,
  height,
  className = '',
  ...props
}: SkeletonProps) {
  const baseClass = 'animate-pulse bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%]';

  const variantClass = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  }[variant];

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`${baseClass} ${variantClass} ${className}`}
      style={style}
      {...props}
    />
  );
}

/**
 * 게시글 카드 스켈레톤
 */
export function PostCardSkeleton() {
  return (
    <div className="p-4 border border-[color:var(--color-border-subtle)] rounded-xl bg-[color:var(--color-bg-elev-1)]">
      <div className="flex justify-between items-start mb-3">
        <Skeleton width="60%" height={24} />
        <Skeleton variant="text" width={80} height={20} />
      </div>
      <Skeleton variant="text" width="100%" className="mb-2" />
      <Skeleton variant="text" width="85%" className="mb-4" />
      <div className="flex gap-4">
        <Skeleton variant="text" width={60} height={16} />
        <Skeleton variant="text" width={80} height={16} />
        <Skeleton variant="text" width={70} height={16} />
      </div>
    </div>
  );
}

/**
 * 게시글 목록 스켈레톤
 */
export function PostListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <PostCardSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * 댓글 스켈레톤
 */
export function CommentSkeleton() {
  return (
    <div className="p-3 border-b border-[color:var(--color-border-subtle)]">
      <div className="flex items-center gap-2 mb-2">
        <Skeleton variant="circular" width={32} height={32} />
        <Skeleton variant="text" width={100} height={16} />
        <Skeleton variant="text" width={80} height={14} />
      </div>
      <Skeleton variant="text" width="90%" height={16} />
    </div>
  );
}
