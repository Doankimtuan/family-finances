/**
 * Savings route layout is read-only. Household lifecycle maintenance must
 * run through an explicit mutation boundary, never this GET tree.
 */
export default function SavingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
