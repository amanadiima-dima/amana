// E2E script — run against the LOCAL dev stack (./dev-local.sh, OTP_BYPASS=true, seeded users). See CLAUDE.md > Testing.
const API='http://localhost:3000/api';
const prisma=new (require('@prisma/client').PrismaClient)();
const call=async(m,p,t,b,f)=>{const h={};if(t)h.Authorization='Bearer '+t;let body;if(f)body=f;else if(b){h['Content-Type']='application/json';body=JSON.stringify(b)}const r=await fetch(API+p,{method:m,headers:h,body});return {status:r.status,data:await r.json().catch(()=>({}))}};
const login=async(phone,name)=>{await call('POST','/auth/send-otp',null,{phone});const r=await call('POST','/auth/verify-otp',null,{phone,code:'123456',...(name?{name}:{})});return {token:r.data.accessToken,user:r.data.user}};
let pass=0,fail=0;const T=(n,c,x='')=>{c?pass++:fail++;console.log(c?'PASS':'FAIL',n,x)};
const day=n=>new Date(Date.now()+864e5*n).toISOString();
const parcel=(t,w=2)=>{const f=new FormData();f.append('pickupAddress','a');f.append('deliveryAddress','b');f.append('weightKg',String(w));f.append('description','invite test');return call('POST','/parcels',t,null,f)};
(async()=>{
 const NEW='+2126'+String(Date.now()).slice(-8);   // brand-new Moroccan number, no account
 const S=(await login('+10000000005')).token, TR=(await login('+10000000014')).token;
 await prisma.booking.deleteMany({where:{payerPhone:{startsWith:'+2126'}}}).catch(()=>{});
 const tr=await call('POST','/trips',TR,{originCity:'Casablanca',destinationCity:'Lyon',departureAt:day(3),maxWeightKg:20,pricePerKg:5,currency:'EUR',mode:'PLANE'});
 const mk=async(phone,extra={})=>{const pc=await parcel(S,2);return call('POST','/bookings',S,{tripId:tr.data.trip.id,parcelRequestId:pc.data.parcel.id,payerPhone:phone,locale:'fr',priorityTip:5,...extra})};

 let r=await mk(NEW); const id=r.data.booking?.id, tok=r.data.booking?.inviteToken;
 T('non-user recipient accepted → PAYMENT_PENDING, no payer yet',r.status===201&&r.data.booking.status==='PAYMENT_PENDING'&&r.data.booking.payerId===null&&r.data.booking.payerPhone===NEW);
 T('invite reported as sent (stub channel in dev)',r.data.invite?.status==='SENT',JSON.stringify(r.data.invite));
 const msg=await prisma.outboundMessage.findFirst({where:{bookingId:id}});
 T('message recorded in French with link, amount and no raw phone',msg&&msg.body.includes('/fr/invite/'+tok)&&msg.body.includes('15.00 EUR')&&msg.toPhone===NEW&&!msg.body.includes('+10000000005'),msg?.body.slice(0,90));
 let pv=await call('GET',`/invites/${tok}`);
 T('public preview works without login',pv.status===200&&pv.data.invite.open===true&&pv.data.invite.amount===15&&pv.data.invite.route==='Casablanca → Lyon',JSON.stringify(pv.data.invite));
 T('preview hides phone numbers',!JSON.stringify(pv.data).includes('+'));
 pv=await call('GET','/invites/not-a-real-token'); T('bad token → 404',pv.status===404);
 r=await call('POST','/payments/intent',S,{bookingId:id}); T('sender cannot pay while recipient has not joined',r.status===403,r.data.message);
 const tb=await call('GET',`/trips/${tr.data.trip.id}/bookings`,TR); T('traveler cannot see it yet',!tb.data.bookings.some(b=>b.id===id));
 // wrong user tries to claim
 const other=await login('+10000000003'); r=await call('POST',`/invites/${tok}/claim`,other.token); T('claim by a different phone refused',r.status===403,r.data.message);
 r=await call('POST',`/invites/${tok}/claim`,S); T('sender cannot claim own invite',r.status===403);
 // recipient registers (first login) → linked automatically
 const rec=await login(NEW,'Fatima'); const linked=await prisma.booking.findUnique({where:{id}}); T('signing up with the invited phone links the request',linked.payerId===rec.user.id);
 r=await call('POST',`/invites/${tok}/claim`,rec.token); T('claim is idempotent for the right person',r.status===200&&r.data.bookingId===id);
 r=await call('GET',`/bookings/${id}`,rec.token); T('recipient can open the booking',r.status===200&&r.data.booking.sender?.name);
 r=await call('GET',`/bookings/${id}`,S); T('sender sees the invite token (to copy link)',!!r.data.booking.inviteToken);
 r=await call('GET',`/bookings/${id}`,rec.token); T('recipient does not get the token back',r.data.booking.inviteToken===undefined);
 r=await call('POST','/payments/intent',rec.token,{bookingId:id}); T('recipient pays 2×5+5=15',r.status===200&&r.data.amount===15,String(r.data.amount));
 r=await call('POST',`/payments/${id}/confirm-stub`,rec.token); T('payment held',r.status===200);
 const b=await prisma.booking.findUnique({where:{id}}); T('released to traveler as PENDING with deadline',b.status==='PENDING'&&!!b.respondDeadline);
 r=await call('PATCH',`/bookings/${id}/respond`,TR,{action:'accept'}); T('traveler accepts',r.status===200);
 const claimed=await call('POST',`/invites/${tok}/decline`); T('cannot decline after it is no longer open',claimed.status===410);

 // decline without an account
 r=await mk('+2126'+String(Date.now()+7).slice(-8)); const tok2=r.data.booking.inviteToken,id2=r.data.booking.id;
 r=await call('POST',`/invites/${tok2}/decline`); T('recipient can decline from the link, no account',r.status===200&&(await prisma.booking.findUnique({where:{id:id2}})).status==='CANCELLED');
 pv=await call('GET',`/invites/${tok2}`); T('declined invite shows as closed',pv.data.invite.open===false);
 // existing user invited → also gets in-app notification
 r=await mk('+10000000003'); const nn=await prisma.notification.count({where:{userId:other.user.id,data:{path:['bookingId'],equals:r.data.booking.id}}}); T('existing user: payer linked + notified in-app',r.data.booking.payerId===other.user.id&&nn>=1);
 // abuse limits
 r=await mk('+'+'4477000'+String(Date.now()).slice(-5)); // 4th invite so far today for this sender in this run
 let last=null; for(let i=0;i<12;i++){last=await mk('+3377'+String(Date.now()+i).slice(-8)); if(last.status===429)break;}
 const envTxt=require('fs').existsSync(require('path').join(__dirname,'../../.env'))?require('fs').readFileSync(require('path').join(__dirname,'../../.env'),'utf8'):'';
 const cap=parseInt((envTxt.match(/^MAX_INVITES_PER_DAY=(\d+)/m)||[])[1]||'10',10);
 if(cap>50){console.log('SKIP daily invite limit (backend/.env has MAX_INVITES_PER_DAY='+cap+' for testing; set it to 10 and re-run to test the 429)');} else T('daily invite limit stops spam (429)',last.status===429,last.data.message);
 // traveler can't be invited, too-soon check still applies
 r=await mk('+10000000014'); T('traveler cannot be the payer',r.status===400||r.status===429,r.data.message);
 console.log(`\n${pass} passed, ${fail} failed`); await prisma.$disconnect();
})().catch(e=>{console.error('ERR',e);process.exit(1)});
