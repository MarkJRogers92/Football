// Produce one portable HTML file from the same source used by the Lab.
const fs=require('node:fs'),path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const out=process.argv[2]||path.join(__dirname,'portrait-studio.html');
const html=read('lab.html').replace('<link rel="stylesheet" href="lab.css">',()=>'<style>'+read('lab.css')+'</style>').replace('<script src="renderer.js"></script>',()=>'<script>'+read('renderer.js')+'</script>').replace('<script src="lab.js"></script>',()=>'<script>'+read('lab.js')+'</script>');
fs.writeFileSync(out,html);console.log('Built portable Portrait Studio ('+Buffer.byteLength(html)+' bytes).');
