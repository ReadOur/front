import logoSrc from "@/assets/logo.png";
import clsx from "clsx";

type LogoProps = {
  /** 기본 로고 이미지 경로 (교체 가능) */
  src?: string;
  /** 대체 텍스트 */
  alt?: string;
  /** 크기 프리셋 */
  size?: "sm" | "md" | "lg";
  /** 텍스트 라벨(옵션) */
  label?: string;
  /** 텍스트 라벨과의 정렬 방식 */
  align?: "left" | "center";
  /** 라벨 타이포 클래스 오버라이드 */
  labelClassName?: string;
  /** 컨테이너 클래스 오버라이드 */
  className?: string;
};

const sizeMap = {
  sm: "h-6",
  md: "h-8",
  lg: "h-10",
};

export default function Logo({
                               src = logoSrc,
                               alt = "Logo",
                               size = "md",
                               label,
                               align = "left",
                               labelClassName,
                               className,
                             }: LogoProps) {
  return (
    <div
      className={clsx(
        "inline-flex items-center gap-2 select-none",
        align === "center" && "justify-center",
        className
      )}
    >
      <img
        src={src}
        alt={alt}
        className={clsx(sizeMap[size], "w-auto")}
        draggable={false}
      />
      {label && (
        <span
          className={clsx(
            "font-semibold text-gray-800",
            size === "sm" && "text-sm",
            size === "md" && "text-base",
            size === "lg" && "text-lg",
            labelClassName
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}
