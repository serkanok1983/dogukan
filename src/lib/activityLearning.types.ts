import type { Guide } from "./guides";

export type ActivityKnowledge = {
  /** Çocuğun oyunda yaptığı eylem ile öğrenme hedefi arasındaki kısa köprü. */
  idea: string;
  concept: {
    term: string;
    definition: string;
  };
  realLife: string;
  talkQuestion: string;
  relatedTopicSlug: string;
};

export type ActivityLearning = ActivityKnowledge & {
  guide: Guide;
  relatedTopic: {
    slug: string;
    title: string;
    emoji: string;
    summary: string;
  };
};

export type ActivityLearningPreview = {
  concept: string;
  relatedTopicSlug: string;
  relatedTopicTitle: string;
  relatedTopicEmoji: string;
};

export type ActivityLearningPreviews = Record<string, ActivityLearningPreview>;
