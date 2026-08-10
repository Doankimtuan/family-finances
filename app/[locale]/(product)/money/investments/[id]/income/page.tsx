import { InvestmentFormMode } from "@/modules/investments/application";
import { InvestmentOperationPage } from "../../investment-operation-page";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <InvestmentOperationPage mode={InvestmentFormMode.INCOME} holdingId={(await params).id} />; }
