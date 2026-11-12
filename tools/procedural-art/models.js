// Hand-built (no Meshy) props for Dynasty Lab: championship-ring, endzone-pylon, gold-football-statue, program-key.
// Pure three.js geometry + procedural walnut texture. Render: `npm i three@0.169.0` here, serve this folder over
// http, open render.html?proc=ring (or pylon, statue, key) in Chromium and screenshot the transparent canvas;
// shoot.js automates that with Playwright. render.html?glb=<file> renders a Meshy GLB with the same lights and camera.
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
const gold=new THREE.MeshPhysicalMaterial({color:0xf2b84b,metalness:1,roughness:0.22,clearcoat:0.4});
const goldDark=new THREE.MeshPhysicalMaterial({color:0xc58a2a,metalness:1,roughness:0.35});
const navy=new THREE.MeshPhysicalMaterial({color:0x14214a,roughness:0.55,sheen:1,sheenColor:new THREE.Color(0x4466aa)});
// walnut: procedural canvas grain
function woodTex(){const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.fillStyle='#6b3a1f';g.fillRect(0,0,512,512);
 for(let i=0;i<180;i++){const y=Math.random()*512;g.strokeStyle=`rgba(${30+Math.random()*40|0},${12+Math.random()*15|0},5,${0.15+Math.random()*0.35})`;g.lineWidth=0.5+Math.random()*2.5;g.beginPath();g.moveTo(0,y);for(let x=0;x<=512;x+=16)g.lineTo(x,y+Math.sin(x/60+i)*6+Math.sin(x/17)*1.5);g.stroke()}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t}
const walnut=new THREE.MeshPhysicalMaterial({map:woodTex(),roughness:0.4,clearcoat:0.7,clearcoatRoughness:0.25});
function plinth(w=1.6,h=0.38,d=1.6){const g=new THREE.Group();const a=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,4,0.05),walnut);a.position.y=h/2;g.add(a);
 const b=new THREE.Mesh(new RoundedBoxGeometry(w*0.84,h*0.55,d*0.84,4,0.04),walnut);b.position.y=h+h*0.275;g.add(b);
 const plate=new THREE.Mesh(new RoundedBoxGeometry(w*0.5,h*0.36,0.02,2,0.008),gold);plate.position.set(0,h*0.5,d/2+0.006);g.add(plate);g.userData.top=h*1.55;return g}
function footballGeo(len=1.1,rad=0.36){const pts=[];for(let i=0;i<=40;i++){const t=i/40,y=(t-0.5)*len;const r=rad*Math.pow(Math.sin(Math.PI*t),0.82);pts.push(new THREE.Vector2(Math.max(r,0.002),y))}return new THREE.LatheGeometry(pts,64)}
const B={
ring(){const g=new THREE.Group();
 const band=new THREE.Mesh(new THREE.TorusGeometry(0.62,0.13,48,128),gold);band.scale.set(1,1,1.6);g.add(band);
 const bezel=new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.36,0.22,48),gold);bezel.position.y=0.78;g.add(bezel);
 const top=new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.4,0.03,48),navy);top.position.y=0.9;g.add(top);
 const stone=new THREE.Mesh(new THREE.OctahedronGeometry(0.2,0),new THREE.MeshPhysicalMaterial({color:0x2a4fd0,metalness:0,roughness:0.02,transmission:0.6,thickness:0.4,ior:2.4,clearcoat:1}));stone.scale.set(1,0.7,1);stone.rotation.y=Math.PI/8;stone.position.y=0.99;g.add(stone);
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const d=new THREE.Mesh(new THREE.SphereGeometry(0.035,16,12),new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:0,metalness:0.2,clearcoat:1}));d.position.set(Math.cos(a)*0.32,0.93,Math.sin(a)*0.32);g.add(d)}
 for(let i=0;i<4;i++){const a=i/4*Math.PI*2+Math.PI/4;const p=new THREE.Mesh(new THREE.ConeGeometry(0.03,0.12,8),gold);p.position.set(Math.cos(a)*0.17,1.0,Math.sin(a)*0.17);p.lookAt(0,1.0,0);p.rotateX(Math.PI/2);p.scale.set(1,0.6,1);g.add(p)}
 // shoulder relief: little footballs on the sides
 for(const s of[-1,1]){const fb=new THREE.Mesh(footballGeo(0.3,0.09),goldDark);fb.scale.set(1,1,0.45);fb.position.set(s*0.7,0.42,0);fb.rotation.z=s*0.5;g.add(fb)}
 const cushion=new THREE.Mesh(new RoundedBoxGeometry(1.7,0.3,1.3,6,0.14),navy);cushion.position.y=-0.72;g.add(cushion);
 g.rotation.x=-0.15;return g},
