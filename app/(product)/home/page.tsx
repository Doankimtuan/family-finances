import { Heading } from "@/shared/ui/heading";
import { Text } from "@/shared/ui/text";

/** IA route scaffold — home. No business logic. */
export default function Page() {
  return (
    <div className="flex flex-col gap-(--space-2)">
      <Heading level={2} className="capitalize">
        home
      </Heading>
      <Text tone="secondary" size="sm">
        Foundation stub — Sprint 0
      </Text>
    </div>
  );
}
