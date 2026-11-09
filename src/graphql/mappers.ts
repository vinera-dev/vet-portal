import type { Slot } from "@/gql/generated";
import { timeOf } from "@/lib/datetime";

export function toSlot(start: string): Slot {
  return { start, time: timeOf(start) };
}
