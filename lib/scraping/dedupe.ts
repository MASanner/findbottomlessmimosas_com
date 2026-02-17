import { buildDedupeKey } from "@/lib/utils";

export function getDedupeKey(name: string, address: string, city: string, state: string): string {
  return buildDedupeKey(name, address, city, state);
}