pylon(){const g=new THREE.Group();
 const turf=document.createElement('canvas');turf.width=turf.height=256;const c=turf.getContext('2d');c.fillStyle='#2f7a35';c.fillRect(0,0,256,256);for(let i=0;i<4000;i++){c.fillStyle=`rgba(${20+Math.random()*60|0},${90+Math.random()*80|0},${20+Math.random()*30|0},0.7)`;c.fillRect(Math.random()*256,Math.random()*256,1,3)}
 const tt=new THREE.CanvasTexture(turf);tt.colorSpace=THREE.SRGBColorSpace;
 const base=plinth(2,0.3,2);g.add(base);
 const grass=new THREE.Mesh(new THREE.BoxGeometry(1.66,0.08,1.66),new THREE.MeshStandardMaterial({map:tt,roughness:0.95}));grass.position.y=base.userData.top+0.04;g.add(grass);
 const line=new THREE.Mesh(new THREE.BoxGeometry(1.66,0.085,0.12),new THREE.MeshStandardMaterial({color:0xf4f4ee,roughness:0.9}));line.position.copy(grass.position);line.position.z=0.25;g.add(line);
 const orange=new THREE.MeshPhysicalMaterial({color:0xff6a14,roughness:0.45,clearcoat:0.3});
 const py=new THREE.Mesh(new RoundedBoxGeometry(0.42,1.6,0.42,5,0.05),orange);py.position.set(0,grass.position.y+0.84,0.25);g.add(py);
 const band=new THREE.Mesh(new RoundedBoxGeometry(0.44,0.18,0.44,3,0.03),navy);band.position.set(0,py.position.y+0.45,0.25);g.add(band);
 const star=new THREE.Shape();for(let i=0;i<10;i++){const r=i%2?0.045:0.11,a=i/10*Math.PI*2-Math.PI/2;i?star.lineTo(Math.cos(a)*r,Math.sin(a)*r):star.moveTo(Math.cos(a)*r,Math.sin(a)*r)}
 for(const [x,z,ry] of[[0,0.215,0],[0.215,0,Math.PI/2]]){const s=new THREE.Mesh(new THREE.ExtrudeGeometry(star,{depth:0.01,bevelEnabled:false}),gold);s.position.set(x,band.position.y,0.25+z);s.rotation.y=ry;g.add(s)}
 const ball=new THREE.Mesh(footballGeo(0.62,0.2),new THREE.MeshPhysicalMaterial({color:0x7a3a18,roughness:0.6,clearcoat:0.2}));ball.rotation.z=Math.PI/2;ball.rotation.y=0.6;ball.position.set(-0.4,grass.position.y+0.22,0.55);g.add(ball);
 for(let i=-3;i<=3;i++){const l=new THREE.Mesh(new THREE.BoxGeometry(0.012,0.03,0.07),new THREE.MeshStandardMaterial({color:0xffffff}));l.position.set(-0.4+i*0.045*Math.cos(0.6),grass.position.y+0.42,0.55-i*0.045*Math.sin(0.6));l.rotation.y=0.6;g.add(l)}
 return g},
