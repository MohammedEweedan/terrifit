/** Local integration verification. Creates only disposable fixtures, then
 * removes those exact users. Never runs against a remote database or API. */
import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { createRequire } from "node:module";
import { PrismaPg } from "@prisma/adapter-pg";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("../src/generated/prisma");
const base = process.env.COACH_TEST_ORIGIN || "http://localhost:3000";
const connection = process.env.DATABASE_URL;
assert.ok(connection, "Load the local .env before running this script.");
assert.ok(["localhost", "127.0.0.1"].includes(new URL(connection).hostname), "Local database required");
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname), "Local API required");
const db = new PrismaClient({adapter:new PrismaPg({connectionString:connection})});
const userId = `coach-test-${randomUUID()}`;
const token = randomBytes(32).toString("base64url");
async function call(path, body, auth=true) {
  const response = await fetch(`${base}${path}`, {method:body ? "POST" : "GET",headers:{"Content-Type":"application/json",...(auth?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const raw = await response.text();
  assert.ok(raw.startsWith("{"), `Non-JSON response for ${path}: ${response.status}`);
  return {status:response.status,data:JSON.parse(raw)};
}
const action = (state, name, extra={}) => ({action:name,day:state.day,slot:state.slot,revision:state.revision,...extra});
try {
  await db.user.create({data:{id:userId,name:"Coaching verification",email:`${userId}@example.invalid`,passwordHash:"fixture-cannot-login",profile:{create:{timezone:"Asia/Tokyo",trainingDays:3,healthConditions:"[]"}},sessions:{create:{tokenHash:createHash("sha256").update(token).digest("hex"),expiresAt:new Date(Date.now()+600000)}}}});
  assert.equal((await call("/api/app/coach",undefined,false)).status,401);
  const empty=await call("/api/app/coach");assert.equal(empty.status,200);assert.equal(empty.data.next,null);assert.equal(empty.data.progress.sessions,0);
  const maps=await call("/api/app/maps");assert.equal(maps.status,200);const mapId=maps.data.maps[0].id;
  await db.mapEnrollment.create({data:{userId,mapId}});
  let state=(await call("/api/app/coach")).data;assert.ok(state.next);
  const original=state.next.session;
  const proposed=await call("/api/app/coach",action(state,"propose",{checkIn:{minutes:35,feeling:"ready"}}));assert.equal(proposed.status,200);assert.ok(proposed.data.draft);assert.equal(proposed.data.applied,null);
  assert.equal((await call("/api/app/coach",action(state,"undo"))).status,409);
  state=proposed.data;
  const applied=await call("/api/app/coach",action(state,"apply",{proposalId:state.draft.id}));assert.equal(applied.status,200);assert.equal(applied.data.applied.id,state.draft.id);state=applied.data;
  const route=`/api/app/maps/${mapId}/sessions/${original.id}`;
  const runtime=await call(route);
  if(state.applied.kind==="rest")assert.equal(runtime.status,409);else{assert.equal(runtime.status,200);assert.deepEqual(runtime.data.session,state.applied.session);}
  const undone=await call("/api/app/coach",action(state,"undo"));assert.equal(undone.status,200);assert.equal(undone.data.applied,null);state=undone.data;
  assert.deepEqual((await call(route)).data.session,original);
  const pain=await call("/api/app/coach",action(state,"propose",{checkIn:{minutes:75,feeling:"pain"}}));assert.equal(pain.data.draft.kind,"rest");assert.equal(pain.data.draft.session,null);
  const pause=await call("/api/app/coach",action(pain.data,"apply",{proposalId:pain.data.draft.id}));assert.equal(pause.status,200);assert.equal((await call(route)).status,409);
  state=(await call("/api/app/coach",action(pause.data,"undo"))).data;
  const stale=await call("/api/app/coach",action(state,"propose",{checkIn:{minutes:35,feeling:"ready"}}));
  await db.mapEnrollment.update({where:{userId_mapId:{userId,mapId}},data:{done:1}});
  assert.equal((await call("/api/app/coach",action(stale.data,"apply",{proposalId:stale.data.draft.id}))).status,409);
  assert.equal((await call("/api/app/coach")).data.draft,null);
  assert.ok(await db.coachingEvent.count({where:{plan:{userId}}})>=6);
  console.log("PASS: authentication, empty state, proposal, apply, runtime, undo, revision conflict, pain pause, stale proposal, audit events.");
} finally {
  await db.user.deleteMany({where:{id:userId}});
  await db.rateLimit.deleteMany({where:{key:`coach:${userId}`}});
  await db.$disconnect();
}
