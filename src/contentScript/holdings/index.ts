import {z} from 'zod';
import {setUpOnHoverFundamentals} from './hoverFundamentals';
import {
  GET_XIRR,
  Instrument,
  InstrumentZod,
  XirrRequest,
  XirrResponse,
} from '../../common/constants';

export class Holdings {
  holdingsMap: Record<string, Instrument> = {};

  constructor() {
    setUpOnHoverFundamentals();
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
    const token = window.localStorage.getItem('__storejs_kite_public_token');
    if (token == null) {
      console.log('console token is null');
      return;
    }
    const res = await chrome.runtime.sendMessage<XirrRequest, XirrResponse>({
      type: GET_XIRR,
      holdings: Object.values(this.holdingsMap),
      token,
    });

    console.log('res', res);
    const {xirrs} = res;
    for (const item of Object.keys(xirrs)) {
      this.holdingsMap[item].xirr = xirrs[item] === 0 ? 'NA' : xirrs[item];
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
