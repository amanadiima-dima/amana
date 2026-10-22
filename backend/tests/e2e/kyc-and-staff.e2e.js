// E2E script — run against the LOCAL dev stack (./dev-local.sh, OTP_BYPASS=true, seeded users). See CLAUDE.md > Testing.
const API='http://localhost:3000/api';
const prisma=new (require('@prisma/client').PrismaClient)();
const call=async(m,p,t,b,f)=>{const h={};if(t)h.Authorization='Bearer '+t;let body;if(f)body=f;else if(b){h['Content-Type']='application/json';body=JSON.stringify(b)}const r=await fetch(API+p,{method:m,headers:h,body});return {status:r.status,data:await r.json().catch(()=>({}))}};
const { signIn } = require('./_auth');
const login = async (phone, name) => { const r = await signIn(phone, name); return { token: r.data.accessToken, refresh: r.data.refreshToken, user: r.data.user, raw: r }; };
let pass=0,fail=0;const T=(n,c,x='')=>{c?pass++:fail++;console.log(c?'PASS':'FAIL',n,x)};
const PNG=Buffer.from('89504e470d0a1a0a0000000d49484452','hex'), WEBM=Buffer.from('1a45dfa3a3428681010000000000001f','hex');
const rnd=()=>String(Date.now()).slice(-8)+Math.floor(Math.random()*90+10);
const form=({type='ID_CARD',front=true,back=true,video=true,videoMime='video/webm',consent='true',token}={})=>{const f=new FormData();f.append('documentType',type);if(consent!==null)f.append('consent',consent);if(token)f.append('challengeToken',token);
 if(front)f.append('front',new Blob([PNG],{type:'image/png'}),'f.png');if(back)f.append('back',new Blob([PNG],{type:'image/png'}),'b.png');if(video)f.append('video',new Blob([WEBM],{type:videoMime}),'v.webm');return f};
(async()=>{
 const U=await login('+3361'+rnd(),'KYC Tester'), V=await login('+3362'+rnd(),'Other User'), AD=await login('+10000000099');
 const ch=await call('GET','/users/me/id-verification/challenge',U.token); T('challenge issued (4 digits + token)',/^\d{4}$/.test(ch.data.code)&&!!ch.data.token);
 const chV=await call('GET','/users/me/id-verification/challenge',V.token);
 const up=(f)=>call('POST','/users/me/id-verification',U.token,null,f);
 let r=await up(form({token:ch.data.token,consent:null})); T('no consent rejected',r.status===400,r.data.message);
 r=await up(form({token:ch.data.token,video:false})); T('missing selfie video rejected',r.status===400,r.data.message);
 r=await up(form({token:ch.data.token,videoMime:'image/png'})); T('non-video as selfie rejected',r.status===400,r.data.message);
 { const f=form({token:ch.data.token,video:false}); f.append('video',new Blob([Buffer.from('just some text, not a video')],{type:'video/webm'}),'v.webm'); r=await up(f); T('a file labelled video but not a video is rejected (bytes checked)',r.status===400,r.data.message); }
 { const f=form({token:ch.data.token,video:false}); f.append('video',new Blob([PNG],{type:'text/plain'}),'v.webm'); r=await up(f); T('an image sent as the selfie is rejected even with a vague type',r.status===400,r.data.message); }
 r=await up(form({token:ch.data.token,back:false})); T('ID card without back rejected',r.status===400,r.data.message);
 r=await up(form({token:'garbage'})); T('forged challenge rejected',r.status===400,r.data.message);
 r=await up(form({token:chV.data.token})); T("another user's challenge rejected",r.status===400,r.data.message);
 r=await up(form({token:ch.data.token,videoMime:'video/webm;codecs=vp8,opus'})); T('a browser recording (type "video/webm;codecs=vp8,opus") is accepted',r.status===200&&r.data.verification?.status==='PENDING',r.data.message);
 r=await up(form({token:ch.data.token,type:'PASSPORT',back:false})); T('passport without back accepted → PENDING',r.status===200&&r.data.verification.status==='PENDING',r.data.message);
 const ch2=await call('GET','/users/me/id-verification/challenge',U.token);
 r=await up(form({token:ch2.data.token})); T('resubmitting as ID card with back works',r.status===200);
 let ls=await call('GET','/admin/verifications',AD.token); const mine=ls.data.verifications.find(v=>v.userId===U.user.id);
 T('admin sees doc type, video and the code to listen for',mine&&mine.documentType==='ID_CARD'&&mine.challengeCode===ch2.data.code&&/\.webm$/.test(mine.selfieVideo||'')&&!!mine.consentAt,mine?.challengeCode);
 const media=await fetch(mine.selfieVideo); T('dev-local video file is retrievable',media.status===200);
 r=await call('GET','/admin/verifications',U.token); T('normal user cannot list verifications',r.status===403);
 const M=await login('+3363'+rnd(),'Helper Maria');
 r=await call('POST','/admin/staff',AD.token,{phone:'+19990009999'}); T('adding unknown phone → 404',r.status===404);
 r=await call('GET','/admin/verifications',M.token); T('before appointment: not staff (403)',r.status===403);
 r=await call('POST','/admin/staff',AD.token,{phone:M.user.phone}); T('admin appoints a moderator',r.status===201);
 r=await call('POST','/admin/staff',AD.token,{phone:M.user.phone}); T('appointing twice rejected',r.status===400);
 const Mu=await call('GET','/users/me',M.token); T('moderator profile shows role',Mu.data.user.role==='MODERATOR');
 r=await call('GET','/admin/verifications',M.token); T('moderator can list verifications',r.status===200);
 r=await call('GET','/admin/disputes',M.token); T('moderator can list disputes',r.status===200);
 for(const [n,path] of [['users','/admin/users'],['staff list','/admin/staff'],['activity log','/admin/activity']]){r=await call('GET',path,M.token);T(`moderator cannot see ${n}`,r.status===403)}
 r=await call('POST','/admin/staff',M.token,{phone:V.user.phone}); T('moderator cannot appoint others',r.status===403);
 r=await call('PATCH',`/admin/verifications/${mine.id}`,M.token,{status:'APPROVED'}); T('moderator approves the verification',r.status===200&&(await prisma.user.findUnique({where:{id:U.user.id}})).isVerified===true);
 const note=await prisma.notification.count({where:{userId:U.user.id,title:{contains:'verified'}}}); T('user notified of approval',note>=1);
 const log=await call('GET','/admin/activity',AD.token); T('audit log records who approved',log.data.activity.some(a=>a.action==='VERIFICATION_APPROVED'&&a.actorName==='Helper Maria')&&log.data.activity.some(a=>a.action==='STAFF_ADDED'));
 const stf=await call('GET','/admin/staff',AD.token); T('team list shows admin + moderator',stf.data.staff.some(s=>s.id===M.user.id&&s.role==='MODERATOR')&&stf.data.staff.some(s=>s.role==='ADMIN'));
 r=await call('DELETE',`/admin/staff/${AD.user.id}`,AD.token); T('admin cannot be removed',r.status===400);
 r=await call('DELETE',`/admin/staff/${M.user.id}`,AD.token); T('admin removes the moderator',r.status===200);
 r=await call('GET','/admin/verifications',M.token); T('removed moderator loses access',r.status===403);
 console.log(`\n${pass} passed, ${fail} failed`); await prisma.$disconnect();
})().catch(e=>{console.error('ERR',e);process.exit(1)});
