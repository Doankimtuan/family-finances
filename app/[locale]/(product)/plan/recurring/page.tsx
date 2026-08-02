import { PlanDestinationStub } from "../plan-destination-stub";

type Props = { params: Promise<{ locale: string }> };

export default function PlanRecurringStubPage({ params }: Props) {
  return (
    <PlanDestinationStub
      params={params}
      stubKey="recurring"
      testId="plan-recurring-stub"
    />
  );
}
