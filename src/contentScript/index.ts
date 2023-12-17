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
