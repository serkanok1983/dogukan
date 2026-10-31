import type { ReactNode } from "react";

export function Card({
  id,
  title,
  icon,
  children,
}: {
  id: string;
  title: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    <section className="parent-card" id={id} aria-labelledby={`${id}-title`}>
      <h2 className="parent-card-title" id={`${id}-title`}>
        <span aria-hidden>{icon}</span> {title}
      </h2>
      {children}
    </section>
  );
}
