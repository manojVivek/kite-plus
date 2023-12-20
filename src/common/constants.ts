import {z} from 'zod';

export const GET_XIRR = 'GET_XIRR';

export const InstrumentZod = z.object({
  tradingsymbol: z.string(),
  instrument_id: z.string(),
  xirr: z.number().or(z.literal('NA')).optional(),
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
