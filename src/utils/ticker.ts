export const sanitizeTicker = (ticker: string) => {
  if (
    ticker.endsWith('-BE') ||
    ticker.endsWith('-E1') ||
    ticker.endsWith('-EQ') ||
    ticker.endsWith('-BL') ||
    ticker.endsWith('-BT') ||
    ticker.endsWith('-GC') ||
    ticker.endsWith('-IL') ||
    ticker.endsWith('-IQ') ||
    ticker.endsWith('-ST') ||
    ticker.endsWith('-SM')
  ) {
    ticker = ticker.slice(0, -3);
  }
  return ticker;
};
