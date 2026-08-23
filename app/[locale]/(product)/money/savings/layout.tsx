import { SavingsLifecycleSync } from "./savings-lifecycle-sync";

export default function SavingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SavingsLifecycleSync />
      {children}
    </>
  );
}
