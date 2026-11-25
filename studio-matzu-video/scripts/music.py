import numpy as np, soundfile as sf
sr=48000; D=65.0; N=int(sr*D); t=np.arange(N)/sr
out=np.zeros((N,2))
rng=np.random.default_rng(3)
def hz(m): return 440*2**((m-69)/12)
def env_ad(n,a,d):
    e=np.ones(n); A=int(a*sr); e[:A]=np.linspace(0,1,A); e[A:]=np.exp(-np.arange(n-A)/(d*sr)); return e
def add(sig,start,pan=0.0):
    i=int(start*sr); j=min(N,i+len(sig)); s=sig[:j-i]
    out[i:j,0]+=s*(1-pan)*0.5**0.5*1.2; out[i:j,1]+=s*(1+pan)*0.5**0.5*1.2
def pad(notes,start,dur,amp):
    n=int(dur*sr); tt=np.arange(n)/sr; s=np.zeros(n)
    for m in notes:
        for det in (-0.08,0,0.08):
            f=hz(m)*2**(det/12)
            s+=np.sin(2*np.pi*f*tt+rng.random()*6)+0.3*np.sin(4*np.pi*f*tt)
    e=np.minimum(1,np.minimum(tt/1.5,(dur-tt)/1.5)).clip(0)
    s*=e*amp/len(notes)
    add(s,start,-0.2); add(np.roll(s,int(0.013*sr)),start,0.2)
def bell(m,start,amp,d=2.5,pan=0):
    n=int((d+0.1)*sr); tt=np.arange(n)/sr; f=hz(m)
    s=(np.sin(2*np.pi*f*tt)+0.4*np.sin(2*np.pi*2*f*tt)*np.exp(-tt*3)+0.15*np.sin(2*np.pi*3.01*f*tt)*np.exp(-tt*5))
    add(s*env_ad(n,0.005,d/3)*amp,start,pan)
def kick(start,amp):
    n=int(0.5*sr); tt=np.arange(n)/sr; f=45+90*np.exp(-tt*30)
    add(np.sin(2*np.pi*np.cumsum(f)/sr)*np.exp(-tt*7)*amp,start)
def tick(start,amp):
    n=int(0.06*sr); s=rng.standard_normal(n); s=np.diff(np.concatenate([[0],s])); add(s*np.exp(-np.arange(n)/(0.01*sr))*amp,start,0.3)
def sub_hit(start,amp):
    n=int(4*sr); tt=np.arange(n)/sr; f=38+50*np.exp(-tt*6)
    s=np.sin(2*np.pi*np.cumsum(f)/sr)*np.exp(-tt*1.2)
    nz=rng.standard_normal(n)*np.exp(-tt*2.5)*0.25; nz=np.convolve(nz,np.ones(40)/40,'same')
    add((s+nz)*amp,start)
def riser(start,dur,amp):
    n=int(dur*sr); tt=np.arange(n)/sr; nz=rng.standard_normal(n)
    k=np.linspace(200,8,n).astype(int); y=np.zeros(n); c=np.cumsum(nz)
    # crude sweep: moving average with shrinking window
    for i in range(0,n,2400):
        w=k[i]; seg=nz[i:i+2400]; y[i:i+2400]=np.convolve(seg,np.ones(w)/w,'same')*np.sqrt(w)*0.3
    y+=0.3*np.sin(2*np.pi*np.cumsum(np.linspace(110,440,n))/sr)
    add(y*(tt/dur)**2*amp,start)
# Section A: reflective (Am9 / Fmaj7)
pad([57,64,67,71],0,7.2,0.22); pad([53,60,64,69],6.6,7.2,0.22)
for i,(m,s) in enumerate([(76,1.3),(72,3.4),(79,7.1),(74,9.8)]): bell(m,s,0.10,3,(-1)**i*0.4)
# Section B: problem build (Dm -> E), pulse
pad([50,57,62,65],13.2,6,0.24); pad([52,59,64,68],18.8,6.2,0.26)
bpm=96; b=60/bpm; tt0=13.5
x=tt0
while x<24.6:
    prog=(x-tt0)/11; kick(x,0.35+0.35*prog)
    tick(x+b/2,0.05+0.1*prog)
    if prog>0.55: tick(x+b/4,0.04*prog); tick(x+3*b/4,0.04*prog)
    x+=b
for i,s in enumerate([16.2,17.6,18.8,20.0]): bell(69+[0,3,5,7][i],s,0.12,1.6)
riser(21.0,3.75,0.25)
# Section C: brand (C - G - Am - F), confident groove
sub_hit(24.75,0.7); bell(84,24.78,0.12,4)
chords=[[48,55,60,64,67],[43,55,59,62,67],[45,57,60,64,69],[41,53,57,60,65]]
x=24.75; ci=0; bar=4*b
while x<55.0:
    pad(chords[ci%4],x,bar+1.2,0.26); ci+=1; x+=bar
x=27.25
while x<54.8:
    kick(x,0.45); tick(x+b/2,0.09)
    if int(round((x-27.25)/b))%2==1: tick(x,0.05)
    x+=b
# arpeggio sparkle at "o mês inteiro"
for i,m in enumerate([72,76,79,84,88]): bell(m,40.6+i*0.12,0.07,1.5,(i-2)*0.2)
riser(52.6,2.75,0.2)
# Section D: logo + finale
sub_hit(55.35,0.8); pad([48,55,60,64,67,71],55.3,6,0.26)
pad([41,53,57,60,64,69],60.3,4.7,0.24); bell(79,55.4,0.1,4); bell(84,60.5,0.1,4.4); bell(72,62.4,0.08,2.5)
# simple reverb: multi-tap feedback-free
rv=np.zeros_like(out)
for dly,g in [(0.031,0.35),(0.047,0.3),(0.071,0.25),(0.113,0.2),(0.167,0.15),(0.241,0.1),(0.353,0.07)]:
    d=int(dly*sr); rv[d:,0]+=out[:-d,1]*g; rv[d:,1]+=out[:-d,0]*g
out=out+rv*0.6
fade=np.ones(N); fn=int(2.5*sr); fade[-fn:]=np.linspace(1,0,fn)**2; out*=fade[:,None]
out=np.tanh(out*1.2); out/=np.max(np.abs(out)); out*=0.9
sf.write("music.wav",out.astype(np.float32),sr)
