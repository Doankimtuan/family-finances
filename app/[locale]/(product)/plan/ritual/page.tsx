import { PlanDestinationStub } from "../plan-destination-stub";

type Props = { params: Promise<{ locale: string }> };

export default function PlanRitualStubPage({ params }: Props) {
  return (
    <PlanDestinationStub
      params={params}
      stubKey="ritual"
      testId="plan-ritual-stub"
    />
  );
}
