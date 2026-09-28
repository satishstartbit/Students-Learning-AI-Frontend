import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceFollow, changeFollowPace, createFollowState, FOLLOW_PACES, FOLLOW_ROUND_MS, followCue, followPosition, pauseFollow, resetFollow, resumeFollow, startFollow, tapFollow } from './followGameLogic.js';
function advance(s,ms){for(let t=0;t<ms;t+=20)s=advanceFollow(s,Math.min(20,ms-t));return s;}
test('reference starts ready at zero and Let’s go starts without a hold countdown',()=>{
 const s=createFollowState();assert.equal(s.phase,'ready');assert.equal(s.taps,0);assert.equal(s.streak,0);assert.equal(s.rounds,0);assert.equal(s.pace,'slow');assert.equal(startFollow(s).phase,'playing');
});
test('all paces have continuous bounded paths across rounds and cycle boundaries',()=>{
 for(const pace of Object.keys(FOLLOW_PACES))for(const width of [260,488]){
  let previous=followPosition(createFollowState({pace}),width,290);
  for(let ms=16;ms<61000;ms+=16){const p=followPosition({...createFollowState({pace}),elapsedMs:ms},width,290);assert.ok(p.x>=44&&p.x<=width-44&&p.y>=72&&p.y<=218);assert.ok(Math.hypot(p.x-previous.x,p.y-previous.y)<5);previous=p;}
 }
});
test('only a glowing hit scores and each glow can score once',()=>{
 let s=startFollow(createFollowState());s=tapFollow(s,true);assert.equal(s.taps,0);
 s=advance(s,1300);assert.equal(followCue(s).glowing,true);s=tapFollow(s,true);assert.equal(s.taps,1);assert.equal(s.streak,1);assert.equal(tapFollow(s,true),s);
 s=advance(s,4000);s=tapFollow(s,true);assert.equal(s.taps,2);assert.equal(s.streak,2);
});
test('outside-circle taps zero points without teleporting or restarting the clock',()=>{
 let s=tapFollow(advance(startFollow(createFollowState()),1300),true);const before=followPosition(s,488,290);const time=s.elapsedMs;
 s=tapFollow(s,false);assert.equal(s.taps,0);assert.equal(s.streak,0);assert.equal(s.elapsedMs,time);assert.deepEqual(followPosition(s,488,290),before);assert.equal(tapFollow(s,true).taps,0);
});
test('missed glow clears streak but retains earlier successful taps',()=>{
 let s=tapFollow(advance(startFollow(createFollowState()),1300),true);s=advance(s,5100);assert.equal(s.taps,1);assert.equal(s.streak,0);
});
test('pause freezes position, glow and round time; resume keeps progress',()=>{
 let s=advance(startFollow(createFollowState()),1400);s=pauseFollow(s);assert.equal(advanceFollow(s,10000),s);assert.equal(tapFollow(s,true),s);const resumed=resumeFollow(s);assert.equal(resumed.elapsedMs,1400);assert.equal(followCue(resumed).glowing,true);
});
test('three rounds complete a session and changing speed clears progress',()=>{
 let s=advance(startFollow(createFollowState()),FOLLOW_ROUND_MS*3);assert.equal(s.phase,'complete');assert.equal(s.rounds,3);assert.equal(advanceFollow(s,20),s);
 s=changeFollowPace(s,'fast');assert.equal(s.pace,'fast');assert.equal(s.phase,'ready');assert.equal(s.rounds,0);assert.equal(resetFollow(s).pace,'fast');
});
test('calm play stays still, uses manual rounds, and works without a timer',()=>{
 let s=startFollow(createFollowState({calm:true}));assert.equal(advanceFollow(s,10000),s);
 const p=followPosition(s,488,290);for(let i=0;i<15;i++)s=tapFollow(s,true);
 assert.equal(s.phase,'complete');assert.equal(s.rounds,3);assert.equal(s.taps,15);assert.deepEqual(followPosition(s,488,290),p);
});
test('stalled frames cannot jump the target; younger students get a longer cue',()=>{
 const s=startFollow(createFollowState());assert.deepEqual(advanceFollow(s,5000),advanceFollow(s,40));
 assert.equal(followCue(advance(s,2500)).glowing,false);assert.equal(followCue(advance(startFollow(createFollowState({isJunior:true})),2500)).glowing,true);
});
