import {GET_XIRR} from '../common/constants';
import {handleXirrRequest} from './xirr';

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.type === GET_XIRR) {
    (async () => {
      const res = await handleXirrRequest(request);
      sendResponse(res);
    })();
    return true;
  }
});

chrome.runtime.onInstalled.addListener(() => {
  const RULE = {
    id: 1,
    priority: 1,
    condition: {
      urlFilter: 'https://console.zerodha.com/api/reports/*',
    },
    action: {
      type: 'modifyHeaders',
      responseHeaders: [
        {
          header: 'Access-Control-Allow-Origin',
          operation: 'set',
          value: 'https://kite.zerodha.com',
        },
        {
          header: 'Access-Control-Allow-Headers',
          operation: 'set',
          value: 'x-csrftoken,x-extension',
        },
        {
          header: 'frame-ancestors',
          operation: 'set',
          value: 'https://kite.zerodha.com',
        },
        {
          header: 'Access-Control-Allow-Credentials',
          operation: 'set',
          value: 'true',
        },
        {
          header: 'Access-Control-Allow-Methods',
          operation: 'set',
          value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        },
        {
          header: 'Access-Control-Allow-Headers',
          operation: 'set',
          value: 'Content-Type, Authorization, X-Csrftoken',
        },
      ],
    },
  };
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [RULE.id],
    // @ts-expect-error
    addRules: [RULE],
  });

  // chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(details => {
  //   console.log('onRuleMatchedDebug', details);
  // });
});
