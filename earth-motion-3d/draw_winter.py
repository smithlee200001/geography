from PIL import Image, ImageDraw, ImageFont
import numpy as np, math
import os
from pathlib import Path
W,H=1400,1680
im=Image.new('RGB',(W,H),'#071425'); d=ImageDraw.Draw(im)
font=os.environ.get('NOTO_CJK_REGULAR','/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc')
bold=os.environ.get('NOTO_CJK_BOLD','/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc')
def f(n,b=False):return ImageFont.truetype(bold if b else font,n)
def txt(x,y,s,n=30,c='#dceaf4',b=False):d.text((x,y),s,font=f(n,b),fill=c)
def arrow(a,b,c='#ffd47b',w=5):
 d.line([a,b],fill=c,width=w);v=np.array(b,dtype=float)-a;v/=np.linalg.norm(v);p=np.array([-v[1],v[0]]);t=np.array(b);d.polygon([tuple(t),tuple(t-v*18+p*8),tuple(t-v*18-p*8)],fill=c)
# backdrop
for i in range(90):
 x=(i*199+43)%W;y=(i*347+217)%1050
 d.ellipse((x,y,x+2,y+2),fill='#28405b')
txt(72,58,'地球运动实验室',23,'#7cbacb');txt(72,105,'冬至：为什么北半球更冷？',54,b=True)
txt(72,187,'自转带来昼夜；倾斜的地轴与公转共同带来四季。',28,'#a2b8ce')
d.rounded_rectangle((72,256,1328,1030),radius=28,fill='#0c1e33',outline='#233d58',width=2)
txt(110,290,'北半球冬至 · 12 月前后',34,b=True);txt(110,340,'北极倾向背离太阳的一侧',26,'#9edddd')
cx,cy,R=910,680,245
# sun
for r in range(144,105,-1):
 alpha=(144-r)/39;col=(int(18+35*alpha),int(33+23*alpha),int(47-12*alpha));d.ellipse((200-r,680-r,200+r,680+r),fill=col)
d.ellipse((95,575,305,785),fill='#ffd07b');d.ellipse((112,592,288,768),fill='#ffdc92')
txt(150,821,'太阳',39,'#ffe0a3',True)
# light direction
for yy in [560,650,740,830]:arrow((360,yy),(620,yy))
txt(370,466,'近似平行的太阳光',25,'#ffd47b')
# sphere pixel rendering
Y,X=np.mgrid[-R:R+1,-R:R+1];xx=X/R;yy=-Y/R;inside=xx*xx+yy*yy<=1;zz=np.sqrt(np.maximum(0,1-xx*xx-yy*yy));tilt=math.radians(23.4);a=np.array([math.sin(tilt),math.cos(tilt),0]);lat=xx*a[0]+yy*a[1]
bright=np.clip(-xx,0,1);amb=.18+.82*bright**.65
base=np.zeros((*xx.shape,3));base[:]=[35,130,184]
# merely suggest textured oceans (no invented geographic borders)
base+=np.sin(xx[...,None]*18+zz[...,None]*12)*4
for k in range(3):base[:,:,k]*=amb
cap=np.abs(lat)>.94
base[cap]=np.stack([150*amb[cap],190*amb[cap],215*amb[cap]],axis=-1)
rgba=np.zeros((*xx.shape,4),dtype=np.uint8);rgba[:,:,:3]=np.clip(base,0,255);rgba[:,:,3]=inside*255
im.paste(Image.fromarray(rgba),(cx-R,cy-R),Image.fromarray(rgba)[:,:,] if False else Image.fromarray(rgba).getchannel('A'));d=ImageDraw.Draw(im)
d.ellipse((cx-R,cy-R,cx+R,cy+R),outline='#6bb5cf',width=2)
# visible longitude and latitude curves with orthographic projection
e=np.array([math.cos(tilt),-math.sin(tilt),0]);z=np.array([0,0,1])
def curve(points,color,width=1):
 run=[]
 for p in points:
  if p[2]>=0:
   run.append((cx+R*p[0],cy-R*p[1]))
  else:
   if len(run)>1:d.line(run,fill=color,width=width)
   run=[]
 if len(run)>1:d.line(run,fill=color,width=width)
for latdeg in [-66.6,-40,-23.4,0,23.4,40,66.6]:
 la=math.radians(latdeg);curve([a*math.sin(la)+math.cos(la)*(e*math.cos(t)+z*math.sin(t)) for t in np.linspace(0,2*math.pi,400)],'#8bb2c0' if latdeg==0 else '#366780',2 if latdeg==0 else 1)
for lon in np.linspace(0,math.pi,9):curve([a*math.sin(t)+math.cos(t)*(e*math.cos(lon)+z*math.sin(lon)) for t in np.linspace(-math.pi/2,math.pi/2,160)],'#2c5875')
# axis and normal with angle
north=(cx+315*a[0],cy-315*a[1]);south=(cx-295*a[0],cy+295*a[1]);arrow(south,north,'#b1fff1',4)
for yy0 in range(cy-310,cy,14):d.line((cx,yy0,cx,yy0+7),fill='#89a0b6',width=2)
pts=[(cx+118*math.sin(t),cy-118*math.cos(t)) for t in np.linspace(0,tilt,30)];d.line(pts,fill='#fff2a8',width=3)
txt(cx+9,cy-172,'23.4°',25,'#ffe4a1');txt(1060,394,'北极 N',27,'#b1fff1',True);txt(717,954,'南极 S',24,'#b1fff1')
txt(825,366,'轨道面法线',20,'#8ba4bb');txt(707,642,'昼',38,'#f1f8fa',True);txt(1060,703,'夜',38,'#9fb7cd',True)
txt(1010,935,'地轴',25,'#b1fff1')
# winter meaning cards
for x,title,body in [(72,'北半球：冬季','阳光更斜 · 白昼更短'),(718,'南半球：夏季','阳光更直 · 白昼更长')]:
 d.rounded_rectangle((x,1060,x+610,1202),radius=22,fill='#112a40');txt(x+30,1083,title,32,b=True);txt(x+30,1140,body,26,'#b3c8d7')
# comparison movements
d.rounded_rectangle((72,1235,1328,1570),radius=28,fill='#0c1e33',outline='#233d58',width=2)
txt(108,1266,'① 自转',32,'#b1fff1',True);txt(108,1320,'绕自己的地轴转',27);txt(108,1362,'平均太阳日约 24 小时',25,'#a2b8ce');txt(108,1410,'同一地点轮流进入昼面、夜面',23,'#a2b8ce')
# schematic orbit right
ox,oy=1000,1418;rx,ry=220,72
d.ellipse((ox-rx,oy-ry,ox+rx,oy+ry),outline='#4c7794',width=3);d.ellipse((ox-25,oy-25,ox+25,oy+25),fill='#ffd47b');d.ellipse((ox+rx-19,oy-19,ox+rx+19,oy+19),fill='#378bc2');arrow((1210,1442),(1185,1461),'#83d8ed',3)
txt(735,1266,'② 公转',32,'#83d8ed',True);txt(735,1312,'绕太阳转一圈约 365.25 天',25);txt(740,1520,'一年中，地轴指向近似保持不变。',23,'#a2b8ce')
txt(75,1600,'示意图：尺寸、距离不按比例。冬季主要不是因为离太阳更远。',23,'#94adc2')
im.save(Path(__file__).with_name('winter-solstice-3d.png'))
