#!/usr/bin/env node
// Bundle the Call Sheet slice into one self-contained HTML document (scripts, fonts and images inlined).
//   node forks/call-sheet/tools/bundle.js <output.html>   → a page to open anywhere or publish
//   require('./bundle.js').bundle({document:true})          → a full document for Dynasty Lab's game-day frame
'use strict';
const fs=require('fs'),path=require('path');
const sliceDir=path.join(__dirname,'../slice');

function bundle(opts={}){
  const html=fs.readFileSync(path.join(sliceDir,'index.html'),'utf8');
  let style=html.match(/<style>([\s\S]*?)<\/style>/)[1];
  // Fonts → data URIs.
  style=style.replace(/url\('([^']+\.woff2)'\)/g,(m,rel)=>`url('data:font/woff2;base64,${fs.readFileSync(path.resolve(sliceDir,rel)).toString('base64')}')`);
  let body=html.match(/<body>([\s\S]*?)<\/body>/)[1];
  // Scripts → inline. "</script" inside sources is escaped so it can't close the tag early.
  body=body.replace(/<script src="([^"]+)"><\/script>/g,(m,rel)=>{
    const src=fs.readFileSync(path.resolve(sliceDir,rel),'utf8').replace(/<\/script/gi,'<\\/script');
    return`<script>/* ${path.basename(rel)} */\n${src}\n</script>`;
  });
  // Images → data URIs.
  body=body.replace(/src="([^"]+\.(webp|png|jpg))"/g,(m,rel,ext)=>`src="data:image/${ext==='jpg'?'jpeg':ext};base64,${fs.readFileSync(path.resolve(sliceDir,rel)).toString('base64')}"`);
  const head=`<title>Call Sheet</title>\n<meta name="description" content="A college football card battler: call plays, win duels, open packs, evolve your playbook.">\n<style>${style}</style>\n`;
  if(opts.document)return`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${head}</head><body>${body}</body></html>`;
  return head+body;
}
module.exports={bundle};

if(require.main===module){
  const out=process.argv[2];if(!out){console.error('Usage: bundle.js <output.html>');process.exit(1)}
  const page=bundle();fs.writeFileSync(out,page);
  console.log(`Wrote ${out} (${(page.length/1024).toFixed(0)} KB)`);
}
