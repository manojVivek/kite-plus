import {z} from 'zod';
import {setUpOnHoverFundamentals} from './hoverFundamentals';
import {
  GET_XIRR,
  Instrument,
  InstrumentZod,
  XirrRequest,
  XirrResponse,
} from '../../common/constants';
import {stringToNode} from '../../utils/dom';

const sortAsc = (xirrColIndex: number) => {
  return (a: Element, b: Element) => {
    const aXirr = Number(a.children[xirrColIndex].textContent?.trim().replace('%', ''));
    const bXirr = Number(b.children[xirrColIndex].textContent?.trim().replace('%', ''));
    if (aXirr > bXirr) {
      return -1;
    }
    if (aXirr < bXirr) {
      return 1;
    }
    return 0;
  };
};

const sortDesc = (xirrColIndex: number) => {
  return (a: Element, b: Element) => {
    const aXirr = Number(a.children[xirrColIndex].textContent?.trim().replace('%', ''));
    const bXirr = Number(b.children[xirrColIndex].textContent?.trim().replace('%', ''));
    if (aXirr < bXirr) {
      return -1;
    }
    if (aXirr > bXirr) {
      return 1;
    }
    return 0;
  };
};

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
    let xirrColIndex = -1;
    for (const row of header.children) {
      if (row.textContent?.trim() === 'XIRR') {
        return;
      }
      if (row.textContent?.trim() === 'P&L') {
        xirrColIndex = Array.from(header.children).indexOf(row) + 1;
      }
    }

    header.insertBefore(
      stringToNode(`<th class="right sortable"><span>XIRR</span></th>`),
      header.children[xirrColIndex]
    );

    const xirrHeader = header.children[xirrColIndex];

    xirrHeader.addEventListener('click', () => {
      // Sort by xirr
      const rows = table.children[1].children;
      let order = 'asc';
      if (xirrHeader.classList.contains('sorted') && xirrHeader.classList.contains('asc')) {
        order = 'desc';
      }

      const sortedRows = Array.from(rows).sort(
        order === 'asc' ? sortAsc(xirrColIndex) : sortDesc(xirrColIndex)
      );

      for (const row of rows) {
        row.remove();
      }

      for (const row of sortedRows) {
        table.children[1].append(row);
      }

      // Remove sort icon from other columns
      for (const row of header.children) {
        row.classList.remove('sorted');
        row.classList.remove('asc');
        row.classList.remove('desc');
      }

      // Add sort icon to xirr column
      header.children[xirrColIndex].classList.add('sorted');
      header.children[xirrColIndex].classList.add(order);
    });

    // Remove sort icon if any other col header is clicked
    for (const row of header.children) {
      if (row.textContent?.trim() === 'XIRR') {
        continue;
      }
      row.addEventListener('click', () => {
        xirrHeader.classList.remove('sorted');
        xirrHeader.classList.remove('asc');
        xirrHeader.classList.remove('desc');
      });
    }

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
      row.insertBefore(
        stringToNode(
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
        ),
        row.children[xirrColIndex]
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
