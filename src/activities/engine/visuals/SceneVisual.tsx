type Props = { emoji: string; caption?: string };

/** Sahne: bir ya da birkaç emoji ve isteğe bağlı kısa yazı (yazı her zaman ayrıca okunur). */
export function SceneVisual({ emoji, caption }: Props) {
  return (
    <figure className="ex-scene">
      <div className="ex-scene-art" role="img" aria-label={caption ?? emoji}>
        <span aria-hidden>{emoji}</span>
      </div>
      {caption ? <figcaption className="ex-scene-caption">{caption}</figcaption> : null}
    </figure>
  );
}
