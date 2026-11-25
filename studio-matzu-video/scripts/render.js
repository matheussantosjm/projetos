const {chromium}=require('playwright');const {spawn}=require('child_process');const http=require('http');const fs=require('fs');const path=require('path');
const dir=process.argv[2], mode=process.argv[3], out=process.argv[4];
const srv=http.createServer((q,r)=>{const f=path.join(dir,decodeURIComponent(q.url.split('?')[0]));fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end()}r.writeHead(200,{'Content-Type':f.endsWith('.html')?'text/html':f.endsWith('.json')?'application/json':f.endsWith('.png')?'image/png':'font/woff2'});r.end(d)})}).listen(8765);
(async()=>{
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
  p.on('console',m=>console.log('page:',m.text()));p.on('pageerror',e=>console.log('ERR',e.message));
  await p.goto('http://localhost:8765/index.html');await p.evaluate(()=>window.ready);
  if(mode==='stills'){
    for(const t of process.argv.slice(5)){await p.evaluate(t=>render(t),parseFloat(t));await p.locator('canvas').screenshot({path:`${out}/f_${t}.png`})}
  } else {
    const fps=30,dur=parseFloat(process.argv[5]||'65');const N=Math.round(fps*dur);
    const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',String(fps),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p',out],{stdio:['pipe','inherit','inherit']});
    for(let i=0;i<N;i++){await p.evaluate(t=>render(t),i/fps);const buf=await p.locator('canvas').screenshot({type:'jpeg',quality:95});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));if(i%150===0)console.log('frame',i,'/',N)}
    ff.stdin.end();await new Promise(r=>ff.on('close',r));
  }
  await b.close();srv.close();
})();
