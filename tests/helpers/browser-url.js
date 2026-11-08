const path=require('node:path');
const {pathToFileURL}=require('node:url');
function testPageURL(name='index.html',base=process.env.DYNASTY_BROWSER_BASE_URL){
 if(!base)return pathToFileURL(path.join(__dirname,'../..',name)).href;
 const url=new URL(base.endsWith('/')?base:base+'/');
 if(!['http:','https:'].includes(url.protocol))throw new Error('Browser test base must use HTTP or HTTPS.');
 return new URL(name,url).href;
}
module.exports={testPageURL};
