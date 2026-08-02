import { PlanDestinationStub } from "../plan-destination-stub";

type Props = { params: Promise<{ locale: string }> };

export default function PlanJarsStubPage({ params }: Props) {
  return (
    <PlanDestinationStub
      params={params}
      stubKey="jars"
      testId="plan-jars-stub"
    />
  );
}
