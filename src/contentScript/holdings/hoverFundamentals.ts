import {sanitizeTicker} from '../../utils/ticker';

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
      e.target.classList.contains('user-id')
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
      ticker === activeTicker
    ) {
      return;
    }

    ticker = sanitizeTicker(ticker);

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

    const handle = setTimeout(addIFrame, 200);

    target.addEventListener('mouseleave', () => {
      clearTimeout(handle);
      activeTicker = '';
      iframe.remove();
    });
  });
};
