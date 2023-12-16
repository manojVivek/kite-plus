import {Holdings} from './holdings';

console.info('contentScript is running!!');

const run = () => {
  if (typeof window.MutationObserver !== 'function') {
    console.log('Browser not supported');
    return;
  }

  const holdings = new Holdings();

  return;

  const callback = () => {
    console.log('Domchange callback');
    holdings.refreshPageData();
  };

  const observer = new MutationObserver(callback);

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
};

run();

const addiFrame = () => {
  const iframe = document.createElement('iframe');
  iframe.src =
    'https://console.zerodha.com/portfolio/holdings?segment=EQ&isin=INE470A01017&tradingsymbol=3MINDIA&src=kiteweb';
  iframe.width = '100%';
  iframe.height = '60%';
  // Append to start of doc
  document.documentElement.prepend(iframe);
};

//addiFrame();
