/**
 * Oyun parçası yüklenirken gösterilen yer tutucu (S8). `next/dynamic`
 * `loading` seçeneğinde kullanılır; depolama ya da tarayıcı API'si okumaz.
 */
export function GameSkeleton() {
  return (
    <div className="game-panel pwa-skeleton" role="status" aria-label="Oyun hazırlanıyor">
      <span className="pwa-skeleton-emoji" aria-hidden>
        🐻
      </span>
      <span className="pwa-skeleton-bar" aria-hidden />
    </div>
  );
}
