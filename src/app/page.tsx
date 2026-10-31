import { HomeClient } from "@/components/HomeClient";
import { HomeSkeleton } from "@/components/home/HomeSkeleton";

export default function HomePage() {
  // Sıra önemli: HomeClient hazır olunca `.home-live ~ .home-skeleton` iskeleti gizler.
  return (
    <>
      <HomeClient />
      <HomeSkeleton />
    </>
  );
}
