import type { Metadata } from "next";
import { BookingFlow } from "@/components/BookingFlow";
import { formatLocalToday } from "@/lib/datetime";

export const metadata: Metadata = { title: "Book an appointment" };

export const dynamic = "force-dynamic";

export default function BookPage() {
  return (
    <>
      <h1>Book an appointment</h1>
      <p>Pick a day and a time, then tell us about your pet. Appointments last 30 minutes.</p>
      <BookingFlow today={formatLocalToday()} />
    </>
  );
}
