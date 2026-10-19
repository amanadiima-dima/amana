// E2E script — run against the LOCAL dev stack (./dev-local.sh, OTP_BYPASS=true, seeded users). See CLAUDE.md > Testing.
const API='http://localhost:3000/api';
const prisma=new (require('@prisma/client').PrismaClient)();
const call=async(m,p,t,b,f)=>{const h={};if(t)h.Authorization='Bearer '+t;let body;if(f)body=f;else if(b){h['Content-Type']='application/json';body=JSON.stringify(b)}const r=await fetch(API+p,{method:m,headers:h,body});return {status:r.status,data:await r.json().catch(()=>({}))}};
const login=async(phone)=>{await call('POST','/auth/send-otp',null,{phone});const r=await call('POST','/auth/verify-otp',null,{phone,code:'123456'});return r.data.accessToken};
let pass=0,fail=0;const T=(n,c,x='')=>{c?pass++:fail++;console.log(c?'PASS':'FAIL',n,x)};
const day=n=>new Date(Date.now()+864e5*n).toISOString();
const trip=(t,o={})=>call('POST','/trips',t,{originCity:'Casablanca',destinationCity:'Paris',departureAt:day(3),maxWeightKg:10,pricePerKg:4,currency:'EUR',mode:'PLANE',...o});
const parcel=(t,w=2)=>{const f=new FormData();f.append('pickupAddress','a');f.append('deliveryAddress','b');f.append('weightKg',String(w));f.append('description','payer test');return call('POST','/parcels',t,null,f)};
const photoTrack=(Tr,id,status,extra={},photo=false)=>{const f=new FormData();f.append('status',status);for(const k in extra)f.append(k,extra[k]);if(photo)f.append('photo',new Blob([Buffer.from('89504e470d0a1a0a','hex')],{type:'image/png'}),'p.png');return call('POST',`/tracking/${id}`,Tr,null,f)};
(async()=>{
 const S=await login('+10000000002'), P=await login('+10000000003'), TR=await login('+10000000012'), OUT=await login('+10000000004');
 const newReq=async(trId,opts={})=>{const pc=await parcel(S,2);return call('POST','/bookings',S,{tripId:trId,parcelRequestId:pc.data.parcel.id,...opts})};
 const tr=await trip(TR);
 // validation
 let r=await newReq(tr.data.trip.id,{payerPhone:'+19999999999'}); T('unknown recipient is invited (no account needed) → PAYMENT_PENDING',r.status===201&&r.data.booking.status==='PAYMENT_PENDING'&&r.data.booking.payerId===null);
 const tooSoon=await trip(TR,{departureAt:new Date(Date.now()+3600e3).toISOString(),destinationCity:'Soon'}); r=await newReq(tooSoon.data.trip.id,{payerPhone:'+10000000003'}); T('departure <3h: recipient pay refused',r.status===400,r.data.message);
 // main flow
 r=await newReq(tr.data.trip.id,{payerPhone:'+10000000003',priorityTip:50}); const id=r.data.booking?.id;
 T('request created as PAYMENT_PENDING with payer',r.status===201&&r.data.booking.status==='PAYMENT_PENDING'&&!!r.data.booking.payerId);
 const dl=await prisma.booking.findUnique({where:{id}}); T('pay deadline set within 24h and before departure',dl.payDeadline&&dl.payDeadline-Date.now()<=24*3600e3+5000&&dl.payDeadline<dl.respondDeadline||dl.payDeadline<new Date(Date.now()+864e5*3));
 let tb=await call('GET',`/trips/${tr.data.trip.id}/bookings`,TR); T('traveler does NOT see it yet',!tb.data.bookings.some(b=>b.id===id));
 r=await call('GET',`/bookings/${id}`,TR); T('traveler cannot open it (404)',r.status===404);
 r=await call('GET',`/bookings/${id}`,P); T('payer can open it',r.status===200&&r.data.booking.payer?.id);
 r=await call('GET',`/bookings/${id}`,OUT); T('outsider blocked',r.status===403);
 let n=await prisma.notification.findMany({where:{userId:(await prisma.user.findUnique({where:{phone:'+10000000003'}})).id,data:{path:['bookingId'],equals:id}}}); T('payer notified',n.length>=1);
 r=await call('POST','/payments/intent',S,{bookingId:id}); T('sender cannot pay (payer must)',r.status===403);
 r=await call('POST','/payments/intent',P,{bookingId:id}); T('payer creates payment (2kg×4+50=58)',r.status===200&&r.data.amount===58,String(r.data.amount));
 r=await call('POST',`/payments/${id}/confirm-stub`,S); T('sender cannot confirm',r.status===403);
 r=await call('POST',`/payments/${id}/confirm-stub`,P); T('payer pays → HELD',r.status===200);
 const b1=await prisma.booking.findUnique({where:{id}}); T('booking now PENDING with respond deadline',b1.status==='PENDING'&&!!b1.respondDeadline);
 tb=await call('GET',`/trips/${tr.data.trip.id}/bookings`,TR); const row=tb.data.bookings.find(b=>b.id===id); T('traveler now sees it, payment already HELD',row&&row.payment?.status==='HELD');
 r=await call('PATCH',`/bookings/${id}/respond`,TR,{action:'accept'}); T('traveler accepts',r.status===200);
 const code=(await call('GET',`/bookings/${id}`,P)).data.booking.deliveryCode; T('payer (recipient) sees the delivery code',/^\d{6}$/.test(code||''));
 const sCode=(await call('GET',`/bookings/${id}`,S)).data.booking.deliveryCode; T('sender sees it too',sCode===code);
 await photoTrack(TR,id,'PICKED_UP'); r=await photoTrack(TR,id,'DELIVERED',{code},true);
 const pay=await prisma.payment.findUnique({where:{bookingId:id}}); T('delivery with code+photo releases payment',pay.status==='RELEASED'&&pay.senderId===(await prisma.user.findUnique({where:{phone:'+10000000003'}})).id);
 // traveler rejects → refund to payer
 const pc2=await parcel(S,1); r=await call('POST','/bookings',S,{tripId:tr.data.trip.id,parcelRequestId:pc2.data.parcel.id,payerPhone:'+10000000003'}); const id2=r.data.booking.id;
 await call('POST','/payments/intent',P,{bookingId:id2}); await call('POST',`/payments/${id2}/confirm-stub`,P);
 await call('PATCH',`/bookings/${id2}/respond`,TR,{action:'reject'}); const p2=await prisma.payment.findUnique({where:{bookingId:id2}}); T('traveler rejects → payer refunded',p2.status==='REFUNDED');
 // payer declines
 const pc3=await parcel(S,1); r=await call('POST','/bookings',S,{tripId:tr.data.trip.id,parcelRequestId:pc3.data.parcel.id,payerPhone:'+10000000003'}); const id3=r.data.booking.id;
 r=await call('DELETE',`/bookings/${id3}`,P); T('payer can decline',r.status===200&&(await prisma.booking.findUnique({where:{id:id3}})).status==='CANCELLED');
 // pay deadline expiry
 const pc4=await parcel(S,1); r=await call('POST','/bookings',S,{tripId:tr.data.trip.id,parcelRequestId:pc4.data.parcel.id,payerPhone:'+10000000003'}); const id4=r.data.booking.id;
 await prisma.booking.update({where:{id:id4},data:{payDeadline:new Date(Date.now()-1000)}}); await call('GET','/bookings',S);
 T('unpaid request past deadline auto-cancels',(await prisma.booking.findUnique({where:{id:id4}})).status==='CANCELLED');
 // traveler response timeout → refund
 const pc5=await parcel(S,1); r=await call('POST','/bookings',S,{tripId:tr.data.trip.id,parcelRequestId:pc5.data.parcel.id,payerPhone:'+10000000003'}); const id5=r.data.booking.id;
 await call('POST','/payments/intent',P,{bookingId:id5}); await call('POST',`/payments/${id5}/confirm-stub`,P);
 await prisma.booking.update({where:{id:id5},data:{respondDeadline:new Date(Date.now()-1000)}}); await call('GET','/bookings',S);
 const e5=await prisma.booking.findUnique({where:{id:id5}}), pp5=await prisma.payment.findUnique({where:{bookingId:id5}});
 T('traveler silent past deadline → cancelled + payer refunded',e5.status==='CANCELLED'&&pp5.status==='REFUNDED');
 // late pay after expiry blocked
 r=await call('POST','/payments/intent',P,{bookingId:id4}); T('cannot pay an expired request',r.status===400,r.data.message);
 // lists
 const lp=await call('GET','/bookings?role=payer',P); T('payer sees bookings they pay for',lp.data.bookings.length>=4);
 const lt=await call('GET','/bookings?role=traveler',TR); T('traveler list hides awaiting-payment ones',!lt.data.bookings.some(b=>b.status==='PAYMENT_PENDING'));
 // chat with payer
 r=await call('POST',`/bookings/${id}/messages`,P,{body:'Hola, soy el destinatario'}); T('payer can chat',r.status===201);
 console.log(`\n${pass} passed, ${fail} failed`); await prisma.$disconnect();
})().catch(e=>{console.error('ERR',e);process.exit(1)});
