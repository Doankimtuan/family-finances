import { AccountType } from "@/modules/ledger/application";
import { AccountCreatePage } from "../account-create-page";

type Props = { params: Promise<{ locale: string }> };

export default async function AddCreditAccountPage({ params }: Props) {
  const { locale } = await params;
  return (
    <AccountCreatePage locale={locale} fixedType={AccountType.CREDIT_CARD} />
  );
}
