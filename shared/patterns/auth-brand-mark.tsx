import { BrandMark, type BrandMarkProps } from "@/shared/patterns/brand-mark";

/** Soft Cradle & Seed brand mark used on auth screens. */
export function AuthBrandMark({ className }: { className?: string }) {
  return <BrandMark variant="soft" size="md" className={className} />;
}

export type { BrandMarkProps };
