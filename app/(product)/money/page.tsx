import { ProductStub } from "@/shared/patterns/product-stub";

/** IA route scaffold — money. No business logic. */
export default function Page() {
  return (
    <ProductStub
      title="Money"
      emptyTitle="No money yet"
      emptyDescription="Jars and balances will live here when you start tracking."
    />
  );
}
