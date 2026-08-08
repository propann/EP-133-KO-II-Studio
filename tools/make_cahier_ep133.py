from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfbase.pdfmetrics import stringWidth

OUT='CAHIER_FINGER_DRUMMING_EP133.pdf'
W,H=A4
ORANGE=colors.HexColor('#FF4400'); PAPER=colors.HexColor('#E6E4DF'); INK=colors.HexColor('#1A1A1A'); AMBER=colors.HexColor('#FFB000'); GREY=colors.HexColor('#DEDCD6'); BLUE=colors.HexColor('#2B6CB0')
styles=[
('BOOM-BAP','86 BPM','x--- --x- x--- ---x','---- x--- ---- x---','x-x- x-x- x-x- x-xx','---- --x- ---- x--x'),
('TRAP','140 BPM / half-time','x--- ---- --x- ---x','---- ---- x--- ----','xxxx xxxx xxxx xxxx','---- --xx ---- ----'),
('HOUSE','124 BPM','x--- x--- x--- x---','---- x--- ---- x---','--x- --x- --x- --x-','---- --x- ---- --x-'),
('TECHNO','132 BPM','x--- x--- x--- x---','---- x--- ---- x---','--x- --x- --x- --x-','---x ---- ---x ----'),
('FUNK / BOOGIE','108 BPM','x--x --x- x--- --x-','---- x--- ---- x--x','x-xx x-xx x-xx x-xx','--x- ---- --x- -x--'),
('REGGAE','92 BPM','x--- ---- --x- ----','---- x--- ---- x---','--x- --x- --x- --x-','---x x--- ---x x---'),
('DNB','174 BPM','x--- ---- --x- -x--','---- x--- ---- x---','x-xx x-xx x-xx x-xx','---x --x- ---x -x--'),
('BREAKBEAT','132 BPM','x--- --x- ---- x--x','---- x--- ---- x---','x-x- x-xx x-x- x-xx','--x- ---- -x-- ---x'),
('ELECTRO / GLITCH','118 BPM','x--- ---x x--- ----','---- x--- ---- x--x','x-x- xx-x x-x- xxx-','---- -x-x ---- x-xx'),
('AFRO / LATIN','104 BPM','x--- ---x x--- --x-','---- x--- ---- x---','x-x- x-x- x-x- x-x-','--x- ---x --x- ---x')]
styles += [
('BOOM-BAP / GHOST','86 BPM','x--- --x- x--- x--x','---- x--- ---- x---','xxxx x-x- xxxx x-xx','---x ---- --x- ---x'),
('BOOM-BAP / SWING','92 BPM','x--x ---x x--- --x-','---- x--- ---- x--x','x-xx --x- x-xx --x-','--x- ---- ---x --x-'),
('TRAP / ROLL','145 BPM / half-time','x--- ---x --x- ---x','---- ---- x--- ----','xx-x xxxx x-xx xxxx','---- -xxx ---- --xx'),
('TRAP / DARK','130 BPM / half-time','x--x ---- --x- x---','---- ---- x--- ----','xxxx xx-x xxxx xxxx','--x- ---- ---x --x-'),
('HOUSE / BOUNCE','126 BPM','x--- x--- x--x x---','---- x--- ---- x---','--xx --x- --xx --x-','---x ---- ---x ----'),
('HOUSE / MINIMAL','122 BPM','x--- ---- x--- ----','---- x--- ---- x---','--x- ---- --x- ----','---- ---x ---- ---x'),
('TECHNO / ROLLING','138 BPM','x--- x--- x--- x--x','---- x--- ---- x---','xxxx xxxx xxxx xxxx','---x ---x ---x ---x'),
('TECHNO / INDUSTRIAL','128 BPM','x--x x--- x--x x---','---- x--- ---- x---','--x- x-x- --x- x-x-','---x ---- ---x ----'),
('FUNK / BREAK','104 BPM','x--x --x- x--- --xx','---- x--- ---- x--x','x-xx x-xx x-xx xx-x','--x- ---x --x- ---x'),
('FUNK / SYNCOPÉ','112 BPM','x--- --x- x--x ---x','---- x--- ---- x---','x-xx x-x- x-xx x-x-','--x- ---- -x-- ---x'),
('DISCO / FOUR FLOOR','118 BPM','x--- x--- x--- x---','---- x--- ---- x---','x-x- x-x- x-x- x-x-','--x- ---- --x- ----'),
('DISCO / HI-HAT','120 BPM','x--- x--- x--- x---','---- x--- ---- x---','xxxx xxxx xxxx xxxx','---- --x- ---- --x-'),
('REGGAE / ONE DROP','78 BPM','x--- ---- ---- ----','---- x--- ---- x---','--x- --x- --x- --x-','---x x--- ---x x---'),
('DANCEHALL / BOUNCE','96 BPM','x--- --x- x--- ---x','---- x--- ---- x---','x-x- --x- x-x- --x-','--x- ---x --x- ---x'),
('DNB / TWO STEP','174 BPM','x--- ---- --x- ----','---- x--- ---- x---','x-xx x-xx x-xx x-xx','---x --x- ---x --x-'),
('DNB / ROLL','174 BPM','x--x ---- --x- -x--','---- x--- ---- x---','xxxx xxxx xxxx xxxx','--x- -x-- --x- -x--'),
('JUNGLE / BREAK','168 BPM','x--x --x- ---- x--x','---- x--- ---- x---','x-xx xxxx x-xx xxxx','--x- ---x --x- -x--'),
('BREAKBEAT / FUNKY','128 BPM','x--- --x- x--- x--x','---- x--- ---- x---','x-x- x-xx x-x- xx-x','--x- ---- ---x --x-'),
('GARAGE / 2-STEP','132 BPM','x--- ---- --x- ---x','---- x--- ---- x---','x-x- x-x- x-x- x-x-','--x- ---x --x- ---x'),
('UKG / SHUFFLE','132 BPM','x--x ---- x--- --x-','---- x--- ---- x---','x-xx x-xx x-xx x-xx','---x --x- ---x --x-'),
('ELECTRO / MACHINE','120 BPM','x--- ---x x--- ---x','---- x--- ---- x---','x-x- xx-x x-x- xx-x','--xx ---- --xx ----'),
('ELECTRO / GLITCH ROLL','118 BPM','x--- --x- x--- x--x','---- x--- ---- x--x','xxxx x-xx xxxx xx-x','-x-x ---- -x-x ----'),
('AFROBEAT / SHAKER','105 BPM','x--- ---x x--- --x-','---- x--- ---- x---','xxxxxxxx xxxxxxxx','-x-x -x-x -x-x -x-x'),
('AFROBEAT / CONGA','108 BPM','x--x ---x x--- --x-','---- x--- ---- x---','x-x- x-x- x-x- x-x-','--xx ---x --xx ---x'),
('LATIN / CLAVE','100 BPM','x--- --x- x--- --x-','---- x--- ---- x---','x-x- x-x- x-x- x-x-','--x- ---x --x- ---x'),
('BREAK / HALF-TIME','90 BPM','x--- ---- --x- ---x','---- x--- ---- x---','x-x- x-x- x-x- x-x-','---x ---- ---x ----'),
('BREAK / FILL','110 BPM','x--- --x- x--- x-xx','---- x--- ---- x--x','xxxx xxxx xx-x xxxx','--x- -x-- --x- xxx-')]
def txt(c,s,x,y,size=10,col=INK,font='Helvetica-Bold'):
    c.setFont(font,size); c.setFillColor(col); c.drawString(x,y,s)
