import { ProductStub } from "@/shared/patterns/product-stub";

/** IA route scaffold — together. No business logic. */
export default function Page() {
  return (
    <ProductStub
      title="Together"
      emptyTitle="No partners yet"
      emptyDescription="Shared space for the people in this household."
    />
  );
}
