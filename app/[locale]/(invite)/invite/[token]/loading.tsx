import { AuthScreenShell } from "@/shared/patterns/auth-screen-shell";
import { Skeleton } from "@/shared/ui/skeleton";

export default function Loading() {
  return (
    <AuthScreenShell testId="invite-loading">
      <div className="flex flex-col gap-(--space-4)" aria-hidden>
        <Skeleton className="h-8 w-8 rounded-(--radius-control)" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="mt-(--space-4) flex flex-col gap-(--space-2)">
          <Skeleton className="h-14 w-full rounded-(--radius-control)" />
          <Skeleton className="h-11 w-full rounded-(--radius-control)" />
        </div>
      </div>
    </AuthScreenShell>
  );
}
