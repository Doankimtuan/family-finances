import { ProductStub } from "@/shared/patterns/product-stub";
import { Text } from "@/shared/ui/text";

/** IA route scaffold — home. No business logic. */
export default function Page() {
  return (
    <ProductStub
      title="Home"
      lead={
        <Text tone="secondary" size="sm" className="leading-relaxed">
          A quiet place for what matters today.
        </Text>
      }
      emptyTitle="No activity yet"
      emptyDescription="When something needs attention, it will show up here."
    />
  );
}
