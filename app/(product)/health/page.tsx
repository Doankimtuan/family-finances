import { ProductStub } from "@/shared/patterns/product-stub";

/** IA route scaffold — health. Route-only; not in BottomNav. */
export default function Page() {
  return (
    <ProductStub
      title="Health"
      emptyTitle="Nothing to check"
      emptyDescription="Connection and sync status will show here when available."
    />
  );
}
