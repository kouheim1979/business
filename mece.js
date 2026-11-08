(function(){
"use strict";
const KEY="business-mece-v1";
const $=id=>document.getElementById(id);
const defaults=()=>({theme:"仕事が遅れる原因",axis:"原因の所在（4Mの例）",categories:[
{id:"c1",name:"人（Man）",rule:"担当者の人数・技能・連携に起因するもの",items:"人手不足\n技能・経験不足"},
{id:"c2",name:"設備（Machine）",rule:"機械やシステムの能力・故障に起因するもの",items:"設備故障\nシステム停止"},
{id:"c3",name:"方法（Method）",rule:"手順・指示・計画の方法に起因するもの",items:"段取り不足\n手順が不明確"},
{id:"c4",name:"材料（Material）",rule:"必要な部品・材料・情報の供給に起因するもの",items:"材料欠品\n支給品の到着遅れ"}
],checks:{basis:false,separation:false,coverage:false}});
const blank=()=>({theme:"",axis:"",categories:[{id:"c1",name:"",rule:"",items:""},{id:"c2",name:"",rule:"",items:""}],checks:{basis:false,separation:false,coverage:false}});
function load(){try{const data=JSON.parse(localStorage.getItem(KEY));if(!data||!Array.isArray(data.categories))return blank();return {theme:String(data.theme||"").slice(0,200),axis:String(data.axis||"").slice(0,200),categories:data.categories.slice(0,20).map(c=>({id:String(c.id||""),name:String(c.name||"").slice(0,120),rule:String(c.rule||"").slice(0,280),items:String(c.items||"").slice(0,3000)})),checks:{basis:!!data.checks?.basis,separation:!!data.checks?.separation,coverage:!!data.checks?.coverage}};}catch(_){return blank();}}
let state=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(_){}}
function announce(message){$("mece-feedback").textContent=message;}
function norm(text){return text.normalize("NFKC").replace(/\s+/g,"").toLowerCase();}
function text(el,value){el.textContent=value;return el;}
function make(tag,cl,value){const el=document.createElement(tag);if(cl)el.className=cl;if(value!==undefined)text(el,value);return el;}
function renderEdit(){
 $("mece-theme").value=state.theme;$("mece-axis").value=state.axis;
 const place=$("mece-categories");place.replaceChildren();
 state.categories.forEach((cat,index)=>{
  const card=make("div","mece-category");
  const header=make("div","mece-cathead");
  const heading=make("strong","",("分類 "+(index+1)));
  const rm=make("button","btn small danger","削除");rm.type="button";rm.dataset.meceRemove=cat.id;rm.disabled=state.categories.length<=1;
  header.append(heading,rm);
  const label1=make("label","field");label1.append(text(make("span"),"分類名"));const name=make("input","edit-input");name.type="text";name.placeholder="例：人";name.maxLength=120;name.value=cat.name;name.dataset.meceName=cat.id;label1.append(name);
  const label2=make("label","field");label2.append(text(make("span"),"この分類に入る条件"));const rule=make("input","edit-input");rule.type="text";rule.placeholder="例：担当者の技能・連携に関する原因";rule.maxLength=280;rule.value=cat.rule;rule.dataset.meceRule=cat.id;label2.append(rule);
  const label3=make("label","field");label3.append(text(make("span"),"具体例（1行につき1項目）"));const items=make("textarea","edit-input");items.placeholder="例：人員不足\n引き継ぎ不足";items.maxLength=3000;items.rows=3;items.value=cat.items;items.dataset.meceItems=cat.id;label3.append(items);
  card.append(header,label1,label2,label3);place.append(card);
 });
 for(const name of ["basis","separation","coverage"])$("mece-check-"+name).checked=state.checks[name];
 review();
}
function records(){const sets=[];state.categories.forEach((c,i)=>{String(c.items||"").split(/\r?\n/).map(v=>v.trim()).filter(Boolean).forEach(item=>sets.push({item,key:norm(item),at:i}));});return sets;}
function review(){
 const target=$("mece-review");target.replaceChildren();
 const cats=state.categories;const issues=[];
 if(!state.theme.trim())issues.push("整理するテーマを入力してください。");
 if(!state.axis.trim())issues.push("分類の切り口（軸）を1つ決めてください。");
 if(cats.length<2)issues.push("比較できるよう分類を2つ以上用意してください。");
 const seenNames=new Map();for(const c of cats){if(!c.name.trim())issues.push("空欄の分類名があります。");else{const key=norm(c.name);if(seenNames.has(key))issues.push("分類名「"+c.name+"」が重複しています。");seenNames.set(key,true);}if(!c.rule.trim())issues.push("分類「"+(c.name||"名称未設定")+"」の境界条件が未記入です。");}
 const seenItems=new Map();for(const item of records()){if(seenItems.has(item.key)){issues.push("具体例「"+item.item+"」が複数行に含まれています（表記が同じ項目の重複）。");}else seenItems.set(item.key,true);}
 if(!state.checks.basis)issues.push("自己チェック：分類の軸が揃っているか確認してください。");
 if(!state.checks.separation)issues.push("自己チェック：分類同士の境界が曖昧でないか確認してください。");
 if(!state.checks.coverage)issues.push("自己チェック：想定対象をすべて含むか、「その他・未分類」が必要か確認してください。");
 const hint=make("p","hint",issues.length===0?"入力上の明確な重複は見つかりませんでした。ただし概念上の重複や分類のモレを自動で証明することはできません。":"見直しポイント："+issues.length+"件。機械判定は完全一致に近い重複だけです。");
 target.append(hint);
 if(issues.length){const ul=make("ul","mece-warnings");issues.slice(0,25).forEach(issue=>ul.append(make("li","",issue)));if(issues.length>25)ul.append(make("li","","残り "+(issues.length-25)+" 件"));target.append(ul);}
 renderTree();
}
function renderTree(){
 const node=$("mece-tree");node.replaceChildren();
 const topic=make("div","mece-root",state.theme.trim()||"（テーマ未入力）");node.append(topic);
 if(state.axis.trim())node.append(make("p","mece-axis-label","切り口："+state.axis));
 const branches=make("div","mece-branches");
 state.categories.forEach(cat=>{
  const branch=make("div","mece-branch");branch.append(make("strong","",cat.name.trim()||"（分類名未入力）"));
  if(cat.rule.trim())branch.append(make("small","",cat.rule));
  const items=String(cat.items||"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if(items.length){const ul=make("ul");items.forEach(t=>ul.append(make("li","",t)));branch.append(ul);}
  branches.append(branch);
 });node.append(branches);
}
function exportText(){
 return "MECE整理ツリー\nテーマ："+(state.theme||"（未入力）")+"\n分類の切り口："+(state.axis||"（未入力）")+"\n\n"+state.categories.map((c,i)=>(i+1)+". "+(c.name||"（名称未入力）")+"\n  境界条件："+(c.rule||"（未入力）")+"\n"+(c.items.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).map(item=>"  ・"+item).join("\n")||"  ・（項目未入力）")).join("\n\n")+"\n\n確認：分類軸"+(state.checks.basis?"済":"未")+"／境界"+(state.checks.separation?"済":"未")+"／網羅性"+(state.checks.coverage?"済":"未")+"\n※ 自己整理用。概念上の重複や漏れを自動判定するものではありません。";
}
async function copy(){
 const out=exportText();
 try{await navigator.clipboard.writeText(out);announce("整理結果をコピーしました。");}
 catch(_){const node=make("textarea");node.value=out;node.style.position="fixed";node.style.opacity="0";document.body.append(node);node.select();let succeeded=false;try{succeeded=document.execCommand("copy");}catch(_){}node.remove();announce(succeeded?"整理結果をコピーしました。":"自動コピーできません。ブラウザーの権限を確認してください。");}
}
function updateInput(event){const t=event.target;let changed=false;
 for(const prop of ["name","rule","items"]){const attr="mece"+prop[0].toUpperCase()+prop.slice(1);if(t.dataset[attr]!==undefined){const c=state.categories.find(x=>x.id===t.dataset[attr]);if(c){c[prop]=t.value;changed=true;}break;}}
 if(t.id==="mece-theme"){state.theme=t.value;changed=true;}
 if(t.id==="mece-axis"){state.axis=t.value;changed=true;}
 if(t.dataset.meceCheck){state.checks[t.dataset.meceCheck]=!!t.checked;changed=true;}
 if(changed){save();review();}
}
$("mece-theme").addEventListener("input",updateInput);
$("mece-axis").addEventListener("input",updateInput);
$("mece-categories").addEventListener("input",updateInput);
for(const key of ["basis","separation","coverage"])$("mece-check-"+key).addEventListener("change",e=>{e.target.dataset.meceCheck=key;updateInput(e);});
$("mece-categories").addEventListener("click",event=>{const btn=event.target.closest("[data-mece-remove]");if(!btn)return;if(state.categories.length<=1)return;state.categories=state.categories.filter(x=>x.id!==btn.dataset.meceRemove);save();renderEdit();});
$("mece-add").addEventListener("click",()=>{if(state.categories.length>=20){announce("分類は最大20件です。");return;}state.categories.push({id:"c"+Date.now()+"x"+state.categories.length,name:"",rule:"",items:""});save();renderEdit();const last=$("mece-categories").querySelector("div.mece-category:last-child input");if(last)last.focus();announce("分類を追加しました。");});
$("mece-sample").addEventListener("click",()=>{if(!window.confirm("サンプルに置き換えますか？現在の入力は失われます。"))return;state=defaults();save();renderEdit();announce("サンプルを読み込みました。");});
$("mece-clear").addEventListener("click",()=>{if(!window.confirm("MECEの入力を初期化しますか？"))return;state=blank();save();renderEdit();announce("入力を初期化しました。");});
$("mece-copy").addEventListener("click",copy);
renderEdit();
})();