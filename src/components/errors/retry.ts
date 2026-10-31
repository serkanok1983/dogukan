/**
 * Next 16.2 hata bileşenlerine `unstable_retry` verir (error.md). Ad
 * değişebilir; tek noktadan sarılır. Eski `reset` de yedek olarak denenir.
 */
export type RouteErrorProps = {
  error: Error & { digest?: string };
  unstable_retry?: () => void;
  reset?: () => void;
};

export function retry(props: Pick<RouteErrorProps, "unstable_retry" | "reset">): void {
  (props.unstable_retry ?? props.reset)?.();
}
