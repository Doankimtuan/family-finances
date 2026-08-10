import { InvestmentFormMode } from "@/modules/investments/application";
import { InvestmentOperationPage } from "../investment-operation-page";
export default function Page() { return <InvestmentOperationPage mode={InvestmentFormMode.CONVERSION} />; }
