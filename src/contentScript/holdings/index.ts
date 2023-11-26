import {z} from 'zod';

const Instrument = z.object({
  tradingsymbol: z.string(),
  exchange: z.enum(['NSE', 'BSE']),
  isin: z.string(),
});

type Instrument = z.infer<typeof Instrument>;

export class Holdings {
  holdings: Instrument[] = [];
  holdingsMap: Record<string, Instrument> = {};

  constructor() {
    this.getHoldingsAPI();
  }

  isHoldingsPage() {
    return window.location.href === 'https://kite.zerodha.com/holdings';
  }

  updateXirr() {
    //console.log('updateXirr');
  }

  refreshPageData() {
    if (!this.isHoldingsPage()) {
      return;
    }

    this.updateXirr();
  }

  initHoldings = (data: any) => {
    console.log('initHoldings', data);
    this.holdings = z.array(Instrument).parse(data);
    this.holdingsMap = this.holdings.reduce(
      (acc, item) => {
        acc[item.tradingsymbol] = item;
        return acc;
      },
      {} as Record<string, Instrument>
    );
  };

  async getHoldingsAPI() {
    const token = window.localStorage.getItem('__storejs_kite_enctoken');
    if (token == null) {
      console.log('token is null');
      return;
    }
    console.log('token', token);
    try {
      const {data} = await fetch('https://kite.zerodha.com/oms/portfolio/holdings', {
        headers: {
          authorization: `enctoken ${token.replaceAll('"', '')}`,
        },
      }).then(res => res.json());
      this.initHoldings(data);
    } catch (err) {
      console.log('err while getting data from api', err);
    }
  }

  getHoldings() {
    const table = document.querySelectorAll('.holdings-table .data-table table td.instrument');

    console.log('table', table);
    const instruments = Array.from(table)
      .map(item => {
        return item.textContent;
      })
      .filter(Boolean)
      .reduce((acc, item) => {
        acc.push(item as string);
        return acc;
      }, [] as string[]);

    console.log('instruments', instruments.length);
  }
}
