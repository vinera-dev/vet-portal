import { createVetApi, type VetApi } from "./vet-api/client";

export const DEFAULT_VET_API_URL = "http://127.0.0.1:8000";

export function getVetApiUrl(): string {
  return process.env.VET_API_URL ?? DEFAULT_VET_API_URL;
}

let cached: VetApi | undefined;

export function getVetApi(): VetApi {
  cached ??= createVetApi({ baseUrl: getVetApiUrl() });
  return cached;
}
