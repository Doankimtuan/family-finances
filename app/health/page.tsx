import { redirect } from "next/navigation";

export const metadata = {
  title: "Financial Health | Family Finances",
};

export default function HealthPage() {
  redirect("/dashboard");
}
