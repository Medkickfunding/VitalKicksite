import sys
from PIL import Image, ImageDraw
fs=sys.argv[2:]; out=sys.argv[1]
W,H=960,540; cols=2; rows=(len(fs)+1)//2
s=Image.new('RGB',(W*cols,H*rows))
d=ImageDraw.Draw(s)
for i,f in enumerate(fs):
    im=Image.open(f).convert('RGB').resize((W,H)); s.paste(im,((i%cols)*W,(i//cols)*H)); d.text(((i%cols)*W+8,(i//cols)*H+8),f.split('_')[-1],fill=(255,255,0))
s.save(out,quality=88)
