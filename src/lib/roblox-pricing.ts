export const ROBLOX_GAMEPASS_PRICE_MAP = {
  201: 287,
  501: 716,
  701: 1001,
  1001: 1430,
  2001: 2859,
  5001: 7144,
  10001: 14287,
} as const;

export const ALLOWED_ROBLOX_NOMINALS = Object.keys(ROBLOX_GAMEPASS_PRICE_MAP)
  .map((value) => Number(value))
  .sort((a, b) => a - b);

export function getRequiredGamepassPrice(nominal: number): number | null {
  return ROBLOX_GAMEPASS_PRICE_MAP[nominal as keyof typeof ROBLOX_GAMEPASS_PRICE_MAP] ?? null;
}

export function isAllowedRobloxNominal(nominal: number): boolean {
  return ALLOWED_ROBLOX_NOMINALS.includes(nominal);
}
