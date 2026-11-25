'use strict';
// 此函数由 scripting.executeScript 整体注入，所有依赖均位于函数内部。
async function fillLoginForm(payload, options = {}){
  const timeout = Math.min(8000, Math.max(0, options.timeoutMs ?? 8000));
  const baseDeadline = Date.now() + timeout, settleTime = Math.min(600, timeout / 2);
  let deadline = baseDeadline, attempted = false, stableSince = null;
  const notified = new WeakSet();
  // 检测只返回结构与判断标志；按钮标题仅用于识别，不读取凭据输入值或 URL 参数，不触发输入事件。
  const diagnostics = options.probe && options.diagnostics ? {inputs:0,passwordInputs:0,writablePasswords:0,readonlyPasswords:0,disabledPasswords:0,sameOriginFrames:0,inaccessibleFrames:0,openShadowRoots:0,newPasswordHint:false,newPasswordLoginEvidence:false,passwordChangeEvidence:false,actionCandidates:0,visibleActions:0,matchedLoginActions:0,actionScopeExpanded:false} : null;
  function visible(node){
    const view = node.ownerDocument.defaultView, style = view.getComputedStyle(node), rect = node.getBoundingClientRect();
    if(!node.isConnected || node.disabled || node.readOnly || style.display === 'none' || ['hidden','collapse'].includes(style.visibility) || rect.width <= 0 || rect.height <= 0) return false;
    for(let parent = node; parent; parent = parent.parentElement || parent.getRootNode().host){
      if(parent.hasAttribute('inert') || Number(view.getComputedStyle(parent).opacity) === 0) return false;
    }
    return true;
  }
  function inputsOnPage(){
    const inputs = [], roots = [document], visited = new Set();
    for(let index = 0; index < roots.length; index++){
      const root = roots[index], doc = root.ownerDocument || root;
      if(visited.has(root)) continue; visited.add(root);
      try{ if(doc.location.origin !== payload.origin) continue; }catch(_){ continue; }
      const all = [...root.querySelectorAll('input')], writable = all.filter(visible);
      inputs.push(...writable);
      if(diagnostics){
        diagnostics.inputs += all.length;
        diagnostics.passwordInputs += all.filter(input => input.type === 'password').length;
        diagnostics.writablePasswords += writable.filter(input => input.type === 'password').length;
        diagnostics.readonlyPasswords += all.filter(input => input.type === 'password' && input.readOnly).length;
        diagnostics.disabledPasswords += all.filter(input => input.type === 'password' && input.disabled).length;
      }
      for(const node of root.querySelectorAll('*')){
        if(node.shadowRoot){ roots.push(node.shadowRoot); if(diagnostics) diagnostics.openShadowRoots++; }
        if(['IFRAME','FRAME'].includes(node.tagName) && visible(node)){
          let child = null;
          try{ if(node.contentDocument?.location.origin === payload.origin) child = node.contentDocument; }catch(_){}
          if(child){ roots.push(child); if(diagnostics) diagnostics.sameOriginFrames++; }
          else if(diagnostics) diagnostics.inaccessibleFrames++;
        }
      }
    }
    return inputs;
  }
  function newPasswordContext(password, username, root){
    const selector = 'button,input[type="submit"],input[type="button"],input[type="image"],a[href],[role="button"],[onclick],[tabindex],div,span';
    const empty = {login:false,changing:false,actionCandidates:0,visibleActions:0,matchedLoginActions:0,actionScopeExpanded:false};
    let scope = root;
    // 没有 form 时先从账号密码最近的共同容器开始，不借用页面其他表单的登录按钮。
    if(!password.form && !password.closest('[role="form"]') && username){
      for(let node = password.parentElement; node && root.contains(node); node = node.parentElement){
        if(node.contains(username)){ scope = node; break; }
      }
    }
    const broad = node => node.nodeType === 9 || node === password.ownerDocument.body || node === password.ownerDocument.documentElement;
    if(broad(scope)) return empty;
    const scopes = [scope];
    // 旧页面常把操作按钮放在 form 或输入行外；最多扩至两层局部容器，不跨入其他表单或账号密码区。
    for(let depth = 0; username && depth < 2; depth++){
      const parent = scope.parentElement;
      if(!parent || broad(parent)) break;
      if([...parent.querySelectorAll('form,[role="form"]')].some(form => !form.contains(password) || !form.contains(username))) break;
      const competing = [...parent.querySelectorAll('input')].some(input => {
        if(input === password || input === username) return false;
        if(input.type === 'password') return true;
        if(!['text','email','tel'].includes(input.type) || !visible(input)) return false;
        const hint = [input.name,input.id,input.placeholder,input.getAttribute('aria-label') || ''].join(' ');
        return !/search|captcha|one.?time|verification|验证码|搜索/i.test(hint) && !input.autocomplete.toLowerCase().split(/\s+/).includes('one-time-code');
      });
      if(competing) break;
      scopes.push(parent); scope = parent;
    }
    function actionNode(node){
      if(['INPUT','TEXTAREA','SELECT','OPTION'].includes(node.tagName)) return node.tagName === 'INPUT' && ['submit','button','image'].includes(node.type);
      if(node.matches('button,a[href],[role="button"],[onclick],[tabindex]')) return true;
      return ['DIV','SPAN'].includes(node.tagName) && node.ownerDocument.defaultView.getComputedStyle(node).cursor === 'pointer';
    }
    const candidates = [...scope.querySelectorAll(selector)].filter(node => {
      const owner = node.form || node.closest('form,[role="form"]');
      return actionNode(node) && (!owner || owner.contains(password));
    });
    const actions = candidates.filter(node => visible(node) && node.getAttribute('aria-disabled') !== 'true');
    function captionsFor(node){
      const texts = [node.getAttribute('aria-label') || '',node.getAttribute('title') || ''];
      if(node.tagName === 'INPUT') texts.push(node.getAttribute('value') || '',node.type === 'image' ? node.getAttribute('alt') || '' : '');
      else{
        texts.push(node.textContent || '');
        for(const image of node.querySelectorAll('img[alt]')) texts.push(image.getAttribute('alt') || '');
      }
      return texts.filter(text => text.length <= 160).map(text => text.replace(/\s+/g,'').toLowerCase());
    }
    const actionCaptions = actions.map(captionsFor);
    // 普通忘记密码帮助链接不是当前表单的改密码操作；有脚本或按钮角色时仍按操作控件判断。
    const captions = actionCaptions.flatMap((texts,index) => {
      const node = actions[index], helper = node.tagName === 'A' && !node.hasAttribute('onclick') && node.getAttribute('role') !== 'button';
      return helper ? texts.filter(text => !/^(?:(?:忘记|忘記)(?:密码|密碼)|forgotpassword)$/.test(text)) : texts;
    });
    const labels = [...(password.labels || [])].map(label => label.textContent || '').filter(text => text.length <= 160).join(' ');
    const fieldHint = [password.name,password.id,password.placeholder,password.getAttribute('aria-label') || '',labels,...scopes.flatMap(node => [node.id || '',node.getAttribute?.('name') || ''])].join(' ').replace(/\s+/g,'');
    const changing = /注册|註冊|(?:修改|更改|设置|重置|重設|忘记|忘記|确认|確認|新)(?:密码|密碼)|register|sign.?up|(?:change|reset|set)password|createaccount/i.test(captions.join(' ')) || /(?:new|confirm|repeat|retype|reset|change)[_-]?(?:pass(?:word)?|pwd)|注册|註冊|新密码|新密碼|确认密码|確認密碼|password[_-]?(?:reset|change)|regist(?:er|ration)|sign.?up/i.test(fieldHint);
    const loginCaption = text => /^(?:(?:立即|邮箱|账号|账户|用户)?(?:登录|登陆|登入|登錄)(?:系统|邮箱)?|log[._-]?in|sign[._-]?in)$/.test(text);
    const matchedLoginActions = actionCaptions.filter(texts => texts.some(loginCaption)).length;
    return {login:Boolean(username) && matchedLoginActions > 0 && !changing,changing,actionCandidates:candidates.length,visibleActions:actions.length,matchedLoginActions,actionScopeExpanded:scopes.length > 1};
  }
  function inspect(){
    if(location.origin !== payload.origin) return {code:'origin-changed'};
    const inputs = inputsOnPage(), passwords = inputs.filter(input => input.type === 'password');
    if(passwords.length > 1) return {code:'ambiguous-form'};
    if(!passwords.length) return {code:'no-form'};
    const password = passwords[0];
    const newPasswordHint = password.autocomplete.toLowerCase().split(/\s+/).includes('new-password');
    if(diagnostics) diagnostics.newPasswordHint = newPasswordHint;
    const root = password.form || password.closest('[role="form"]') || password.getRootNode();
    const candidates = inputs.filter(input => input.ownerDocument === password.ownerDocument && root.contains(input) && ['text','email','tel'].includes(input.type));
    function score(input){
      const text = [input.name,input.id,input.placeholder,input.getAttribute('aria-label') || ''].join(' ');
      if(/search|captcha|one.?time|verification|验证码|搜索/i.test(text) || input.autocomplete === 'one-time-code') return -1;
      if(input.autocomplete.toLowerCase().split(/\s+/).includes('username')) return 100;
      if(/user|account|login|member|email|mail|mobile|phone|用户名|账号|邮箱|手机号/i.test(text)) return 80;
      if(input.type === 'email') return 60;
      return input.compareDocumentPosition(password) & Node.DOCUMENT_POSITION_FOLLOWING ? 20 : -1;
    }
    const ranked = candidates.map(input => ({input,score:score(input)})).filter(item => item.score > 0).sort((a,b) => b.score - a.score);
    if(ranked.length > 1 && ranked[0].score === ranked[1].score) return {code:'ambiguous-form'};
    const username = ranked[0]?.input;
    if(newPasswordHint){
      // 部分登录页用 new-password 禁止浏览器记住密码；须有局部登录按钮和唯一账号框才兼容。
      const context = newPasswordContext(password,username,root);
      if(diagnostics){
        diagnostics.newPasswordLoginEvidence = context.login; diagnostics.passwordChangeEvidence = context.changing;
        for(const key of ['actionCandidates','visibleActions','matchedLoginActions','actionScopeExpanded']) diagnostics[key] = context[key];
      }
      if(!context.login) return {code:'unsupported-form',username};
    }
    if(payload.username && !username) return {code:'no-form'};
    return {code:'ready',username,password};
  }
  function setValue(input, value){
    if(location.origin !== payload.origin || input.ownerDocument.location.origin !== payload.origin || !visible(input)) return false;
    const view = input.ownerDocument.defaultView;
    // 兼容依赖焦点及失焦校验的旧式表单；不模拟 Enter、按键或点击登录。
    input.focus({preventScroll:true});
    if(!visible(input) || location.origin !== payload.origin || input.ownerDocument.location.origin !== payload.origin) return false;
    Object.getOwnPropertyDescriptor(view.HTMLInputElement.prototype,'value').set.call(input,value);
    input.dispatchEvent(new view.Event('input',{bubbles:true,composed:true}));
    input.dispatchEvent(new view.Event('change',{bubbles:true,composed:true}));
    if(input.isConnected) input.blur();
    notified.add(input); return true;
  }
  function matches(found){
    return found.code === 'ready' && found.password.value === payload.password && (!found.username || found.username.value === payload.username);
  }
  try{
    do{
      const found = inspect();
      if(options.probe) return diagnostics ? {code:found.code,diagnostics:{...diagnostics,usernameDetected:Boolean(found.username)}} : {code:found.code};
      if(found.code === 'ready'){
        if(!attempted) deadline = Math.max(baseDeadline,Math.min(baseDeadline + settleTime,Date.now() + settleTime + 150));
        attempted = true;
        // 仅门户主动跳转时执行：以登记值覆盖现有内容，未登记账号也不沿用浏览器的其他账号。
        if(found.username && (found.username.value !== payload.username || !notified.has(found.username))){
          stableSince = null;
          if(!setValue(found.username,payload.username) && (location.origin !== payload.origin || found.username.ownerDocument.location.origin !== payload.origin)) return {code:'origin-changed'};
        }
        // 用户名的 input/change 可能触发框架重建表单，重新识别后才处理密码。
        const current = inspect();
        if(current.code === 'ready'){
          if(!current.username || current.username.value === payload.username){
            if(current.password.value !== payload.password || !notified.has(current.password)){
              stableSince = null;
              if(!setValue(current.password,payload.password) && (location.origin !== payload.origin || current.password.ownerDocument.location.origin !== payload.origin)) return {code:'origin-changed'};
            }
            const verified = inspect();
            if(matches(verified)){
              if(stableSince === null) stableSince = Date.now();
              if(Date.now() - stableSince >= settleTime) return {code:'filled'};
            }else{
              stableSince = null;
              if(!['ready','no-form'].includes(verified.code)) return {code:verified.code};
            }
          }else stableSince = null;
        }else{
          stableSince = null;
          if(current.code !== 'no-form') return {code:current.code};
        }
      }else{
        stableSince = null;
        if(found.code !== 'no-form') return {code:found.code};
      }
      // 短时校验并修正晚到的浏览器回填，不留下长期监听、定时任务或凭据缓存。
      if(Date.now() >= deadline) break;
      await new Promise(resolve => setTimeout(resolve,Math.min(150, deadline - Date.now())));
    }while(true);
    return {code:attempted ? 'fill-error' : 'no-form'};
  }catch(_){ return {code:'fill-exception'}; }
  finally{ payload.username = ''; payload.password = ''; }
}
