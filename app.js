'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
let W = 1200, H = 1800, orientation = 'portrait';
const canvas = $('#editorCanvas');
const icons = () => window.lucide?.createIcons();
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const clone = x => JSON.parse(JSON.stringify(x));
const palettes = [['#fffdf7','纸白'],['#e4ecd9','鼠尾草'],['#f1d9de','淡粉'],['#d9e7f0','晴蓝'],['#f5e6ae','淡黄'],['#323b3a','炭黑']];
const layouts = [['ai-output','明信片']];
// Set window.CARD_STUDIO_CONFIG before app.js in production. Credentials stay on the server.
const backend = Object.assign({enabled:false,apiBase:'',generatePath:'/api/generate',orderPath:'/api/orders',merchantLoginPath:'/api/admin/login',paymentQrUrl:'',paymentUrl:'',pollMs:2500},window.CARD_STUDIO_CONFIG||{});
const fallbackStyle = {category:'scene',label:'胶带拼贴',skill:'make-tape-collage',prompt:'将上传照片转化为留白充足、材质可信的和纸胶带拼贴画，保留主体识别线索，使用简洁的胶带色块、半透明叠压和温暖白纸。'};
const configuredStyles = window.CARD_STUDIO_CONFIG?.styles||{};
const stylePresets = Object.keys(configuredStyles).length ? configuredStyles : {tapeCollage:fallbackStyle};
function fontName(name){if(name==='Huiwen Mincho'&&!window.CARD_STUDIO_CONFIG?.fontFaces?.[name])return 'SimSun';return name||'SimSun';}
function loadConfiguredFonts(){const faces=window.CARD_STUDIO_CONFIG?.fontFaces||{};const css=Object.entries(faces).map(([family,value])=>{const face=typeof value==='string'?{url:value,format:/\.otf$/i.test(value)?'opentype':'woff2'}:value;return `@font-face{font-family:"${family.replace(/"/g,'')}";src:url("${face.url}") format("${face.format||'woff2'}");font-display:swap;}`;}).join('');if(css){const node=document.createElement('style');node.textContent=css;document.head.append(node);}}
loadConfiguredFonts();
let sourceImage, candidates = [], selected = 0, stage = 'selectionStage', activeCategory = 'scene';
let tool = 'layout', activeLayer = null, activePhoto = 'generated';
let drafts = {}, design = null, undoStack = [], redoStack = [], bounds = new Map();
let stickerAssets = [], finalUrl = '', savedFinal = '', toastTimer, sourceFile = null, currentOrder = null, generateController = null, generationRequestId = '', orderRequestId = '', savingOrder = false;
let generationGrantCode = '';
const seedStickerIds = [23,24,22,26,31,51,112,117,128,219];
Promise.all(seedStickerIds.map(async id=>{const url=`assets/stickers/doodle-${id}.png`;try{return {id:`doodle-${id}`,url,image:await loadImage(url)};}catch{return null;}})).then(items=>{stickerAssets=items.filter(Boolean);if(tool==='sticker')renderPanel('sticker');});
function toast(text) { $('#toast').textContent = text; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 2500); }
function guide(text,notify=true){const node=$('#editorGuide');if(node)node.textContent=text;const canvasNode=$('#canvasGuide');if(canvasNode){canvasNode.textContent=text;canvasNode.classList.toggle('hidden',tool==='layout'||!text);}if(notify)toast(text);}
const guideText={layout:'版式：拖动照片移动，双指缩放和旋转',photo:'照片：单指拖动取景，双指缩放和旋转；放大后画面外部分会被裁掉',date:'日期：拖动画布任意位置即可移动当前日期',caption:'一句话：拖动画布任意位置即可移动当前文字',sticker:'贴纸：先点选贴纸，再拖动画布任意位置移动当前贴纸'};
function show(next) { stage = next; ['selectionStage','uploadStage','candidateStage','editorStage'].forEach(id => $('#'+id).classList.toggle('hidden', id !== next)); document.body.classList.toggle('editing', next === 'editorStage'); window.scrollTo(0,0); requestAnimationFrame(resizePreview); }
function openStylePreview(id,preset){
  const dialog=$('#stylePreviewDialog');if(!dialog)return;
  const original=preset.previewOriginal||sourceImage?.src||null;
  const result=preset.previewImage||null;
  $('#stylePreviewTitle').textContent=preset.label||id;
  $('#stylePreviewNote').textContent=preset.previewOriginal?'上方为原图，下方为风格成图':'示例图片待补充，先查看成品示意';
  const media=$('#stylePreviewMedia');
  const setMode=mode=>{
    $$('#stylePreviewDialog [data-preview-mode]').forEach(button=>button.classList.toggle('active',button.dataset.previewMode===mode));
    media.replaceChildren();
    if(mode==='compare'){
      const compare=document.createElement('div');compare.className='style-preview-compare';
      [['原图',original],['成图',result]].forEach(([label,src])=>{const figure=document.createElement('figure');if(src){const image=document.createElement('img');image.src=src;image.alt=`${preset.label||id}${label}`;figure.append(image);}else{const placeholder=document.createElement('div');placeholder.className='style-preview-placeholder';placeholder.textContent='示例待补充';figure.append(placeholder);}const caption=document.createElement('figcaption');caption.textContent=label;figure.append(caption);compare.append(figure);});
      media.append(compare);
    }else{const src=mode==='original'?original:result;if(src){const image=document.createElement('img');image.className='style-preview-image';image.src=src;image.alt=`${preset.label||id}${mode==='original'?'原图':'成图'}`;media.append(image);}else{const placeholder=document.createElement('div');placeholder.className='style-preview-placeholder';placeholder.textContent='示例待补充';media.append(placeholder);}}
  };
  $$('#stylePreviewDialog [data-preview-mode]').forEach(button=>button.onclick=()=>setMode(button.dataset.previewMode));
  setMode('result');dialog.showModal();icons();
}
$('#closeStylePreview').onclick=()=>$('#stylePreviewDialog').close();
function renderStylePicker(){
  const picker=$('#stylePicker');if(!picker)return;
  const entries=Object.entries(stylePresets).filter(([,preset])=>(preset.category||'scene')===activeCategory);
  picker.replaceChildren(...entries.map(([id,preset],index)=>{const label=document.createElement('label');const input=document.createElement('input');input.type='radio';input.name='style';input.value=id;input.checked=index===0;input.disabled=preset.commercialUseAllowed===false;const card=document.createElement('span');card.className=`style-card${input.disabled?' license-locked':''}`;const sample=document.createElement('span');sample.className=`style-sample ${id}-sample${preset.previewImage?'':' no-preview'}`;const image=document.createElement('img');image.dataset.styleImage='';image.alt=`${preset.label||id}成图示意`;image.loading='lazy';image.decoding='async';image.src=preset.previewImage?.replace(/-result\.webp$/, '-result-thumb.webp')||'';image.hidden=!preset.previewImage;const previewButton=document.createElement('button');previewButton.type='button';previewButton.className='style-preview-trigger';previewButton.title='查看原图和成图示例';previewButton.setAttribute('aria-label',`查看${preset.label||id}原图和成图示例`);previewButton.innerHTML='<i data-lucide="maximize-2"></i>';previewButton.onclick=e=>{e.preventDefault();e.stopPropagation();openStylePreview(id,preset);};sample.append(image,previewButton);const name=document.createElement('span');name.className='style-name';const strong=document.createElement('strong');strong.textContent=preset.label||id;const small=document.createElement('small');small.textContent=input.disabled?'需取得商用授权后启用':preset.description||'只生成一张处理后的成品图';name.append(strong,small);card.append(sample,name);label.append(input,card);return label;}));
  icons();
}
renderStylePicker();
window.addEventListener('load',()=>{if(!backend.paymentQrUrl)return;const preload=()=>{$('#paymentQr').src=backend.paymentQrUrl;};if('requestIdleCallback' in window)requestIdleCallback(preload,{timeout:3000});else setTimeout(preload,1000);},{once:true});
function checkpoint() { undoStack.push(clone({design,drafts})); if(undoStack.length > 40) undoStack.shift(); redoStack = []; updateHistory(); }
function updateHistory() { $('#undo').disabled = !undoStack.length; $('#redo').disabled = !redoStack.length; }
function restore(from,to) { if(!from.length)return; to.push(clone({design,drafts})); ({design,drafts}=from.pop()); activeLayer=null; renderPanel(tool); render(); updateHistory(); }
$('#undo').onclick=()=>restore(undoStack,redoStack); $('#redo').onclick=()=>restore(redoStack,undoStack);
function readFile(file) { return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);}); }
function loadImage(url) { return new Promise((resolve,reject)=>{const img=new Image();if(/^https?:\/\//i.test(String(url))){img.crossOrigin='anonymous';}img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('图片加载失败'));img.src=url;}); }
function apiUrl(path){return `${String(backend.apiBase||'').replace(/\/$/,'')}${path}`;}
function hasBackend(){return backend.enabled===true||Boolean(backend.apiBase);}
function setStatus(id,text){const node=$('#'+id);if(node)node.textContent=text;}
function selectedStyle(){return document.querySelector('input[name="style"]:checked')?.value||Object.keys(stylePresets)[0]||'tapeCollage';}
function selectedCategory(){return document.querySelector('input[name="category"]:checked')?.value||activeCategory||'scene';}
function selectedMode(){return 'postcard';}
function selectedSkill(preset,style){return preset.skill||style;}
function fallbackPreset(){return stylePresets[selectedStyle()]||Object.values(stylePresets)[0]||fallbackStyle;}
function sessionId(){try{let value=localStorage.getItem('card-studio-session-id');if(!value){value=crypto.randomUUID();localStorage.setItem('card-studio-session-id',value);}return value;}catch{return '';}}
document.addEventListener('change',e=>{if(e.target.matches('input[name="style"]'))generationRequestId='';if(e.target.matches('input[name="category"]')){activeCategory=e.target.value;generationRequestId='';renderStylePicker();}});
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
async function responseJson(response){const data=await response.json().catch(()=>null);if(!response.ok)throw new Error(data?.message||data?.error||`HTTP ${response.status}`);return data;}
let merchantLoginInProgress=false;
let merchantToken='';
async function merchantRequest(path,options={}){
  const request=()=>fetch(apiUrl(path),Object.assign({},options,{headers:Object.assign({},options.headers,merchantToken?{Authorization:`Bearer ${merchantToken}`}:{})}));
  let response=await request();
  if(response.status!==401)return response;
  merchantToken='';
  if(merchantLoginInProgress)throw new Error('商家登录进行中');
  const password=window.prompt('请输入商家密码');
  if(!password)throw new Error('已取消商家登录');
  merchantLoginInProgress=true;
  try{
    const login=await fetch(apiUrl(backend.merchantLoginPath),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});
    if(!login.ok)throw new Error('商家密码不正确');
    merchantToken=(await login.json()).token||'';
    if(!merchantToken)throw new Error('商家登录失败');
  }finally{merchantLoginInProgress=false;}
  return request();
}
function normaliseCandidate(item,index){
  let url=typeof item==='string'?item:(item?.url||item?.image||item?.imageUrl||item?.src);
  if(!url)throw new Error(`candidate ${index+1} has no image`);
  if(/^\//.test(url)&&backend.apiBase)url=apiUrl(url);
  return {id:item?.id||`candidate-${index+1}`,url};
}
async function waitForGeneration(jobId,signal){
  for(let attempt=0;attempt<60;attempt++){
    if(signal?.aborted)throw new DOMException('Aborted','AbortError');
    setStatus('generateStatus',`正在生成成品，通常需要约 1 分钟（已等待 ${Math.max(1,Math.round((attempt*backend.pollMs)/1000))} 秒），请不要重复点击。`);
    const data=await responseJson(await fetch(apiUrl(`${backend.generatePath}/${encodeURIComponent(jobId)}`),{signal}));
    if(data.candidates||data.images||data.results)return data;
    if(['failed','error'].includes(data.status))throw new Error(data.message||'生成失败');
    await sleep(backend.pollMs);
  }
  throw new Error('生成超时，请稍后重试');
}
async function requestCandidates(){
  if(!hasBackend())return null;
  const style=selectedStyle(), category=selectedCategory(), mode='postcard', preset=stylePresets[style]||fallbackPreset();
  if(!generationRequestId)generationRequestId=crypto.randomUUID();
  const form=new FormData();form.append('image',sourceFile,sourceFile.name);form.append('category',category);form.append('mode',mode);form.append('composition','single-postcard');form.append('style',style);form.append('skill',selectedSkill(preset,style));form.append('prompt',preset.prompt||'');form.append('reserveTextArea','bottom');form.append('textLayers','date,caption');form.append('orientation',orientation);form.append('ratio',orientation==='portrait'?'2:3':'3:2');form.append('width',String(W));form.append('height',String(H));form.append('dpi','300');form.append('physicalSize',orientation==='portrait'?'4x6in':'6x4in');form.append('count','1');form.append('requestId',generationRequestId);form.append('sessionId',sessionId());if(generationGrantCode)form.append('grantCode',generationGrantCode);
  generateController=new AbortController();
  const data=await responseJson(await fetch(apiUrl(backend.generatePath),{method:'POST',body:form,signal:generateController.signal}));
  if(data.candidates||data.images||data.results)return data;
  if(data.jobId||data.id)return waitForGeneration(data.jobId||data.id,generateController.signal);
  throw new Error('生成接口没有返回候选图');
}
function candidateList(data,limit=2){return (data?.candidates||data?.images||data?.results||[]).map(normaliseCandidate).slice(0,limit);}
async function dataUrlBlob(dataUrl){const response=await fetch(dataUrl);return response.blob();}
async function submitOrder(){
  const style=selectedStyle(), category=selectedCategory(), mode='postcard', preset=stylePresets[style]||fallbackPreset();
  if(hasBackend()){
    const form=new FormData();form.append('image',await dataUrlBlob(finalUrl),'card.jpg');form.append('category',category);form.append('mode',mode);form.append('composition','single-postcard');form.append('layout',design.layout);form.append('style',style);form.append('skill',selectedSkill(preset,style));form.append('orientation',orientation);form.append('width',String(W));form.append('height',String(H));form.append('requestId',orderRequestId);
    const data=await responseJson(await fetch(apiUrl(backend.orderPath),{method:'POST',body:form}));
    return Object.assign({status:'awaiting_payment'},data,{url:finalUrl,layout:design.layout,category,mode,composition:'single-postcard',style,created:new Date().toISOString()});
  }
  const day=new Date().toISOString().slice(0,10).replaceAll('-','');
  return {id:crypto.randomUUID(),orderNo:`DALI-${day}-${Math.random().toString(36).slice(2,6).toUpperCase()}`,paymentRemark:'',status:'awaiting_payment',paymentStatus:'unpaid',printStatus:'pending',url:finalUrl,layout:design.layout,category,mode,composition:'single-postcard',style,created:new Date().toISOString()};
}
$('#uploadEmpty').onclick = $('#changePhoto').onclick = () => $('#photoInput').click();
function setOrientation(next) {
  if(next!==orientation&&stage==='uploadStage'){candidates=[];design=null;drafts={};}
  if(next!==orientation)generationRequestId='';
  orientation=next; W=next==='portrait'?1200:1800; H=next==='portrait'?1800:1200;
  canvas.width=W;canvas.height=H;
  $$('[data-orientation]').forEach(b=>{b.classList.toggle('active',b.dataset.orientation===next);b.setAttribute('aria-pressed',String(b.dataset.orientation===next));});
  $('#dimensionLabel').textContent=next==='portrait'?'4 × 6 in':'6 × 4 in';
  $('.editor-top small').textContent=`6 英寸 · ${next==='portrait'?'竖版':'横版'} · 单面`;
  $('#candidateCards').classList.toggle('landscape',next==='landscape');
  resizePreview();
}
$$('[data-orientation]').forEach(b=>b.onclick=()=>setOrientation(b.dataset.orientation));
$('#photoInput').onchange = async e => {
  const file=e.target.files[0]; if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>25*1024*1024){toast('请选择 25 MB 以内的 JPG、PNG 或 WEBP 图片');return;}
  try { const next=await loadImage(await readFile(file)); sourceImage=next;generationRequestId='';candidates=[];design=null;drafts={}; $('#sourcePreview').src=sourceImage.src; $('#photoPanel').classList.remove('hidden'); $('#uploadEmpty').classList.add('hidden'); $('#generateBtn').disabled=false; setOrientation(next.naturalWidth/next.naturalHeight>1.12?'landscape':'portrait'); }
  catch { toast('这张照片无法读取，请换一张'); }
  sourceFile=file;
  e.target.value='';
};
$('#grantCodeInput').oninput=e=>{generationGrantCode=e.target.value.trim().toUpperCase();e.target.value=generationGrantCode;};
$('#confirmStyleBtn').onclick=()=>{generationRequestId='';setStatus('selectionStatus','风格已确定，请上传照片');show('uploadStage');};
$('#backToSelection').onclick=()=>show('selectionStage');
function cover(ctx,img,rect,t) {
  const base=Math.max(rect.w/img.naturalWidth,rect.h/img.naturalHeight);
  t.zoom=clamp(t.zoom,1,4); const w=img.naturalWidth*base*t.zoom,h=img.naturalHeight*base*t.zoom;
  t.x=clamp(t.x,-(w-rect.w)/2,(w-rect.w)/2); t.y=clamp(t.y,-(h-rect.h)/2,(h-rect.h)/2);
  ctx.save();ctx.beginPath();ctx.rect(rect.x,rect.y,rect.w,rect.h);ctx.clip();
  ctx.translate(rect.x+rect.w/2,rect.y+rect.h/2);ctx.rotate((t.angle||0)*Math.PI/180);
  ctx.drawImage(img,-w/2+t.x,-h/2+t.y,w,h);ctx.restore();
}
$('#generateBtn').onclick = async () => {
  if(!sourceImage)return;
  const button=$('#generateBtn');
  const label=button.querySelector('span');
  button.disabled=true;button.classList.add('is-loading');button.setAttribute('aria-busy','true');
  if(label)label.textContent='正在生成…';
  setStatus('generateStatus',hasBackend()?'正在生成成品，通常需要约 1 分钟，请不要重复点击。':'本地预览模式：正在准备成品…');
  try {
    let remote=null;
    if(hasBackend())remote=await requestCandidates();
    const preview=document.createElement('canvas');preview.width=W;preview.height=H;const ctx=preview.getContext('2d');ctx.fillStyle='#f3f1ec';ctx.fillRect(0,0,W,H);
    const scale=Math.max(W/sourceImage.naturalWidth,H/sourceImage.naturalHeight),w=sourceImage.naturalWidth*scale,h=sourceImage.naturalHeight*scale;ctx.drawImage(sourceImage,(W-w)/2,(H-h)/2,w,h);
    const localUrl=preview.toDataURL('image/jpeg',.94);
    const remoteItems=candidateList(remote,1);
    candidates=(remoteItems.length?remoteItems:[{url:localUrl,id:'local-1'}]);
    for(const item of candidates)item.image=await loadImage(item.url);
    selected=0; design=null;drafts={};undoStack=[];redoStack=[];
    design=newDesign('ai-output');design.outputMode='postcard';drafts={};undoStack=[];redoStack=[];
    setStatus('candidateStatus',remoteItems.length?'AI 已生成一张成品明信片':'本地预览模式：成品使用原片填充');
    show('editorStage');activeLayer=null;renderPanel('photo');render();updateHistory();
    generationRequestId='';
    setStatus('generateStatus','成品已准备好，可以添加日期和一句话');
  } catch(error) { if(error.name!=='AbortError')toast(error.message||'无法生成成品，请重试'); setStatus('generateStatus','生成失败，可重试'); } finally {button.disabled=false;button.classList.remove('is-loading');button.removeAttribute('aria-busy');if(label)label.textContent='生成我的成品';generateController=null;icons();}
};
 function newDesign(layout) {
  return {layout,outputMode:selectedMode(),frame:'#fffdf7',compareFrame:false,comparePreset:'stack',cards:makeCards('stack'),photo:{zoom:1,x:0,y:0,angle:0,scale:1,offset:0},original:{zoom:1,x:0,y:0},text:[{id:'date',text:'DALI / TODAY',x:W*.08,y:H*.83,size:58,color:'#354940',font:'SimSun'},{id:'caption',text:'风从洱海吹来',x:W*.08,y:H*.9,size:76,color:'#354940',font:'SimSun'}],stickers:[]};
}
function makeCards(preset){
  if(preset==='side')return {original:{x:W*.25,y:H*.5,w:W*.5,h:H,angle:0},generated:{x:W*.75,y:H*.5,w:W*.5,h:H,angle:0}};
  if(preset==='stagger')return {original:{x:W*.38,y:H*.35,w:W*.67,h:H*.62,angle:-7},generated:{x:W*.64,y:H*.68,w:W*.67,h:H*.62,angle:7}};
  return {original:{x:W*.5,y:H*.25,w:W,h:H*.5,angle:0},generated:{x:W*.5,y:H*.75,w:W,h:H*.5,angle:0}};
}
$('#enterEditor').onclick=()=>{if(!design)design=newDesign('ai-output');show('editorStage');activeLayer=null;renderPanel('date');render();updateHistory();};
$('#backToUpload').onclick=()=>show('uploadStage');
$('#backToCandidates').onclick=()=>{show('uploadStage');$('#generateBtn span').textContent='再生成一张';setStatus('generateStatus','不满意可以再生成；两次生成至少间隔 30 秒。如提示操作频繁，请联系店主领取授权码。');};
function photoRects() {
  if(design.layout==='compare')return Object.fromEntries(Object.entries(design.cards).map(([key,c])=>[key,{x:c.x-c.w/2,y:c.y-c.h/2,w:c.w,h:c.h}]));
  if(design.layout==='postcard'||design.layout==='ai-output')return {generated:{x:0,y:0,w:W,h:H}};
  const w=W*design.photo.scale,h=H*design.photo.scale;
  return {generated:{x:(W-w)/2,y:clamp((orientation==='landscape'?45:85)+design.photo.offset,30,H-h-30),w,h}};
}
function textGeometry(ctx,layer) {
  ctx.font=`${layer.size}px "${fontName(layer.font)}", "Microsoft YaHei", sans-serif`; const lines=[];let line='';
  for(const char of layer.text){if(char==='\n'||ctx.measureText(line+char).width>W-80){lines.push(line);line=char==='\n'?'':char;}else line+=char;}
  if(line)lines.push(line); const width=Math.max(1,...lines.map(s=>ctx.measureText(s).width));const height=Math.max(1,lines.length)*layer.size*1.3;
  layer.x=clamp(layer.x,0,W-width);layer.y=clamp(layer.y,0,H-height);
  return {x:layer.x,y:layer.y,w:width,h:height,lines};
}
const outlineOffsets = n => {const points=[];for(let i=0;i<32;i++){const angle=i*Math.PI/16;points.push([Math.cos(angle)*n,Math.sin(angle)*n]);}return points;};
function drawDoodle(ctx,asset,layer){
  const aspect=asset.image.naturalHeight/asset.image.naturalWidth,h=layer.width*aspect,pad=layer.outline?layer.outlineWidth:0,key=[asset.id,layer.width,layer.fill,layer.outline?layer.outlineColor:'',pad].join(':');
  let painted=doodleCache.get(key);
  if(!painted){const w=Math.ceil(layer.width+pad*2),hh=Math.ceil(h+pad*2),off=document.createElement('canvas');off.width=w;off.height=hh;const oc=off.getContext('2d');
    if(layer.outline){oc.globalAlpha=1;oc.filter='none';for(const [dx,dy] of outlineOffsets(pad))oc.drawImage(asset.image,pad+dx,pad+dy,layer.width,h);oc.globalCompositeOperation='source-in';oc.fillStyle=layer.outlineColor;oc.fillRect(0,0,w,hh);oc.globalCompositeOperation='source-over';}
    const fill=document.createElement('canvas');fill.width=Math.ceil(layer.width);fill.height=Math.ceil(h);const fc=fill.getContext('2d');fc.drawImage(asset.image,0,0,fill.width,fill.height);fc.globalCompositeOperation='source-in';fc.fillStyle=layer.fill;fc.fillRect(0,0,fill.width,fill.height);oc.drawImage(fill,pad,pad);painted=off;doodleCache.set(key,painted);if(doodleCache.size>150)doodleCache.delete(doodleCache.keys().next().value);
  }
  ctx.drawImage(painted,layer.x-pad,layer.y-pad);
}
const doodleCache = new Map();
function drawCompareCard(ctx,img,card,t){
  ctx.save();ctx.translate(card.x,card.y);ctx.rotate(card.angle*Math.PI/180);
  const frame=design.compareFrame?Math.min(card.w,card.h)*.045:0;
  if(frame){ctx.fillStyle='#fffdf7';ctx.fillRect(-card.w/2,-card.h/2,card.w,card.h);}
  cover(ctx,img,{x:-card.w/2+frame,y:-card.h/2+frame,w:card.w-frame*2,h:card.h-frame*2},t);
  ctx.restore();
}
function render(target=canvas,selection=true) {
  if(!design||!candidates.length)return;const ctx=target.getContext('2d');ctx.clearRect(0,0,W,H);ctx.fillStyle=design.frame;ctx.fillRect(0,0,W,H);
  if(design.layout==='compare'){
    drawCompareCard(ctx,sourceImage,design.cards.original,design.original);
    drawCompareCard(ctx,candidates[selected].image,design.cards.generated,design.photo);
  }else cover(ctx,candidates[selected].image,photoRects().generated,design.photo);
  bounds=new Map();ctx.textBaseline='top';
  for(const layer of design.text){if(!layer.text)continue;const box=textGeometry(ctx,layer);ctx.font=`${layer.size}px "${fontName(layer.font)}", "Microsoft YaHei", sans-serif`;ctx.fillStyle=layer.color;box.lines.forEach((line,i)=>ctx.fillText(line,layer.x,layer.y+i*layer.size*1.3));bounds.set(layer.id,box);}
  for(const layer of design.stickers){const asset=stickerAssets.find(a=>a.id===layer.asset);if(!asset)continue;const h=layer.width*asset.image.naturalHeight/asset.image.naturalWidth,pad=layer.outline?layer.outlineWidth:0;layer.x=clamp(layer.x,pad,W-layer.width-pad);layer.y=clamp(layer.y,pad,H-h-pad);drawDoodle(ctx,asset,layer);bounds.set(layer.id,{x:layer.x-pad,y:layer.y-pad,w:layer.width+pad*2,h:h+pad*2});}
  if(selection&&activeLayer&&bounds.has(activeLayer)){const b=bounds.get(activeLayer);ctx.save();ctx.strokeStyle='#53846b';ctx.lineWidth=4;ctx.setLineDash([13,10]);ctx.strokeRect(b.x-10,b.y-10,b.w+20,b.h+20);ctx.restore();}
  else if(selection&&design.layout==='compare'&&(tool==='layout'||tool==='photo')){const c=design.cards[activePhoto];ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.angle*Math.PI/180);ctx.strokeStyle='#53846b';ctx.lineWidth=4;ctx.setLineDash([13,10]);ctx.strokeRect(-c.w/2+4,-c.h/2+4,c.w-8,c.h-8);ctx.restore();}
}
function resizePreview(){if(stage!=='editorStage')return;const area=$('#previewArea'),ratio=W/H;const width=Math.max(40,Math.min(area.clientWidth-32,(area.clientHeight-48)*ratio));canvas.style.width=width+'px';canvas.style.height=width/ratio+'px';render();}
new ResizeObserver(resizePreview).observe($('#previewArea'));
function viewport(){document.documentElement.style.setProperty('--app-height',(window.visualViewport?.height||window.innerHeight)+'px');resizePreview();}
window.visualViewport?.addEventListener('resize',viewport);window.addEventListener('resize',viewport);viewport();
const titles={layout:'成品版式',photo:'照片取景',date:'日期',caption:'一句话',sticker:'贴纸'};
const iconButton=(id,icon,label)=>`<button id="${id}" class="icon-button" aria-label="${label}" title="${label}"><i data-lucide="${icon}"></i></button>`;
function swatches(colors,current,attr){return colors.map(([color,name])=>`<button class="swatch ${current===color?'active':''}" style="--swatch:${color}" ${attr}="${color}" aria-label="${name}" title="${name}" aria-pressed="${current===color}"></button>`).join('');}
function renderPanel(next) {
  tool=next;const panel=$('#toolPanel');$('#panelTitle').textContent=titles[tool];guide(guideText[tool]||'选择画布中的元素进行编辑',false);$$('.tool').forEach(b=>b.classList.toggle('active',b.dataset.tool===tool));
  if(tool==='layout'){
    panel.innerHTML=`<div class="layout-options">${layouts.map(([key,name])=>`<button class="layout-option ${key===design.layout?'active':''}" data-layout="${key}" aria-pressed="${key===design.layout}"><span class="layout-mini ${key} ${orientation}"><img src="${candidates[selected].url}" alt="">${key==='compare'?`<img src="${candidates[selected].url}" alt="">`:''}</span><span>${name}</span></button>`).join('')}</div>${design.layout.startsWith('polaroid')?`<div class="swatch-row"><span>边框</span>${swatches(palettes,design.frame,'data-frame')}</div>`:''}${design.layout==='compare'?`<div class="compare-controls"><div class="segmented"><button data-preset="stack" class="${design.comparePreset==='stack'?'active':''}">上下</button><button data-preset="side" class="${design.comparePreset==='side'?'active':''}">左右</button><button data-preset="stagger" class="${design.comparePreset==='stagger'?'active':''}">错位</button></div><div class="compare-frame-control"><span>照片边缘</span><div class="segmented"><button data-compare-frame="false" class="${!design.compareFrame?'active':''}">无边框</button><button data-compare-frame="true" class="${design.compareFrame?'active':''}">留白边</button></div></div></div>`:''}<div class="layout-photo-tools"><div class="photo-tool-heading"><span>照片调整</span><small>直接拖动照片，不需要切换相框位置</small></div>${design.layout==='compare'?`<div class="segmented"><button data-photo="original" class="${activePhoto==='original'?'active':''}">原图</button><button data-photo="generated" class="${activePhoto==='generated'?'active':''}">生成图</button></div>`:''}<div class="control-row"><span class="photo-target">${design.layout==='compare'?'选中照片':'照片取景'}</span><div class="compact-actions">${iconButton('layoutPhotoOut','zoom-out','缩小照片')}${iconButton('layoutPhotoIn','zoom-in','放大照片')}${iconButton('layoutPhotoRotate','rotate-cw','旋转照片')}${iconButton('layoutPhotoReset','rotate-ccw','重置照片')}</div></div></div>`;
    $$('[data-layout]').forEach(b=>b.onclick=()=>{if(b.dataset.layout===design.layout)return;checkpoint();drafts[design.layout]=clone(design);design=drafts[b.dataset.layout]?clone(drafts[b.dataset.layout]):newDesign(b.dataset.layout);activeLayer=null;activePhoto='generated';renderPanel('layout');render();});
    $$('[data-frame]').forEach(b=>b.onclick=()=>{checkpoint();design.frame=b.dataset.frame;renderPanel('layout');render();});
    $$('[data-compare-frame]').forEach(b=>b.onclick=()=>{checkpoint();design.compareFrame=b.dataset.compareFrame==='true';renderPanel('layout');render();});
    $$('[data-preset]').forEach(b=>b.onclick=()=>{checkpoint();design.comparePreset=b.dataset.preset;design.cards=makeCards(design.comparePreset);renderPanel('layout');render();});
    $$('[data-photo]').forEach(b=>b.onclick=()=>{activePhoto=b.dataset.photo;renderPanel('layout');});
    const zoom=f=>{checkpoint();const t=activePhoto==='original'?design.original:design.photo;if(design.layout==='compare'){const card=design.cards[activePhoto];card.w=clamp(card.w*f,W*.2,W*1.2);card.h=clamp(card.h*f,H*.2,H*1.2);}else t.zoom=clamp(t.zoom*f,1,4);render();};
    $('#layoutPhotoOut').onclick=()=>zoom(1/1.1);$('#layoutPhotoIn').onclick=()=>zoom(1.1);
    $('#layoutPhotoRotate').onclick=()=>{checkpoint();if(design.layout==='compare')design.cards[activePhoto].angle=(design.cards[activePhoto].angle+15)%360;else design.photo.angle=(design.photo.angle+15)%360;render();};
    $('#layoutPhotoReset').onclick=()=>{checkpoint();if(design.layout==='compare')design.cards[activePhoto]=makeCards(design.comparePreset)[activePhoto];else design.photo={zoom:1,x:0,y:0,angle:0,scale:orientation==='landscape'?.72:.78,offset:0};render();};
  }else if(tool==='date'||tool==='caption'){
    const layer=design.text.find(l=>l.id===tool);activeLayer=layer.id;
    panel.innerHTML=`<div class="input-row"><input id="textInput" class="panel-input" aria-label="${titles[tool]}内容" maxlength="${tool==='date'?32:80}" placeholder="${tool==='date'?'DALI / TODAY':'风从洱海吹来'}">${iconButton('removeText','trash-2','移除文字')}</div><div class="control-row font-row"><label class="font-picker">字体<select id="fontFamily"><option value="SimSun" ${(layer.font||'SimSun')==='SimSun'?'selected':''}>宋体</option><option value="KaiTi" ${layer.font==='KaiTi'?'selected':''}>楷体</option><option value="Huiwen Mincho" ${layer.font==='Huiwen Mincho'?'selected':''}>汇文明朝体</option></select></label><div class="size-controls">${iconButton('textSmaller','minus','缩小文字')}<span id="textSize">${layer.size}</span>${iconButton('textLarger','plus','放大文字')}</div></div><div class="control-row"><div class="text-colors"><span>颜色</span>${swatches([['#354940','深绿'],['#fffdf7','纸白'],['#242424','黑色'],['#b45a6b','玫红'],['#6486ad','晴蓝']],layer.color,'data-text-color')}<label class="custom-color" title="自选颜色"><i data-lucide="pipette"></i><input id="customTextColor" type="color" value="${layer.color}" aria-label="自选文字颜色"></label></div></div>`;
    const input=$('#textInput');input.value=layer.text;input.onfocus=()=>checkpoint();input.oninput=()=>{layer.text=input.value;render();};
    $('#removeText').onclick=()=>{checkpoint();layer.text='';input.value='';render();};
    const size=delta=>{checkpoint();layer.size=clamp(layer.size+delta,24,130);$('#textSize').textContent=layer.size;render();};$('#textSmaller').onclick=()=>size(-6);$('#textLarger').onclick=()=>size(6);
    $('#fontFamily').onchange=async e=>{
      checkpoint();
      layer.font=e.target.value;
      render();
      const family=fontName(layer.font);
      try{
        if(document.fonts?.load)await document.fonts.load(`${layer.size}px "${family}"`);
      }catch{}
      render();
    };
    $$('[data-text-color]').forEach(b=>b.onclick=()=>{checkpoint();layer.color=b.dataset.textColor;renderPanel(tool);render();});
    $('#customTextColor').oninput=e=>{checkpoint();layer.color=e.target.value;render();};
  }else if(tool==='photo'){
    activeLayer=null;
    panel.innerHTML=`<p class="guide-note">单指拖动取景，双指缩放和旋转；放大后，画面外的部分会被裁掉。</p>${design.layout==='compare'?`<div class="segmented"><button data-photo="original" class="${activePhoto==='original'?'active':''}">原图</button><button data-photo="generated" class="${activePhoto==='generated'?'active':''}">生成图</button></div>`:''}<div class="control-row"><span class="photo-target">照片取景</span><div class="compact-actions">${iconButton('photoOut','zoom-out','缩小照片')}${iconButton('photoIn','zoom-in','放大照片')}${iconButton('resetPhoto','rotate-ccw','复位照片')}</div></div>`;
    $$('[data-photo]').forEach(b=>b.onclick=()=>{activePhoto=b.dataset.photo;renderPanel('layout');});
    const zoom=f=>{checkpoint();const t=activePhoto==='original'?design.original:design.photo;if(design.layout==='compare'){const card=design.cards[activePhoto];card.w=clamp(card.w*f,W*.2,W*1.2);card.h=clamp(card.h*f,H*.2,H*1.2);}else t.zoom=clamp(t.zoom*f,1,4);render();};$('#photoOut').onclick=()=>zoom(1/1.1);$('#photoIn').onclick=()=>zoom(1.1);
    $('#resetPhoto').onclick=()=>{checkpoint();if(design.layout==='compare')design.cards[activePhoto]=makeCards(design.comparePreset)[activePhoto];else design.photo={zoom:1,x:0,y:0,angle:0,scale:orientation==='landscape'?.72:.78,offset:0};render();};
  }else{
    const activeSticker=design.stickers.find(s=>s.id===activeLayer);
    panel.innerHTML=`<div class="sticker-list">${stickerAssets.map(a=>`<button class="sticker-option" data-asset="${a.id}" aria-label="添加涂鸦贴纸"><span style="--doodle:url('${a.url}')"></span></button>`).join('')}</div>${activeSticker?`<div class="sticker-style"><span>填色</span>${swatches([['#ee8291','珊瑚粉'],['#f1c84c','柠檬黄'],['#77b8a2','薄荷绿'],['#79a9d4','天空蓝'],['#fffdf7','奶油白'],['#354940','深绿']],activeSticker.fill,'data-sticker-fill')}<label class="custom-color" title="自选贴纸颜色"><i data-lucide="pipette"></i><input id="customStickerColor" type="color" value="${activeSticker.fill}" aria-label="自选贴纸填色"></label></div><div class="sticker-style outline-style"><label><input id="stickerOutlineToggle" type="checkbox" ${activeSticker.outline?'checked':''}>描边</label>${activeSticker.outline?`<div class="outline-swatches">${swatches([['#fffdf7','奶油白'],['#354940','深绿'],['#f1c84c','淡黄']],activeSticker.outlineColor,'data-outline-color')}<label class="custom-color" title="自选描边颜色"><i data-lucide="pipette"></i><input id="customOutlineColor" type="color" value="${activeSticker.outlineColor}" aria-label="自选描边颜色"></label></div><select id="outlineSize" aria-label="描边粗细"><option value="8" ${activeSticker.outlineWidth===8?'selected':''}>细</option><option value="14" ${activeSticker.outlineWidth===14?'selected':''}>中</option><option value="22" ${activeSticker.outlineWidth===22?'selected':''}>粗</option></select>`:''}<div class="compact-actions">${iconButton('shrinkSticker','minus','缩小贴纸')}${iconButton('growSticker','plus','放大贴纸')}${iconButton('removeSticker','trash-2','删除贴纸')}</div></div><div class="sticker-import"><span>可拖动、双指缩放</span><label title="导入自有素材"><i data-lucide="image-plus"></i><input id="stickerInput" type="file" accept="image/png,image/webp" hidden></label></div>`:`<div class="sticker-import"><span class="sticker-hint">点选涂鸦添加到画面</span><label title="导入自有素材"><i data-lucide="image-plus"></i><input id="stickerInput" type="file" accept="image/png,image/webp" hidden></label></div>`}`;
    $('#stickerInput').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(!['image/png','image/webp'].includes(f.type)||f.size>5*1024*1024){toast('请选择 5 MB 以内的 PNG 或 WEBP 贴纸');return;}try{const url=await readFile(f),image=await loadImage(url);const asset={id:crypto.randomUUID(),url,image};stickerAssets.push(asset);addSticker(asset.id);}catch{toast('贴纸读取失败');}};
    $$('[data-asset]').forEach(b=>b.onclick=()=>addSticker(b.dataset.asset));
    $$('[data-sticker-fill]').forEach(b=>b.onclick=()=>{const l=design.stickers.find(s=>s.id===activeLayer);if(!l)return;checkpoint();l.fill=b.dataset.stickerFill;doodleCache.clear();renderPanel('sticker');render();});
    if($('#customStickerColor'))$('#customStickerColor').oninput=e=>{const l=design.stickers.find(s=>s.id===activeLayer);if(l){checkpoint();l.fill=e.target.value;doodleCache.clear();render();}};
    $$('[data-outline-color]').forEach(b=>b.onclick=()=>{const l=design.stickers.find(s=>s.id===activeLayer);if(!l)return;checkpoint();l.outlineColor=b.dataset.outlineColor;doodleCache.clear();renderPanel('sticker');render();});
    if($('#customOutlineColor'))$('#customOutlineColor').oninput=e=>{const l=design.stickers.find(s=>s.id===activeLayer);if(l){checkpoint();l.outlineColor=e.target.value;doodleCache.clear();render();}};
    if($('#outlineSize'))$('#outlineSize').onchange=e=>{const l=design.stickers.find(s=>s.id===activeLayer);if(l){checkpoint();l.outlineWidth=Number(e.target.value);doodleCache.clear();render();}};
    if($('#stickerOutlineToggle'))$('#stickerOutlineToggle').onchange=e=>{const l=design.stickers.find(s=>s.id===activeLayer);if(l){checkpoint();l.outline=e.target.checked;doodleCache.clear();renderPanel('sticker');render();}};
    const changeSticker=f=>{const l=design.stickers.find(s=>s.id===activeLayer);if(!l)return;checkpoint();l.width=clamp(l.width*f,80,Math.min(750,H/(stickerAssets.find(a=>a.id===l.asset).image.naturalHeight/stickerAssets.find(a=>a.id===l.asset).image.naturalWidth)));render();};
    if(activeSticker){
      $('#shrinkSticker').onclick=()=>changeSticker(.88);$('#growSticker').onclick=()=>changeSticker(1.12);$('#removeSticker').onclick=()=>{if(!design.stickers.some(s=>s.id===activeLayer))return;checkpoint();design.stickers=design.stickers.filter(s=>s.id!==activeLayer);activeLayer=null;renderPanel('sticker');render();};
      ['shrinkSticker','growSticker','removeSticker'].forEach(id=>$('#'+id).disabled=!design.stickers.some(s=>s.id===activeLayer));
    }
  }
  icons();render();
}
function addSticker(asset){checkpoint();const image=stickerAssets.find(a=>a.id===asset).image;const layer={id:crypto.randomUUID(),asset,x:450,y:700,width:Math.min(240,600*image.naturalWidth/image.naturalHeight),fill:'#ee8291',outline:false,outlineColor:'#fffdf7',outlineWidth:14};design.stickers.push(layer);activeLayer=layer.id;renderPanel('sticker');render();}
$$('.tool').forEach(b=>b.onclick=()=>{$('.editor-controls').classList.remove('collapsed');activeLayer=null;renderPanel(b.dataset.tool);});
$('#collapsePanel').onclick=()=>{$('.editor-controls').classList.toggle('collapsed');$('#collapsePanel').setAttribute('aria-label',$('.editor-controls').classList.contains('collapsed')?'展开选项':'收起选项');};
function point(e,el){const r=el.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};}
function hitCard(p,card){const a=-card.angle*Math.PI/180,dx=p.x-card.x,dy=p.y-card.y;return Math.abs(dx*Math.cos(a)-dy*Math.sin(a))<=card.w/2&&Math.abs(dx*Math.sin(a)+dy*Math.cos(a))<=card.h/2;}
function gesture(el){
  const pointers=new Map();let session=null;
  const distance=()=>{const p=[...pointers.values()];return Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);};
  const pointerAngle=()=>{const p=[...pointers.values()];return Math.atan2(p[1].y-p[0].y,p[1].x-p[0].x);};
  el.addEventListener('pointerdown',e=>{
    if(!design)return;e.preventDefault();el.setPointerCapture(e.pointerId);const p=point(e,el);pointers.set(e.pointerId,p);
    if(pointers.size===1){
      document.activeElement?.blur();
      if(tool==='date'||tool==='caption'){
        activeLayer=tool;const layer=design.text.find(item=>item.id===tool);checkpoint();session={type:'layer',target:layer,last:p};
      }else if(tool==='sticker'){
        const tolerance=20*W/el.getBoundingClientRect().width;const hitSticker=[...bounds.entries()].reverse().find(([id,b])=>design.stickers.some(s=>s.id===id)&&p.x>=b.x-tolerance&&p.x<=b.x+b.w+tolerance&&p.y>=b.y-tolerance&&p.y<=b.y+b.h+tolerance);
        if(hitSticker)activeLayer=hitSticker[0];
        const layer=design.stickers.find(item=>item.id===activeLayer);
        if(layer){checkpoint();session={type:'layer',target:layer,last:p};}else{session=null;guide('请先点选一个贴纸，再拖动画布移动它');}
      }else{
        const tolerance=20*W/el.getBoundingClientRect().width;const hit=[...bounds.entries()].reverse().find(([,b])=>p.x>=b.x-tolerance&&p.x<=b.x+b.w+tolerance&&p.y>=b.y-tolerance&&p.y<=b.y+b.h+tolerance);const hitId=hit?.[0];
        if(hitId&&tool==='layout'){session=null;guide('当前是版式工具；拖动空白处即可移动照片');}
        else if(design.layout==='compare'&&(tool==='layout'||tool==='photo')){
          const hitPhoto=[activePhoto,activePhoto==='original'?'generated':'original'].find(key=>hitCard(p,design.cards[key]));
          if(hitPhoto){activePhoto=hitPhoto;session={type:'compare-card',target:design.cards[activePhoto],last:p};renderPanel('layout');}
        }else if(tool==='layout'||tool==='photo'){checkpoint();session={type:'photo',target:design.photo,last:p};}
      }
    }
    if(pointers.size===2&&session){session.distance=distance();session.initialPointerAngle=pointerAngle();session.initialAngle=session.target.angle||0;session.initialZoom=session.target.zoom||session.target.width||session.target.size;session.initialScale=session.target.scale;session.initialWidth=session.target.w;session.initialHeight=session.target.h;}
    render();
  });
  el.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId)||!session)return;const p=point(e,el);pointers.set(e.pointerId,p);
    if(pointers.size===2){const factor=distance()/Math.max(1,session.distance),rotation=(pointerAngle()-session.initialPointerAngle)*180/Math.PI;if(session.type==='layer'){if(session.target.width)session.target.width=clamp(session.initialZoom*factor,80,600);else session.target.size=clamp(session.initialZoom*factor,24,130);}else if(session.type==='compare-card'){session.target.w=clamp(session.initialWidth*factor,W*.2,W*1.2);session.target.h=clamp(session.initialHeight*factor,H*.2,H*1.2);session.target.angle=session.initialAngle+rotation;}else{session.target.zoom=clamp(session.initialZoom*factor,1,4);session.target.angle=session.initialAngle+rotation;}}
    else {const dx=p.x-session.last.x,dy=p.y-session.last.y;session.target.x+=dx;session.target.y+=dy;session.last=p;}
    render();
  });
  const end=e=>{pointers.delete(e.pointerId);if(pointers.size===1&&session)session.last=[...pointers.values()][0];if(!pointers.size){session=null;if(tool==='date'||tool==='caption'){const l=design.text.find(x=>x.id===tool);if($('#textSize'))$('#textSize').textContent=Math.round(l.size);}}};
  el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);el.addEventListener('lostpointercapture',end);
  el.addEventListener('wheel',e=>{if(!design)return;e.preventDefault();checkpoint();const f=e.deltaY<0?1.08:1/1.08;if(design.layout==='compare'){const c=design.cards[activePhoto];c.w=clamp(c.w*f,W*.2,W*1.2);c.h=clamp(c.h*f,H*.2,H*1.2);}else design.photo.zoom*=f;render();},{passive:false});
}
gesture(canvas);
canvas.addEventListener('keydown',e=>{if(!design||!activeLayer)return;const layer=design.text.find(l=>l.id===activeLayer)||design.stickers.find(l=>l.id===activeLayer);const directions={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,-10],ArrowDown:[0,10]};if(directions[e.key]){e.preventDefault();checkpoint();layer.x+=directions[e.key][0];layer.y+=directions[e.key][1];render();}});
function orderNumber(order){return order?.orderNo||order?.orderNumber||order?.number||order?.id||'待生成';}
function orderPaymentStatus(order){return order?.paymentStatus||(['paid','confirmed'].includes(order?.status)?'paid':'unpaid');}
function orderPrintStatus(order){return order?.printStatus||(['printed'].includes(order?.status)?'printed':'pending');}
function renderPayment(order){
  const number=orderNumber(order), remark=order?.paymentRemark||number, qr=order?.paymentQrUrl||backend.paymentQrUrl, paymentUrl=order?.paymentUrl||backend.paymentUrl;
  $('#orderNumber').textContent=number;$('#paymentHint').textContent=`付款时请在微信备注里填写：${remark}。商家核对到账后安排打印。请务必记住订单号，现场会按订单号叫号。`;
  const qrImage=$('#paymentQr');qrImage.classList.toggle('hidden',!qr);if(qr){if(qrImage.getAttribute('src')!==qr)qrImage.src=qr;qrImage.onclick=()=>{const dialog=$('#qrDialog');$('#qrLarge').src=qr;if(dialog&&!dialog.open)dialog.showModal();icons();};}
  $('#paymentLink').classList.toggle('hidden',!paymentUrl);if(paymentUrl){$('#paymentLink').href=paymentUrl;$('#paymentLink').textContent='打开收款码';}
  const paid=orderPaymentStatus(order)==='paid';$('#markCustomerPaid').disabled=paid;$('#markCustomerPaid').textContent=paid?'商家已确认付款':'我已付款，通知商家';$('#returnHome').classList.toggle('hidden',!paid&&orderPaymentStatus(order)!=='customer_reported');
}
async function saveOrderLocal(order){return dbAction('readwrite','orders',store=>store.put(order));}
async function markPayment(order, status){
  if(hasBackend()&&order?.id){
    const response=await fetch(apiUrl(`${backend.orderPath}/${encodeURIComponent(order.id)}/payment`),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});
    order=Object.assign(order,await responseJson(response));
  }else order.paymentStatus=status;
  await saveOrderLocal(order);currentOrder=order;renderPayment(order);return order;
}
$('#saveOrder').onclick=async()=>{
  if(savingOrder)return;
  if(!design||!candidates.length){toast('请先完成照片生成和编辑');return;}
  const button=$('#saveOrder'),label=button.querySelector('span');
  savingOrder=true;button.disabled=true;button.classList.add('is-loading');button.setAttribute('aria-busy','true');if(label)label.textContent='保存中…';
  try{
    if(!orderRequestId)orderRequestId=crypto.randomUUID();
    const output=document.createElement('canvas');output.width=W;output.height=H;render(output,false);finalUrl=output.toDataURL('image/jpeg',.96);
    $('#finalPreview').src=finalUrl;$('#exportSize').textContent=`${W} × ${H} px · 6 英寸单面`;$('#saveLocal').disabled=false;$('#saveStatus').textContent='正在提交订单，请稍候…';
    const dialog=$('#finishDialog');if(!dialog.open)dialog.showModal();
    currentOrder=await submitOrder();
    if(!currentOrder.id)currentOrder.id=crypto.randomUUID();
    if(!currentOrder.orderNo)currentOrder.orderNo=orderNumber(currentOrder);
    if(!currentOrder.paymentRemark)currentOrder.paymentRemark=currentOrder.orderNo;
    currentOrder.url=finalUrl;await saveOrderLocal(currentOrder);renderPayment(currentOrder);
    $('#saveStatus').textContent=hasBackend()?'订单已提交，请按订单号付款':'本地订单已创建，接入后端后会同步到商家队列';$('#saveLocal').disabled=false;orderRequestId='';
  }catch(error){
    $('#saveStatus').textContent='订单提交失败，成品仍可下载；可以稍后重试。';
    toast(error.message||'订单提交失败');
    if(finalUrl)$('#downloadFinal').focus();
  }finally{
    savingOrder=false;button.disabled=false;button.classList.remove('is-loading');button.removeAttribute('aria-busy');if(label)label.textContent='完成';icons();
  }
};
$('#closeFinish').onclick=()=>$('#finishDialog').close();
$('#closeQr').onclick=()=>$('#qrDialog').close();
$('#returnHome').onclick=()=>{ $('#finishDialog').close(); $('#historyView').classList.add('hidden'); $('#operatorView').classList.add('hidden'); $('#customerView').classList.remove('hidden'); document.body.classList.remove('editing'); show('selectionStage'); window.scrollTo(0,0); };
function download(url){const a=document.createElement('a');a.href=url;a.download=`TODAY-${new Date().toISOString().slice(0,10)}.jpg`;a.click();}
$('#downloadFinal').onclick=()=>download(finalUrl);
$('#copyOrder').onclick=async()=>{try{await navigator.clipboard.writeText($('#orderNumber').textContent);toast('订单号已复制');}catch{toast('请长按订单号复制');}};
$('#markCustomerPaid').onclick=async()=>{if(!currentOrder)return;$('#markCustomerPaid').disabled=true;try{await markPayment(currentOrder,'customer_reported');$('#saveStatus').textContent='已通知商家，请等待核对到账。记住订单号，现场会按号叫号。';$('#returnHome').classList.remove('hidden');}catch{toast('付款状态暂时无法提交，请稍后重试');$('#markCustomerPaid').disabled=false;}};
$('#refreshPayment').onclick=async()=>{if(!currentOrder)return;try{if(hasBackend()&&currentOrder.id){const order=await responseJson(await fetch(apiUrl(`${backend.orderPath}/${encodeURIComponent(currentOrder.id)}`)));currentOrder=Object.assign(currentOrder,order);await saveOrderLocal(currentOrder);renderPayment(currentOrder);}toast(orderPaymentStatus(currentOrder)==='paid'?'商家已确认付款':'暂未确认付款');}catch{toast('暂时无法刷新付款状态');}};
const dbReady=new Promise((resolve,reject)=>{if(!window.indexedDB){reject(new Error('No IndexedDB'));return;}const req=indexedDB.open('today-studio',2);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('works'))db.createObjectStore('works',{keyPath:'id'});if(!db.objectStoreNames.contains('orders'))db.createObjectStore('orders',{keyPath:'id'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
dbReady.catch(()=>{});
async function dbAction(mode,storeName,action){const db=await dbReady;return new Promise((resolve,reject)=>{const tx=db.transaction(storeName,mode);const req=action(tx.objectStore(storeName));let result;req.onsuccess=()=>{result=req.result;};tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);});}
$('#saveLocal').onclick=async()=>{if(!finalUrl)return;if(savedFinal===finalUrl){toast('这份成品已经保存');return;}try{const order=currentOrder||{id:crypto.randomUUID(),orderNo:`DALI-${Date.now()}`,paymentRemark:'',paymentStatus:'unpaid',printStatus:'pending',url:finalUrl,layout:design.layout,created:new Date().toISOString()};order.url=finalUrl;await saveOrderLocal(order);savedFinal=finalUrl;currentOrder=order;renderPayment(order);$('#saveStatus').textContent='已保存到本机订单队列';$('#saveLocal').disabled=true;}catch{toast('本机空间不可用，请直接下载图片');}};
function createOrderRow(order){
  const row=document.createElement('div');row.className='order';const img=document.createElement('img');img.src=order.url;img.alt='已保存的成品';const info=document.createElement('div');const title=document.createElement('strong');title.textContent=`${orderNumber(order)} · 明信片`;const time=document.createElement('small');time.textContent=new Date(order.created||Date.now()).toLocaleString();const status=document.createElement('small');status.className='order-status';status.textContent=`${orderPaymentStatus(order)==='paid'?'已付款':'待核款'} · ${orderPrintStatus(order)==='printed'?'已打印':'待打印'}`;info.append(title,time,status);
  const actions=document.createElement('div');actions.className='order-actions';const downloadButton=document.createElement('button');downloadButton.className='icon-button';downloadButton.title='下载成品';downloadButton.setAttribute('aria-label','下载成品');downloadButton.innerHTML='<i data-lucide="download"></i>';downloadButton.onclick=()=>download(order.url);const paidButton=document.createElement('button');paidButton.className='small-action';paidButton.textContent=orderPaymentStatus(order)==='paid'?'已付款':'确认付款';paidButton.disabled=orderPaymentStatus(order)==='paid';paidButton.onclick=async()=>{try{order.paymentStatus='paid';if(hasBackend()&&order.id)Object.assign(order,await responseJson(await merchantRequest(`${backend.orderPath}/${encodeURIComponent(order.id)}/payment`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'paid'})})));await saveOrderLocal(order);await loadQueue();}catch{toast('付款状态保存失败');}};const printedButton=document.createElement('button');printedButton.className='small-action';printedButton.textContent=orderPrintStatus(order)==='printed'?'已打印':'标记已打印';printedButton.disabled=orderPrintStatus(order)==='printed';printedButton.onclick=async()=>{try{order.printStatus='printed';if(hasBackend()&&order.id)Object.assign(order,await responseJson(await merchantRequest(`${backend.orderPath}/${encodeURIComponent(order.id)}/print`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'printed'})})));await saveOrderLocal(order);await loadQueue();}catch{toast('打印状态保存失败');}};actions.append(downloadButton,paidButton,printedButton);row.append(img,info,actions);return row;
}
async function loadQueue(remoteOrders){const q=$('#queue');q.textContent='正在读取…';try{const remote=remoteOrders||await responseJson(await merchantRequest(backend.orderPath));const orders=Array.isArray(remote)?remote:(remote.orders||[]);q.replaceChildren();if(!orders.length){q.textContent='还没有订单';return;}orders.sort((a,b)=>new Date(b.created||0)-new Date(a.created||0)).forEach(order=>q.append(createOrderRow(order)));icons();}catch{q.textContent='暂时无法读取订单，请重新登录。';}}
async function loadHistory(){const list=$('#historyList');list.textContent='正在读取…';try{const orders=await dbAction('readonly','orders',s=>s.getAll());const works=await dbAction('readonly','works',s=>s.getAll());const all=[...orders,...works.map(work=>({id:`legacy-${work.id}`,orderNo:work.orderNo||`LOCAL-${work.id}`,paymentStatus:'unpaid',printStatus:'pending',url:work.url,layout:work.layout,created:work.created}))];const unique=[...new Map(all.map(order=>[orderNumber(order),order])).values()].sort((a,b)=>new Date(b.created||0)-new Date(a.created||0));list.replaceChildren();if(!unique.length){list.textContent='还没有订单';return;}unique.forEach(order=>{const row=document.createElement('article');row.className='history-item';const info=document.createElement('div');const no=document.createElement('strong');no.textContent=orderNumber(order);const status=document.createElement('small');status.textContent=`${orderPaymentStatus(order)==='paid'?'已付款':'待核款'} · ${orderPrintStatus(order)==='printed'?'已打印':'待打印'}`;info.append(no,status);const copy=document.createElement('button');copy.className='small-action';copy.textContent='复制订单号';copy.onclick=async()=>{try{await navigator.clipboard.writeText(orderNumber(order));toast('订单号已复制');}catch{toast(orderNumber(order));}};const view=document.createElement('button');view.className='small-action';view.textContent='付款信息';view.onclick=()=>{currentOrder=order;finalUrl=order.url||'';if(finalUrl)$('#finalPreview').src=finalUrl;renderPayment(order);$('#saveStatus').textContent='可把订单号和付款备注给商家';$('#finishDialog').showModal();icons();};row.append(info,copy,view);list.append(row);});}catch{list.textContent='暂时无法读取历史订单。';}}
$('#operatorToggle').onclick=async()=>{const button=$('#operatorToggle');button.disabled=true;try{if(!hasBackend())throw new Error('商家后台尚未连接');const remote=await responseJson(await merchantRequest(backend.orderPath));$('#customerView').classList.add('hidden');$('#historyView').classList.add('hidden');$('#operatorView').classList.remove('hidden');await loadQueue(remote);}catch(error){if(error.message!=='已取消商家登录')toast(error.message||'商家登录失败');}finally{button.disabled=false;}};
$('#createGrant').onclick=async()=>{const button=$('#createGrant'),result=$('#grantResult');button.disabled=true;result.textContent='正在生成…';try{const response=await merchantRequest('/api/admin/generation-grants',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({uses:Number($('#grantUses').value||1)})});const data=await responseJson(response);result.textContent=`授权码：${data.code}（剩余 ${data.remaining} 次）`;try{await navigator.clipboard.writeText(data.code);toast('授权码已生成并复制');}catch{toast('授权码已生成，请告诉顾客');}}catch(error){result.textContent='生成失败，请重试';toast(error.message||'授权码生成失败');}finally{button.disabled=false;}};
$('#historyToggle').onclick=async()=>{merchantToken='';$('#queue').replaceChildren();$('#customerView').classList.add('hidden');$('#operatorView').classList.add('hidden');$('#historyView').classList.remove('hidden');document.body.classList.remove('editing');await loadHistory();};
$('#customerToggle').onclick=()=>{merchantToken='';$('#queue').replaceChildren();$('#operatorView').classList.add('hidden');$('#historyView').classList.add('hidden');$('#customerView').classList.remove('hidden');};
$('#historyBack').onclick=()=>{$('#historyView').classList.add('hidden');$('#customerView').classList.remove('hidden');};
icons();updateHistory();
