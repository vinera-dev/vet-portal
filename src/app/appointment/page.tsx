import type { Metadata } from "next";
import { AppointmentManager } from "@/components/AppointmentManager";
import { formatLocalToday } from "@/lib/datetime";

export const metadata: Metadata = { title: "Manage an appointment" };

export const dynamic = "force-dynamic";

interface AppointmentPageProps {
  searchParams: Promise<{ code?: string | string[] }>;
}

export default async function AppointmentPage({ searchParams }: AppointmentPageProps) {
  const { code } = await searchParams;
  const initialCode = Array.isArray(code) ? code[0] : code;
  return (
    <>
      <h1>Manage an appointment</h1>
      <p>Enter the code you received when booking to view, reschedule or cancel it.</p>
      <AppointmentManager today={formatLocalToday()} initialCode={initialCode} />
    </>
  );
}
