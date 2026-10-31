"use client";

import { useParentMode } from "@/lib/auth";
import type { EncyclopediaSource } from "@/lib/encyclopedia";

type Props = { title: string; sources: EncyclopediaSource[] };

/**
 * Adult sources for a topic. Links render only in parent mode (CONTRACT §0.7:
 * no external href on the child surface); otherwise title + organisation as
 * plain text. The static HTML is always the plain-text version.
 */
export function TopicSources({ title, sources }: Props) {
  const parentMode = useParentMode();
  return (
    <ul aria-label={`${title} için yetişkin kaynakları`}>
      {sources.map((source) => (
        <li key={source.url}>
          {parentMode ? (
            <a href={source.url} rel="noreferrer">
              {source.title}
            </a>
          ) : (
            <span>{source.title}</span>
          )}
          {" — "}
          {source.organization}
        </li>
      ))}
    </ul>
  );
}
