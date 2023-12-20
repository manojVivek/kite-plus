import pLimit from 'p-limit';
import {Instrument, XirrRequest, XirrResponse} from '../common/constants';

const limit = pLimit(8);

const fetchXirr = async (instrumentId: string, token: string): Promise<number> => {
  try {
    const {data} = await fetch(
      `https://console.zerodha.com/api/reports/xirr?segment=EQ&instrument_id=${instrumentId}`,
      {
        headers: {
          'X-Csrftoken': token.replaceAll('"', ''),
          'X-Extension': 'true',
        },
        credentials: 'include',
      }
    ).then(res => res.json());
    return Number(data.result);
  } catch (e) {
    console.log('error', e);
  }
  return 0;
};

export const handleXirrRequest = async (request: XirrRequest): Promise<XirrResponse> => {
  const token: string = request.token;
  const holdings: Instrument[] = request.holdings;
  const xirrs: Record<string, number> = {};
  await Promise.all(
    holdings.map(async holding => {
      const instrumentId = holding.instrument_id;
      await limit(async () => {
        const xirr = await fetchXirr(instrumentId, token);
        xirrs[holding.tradingsymbol] = xirr;
      });
    })
  );

  console.log('xirrs', xirrs);

  return {xirrs};
};