def centered(c,s,x,y,size=10,col=INK):
    c.setFont('Helvetica-Bold',size); c.setFillColor(col); c.drawCentredString(x,y,s)
def button(c,x,y,w,h,label,fill=GREY):
    c.setFillColor(fill); c.setStrokeColor(INK); c.setLineWidth(1.2); c.roundRect(x,y,w,h,4,fill=1,stroke=1); centered(c,label,x+w/2,y+h/2-4,12,INK)
def header(c,title,sub=''):
    c.setFillColor(PAPER); c.rect(0,0,W,H,fill=1,stroke=0)
    c.setFillColor(INK); c.rect(0,H-28*mm,W,28*mm,fill=1,stroke=0)
    txt(c,'EP-133  /  FINGER DRUMMING',15*mm,H-14*mm,10,AMBER)
    txt(c,title,15*mm,H-23*mm,22,colors.white)
    if sub: txt(c,sub,15*mm,H-35*mm,10,INK)
def grid(c,x,y,row_labels,patterns,cell=8*mm):
    # 16-step grid, 4 beat groups
    labelw=25*mm
    for i in range(16):
        if i%4==0:
            c.setFillColor(colors.Color(1,0.27,0,alpha=.08)); c.rect(x+labelw+i*cell,y-5*mm,4*cell,50*mm,fill=1,stroke=0)
        c.setStrokeColor(colors.HexColor('#A9A6A0')); c.setLineWidth(.4); c.line(x+labelw+i*cell,y-5*mm,x+labelw+i*cell,y+45*mm)
        centered(c,str(i//4+1) if i%4==0 else ('e' if i%4==1 else ('&' if i%4==2 else 'a')),x+labelw+i*cell+cell/2,y+50*mm,6,INK)
    for r,(lab,pat) in enumerate(zip(row_labels,patterns)):
        yy=y+(3-r)*12*mm; txt(c,lab,x,yy+3,8,INK)
        for i,ch in enumerate(pat.replace(' ','')):
            active=ch=='x'; xx=x+labelw+i*cell
            c.setFillColor(ORANGE if active else GREY); c.setStrokeColor(INK); c.roundRect(xx+1,yy,cell-2,9*mm,2,fill=1,stroke=1)
            if active: centered(c,'●',xx+cell/2,yy+2.4*mm,13,colors.white)
def padmap(c,x,y,scale=1):
    txt(c,'DISPOSITION RÉELLE',x,y+68*mm,8,ORANGE)
    for i,l in enumerate(['A','B','C','D']): button(c,x,y+(3-i)*13*mm,10*mm,9*mm,l,colors.HexColor('#BFC1C0'))
    labels=['7','8','9','4','5','6','1','2','3','0','+','-']
    for i,l in enumerate(labels):
        xx=x+25*mm+(i%3)*14*mm; yy=y+(3-i//3)*13*mm
        button(c,xx,yy,11*mm,10*mm,l,AMBER if l in ['7','9','5'] else GREY)
    txt(c,'7 kick / pouce G   9 snare / index D   5 hat / index G',x,y-7*mm,7,INK,'Helvetica')
def cover(c):
    c.setFillColor(INK); c.rect(0,0,W,H,fill=1,stroke=0)
    c.setFillColor(ORANGE); c.circle(W-35*mm,H-38*mm,45*mm,fill=1,stroke=0)
    txt(c,'CAHIER',18*mm,H-65*mm,34,colors.white)
    txt(c,'FINGER',18*mm,H-85*mm,34,ORANGE)
    txt(c,'DRUMMING',18*mm,H-105*mm,34,colors.white)
    txt(c,'EP-133  K.O. II',18*mm,H-125*mm,16,AMBER)
    txt(c,'10 styles • grilles 16 pas • exercices progressifs',18*mm,30*mm,10,colors.white,'Helvetica')
    c.showPage()
c=canvas.Canvas(OUT,pagesize=A4)
cover(c)
header(c,'COMMENT LIRE LE CAHIER','Une page = une boucle à apprendre, jouer et enregistrer.')
padmap(c,22*mm,115*mm)
txt(c,'La grille',110*mm,205*mm,16,ORANGE); txt(c,'Chaque case représente une subdivision.',110*mm,194*mm,10,INK,'Helvetica')
txt(c,'● = frappe   - = silence',110*mm,185*mm,12,INK)
txt(c,'Méthode',110*mm,165*mm,16,ORANGE)
for i,s in enumerate(['1. Commence à 60 BPM','2. Joue kick + snare','3. Ajoute les hats','4. Ajoute les percus','5. Monte de 5 BPM']): txt(c,s,110*mm,153*mm-i*10*mm,10,INK,'Helvetica')
c.showPage()
for idx,(name,bpm,kick,snare,hat,perc) in enumerate(styles,1):
    header(c,f'{idx:02d}  {name}',bpm+'  •  boucle 1 mesure  •  niveau '+('★☆☆' if idx<4 else '★★☆' if idx<8 else '★★★'))
    grid(c,18*mm,170*mm,['KICK  A-7','SNARE A-9','HAT    A-5','PERC   A-1'],[kick,snare,hat,perc])
    padmap(c,22*mm,67*mm)
    c.setFillColor(INK); c.roundRect(110*mm,68*mm,80*mm,54*mm,5,fill=1,stroke=0)
    txt(c,'OBJECTIF',117*mm,110*mm,9,AMBER)
    goals=['Garder le kick solide.','Faire respirer les silences.','Contraster les vélocités.','Boucler 8 fois sans erreur.']
    for j,g in enumerate(goals): txt(c,'□ '+g,117*mm,98*mm-j*9*mm,9,colors.white,'Helvetica')
    txt(c,'Notes :',18*mm,35*mm,10,INK); c.setStrokeColor(colors.HexColor('#99958E'))
    for j in range(3): c.line(18*mm,27*mm-j*7*mm,190*mm,27*mm-j*7*mm)
    c.showPage()
header(c,'PLAN D’ENTRAÎNEMENT','À cocher au fil des sessions.')
steps=['Je connais le placement des pads','Je joue à 60 BPM','Je tiens 4 mesures','Je tiens 8 mesures','Je joue avec accents','Je crée ma propre variation']
for i,s in enumerate(steps):
    y=220*mm-i*22*mm; button(c,25*mm,y,14*mm,14*mm,'□',colors.white); txt(c,s,48*mm,y+4*mm,13,INK,'Helvetica')
txt(c,'BPM maximum propre : ________',25*mm,65*mm,14,ORANGE)
txt(c,'Style préféré : __________________________',25*mm,50*mm,14,ORANGE)
c.save()
print(OUT)
