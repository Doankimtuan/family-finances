import { ProductStub } from "@/shared/patterns/product-stub";

/** IA route scaffold — inbox. No business logic. */
export default function Page() {
  return (
    <ProductStub
      title="Inbox"
      emptyTitle="Inbox is clear"
      emptyDescription="Items waiting for review will land here."
    />
  );
}
