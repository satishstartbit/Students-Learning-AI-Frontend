import assert from 'node:assert/strict';
import test from 'node:test';
import { advanceFollow, corridorAt, createFollowState, followSpeed, insideCourse, insideHub, moveFollow, pauseFollow, pressFollow, resetFollow, HOLD_MS } from './followGameLogic.js';
const bounds = { width: 640, height: 300 };
function start(options) { let s = createFollowState(options); s = pressFollow(s,s,bounds); for(let ms=0;ms<HOLD_MS;ms+=40) s=advanceFollow(s,40,bounds); return s; }
function earned() { let s=start();for(let i=0;i<100;i++)s=advanceFollow(s,16,bounds);return s; }
test('countdown requires a continuous hold and never scrolls or scores early',()=>{
 let s=createFollowState();s=pressFollow(s,s,bounds);assert.equal(s.phase,'countdown');
 for(let i=0;i<74;i++)s=advanceFollow(s,40,bounds);
 assert.equal(s.phase,'countdown');assert.equal(s.score,0);assert.equal(s.distance,0);
 s=pauseFollow(s);assert.equal(s.holdMs,0);s=pressFollow(s,s,bounds);assert.equal(s.holdMs,0);
 for(let i=0;i<75;i++)s=advanceFollow(s,40,bounds);assert.equal(s.phase,'playing');
});
test('moving away while preparing pauses instead of silently starting',()=>{
 const s=createFollowState();assert.equal(moveFollow(pressFollow(s,s,bounds),{x:.5,y:.5},bounds).phase,'paused');
});
test('outside-circle presses end the run at zero without teleporting',()=>{
 const s=earned();assert.ok(s.score>0);
 assert.equal(insideHub(s,{x:s.x+25/bounds.width,y:s.y+25/bounds.height},bounds),false);
 const failed=pressFollow(pauseFollow(s),{x:.8,y:.5},bounds);
 assert.equal(failed.score,0);assert.equal(failed.phase,'failed');assert.equal(failed.distance,s.distance);
 assert.equal(failed.x,s.x);assert.equal(pressFollow(failed,failed,bounds),failed);
 assert.equal(resetFollow(failed).phase,'paused');
});
test('release freezes position, distance and points; countdown resume preserves them',()=>{
 const s=earned(), paused=pauseFollow(s);
 assert.equal(advanceFollow(paused,5000,bounds),paused);
 const resumed=pressFollow(paused,paused,bounds);
 assert.equal(resumed.phase,'countdown');assert.equal(resumed.distance,s.distance);assert.equal(resumed.score,s.score);
});
test('absolute steering and swept wall collision retain the failure position',()=>{
 const s=moveFollow(earned(),{x:.4,y:.52},bounds);assert.equal(s.x,.4);assert.equal(s.y,.52);
 const failed=moveFollow(s,{x:.4,y:.01},bounds);
 assert.equal(failed.reason,'wall');assert.equal(failed.score,0);assert.equal(failed.x,.4);assert.ok(failed.y>.01 && failed.y<.52);
 assert.equal(advanceFollow(failed,40,bounds),failed);
 const outside=moveFollow(s,{x:-1,y:.5},bounds);assert.equal(outside.phase,'paused');assert.equal(outside.score,s.score);
});
test('circle clearance does not use invisible square corners',()=>{
 const b={width:320,height:300}; let verified=0;
 for(let d=0;d<2;d+=.1)for(let y=.25;y<.75;y+=.01){
  const s={...createFollowState(),distance:d,x:.4,y};
  const exact=Array.from({length:720},(_,i)=>{const a=i*Math.PI/360;const x=s.x+28*Math.cos(a)/b.width;const py=s.y+28*Math.sin(a)/b.height;const c=corridorAt(d+x);return Math.abs(py-c.centre)<c.half-.0001;}).every(Boolean);
  if(exact){assert.equal(insideCourse(s,s,b),true);verified++;}
 }
 assert.ok(verified>100);
});
test('long frames are bounded and stationary play eventually hits a moving wall',()=>{
 assert.deepEqual(advanceFollow(start(),5000,bounds),advanceFollow(start(),40,bounds));
 let s=start();for(let i=0;i<5000&&s.phase==='playing';i++)s=advanceFollow(s,40,bounds);
 assert.equal(s.phase,'failed');assert.equal(s.reason,'wall');assert.ok(s.distance>0);
});
test('endless course remains playable beyond 300 on phone and desktop in both bands',()=>{
 for(const isJunior of [false,true])for(const width of [260,640]){
  const b={width,height:300};let s=start({isJunior});
  for(let i=0;i<3500;i++){
   s=moveFollow(s,{x:s.x,y:corridorAt(s.distance+s.x,isJunior,s.seed).centre},b);
   s=advanceFollow(s,40,b);assert.equal(s.phase,'playing');
  }
  assert.ok(s.score>1000);
 }
 assert.ok(followSpeed(5)>followSpeed(0));assert.ok(followSpeed(0,true)<followSpeed(0));
});
test('calm course is stationary and can be completed without timed points',()=>{
 let s=start({calm:true});assert.equal(advanceFollow(s,1000,bounds),s);
 for(let x=.18;x<.96 && s.phase==='playing';x+=.005)s=moveFollow(s,{x,y:corridorAt(x).centre},bounds);
 assert.equal(s.phase,'complete');assert.ok(s.score>0);assert.equal(s.distance,0);
});
