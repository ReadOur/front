/**
 * 조건부 클래스명을 생성하는 유틸리티 함수
 * @example
 * cn('btn', isActive && 'active', { 'btn-primary': isPrimary })
 * // => 'btn active btn-primary'
 */
export function cn(...args: (string | boolean | undefined | null | Record<string, boolean>)[]): string {
  const classes: string[] = [];

  for (const arg of args) {
    if (!arg) continue;

    if (typeof arg === 'string') {
      classes.push(arg);
    } else if (typeof arg === 'object') {
      for (const [key, value] of Object.entries(arg)) {
        if (value) classes.push(key);
      }
    }
  }

  return classes.join(' ');
}

/**
 * 여러 클래스명을 결합하는 간단한 함수
 */
export function clsx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
