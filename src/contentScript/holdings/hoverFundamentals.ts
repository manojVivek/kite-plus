import {sanitizeTicker} from '../../utils/ticker';

const TICKER_BACKLIST = ['LTP', 'CNC', 'SELL', 'BUY', 'SENSEX', 'NA', 'GTT', 'SIP', 'P&L'];

export const setUpOnHoverFundamentals = () => {
  let activeTicker = '';
  let hoverFundamentalsEnabled = false;
  chrome.storage.sync.get(['hoverFundamentalsEnabled'], result => {
    hoverFundamentalsEnabled = result.hoverFundamentalsEnabled ?? true;
  });
  chrome.storage.sync.onChanged.addListener(changes => {
    if (changes.hoverFundamentalsEnabled) {
      hoverFundamentalsEnabled = changes.hoverFundamentalsEnabled.newValue;
    }
  });

  document.addEventListener('mouseover', async (e: any) => {
    if (!hoverFundamentalsEnabled) {
      return;
    }
    if (
      !(e.target.tagName === 'SPAN' || e.target.tagName === 'TD') ||
      e.target.classList.contains('user-id') ||
      e.target.classList.contains('exchange') ||
      e.target.classList.contains('order-status-label') ||
      e.target.parentElement.classList.contains('order-status-label') ||
      e.target.classList.contains('order-status') ||
      e.target.parentElement.classList.contains('sortable') ||
      e.target.classList.contains('sortable') ||
      e.target.parentElement.classList.contains('quantity') ||
      e.target.classList.contains('quantity')
    ) {
      return;
    }
    const target = e.target as HTMLElement;
    let ticker = target.textContent?.trim();
    // check if context is all caps and alphabetical
    if (
      ticker == '' ||
      ticker == null ||
      ticker !== ticker.toUpperCase() ||
      !/^[A-Z&\-0-9]+$/.test(ticker) ||
      ticker === activeTicker ||
      TICKER_BACKLIST.includes(ticker)
    ) {
      return;
    }

    ticker = sanitizeTicker(ticker);

    activeTicker = ticker;

    const iframe = document.createElement('iframe');
    const addIFrame = () => {
      iframe.src = `https://b2b.tijorifinance.com/b2b/v1/in/kite-widget/web/equity/${ticker}/?exchange=BSE&broker=kite&theme=default`;
      iframe.width = '970px';
      iframe.height = '565px';
      iframe.style.position = 'fixed';
      iframe.style.bottom = '0';
      iframe.style.right = '0';
      iframe.style.zIndex = '999';
      iframe.style.border = 'none';
      iframe.style.background = 'white';
      iframe.style.boxShadow = '0 0 5px 0px #0000004d';

      document.querySelector('#app')?.append(iframe);
    };

    const handle = setTimeout(addIFrame, 200);

    target.addEventListener('mouseleave', () => {
      clearTimeout(handle);
      activeTicker = '';
      iframe.remove();
    });
  });
};
