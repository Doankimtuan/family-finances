import { AccountCreatePage } from "../account-create-page";

type Props = { params: Promise<{ locale: string }> };

export default async function AddAccountPage({ params }: Props) {
  const { locale } = await params;
  return <AccountCreatePage locale={locale} />;
}
