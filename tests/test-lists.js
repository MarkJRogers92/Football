const test=require('node:test'),assert=require('node:assert/strict');
const {checkTestLists}=require('../tools/check-test-lists');
const scripts={test:'node --test tests/a.js tests/b.js','test:fast':'node --test tests/a.js','test:slow':'node --test tests/b.js','test:browser':'node tests/ui-browser.js'};
test('test-list guard catches an omitted file, missing tier and duplicate tier',()=>{
 assert.deepEqual(checkTestLists(scripts,['a.js','b.js','ui-browser.js']),[]);
 assert.match(checkTestLists(scripts,['a.js','b.js','ui-browser.js','forgotten.js']).join(' '),/forgotten/);
 assert.match(checkTestLists({...scripts,'test:slow':''},['a.js','b.js','ui-browser.js']).join(' '),/b.js.*tier/);
 assert.match(checkTestLists({...scripts,'test:slow':'node --test tests/a.js tests/b.js'},['a.js','b.js','ui-browser.js']).join(' '),/a.js.*both/);
});
