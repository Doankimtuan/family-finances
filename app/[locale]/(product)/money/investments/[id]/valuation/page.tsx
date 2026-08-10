import { InvestmentFormMode } from "@/modules/investments/application";
import { InvestmentOperationPage } from "../../investment-operation-page";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <InvestmentOperationPage mode={InvestmentFormMode.VALUATION} holdingId={(await params).id} />; }
