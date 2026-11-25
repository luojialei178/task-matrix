(() => {
  'use strict';
  if(location.protocol !== 'file:' || !decodeURIComponent(location.pathname).endsWith('/password-manager.html') || window !== window.top) return;
  const OPEN_EVENT = 'pswd-util:extension-open', RESULT_EVENT = 'pswd-util:extension-result';
  window.addEventListener(OPEN_EVENT, event => {
    let payload;
    try{
      if(typeof event.detail !== 'string' || event.detail.length > 100000) return;
      payload = JSON.parse(event.detail);
      if(payload.type !== 'pswd-util:open' || typeof payload.requestId !== 'string') return;
    }catch(_){ return; }
    event.preventDefault();
    // 只传本次明确跳转的单条记录，不读取 JSON，也不使用任何浏览器存储。
    const requestId = payload.requestId;
    const report = code => window.dispatchEvent(new CustomEvent(RESULT_EVENT,{detail:JSON.stringify({requestId,code})}));
    let task;
    try{ task = chrome.runtime.sendMessage(payload); }
    catch(_){ payload.username = ''; payload.password = ''; payload = null; report('extension-error'); return; }
    Promise.resolve(task).then(response => report(response?.code || 'extension-error')).catch(() => report('extension-error'))
      .finally(() => { payload.username = ''; payload.password = ''; payload = null; });
  });
})();
