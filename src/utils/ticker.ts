export const sanitizeTicker = (ticker: string) => {
  console.log('sanitizing ticker', ticker);
  if (ticker.includes('-')) {
    ticker = ticker.split('-')[0];
  }
  if (ticker.endsWith('6')) {
    ticker = ticker.slice(0, -1);
  }

  return ticker;
};
