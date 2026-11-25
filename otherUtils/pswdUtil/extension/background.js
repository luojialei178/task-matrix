'use strict';
if(typeof importScripts === 'function') importScripts('fill.js');
const activeSourceTabs = new Set();
function websiteURL(value){
  if(typeof value !== 'string' || value.length > 40000) return null;
  try{ const url = new URL(value); return ['http:','https:'].includes(url.protocol) && !url.username && !url.password ? url : null; }catch(_){ return null; }
}
function websitePermission(url){ return url.protocol + '//' + url.hostname + '/*'; }
function validManagerSender(sender){
  try{
    const url = new URL(sender.url);
    return sender.id === chrome.runtime.id && sender.frameId === 0 && Number.isInteger(sender.tab?.id) && sender.tab.url === sender.url && url.protocol === 'file:' && decodeURIComponent(url.pathname).endsWith('/password-manager.html');
  }catch(_){ return false; }
}
function validLoginOrigin(value){
  if(value === undefined || value === '') return true;
  const url = websiteURL(value); return Boolean(url && value === url.origin);
}
function validOpenRequest(message){
  return validLoginOrigin(message?.loginOrigin) && message?.type === 'pswd-util:open' && typeof message.requestId === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(message.requestId) && websiteURL(message.url) && typeof message.username === 'string' && message.username.length <= 1000 && typeof message.password === 'string' && message.password.length > 0 && message.password.length <= 4096;
}
function waitForWebsite(tabId, origin, options = {}){
  return new Promise((resolve,reject) => {
    let finished = false, checking = false, generation = 0, stableDocument = null, lastCode = 'load-timeout';
    const permission = {origins:[websitePermission(new URL(origin))]};
    function finish(error, documentId){
      if(finished) return; finished = true; clearTimeout(timer); clearInterval(interval);
      chrome.tabs.onUpdated.removeListener(updated); chrome.tabs.onRemoved.removeListener(removed);
      if(error) reject(new Error(error)); else resolve(documentId);
    }
    function acceptable(tab){
      const address = tab.pendingUrl || tab.url, url = websiteURL(address);
      if(!address || address === 'about:blank') return false;
      if(!url || (!options.allowRedirects && url.origin !== origin)){ finish('origin-changed'); return false; }
      if(url.origin !== origin){ lastCode = 'origin-changed'; stableDocument = null; return false; }
      // 尚未提交的导航不能借用旧文档的 complete 状态；也不向中间跳转域传凭据。
      if(tab.pendingUrl || websiteURL(tab.url)?.origin !== origin){ stableDocument = null; return false; }
      return true;
    }
    async function poll(){
      if(finished || checking) return; checking = true;
      const revision = generation;
      try{
        const tab = await chrome.tabs.get(tabId);
        if(finished || revision !== generation || !acceptable(tab)) return;
        if(!await chrome.permissions.contains(permission)){ finish('permission-required'); return; }
        // 立即执行无凭据探测，不等待图片等非关键资源触发整页 load。
        const [probe] = await chrome.scripting.executeScript({target:{tabId},injectImmediately:true,func:fillLoginForm,args:[{origin,username:'',password:''},{probe:true,timeoutMs:0}]});
        if(finished || revision !== generation) return;
        if(!probe?.documentId || !probe.result?.code){ stableDocument = null; lastCode = 'injection-no-result'; return; }
        const code = probe.result.code;
        if(code === 'origin-changed'){ finish('origin-changed'); return; }
        if(code !== 'ready'){
          stableDocument = null;
          lastCode = code === 'no-form' && tab.status !== 'complete' ? 'load-timeout' : code;
          return;
        }
        lastCode = 'navigation-changed';
        if(stableDocument !== probe.documentId){ stableDocument = probe.documentId; return; }
        const current = await chrome.tabs.get(tabId);
        if(!finished && revision === generation && acceptable(current)) finish(null,probe.documentId);
      }catch(_){ if(!finished){ stableDocument = null; lastCode = 'injection-error'; } }
      finally{ checking = false; }
    }
    function updated(id, change, tab){
      if(id !== tabId || finished) return;
      if(change.url || change.status === 'loading'){ generation++; stableDocument = null; }
      acceptable({...tab,pendingUrl:change.url || tab.pendingUrl}); poll();
    }
    function removed(id){ if(id === tabId) finish('tab-closed'); }
    const timer = setTimeout(() => finish(lastCode),Math.max(0,options.timeoutMs ?? 12000));
    const interval = setInterval(poll,150);
    chrome.tabs.onUpdated.addListener(updated); chrome.tabs.onRemoved.addListener(removed); poll();
  });
}
async function openCredentials(message, sender){
  if(!validManagerSender(sender) || !validOpenRequest(message)) return {code:'rejected'};
  const sourceId = sender.tab.id;
  if(activeSourceTabs.has(sourceId)) return {code:'busy'};
  activeSourceTabs.add(sourceId);
  let payload = null;
  try{
    const url = websiteURL(message.url), origin = message.loginOrigin || url.origin;
    const permission = {origins:[websitePermission(new URL(origin))]}, deadline = Date.now() + 22000;
    const permitted = await chrome.permissions.contains(permission);
    const tab = await chrome.tabs.create({url:url.href,active:true});
    // 未授权时只普通打开网站；用户在扩展弹窗授权后，再从矩阵点击跳转。
    if(!permitted) return {code:'permission-required'};
    let previousDocumentId = null, previousFailureCode = null;
    for(let attempt = 0; attempt < 2; attempt++){
      const documentId = await waitForWebsite(tab.id,origin,{allowRedirects:Boolean(message.loginOrigin),timeoutMs:Math.min(12000,Math.max(0,deadline - Date.now()))});
      if(previousDocumentId === documentId) return {code:previousFailureCode};
      if(!await chrome.permissions.contains(permission)) return {code:'permission-required'};
      const current = await chrome.tabs.get(tab.id);
      if(websiteURL(current.pendingUrl || current.url)?.origin !== origin) return {code:'origin-changed'};
      if(current.pendingUrl){ if(!attempt) continue; return {code:'navigation-changed'}; }
      payload = {origin,username:message.username,password:message.password};
      let failedCode = 'injection-no-result';
      try{
        const [result] = await chrome.scripting.executeScript({target:{tabId:tab.id,documentIds:[documentId]},injectImmediately:true,func:fillLoginForm,args:[payload,{timeoutMs:Math.min(8000,Math.max(0,deadline - Date.now() - 600))}]});
        if(result?.result?.code) return {code:result.result.code};
      }catch(_){ failedCode = 'injection-error'; }
      finally{ payload.username = ''; payload.password = ''; payload = null; }
      // 只对文档切换重新探测一次；策略拒绝等同文档失败不盲目重试。
      const after = await chrome.tabs.get(tab.id);
      if(websiteURL(after.pendingUrl || after.url)?.origin !== origin) return {code:'origin-changed'};
      if(attempt || Date.now() >= deadline) return {code:'navigation-changed'};
      previousDocumentId = documentId; previousFailureCode = failedCode;
    }
    return {code:'navigation-changed'};
  }catch(error){
    return {code:['origin-changed','tab-closed','load-timeout','no-form','ambiguous-form','unsupported-form','permission-required','fill-exception','injection-error','injection-no-result','navigation-changed'].includes(error.message) ? error.message : 'extension-error'};
  }finally{
    activeSourceTabs.delete(sourceId);
    if(payload){ payload.username = ''; payload.password = ''; payload = null; }
    message.username = ''; message.password = '';
  }
}
async function diagnoseLoginForm(message, sender){
  // 仅扩展自己的弹窗可以检测当前活动网站；不接受卡片凭据或指定其他标签页。
  if(sender.id !== chrome.runtime.id || sender.url !== chrome.runtime.getURL('popup.html') || sender.tab || message?.type !== 'pswd-util:diagnose' || Object.keys(message).some(key => key !== 'type')) return {code:'rejected'};
  let timer = null;
  try{
    const [tab] = await chrome.tabs.query({active:true,currentWindow:true}), url = websiteURL(tab?.url);
    if(!url || !Number.isInteger(tab.id)) return {code:'unsupported-page'};
    if(tab.pendingUrl) return {code:'navigation-changed'};
    if(!await chrome.permissions.contains({origins:[websitePermission(url)]})) return {code:'permission-required'};
    const [probe] = await Promise.race([
      chrome.scripting.executeScript({target:{tabId:tab.id},injectImmediately:true,func:fillLoginForm,args:[{origin:url.origin,username:'',password:''},{probe:true,diagnostics:true,timeoutMs:0}]}),
      new Promise((_,reject) => { timer = setTimeout(() => reject(new Error('diagnostic-timeout')),4000); })
    ]);
    const current = await chrome.tabs.get(tab.id);
    if(current.pendingUrl || websiteURL(current.url)?.origin !== url.origin) return {code:'navigation-changed'};
    const result = probe?.result;
    if(!probe?.documentId || !['ready','no-form','ambiguous-form','unsupported-form','origin-changed','fill-exception'].includes(result?.code)) return {code:'injection-no-result'};
    // 仅返回固定字段与数字计数，不透传异常、页面字段或任何输入值。
    const diagnostics = {};
    for(const key of ['inputs','passwordInputs','writablePasswords','readonlyPasswords','disabledPasswords','sameOriginFrames','inaccessibleFrames','openShadowRoots','actionCandidates','visibleActions','matchedLoginActions']){
      const value = result.diagnostics?.[key]; diagnostics[key] = Number.isInteger(value) && value >= 0 ? Math.min(value,100000) : 0;
    }
    for(const key of ['usernameDetected','newPasswordHint','newPasswordLoginEvidence','passwordChangeEvidence','actionScopeExpanded']) diagnostics[key] = result.diagnostics?.[key] === true;
    return {code:result.code,origin:url.origin,diagnostics};
  }catch(error){ return {code:error.message === 'diagnostic-timeout' ? 'diagnostic-timeout' : 'injection-error'}; }
  finally{ clearTimeout(timer); }
}
chrome.runtime.onMessage.addListener((message,sender,respond) => {
  if(message?.type === 'pswd-util:diagnose'){
    diagnoseLoginForm(message,sender).then(respond).catch(() => respond({code:'extension-error'})); return true;
  }
  if(message?.type !== 'pswd-util:open') return false;
  openCredentials(message,sender).then(respond).catch(() => respond({code:'extension-error'}));
  return true;
});
