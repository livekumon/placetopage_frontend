/**
 * srcDoc iframe preview: same-page links (#, #section) must not change the parent
 * window hash or reload the iframe document — that was jumping the editor / resetting
 * the live preview. External links with target="_blank" are left alone.
 */
export function withPreviewLinkFix(html) {
  if (!html || typeof html !== 'string') return html
  const script = `<script>(function(){
  document.addEventListener('click',function(e){
    var a=e.target&&e.target.closest&&e.target.closest('a[href]');
    if(!a)return;
    var href=(a.getAttribute('href')||'').trim();
    if(a.getAttribute('target')==='_blank'||a.getAttribute('target')==='_new')return;
    if(/^mailto:|^tel:/i.test(href))return;
    if(href.charAt(0)!=='#')return;
    e.preventDefault();
    e.stopPropagation();
    if(href.length>1){
      try{
        var raw=decodeURIComponent(href.slice(1));
        var el=document.getElementById(raw)||document.querySelector('[name="'+raw+'"]');
        if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
      }catch(_){}
    }
  },true);
})();</script>`
  if (html.includes('</body>')) return html.replace(/<\/body>/i, script + '</body>')
  return html + script
}

/** Maps `data-p2p-field` on generated HTML to postMessage so the parent editor can focus the matching input. */
const P2P_EDITOR_STYLE_AND_SCRIPT = `<style id="p2p-edit-styles">
[data-p2p-field]{cursor:pointer}
[data-p2p-field]:hover{box-shadow:0 0 0 2px rgba(37,99,235,0.55);border-radius:4px}
</style>
<script>(function(){
document.addEventListener('click',function(e){
  var el=e.target&&e.target.closest&&e.target.closest('[data-p2p-field]');
  if(!el)return;
  e.preventDefault();
  e.stopPropagation();
  var f=el.getAttribute('data-p2p-field');
  if(f&&window.parent){
    try{window.parent.postMessage({source:'p2p-preview',type:'focus-field',field:f},'*');}catch(_){}
  }
},true);
})();</script>`

/**
 * Enables click-to-edit from the settings preview iframe: elements with `data-p2p-field`
 * (from generated HTML) notify the parent to scroll to and focus the matching form control.
 */
export function withPreviewEditorBridge(html) {
  if (!html || typeof html !== 'string') return html
  if (html.includes('</body>')) return html.replace(/<\/body>/i, P2P_EDITOR_STYLE_AND_SCRIPT + '</body>')
  return html + P2P_EDITOR_STYLE_AND_SCRIPT
}

/** Full preview srcDoc: click-to-edit bridge first, then internal anchor fix (order matters: link fix uses stopPropagation). */
export function buildSiteEditPreviewSrcDoc(html) {
  return withPreviewLinkFix(withPreviewEditorBridge(html))
}
