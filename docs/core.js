const MAX=359999999;
function fail(code,cue){const e=new Error(code);e.cue=cue;throw e;}
export function parseTime(s,format){
 const re=format==='srt'?/^(\d{2,}):(\d{2}):(\d{2}),(\d{3})$/:/^(?:(\d{2,}):)?(\d{2}):(\d{2})\.(\d{3})$/;
 const m=s.match(re);if(!m)fail('time');const h=Number(m[1]||0),min=Number(m[2]),sec=Number(m[3]),ms=Number(m[4]);if(min>59||sec>59)fail('time');const value=((h*60+min)*60+sec)*1000+ms;if(value>MAX)fail('range');return value;
}
export function formatTime(value,format){if(!Number.isInteger(value)||value<0||value>MAX)fail('range');const h=Math.floor(value/3600000),m=Math.floor(value/60000)%60,s=Math.floor(value/1000)%60,ms=value%1000,p=(n,l=2)=>String(n).padStart(l,'0');return `${p(h)}:${p(m)}:${p(s)}${format==='srt'?',':'.'}${p(ms,3)}`;}
export function parseSubtitles(raw){
 if(typeof raw!=='string'||!raw.trim())fail('empty');if(new TextEncoder().encode(raw).length>1048576)fail('size');
 let normalized=raw.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').replace(/^(?:[ \t]*\n)+/,'').replace(/(?:\n[ \t]*)+$/,'');const format=/^WEBVTT(?:[ \t].*)?(?:\n|$)/.test(normalized)?'vtt':'srt';let header='WEBVTT';
 if(format==='vtt'){const pos=normalized.indexOf('\n');if(pos===-1)fail('empty');header=normalized.slice(0,pos);normalized=normalized.slice(pos+1);if(!/^[ \t]*\n/.test(normalized))fail('header');normalized=normalized.replace(/^(?:[ \t]*\n)+/,'');}
 if(!normalized)fail('empty');const blocks=normalized.split(/\n[ \t]*\n/);if(blocks.length>10000)fail('size');const cues=blocks.map((block,index)=>{
  const lines=block.split('\n');let id='',line=lines.shift();if(format==='vtt'&&/^(NOTE|STYLE|REGION)(\s|$)/.test(line))fail('unsupported',index+1);
  if(!line.includes('-->')){id=line;line=lines.shift()||'';}
  if(format==='srt'&&!/^\d+$/.test(id))fail('structure',index+1);if(id.includes('-->'))fail('structure',index+1);
  const m=line.match(/^(\S+)[ \t]+-->[ \t]+(\S+)(.*)$/);if(!m)fail('structure',index+1);if(format==='srt'&&m[3].trim())fail('unsupported',index+1);
  let start,end;try{start=parseTime(m[1],format);end=parseTime(m[2],format);}catch(e){e.cue=index+1;throw e;}if(end<=start)fail('duration',index+1);
  const text=lines.join('\n');if(!text.trim())fail('structure',index+1);
  // Inline WebVTT timestamps would also require retiming; reject instead of corrupting them.
  if(/<\d{2}(?::\d{2})?:\d{2}[.,]\d{3}>/.test(text))fail('inline',index+1);
  if(text.includes('-->'))fail('structure',index+1);
  return {id,start,end,settings:m[3],text};
 });return {format,header,cues};
}
export function shiftSubtitles(raw,{offset=0,factor=1,format='same'}={}){
 if(!Number.isFinite(offset)||Math.abs(offset)>86400000||!Number.isFinite(factor)||factor<0.1||factor>10)fail('options');const parsed=parseSubtitles(raw),target=format==='same'?parsed.format:format;if(!['srt','vtt'].includes(target))fail('options');
 // Conversion supports common plain/SRT formatting only; no silent loss of VTT settings/voice/class tags.
 if(target!==parsed.format&&parsed.cues.some(c=>c.settings.trim()||[...c.text.matchAll(/<[^>]*>/g)].some(m=>!/^<\/?(?:b|i|u)>$/i.test(m[0]))))fail('conversion');
 const cues=parsed.cues.map((cue,i)=>{const start=Math.round(cue.start*factor+offset),end=Math.round(cue.end*factor+offset);if(start<0||end<0)fail('negative',i+1);if(start>MAX||end>MAX)fail('range',i+1);if(end<=start)fail('duration',i+1);return {...cue,start,end};});
 const sorted=[...cues].sort((a,b)=>a.start-b.start),overlapSet=new Set();let maxEnd=-1,maxIndex=-1;sorted.forEach((c,i)=>{if(c.start<maxEnd){overlapSet.add(i);overlapSet.add(maxIndex);}if(c.end>maxEnd){maxEnd=c.end;maxIndex=i;}});const overlaps=overlapSet.size,outOfOrder=cues.some((c,i)=>i&&c.start<cues[i-1].start);
 const body=cues.map((c,i)=>{const id=target==='srt'?(parsed.format==='srt'?c.id:String(i+1)):(parsed.format==='vtt'?c.id:c.id);return (id?id+'\n':'')+`${formatTime(c.start,target)} --> ${formatTime(c.end,target)}${target==='vtt'?c.settings:''}\n${c.text}`;}).join('\n\n');
 return {text:(target==='vtt'?(parsed.format==='vtt'?parsed.header:'WEBVTT')+'\n\n':'')+body+'\n',format:target,count:cues.length,overlaps,outOfOrder,cues};
}
