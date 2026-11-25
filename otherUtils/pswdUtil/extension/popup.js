'use strict';
const $ = id => document.getElementById(id);
let currentPattern = null, detecting = false;
async function refreshPermission(){
  const allowed = currentPattern && await chrome.permissions.contains({origins:[currentPattern]});
  $('grant').disabled = !currentPattern || Boolean(allowed); $('revoke').hidden = !allowed;
  $('grant').textContent = allowed ? '此网站已授权' : '允许填充此网站';
  $('detect').disabled = !allowed || detecting;
}
$('grant').addEventListener('click', async () => {
  if(!currentPattern) return;
  try{
    // request 必须直接位于按钮的用户手势中，前面不插入异步操作。
    const request = chrome.permissions.request({origins:[currentPattern]}); $('grant').disabled = true;
    $('status').textContent = await request ? '已授权。返回地址门户，再点击「跳转」。' : '未授权，不会填入任何密码。';
  }catch(_){ $('status').textContent = '授权失败，请检查浏览器或企业策略。'; }
  await refreshPermission();
});
$('revoke').addEventListener('click', async () => {
  if(!currentPattern) return;
  try{ await chrome.permissions.remove({origins:[currentPattern]}); $('status').textContent = '已取消此网站的填充授权。'; await refreshPermission(); }
  catch(_){ $('status').textContent = '取消授权失败，可在扩展详情中调整。'; }
});
$('detect').addEventListener('click', async () => {
  if(!currentPattern || detecting) return;
  detecting = true; $('detect').disabled = true; $('diagnostic').hidden = false; $('diagnostic').textContent = '正在检测登录框（不读取账号密码）…';
  try{
    const result = await chrome.runtime.sendMessage({type:'pswd-util:diagnose'});
    const messages = {
      'ready':'已识别登录表单；仅结构检测通过，不代表实际填充成功。若仍失败，请同时提供门户底部的失败提示。',
      'no-form':'未找到可识别的可写密码登录框。',
      'ambiguous-form':'存在多个密码框或账号框歧义，已停止自动匹配。',
      'unsupported-form':'密码框标记为 new-password，且未取得安全的登录证据；可能是注册／改密码，也可能是登录页误用标记。',
      'fill-exception':'检查登录框时发生异常，需要针对该页面适配。',
      'injection-error':'检测脚本未能执行；可能是权限、导航或企业策略限制，不能据此确定是哪一种。',
      'injection-no-result':'检测未取得有效结果，请等待页面稳定后重试。',
      'navigation-changed':'页面正在跳转或来源已变化，请在最终登录页重试。',
      'origin-changed':'登录来源已变化，请在最终登录页重试。',
      'permission-required':'当前网站未授权，请先授权后检测。',
      'unsupported-page':'只支持普通 HTTP／HTTPS 登录页面。',
      'diagnostic-timeout':'检测超时，请等待页面稳定后重试。',
      'rejected':'检测请求未通过扩展校验，请重新加载扩展。'
    };
    const lines = ['扩展 ' + chrome.runtime.getManifest().version + ' · 检测码：' + (Object.hasOwn(messages,result?.code) ? result.code : 'extension-error'),messages[result?.code] || '扩展检测失败，请重新加载扩展。'];
    if(result?.origin) $('site').textContent = result.origin;
    const info = result?.diagnostics;
    if(info){
      lines.push('输入框 ' + info.inputs + '；密码框 ' + info.passwordInputs + '（可写 ' + info.writablePasswords + '、只读 ' + info.readonlyPasswords + '、禁用 ' + info.disabledPasswords + '）；已识别账号框：' + (info.usernameDetected ? '是' : '否'));
      lines.push('同源框架 ' + info.sameOriginFrames + '；不可访问框架 ' + info.inaccessibleFrames + '；开放 Shadow DOM ' + info.openShadowRoots);
      if(info.newPasswordHint){
        lines.push('new-password 标记：是；明确登录证据：' + (info.newPasswordLoginEvidence ? '是（可兼容）' : '否') + '；注册／改密码证据：' + (info.passwordChangeEvidence ? '是' : '否'));
        lines.push('局部操作控件 ' + info.actionCandidates + '（可见 ' + info.visibleActions + '、登录标题匹配 ' + info.matchedLoginActions + '）；局部范围扩展：' + (info.actionScopeExpanded ? '是' : '否'));
        if(!info.newPasswordLoginEvidence && !info.passwordChangeEvidence) lines.push(info.actionCandidates === 0 ? '局部范围未找到支持的操作控件；可能是按钮结构或位置未覆盖。' : info.visibleActions === 0 ? '操作控件不可见或不可用，不作为登录证据。' : info.matchedLoginActions === 0 ? '操作控件已找到，但文本、无障碍名称或图片标题未匹配登录。' : '登录标题已匹配，但账号或局部结构未满足安全条件。');
      }
      if(info.readonlyPasswords || info.disabledPasswords) lines.push('只读／禁用密码框不会强制解锁。');
      if(info.inaccessibleFrames) lines.push('有跨源、沙箱或尚未加载的框架；当前检测不读取其内部内容。');
      if(result.code === 'no-form' && !info.passwordInputs) lines.push('也可能是分步登录、关闭 Shadow DOM 或安全控件，不能仅据此认定网页太老。');
    }
    $('diagnostic').textContent = lines.join('\n');
  }catch(_){ $('diagnostic').textContent = '扩展检测失败，请重新加载扩展后再试。'; }
  finally{ detecting = false; await refreshPermission(); }
});
$('details').addEventListener('click', () => chrome.tabs.create({url:'chrome://extensions/?id='+chrome.runtime.id}));
(async () => {
  try{
    chrome.extension.isAllowedFileSchemeAccess(allowed => { $('fileHint').hidden = allowed; });
    const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
    const url = new URL(tab?.url || '');
    if(!['http:','https:'].includes(url.protocol) || url.username || url.password){ $('site').textContent = '先打开目标登录网站，再点本扩展授权。'; return; }
    currentPattern = url.protocol + '//' + url.hostname + '/*'; $('site').textContent = url.origin;
    await refreshPermission();
  }catch(_){ $('site').textContent = '无法识别网站，请在普通登录页打开扩展。'; }
})();
