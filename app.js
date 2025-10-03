// app.js — 由容量算電流 / 由電流算容量（容量顯示 kW）
const WIRE_TABLE=[["3.5",30,27],["5.5",39,35],["8",51,46],["14",74,67],["22",93,84],["30",116,104],["38",130,117],["50",155,140],["60",176,159],["80",208,187],["100",242,218],["125",277,249],["150",309,278],["60*2",350,300],["80*2",400,400],["125*2",500,null],["150*2",null,500],["80*3",600,null],["100*3",null,600],["125*3",800,null],["150*3",null,800],["125*4",1000,null],["150*4",null,1000]];
const BUSBAR=[[15,2,1,30,130],[15,3,1,45,150],[20,2,1,40,155],[20,3,1,60,175],[20,5,1,100,220],[25,2,1,50,200],[25,3,1,75,250],[25,5,1,125,330],[30,3,1,90,305],[30,5,1,150,370],[30,5,2,300,820],[40,3,1,120,420],[40,5,1,200,715],[40,5,2,400,1230],[50,5,1,250,585],[50,10,1,500,875],[50,10,2,1000,1600],[60,5,1,300,700],[60,8,1,480,875],[60,10,1,600,1170],[60,10,2,1200,1790],[80,5,1,400,1230],[80,10,1,800,1300],[80,10,2,1600,1920],[80,10,3,2400,3310],[80,10,4,3200,4250],[100,5,1,500,1650],[100,10,1,1000,2735],[100,10,2,2000,3950],[100,10,3,3000,5010],[100,10,4,4000,5280],[120,10,2,2400,3100],[120,10,3,3600,4200],[120,10,4,4800,5280]];

function prettyNum(x){ if(!isFinite(x)) return 'NaN'; return parseFloat(x.toPrecision(6)).toString(); }
function prettyAmp(x){ return prettyNum(x); }

function resolveVPhase(){const sel=document.getElementById('vs').value;if(!sel)throw new Error('尚未選擇「電壓系統 (V)」');if(sel==='4W_380')return{V:380,is3:true,B:4};if(sel==='3W_220')return{V:220,is3:true,B:3};if(sel==='1P3W_220')return{V:220,is3:false,B:2};const v=parseFloat(document.getElementById('v').value);if(!isFinite(v)||v<=0)throw new Error('已選擇自訂 V，但未輸入數值');const is3=document.getElementById('is3').checked;return{V:v,is3:is3,B:is3?3:2}}

function pickWire(I,isFourW){for(const[s,a3,a4]of WIRE_TABLE){const cap=isFourW?a4:a3;if(cap==null)continue;if(cap>=I)return s}return null}
function pickBusbar(I){const byAC=BUSBAR.slice().sort((a,b)=>(a[4]??1e9)-(b[4]??1e9));for(const r of byAC){const cap=r[4];if(cap==null)continue;if(cap>=I)return{w:r[0],t:r[1],p:r[2]}}return null}

function setMode(mode){document.getElementById('panel_fw').classList.toggle('hide',mode!=='fw');document.getElementById('panel_bw').classList.toggle('hide',mode!=='bw');document.getElementById('tab_fw').classList.toggle('active',mode==='fw');document.getElementById('tab_bw').classList.toggle('active',mode==='bw');document.body.dataset.mode=mode;}

function calc(){
  const out=document.getElementById('out');
  const mode=document.body.dataset.mode||'fw';
  try{
    const {V,is3,B}=resolveVPhase();
    if(mode==='fw'){
      const W=parseFloat(document.getElementById('w').value);
      if(!isFinite(W)||W<=0) throw new Error('請輸入正確的容量 (W)');
      const I=(W/V)/(is3?Math.sqrt(3):1)*1.25;
      const wire=pickWire(I,B===4); const bus=pickBusbar(I);
      const line1=`1.電流值:${prettyAmp(I)}(A)`;
      const line2=`2.適用線徑:XLPE${wire?(' '+wire):'（無對應，請增大規格或改並聯）'}${wire?' mm²':''}`;
      const line3=bus?`3.適用銅排:[Cu bus ${bus.w}×${bus.t} mm × ${bus.p}片/相]x_${B}`:`3.適用銅排:（無對應，請增大規格）`;
      out.textContent=[line1,line2,line3].join('\n');
    }else{
      const I=parseFloat(document.getElementById('amps').value);
      if(!isFinite(I)||I<=0) throw new Error('請輸入正確的電流 (A)');
      const W=(I/1.25)*V*(is3?Math.sqrt(3):1);
      const kW=W/1000;
      const wire=pickWire(I,B===4); const bus=pickBusbar(I);
      const line1=`1.容量:${prettyNum(kW)}(kW)`;
      const line2=`2.適用線徑:XLPE${wire?(' '+wire):'（無對應，請增大規格或改並聯）'}${wire?' mm²':''}`;
      const line3=bus?`3.適用銅排:[Cu bus ${bus.w}×${bus.t} mm × ${bus.p}片/相]x_${B}`:`3.適用銅排:（無對應，請增大規格）`;
      out.textContent=[line1,line2,line3].join('\n');
    }
  }catch(e){ out.textContent='⚠️ '+e.message; }
}
document.getElementById('calc').addEventListener('click',calc);
document.getElementById('tab_fw').addEventListener('click',()=>setMode('fw'));
document.getElementById('tab_bw').addEventListener('click',()=>setMode('bw'));
setMode('fw');

// Register SW
if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js')})}
