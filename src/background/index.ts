console.log('background is running')

const allResourceTypes = Object.values(chrome.declarativeNetRequest.ResourceType);

chrome.runtime.onMessage.addListener(request => {
  if (request.type === 'COUNT') {
    console.log('background has received a message from popup, and count is: ', request?.count);
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
    addRules: [RULE],
  });

  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(details => {
    console.log('onRuleMatchedDebug', details);
  });

});
