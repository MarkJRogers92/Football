// The desktop update notice reads the release list itself, because every build is a prerelease and GitHub's
// /releases/latest ignores prereleases.
const test=require('node:test'),assert=require('node:assert/strict');
const {newestRelease,versionParts}=require('../desktop/releases.js');

test('the newest published version wins, prereleases included, drafts and odd tags skipped',()=>{
 const list=[
  {tag_name:'v0.16.0',html_url:'https://github.com/MarkJRogers92/Football/releases/tag/v0.16.0',prerelease:true},
  {tag_name:'v0.18.0',draft:true},
  {tag_name:'nightly'},
  {tag_name:'v0.17.0',html_url:'https://github.com/MarkJRogers92/Football/releases/tag/v0.17.0',prerelease:true},
  {tag_name:'v0.9.55',prerelease:true}
 ];
 assert.deepEqual(newestRelease(list),{tag:'v0.17.0',url:'https://github.com/MarkJRogers92/Football/releases/tag/v0.17.0',prerelease:true});
 assert.deepEqual(versionParts('v0.10.2'),[0,10,2],'versions compare numerically, so 0.10 is newer than 0.9');
 assert.equal(newestRelease([{tag_name:'v0.10.0'},{tag_name:'v0.9.99'}]).tag,'v0.10.0');
 assert.equal(newestRelease([]),null);assert.equal(newestRelease({message:'Not Found'}),null);
});
