import { Page } from "@/shared/patterns/page";
import { HOME_TEST_ID } from "@/modules/home/application/home-constants";
import {
  HomeStreamingFallback,
  HomeTopBarFallback,
} from "./home-streaming-sections";

export default function HomeLoading() {
  return (
    <Page
      testId={HOME_TEST_ID.LOADING}
      topBar={<HomeTopBarFallback />}
      contentClassName="gap-(--space-5)"
    >
      <HomeStreamingFallback />
    </Page>
  );
}