statue(){const g=new THREE.Group();const p=plinth(1.5,0.42,1.5);g.add(p);
 const stem=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.22,0.5,32),goldDark);stem.position.y=p.userData.top+0.25;g.add(stem);
 const cup=new THREE.Mesh(new THREE.SphereGeometry(0.26,32,16,0,Math.PI*2,0,Math.PI/2),gold);cup.rotation.x=Math.PI;cup.position.y=p.userData.top+0.62;g.add(cup);
 const ball=new THREE.Mesh(footballGeo(1.3,0.42),gold);ball.rotation.z=Math.PI/2+0.12;ball.position.y=p.userData.top+0.98;g.add(ball);
 // raised laces along the top seam
 const lg=new THREE.Group();const seam=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.5,8),goldDark);seam.rotation.z=Math.PI/2;lg.add(seam);
 for(let i=-4;i<=4;i++){const l=new THREE.Mesh(new RoundedBoxGeometry(0.035,0.025,0.16,2,0.01),new THREE.MeshPhysicalMaterial({color:0xfff2d0,metalness:0.6,roughness:0.25}));l.position.x=i*0.055;lg.add(l)}
 lg.position.y=0.415;const holder=new THREE.Group();holder.add(lg);holder.rotation.z=0.12;holder.position.y=p.userData.top+0.98;g.add(holder);
 for(const s of[-1,1]){const st=new THREE.Mesh(new THREE.TorusGeometry(0.405,0.022,12,64),goldDark);st.rotation.y=Math.PI/2;st.position.set(s*0.4,0,0);st.scale.set(1,1,1);const h=new THREE.Group();h.add(st);h.rotation.z=0.12;h.position.y=p.userData.top+0.98;st.scale.setScalar(0.86);g.add(h)}
 return g},
key(){const g=new THREE.Group();
 const cushion=new THREE.Mesh(new RoundedBoxGeometry(2.1,0.36,1.4,8,0.17),navy);cushion.position.y=0.18;g.add(cushion);
 const piping=new THREE.Mesh(new THREE.TorusGeometry(1,0.03,8,96),gold);piping.scale.set(1.0,0.64,1);piping.rotation.x=Math.PI/2;piping.position.y=0.18;g.add(piping);
 for(const [x,z] of[[-1.02,-0.67],[1.02,-0.67],[-1.02,0.67],[1.02,0.67]]){const t=new THREE.Mesh(new THREE.SphereGeometry(0.07,16,12),gold);t.position.set(x,0.2,z);g.add(t)}
 const k=new THREE.Group();
 const bow=new THREE.Mesh(new THREE.TorusGeometry(0.28,0.07,24,64),gold);k.add(bow);
 const inner=new THREE.Mesh(footballGeo(0.34,0.11),goldDark);inner.rotation.z=Math.PI/2;k.add(inner);
 const shaft=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,1.25,24),gold);shaft.rotation.z=Math.PI/2;shaft.position.x=0.9;k.add(shaft);
 const collar=new THREE.Mesh(new THREE.TorusGeometry(0.075,0.025,12,32),goldDark);collar.rotation.y=Math.PI/2;collar.position.x=0.4;k.add(collar);
 for(const [x,h] of[[1.3,0.22],[1.42,0.14],[1.5,0.26]]){const b=new THREE.Mesh(new THREE.BoxGeometry(0.09,h,0.07),gold);b.position.set(x,-h/2,0);k.add(b)}
 k.scale.setScalar(1.1);k.rotation.x=-Math.PI/2;k.position.set(-0.8,0.43,0.05);k.rotation.z=0.25;g.add(k);
 const tag=new THREE.Mesh(new THREE.TorusGeometry(0.1,0.02,8,32),goldDark);tag.position.set(-0.95,0.4,0.1);tag.rotation.x=Math.PI/2;g.add(tag);
 return g}};
export const build=name=>B[name]();
