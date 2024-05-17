import {z} from 'zod';
import {sanitizeTicker} from '../utils/ticker';

export const GET_XIRR = 'GET_XIRR';
export const GET_PORTFOLIO_XIRR = 'GET_PORTFOLIO_XIRR';

export const InstrumentZod = z
  .object({
    tradingsymbol: z.string(),
    sanitizedTradingsymbol: z.string().optional(),
    instrument_id: z.string(),
    xirr: z.number().or(z.literal('NA')).optional(),
  })
  .transform(data => {
    // TODO: this transform is not working, fix it
    data.sanitizedTradingsymbol = sanitizeTicker(data.tradingsymbol);
    return data;
  });

export type Instrument = z.infer<typeof InstrumentZod>;

export type XirrRequest = {
  type: typeof GET_XIRR;
  holdings: Instrument[];
  token: string;
};

export type XirrResponse = {
  xirrs: Record<string, number>;
};

export type PortfolioXirrRequest = {
  type: typeof GET_PORTFOLIO_XIRR;
  token: string;
};

export type PortfolioXirrResponse = {
  xirr: number;
};
