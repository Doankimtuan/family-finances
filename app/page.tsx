import { Heading } from "@/shared/ui/heading";
import { Text } from "@/shared/ui/text";
import { OpenAppButton } from "./open-app-button";

export default function LandingPage() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-(--space-6) text-center">
      <div className="flex w-full max-w-[var(--app-viewport-max)] flex-col items-center gap-(--space-5)">
        <Heading
          level={1}
          className="text-[2.75rem] leading-none tracking-tight text-text-primary sm:text-5xl"
        >
          ViNha
        </Heading>
        <Text tone="secondary" size="base" className="max-w-[18rem]">
          Shared money, calmly kept.
        </Text>
        <OpenAppButton />
      </div>
    </div>
  );
}
