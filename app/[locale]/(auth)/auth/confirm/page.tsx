import { ConfirmScreen } from "./confirm-screen";

type Props = {
  searchParams: Promise<{ status?: string; code?: string }>;
};

export default async function AuthConfirmPage({ searchParams }: Props) {
  const params = await searchParams;
  const statusParam = params.status;
  const status =
    statusParam === "ok" || statusParam === "error" ? statusParam : "pending";

  return <ConfirmScreen status={status} code={params.code} />;
}
