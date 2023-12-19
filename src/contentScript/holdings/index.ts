import {z} from 'zod';
import pLimit from 'p-limit';
import {Xirr} from './xirr';

const InstrumentZod = z.object({
  tradingsymbol: z.string(),
  instrument_id: z.string(),
  xirr: z.number().or(z.literal('NA')).optional(),
});

type Instrument = z.infer<typeof InstrumentZod>;

export class Holdings {
  holdingsMap: Record<string, Instrument> = {};
  limit = pLimit(8);
  xirrFetcher = new Xirr();

  constructor() {
    this.setUpOnHoverFundamentals();
    (async () => {
      const result = await chrome.storage.sync.get(['xirrEnabled']);
      if (result.xirrEnabled === undefined || Boolean(result.xirrEnabled)) {
        await this.initHoldings(await this.fetchPortfolioReport());
      }
      this.setUpLocationChangeListener();
      this.refreshPageData();
      console.log('location change listener added');
    })();
  }

  setUpLocationChangeListener() {
    // Improve this
    let lastURL = document.location.href;

    setInterval(() => {
      if (lastURL !== document.location.href) {
        this.refreshPageData();
        lastURL = document.location.href;
      }
    }, 1000);
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

  setUpOnHoverFundamentals = () => {
    let activeTicker = '';
    document.addEventListener('mouseover', async (e: any) => {
      if (!(e.target.tagName === 'SPAN' || e.target.tagName === 'TD')) {
        return;
      }
      const target = e.target as HTMLElement;
      const ticker = target.textContent?.trim();
      // check if context is all caps and alphabetical
      if (
        ticker == '' ||
        ticker == null ||
        ticker !== ticker.toUpperCase() ||
        !/^[A-Z]+$/.test(ticker) ||
        ticker === activeTicker
      ) {
        return;
      }
      activeTicker = ticker;

      const iframe = document.createElement('iframe');
      const addIFrame = () => {
        iframe.src = `https://stocks.tickertape.in/tickers/${ticker}`;
        iframe.width = '715px';
        iframe.height = '400px';
        iframe.style.position = 'fixed';
        iframe.style.bottom = '0';
        iframe.style.right = '0';
        iframe.style.zIndex = '999';
        iframe.style.border = 'none';
        iframe.style.background = 'white';
        iframe.style.boxShadow = '0 0 5px 0px #0000004d';

        document.querySelector('#app')?.append(iframe);
      };

      const handle = setTimeout(addIFrame, 250);

      target.addEventListener('mouseleave', () => {
        clearTimeout(handle);
        activeTicker = '';
        iframe.remove();
      });
    });
  };

  updateXirr = async () => {
    console.log('Updating xirr');
    const table = document.querySelector('.holdings-table table');
    if (table == null) {
      return;
    }
    const header = table.children[0].children[0];
    for (const row of header.children) {
      if (row.textContent?.trim() === 'XIRR') {
        return;
      }
    }
    header.insertAdjacentHTML('beforeend', '<th>XIRR</th>');
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
    const holdings = z.array(InstrumentZod).parse(data);
    this.holdingsMap = holdings.reduce(
      (acc, item) => {
        acc[item.tradingsymbol] = item;
        return acc;
      },
      {} as Record<string, Instrument>
    );
    await this.enrichHoldingsWithXirr();
    console.log('holdingsMap', this.holdingsMap);
  };

  enrichHoldingsWithXirr = async () => {
    for (const item of Object.values(this.holdingsMap)) {
      await this.limit(async () => {
        const xirr = await this.xirrFetcher.fetchXirr(item.instrument_id);
        item.xirr = xirr;
      });
    }
  };

  fetchPortfolioReport = async (retrying = false): Promise<Instrument[]> => {
    const token = window.localStorage.getItem('__storejs_kite_public_token');
    if (token == null) {
      console.log('console token is null');
      return [];
    }
    try {
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
      const res = await fetch(
        `https://console.zerodha.com/api/reports/holdings/portfolio?date=${dateStr}`,
        {
          headers: {
            'X-Csrftoken': token.replaceAll('"', ''),
            'X-Extension': 'true',
          },
          credentials: 'include',
        }
      ).then(res => res.json());
      if (res.status === 'error' && res.error_type === 'TokenException') {
        if (retrying) {
          return [];
        }
        await this.loadConsoleIframe();
        return this.fetchPortfolioReport(true);
      }
      const {data} = res;
      return data.result.eq;
    } catch (e) {
      console.log('error', e);
    }
    return [];
  };

  loadConsoleIframe = async () => {
    const iframe = document.createElement('iframe');
    iframe.src = 'https://console.zerodha.com/portfolio/holdings';
    iframe.width = '100%';
    iframe.height = '60%';
    iframe.style.display = 'none';
    // Append to start of doc
    document.documentElement.prepend(iframe);
    await new Promise(resolve => setTimeout(resolve, 5000));
    iframe.remove();
  };
}
