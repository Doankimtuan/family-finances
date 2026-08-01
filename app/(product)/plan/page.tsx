import { ProductStub } from "@/shared/patterns/product-stub";

/** IA route scaffold — plan. No business logic. */
export default function Page() {
  return (
    <ProductStub
      title="Plan"
      emptyTitle="Nothing planned"
      emptyDescription="Upcoming rhythms and rituals will appear here."
    />
  );
}
