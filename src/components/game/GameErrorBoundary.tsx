"use client";

import { Component, Fragment, type ReactNode } from "react";
import { ErrorCard } from "@/components/errors/ErrorCard";
import { recordError } from "@/lib/errors";

type Props = { slug: string; children: ReactNode };
type State = { failed: boolean; slug: string; attempt: number };

/**
 * Bir oyunun içindeki hatayı yakalar; üst çubuk ve kabuk ayakta kalır
 * (CONTRACT §10.9). `slug` değişince kendiliğinden sıfırlanır. Sahibi S8.
 */
export class GameErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, slug: this.props.slug, attempt: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true };
  }

  static getDerivedStateFromProps(
    props: Props,
    state: State,
  ): Partial<State> | null {
    if (props.slug !== state.slug)
      return { slug: props.slug, failed: false, attempt: 0 };
    return null;
  }

  componentDidCatch(error: Error): void {
    recordError(this.props.slug, error);
  }

  private handleRetry = () => {
    // Yeni anahtar, oyunu sıfırdan bağlar (sayfa yenilenmez).
    this.setState((s) => ({ failed: false, attempt: s.attempt + 1 }));
  };

  render(): ReactNode {
    if (this.state.failed) {
      return (
        <ErrorCard
          variant="game"
          title="Oyun biraz yoruldu 😴"
          say="Oyun biraz yoruldu. Tekrar deneyelim mi?"
          onRetry={this.handleRetry}
        />
      );
    }
    return <Fragment key={this.state.attempt}>{this.props.children}</Fragment>;
  }
}
