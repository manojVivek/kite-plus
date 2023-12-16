import {z} from 'zod';
import pLimit from 'p-limit';
import {Xirr} from './xirr';

const Instrument = z.object({
  tradingsymbol: z.string(),
  instrument_id: z.string(),
  xirr: z.number().or(z.literal('NA')).optional(),
});

type Instrument = z.infer<typeof Instrument>;

export class Holdings {
  holdingsMap: Record<string, Instrument> = {};
  limit = pLimit(8);
  xirrFetcher = new Xirr();

  constructor() {
    (async () => {
      this.initHoldings(await this.fetchPortfolioReport());
    })();
  }

  isHoldingsPage() {
    return window.location.href === 'https://kite.zerodha.com/holdings';
  }

  refreshPageData() {
    if (!this.isHoldingsPage()) {
      return;
    }

    this.updateXirr();
  }

  updateXirr = async () => {
    const table = document.querySelector('.holdings-table table');
    if (table == null) {
      return;
    }
    const header = table.children[0];
    header.children[0].insertAdjacentHTML('beforeend', '<th>XIRR</th>');
    const rows = table.children[1].children;
    for (const row of rows) {
      const tradingsymbol = row.children[0].textContent?.trim();
      if (tradingsymbol == null) {
        continue;
      }
      const instrument = this.holdingsMap[tradingsymbol];
      if (instrument == null) {
        continue;
      }
      row.insertAdjacentHTML(
        'beforeend',
        `<td class="net-change ${
          instrument.xirr != null && instrument.xirr !== 'NA'
            ? instrument.xirr > 0
              ? 'text-green'
              : 'text-red'
            : ''
        }"><span>${
          typeof instrument.xirr === 'number'
            ? `${instrument.xirr > 0 ? '+' : ''}${instrument.xirr.toFixed(2)}%`
            : instrument.xirr
        }</span></td>`
      );
    }
  };

  initHoldings = async (data: any) => {
    const holdings = z.array(Instrument).parse(data);
    this.holdingsMap = holdings.reduce(
      (acc, item) => {
        acc[item.tradingsymbol] = item;
        return acc;
      },
      {} as Record<string, Instrument>
    );
    await this.enrichHoldingsWithXirr();
    this.refreshPageData();
  };

  enrichHoldingsWithXirr = async () => {
    for (const item of Object.values(this.holdingsMap)) {
      await this.limit(async () => {
        const xirr = await this.xirrFetcher.fetchXirr(item.instrument_id);
        item.xirr = xirr;
      });
    }
  };

  fetchPortfolioReport = async () => {
    const token = window.localStorage.getItem('__storejs_kite_public_token');
    if (token == null) {
      console.log('console token is null');
      return;
    }
    try {
      const {data} = await fetch(
        `https://console.zerodha.com/api/reports/holdings/portfolio?date=2023-12-15`,
        {
          headers: {
            'X-Csrftoken': token.replaceAll('"', ''),
            'X-Extension': 'true',
          },
          credentials: 'include',
        }
      ).then(res => res.json());
      return data.result.eq;
    } catch (e) {
      console.log('error', e);
    }
  };
}
