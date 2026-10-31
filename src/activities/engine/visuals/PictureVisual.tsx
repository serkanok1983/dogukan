type Props = { emoji: string; alt: string };

/** Tek büyük resim. */
export function PictureVisual({ emoji, alt }: Props) {
  return (
    <div className="ex-picture" role="img" aria-label={alt}>
      <span aria-hidden>{emoji}</span>
    </div>
  );
}
