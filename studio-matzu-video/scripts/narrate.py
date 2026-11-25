import json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
k=Kokoro("kokoro.onnx","voices.bin")
V="pm_alex"
BR="stˈudʒiʊ mˈatsu"
# id, text, speed, pause_after(s), gain
S=[
("s1","Você dedica tempo, conhecimento e atenção a cada detalhe do seu trabalho.",0.86,0.9,1.0),
("s2","Mas será que a sua presença digital",0.86,0.15,1.0),
("s3","transmite essa mesma qualidade?",0.84,1.3,1.0),
("p1","Produzir conteúdo exige tempo.",0.92,0.45,1.0),
("p2","Planejamento.",0.95,0.3,1.03),
("p3","Direção.",0.95,0.3,1.03),
("p4","Gravação.",0.97,0.3,1.05),
("p5","Edição.",0.97,0.5,1.06),
("p6","E, acima de tudo, frequência.",0.9,1.3,1.08),
("b1","É aqui que entra o "+"@BR"+".",0.88,0.7,1.0),
("b2","Uma produtora audiovisual que simplifica a maneira como marcas, empresas e profissionais produzem conteúdo.",0.9,1.0,1.0),
("e1","Em uma única sessão de gravação,",0.82,0.35,1.08),
("e2","podemos produzir conteúdo para",0.9,0.12,1.0),
("e3","o mês inteiro.",0.8,1.1,1.1),
("d1","Da direção à entrega final, cuidamos de cada etapa da produção.",0.9,1.0,1.0),
("v1","Você continua fazendo o que faz de melhor.",0.88,0.6,1.0),
("v2","Nós cuidamos de mostrar isso ao mundo.",0.86,1.3,1.03),
("m1","@BR.",0.8,1.1,1.08),
("f1","A qualidade do seu trabalho",0.8,0.25,1.08),
("f2","merece ser vista.",0.76,2.6,1.12),
]
sr=24000; out=[]; t=1.2; tl=[]
out.append(np.zeros(int(sr*1.2),np.float32))
for sid,txt,sp,pa,g in S:
    if "@BR" in txt:
        pre,post=txt.split("@BR")
        ph=((k.tokenizer.phonemize(pre,"pt-br")+" ") if pre.strip() else "")+BR+post
    else:
        ph=k.tokenizer.phonemize(txt,"pt-br")
    ph=ph.replace("ˈɔ st","ʊ st")
    a,_=k.create(ph,voice=V,speed=sp,lang="pt-br",is_phonemes=True)
    a=a.astype(np.float32)
    # trim silence
    idx=np.where(np.abs(a)>0.01)[0]; a=a[max(0,idx[0]-240):idx[-1]+1200]
    a=a/np.max(np.abs(a))*0.8*g
    d=len(a)/sr; tl.append(dict(id=sid,text=txt.replace("@BR","Studio Matzu"),start=round(t,3),end=round(t+d,3)))
    print(sid,ph[:70],round(t,2),round(d,2))
    out.append(a); out.append(np.zeros(int(sr*pa),np.float32)); t+=d+pa
y=np.concatenate(out); sf.write("raw.wav",y,sr)
json.dump(dict(duration=round(t,3),segments=tl),open("timeline.json","w"),indent=1,ensure_ascii=False)
print("total",t)
