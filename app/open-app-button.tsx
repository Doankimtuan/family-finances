"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";

export function OpenAppButton() {
  const router = useRouter();

  return (
    <Button
      variant="primary"
      size="md"
      className="min-h-11 min-w-[10rem] px-(--space-6)"
      onPress={() => router.push("/home")}
    >
      Open app
    </Button>
  );
}
