const {test}=require('node:test'),assert=require('node:assert/strict');
const {testPageURL}=require('./helpers/browser-url');
test('browser fixtures can use an HTTP development server without changing the tested page',()=>{
 assert.equal(testPageURL('index.html','http://127.0.0.1:18767'),'http://127.0.0.1:18767/index.html');
 assert.equal(testPageURL('.correctness-browser.html','http://127.0.0.1:18767/'), 'http://127.0.0.1:18767/.correctness-browser.html');
});
test('offline developer browser tests retain ordinary file URLs',()=>{
 assert.match(testPageURL('index.html',''),/^file:\/\/.*\/index.html$/);
});
test('browser test bases reject non-web protocols',()=>{
 assert.throws(()=>testPageURL('index.html','file:///tmp/'),/HTTP or HTTPS/);
});
