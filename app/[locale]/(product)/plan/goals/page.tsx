import { PlanDestinationStub } from "../plan-destination-stub";

type Props = { params: Promise<{ locale: string }> };

export default function PlanGoalsStubPage({ params }: Props) {
  return (
    <PlanDestinationStub
      params={params}
      stubKey="goals"
      testId="plan-goals-stub"
    />
  );
}
