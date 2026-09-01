import { HomeClient } from "@/components/HomeClient";
import { getActivityLearningPreviews } from "@/lib/activityLearning";

export default function HomePage() {
  return <HomeClient learningPreviews={getActivityLearningPreviews()} />;
}
