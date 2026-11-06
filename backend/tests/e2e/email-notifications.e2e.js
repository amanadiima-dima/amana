// E2E script — run against the LOCAL dev stack (./dev-local.sh, OTP_BYPASS=true, seeded users). See CLAUDE.md > Testing.
// Locally RESEND_API_KEY is unset, so emails are recorded as EMAIL_STUB instead of sent.
const API='http://localhost:3000/api';
const prisma=new (require('@prisma/client').PrismaClient)();
const call=async(m,p,t,b,f)=>{const h={};if(t)h.Authorization='Bearer '+t;let body;if(f)body=f;else if(b){h['Content-Type']='application/json';body=JSON.stringify(b)}const r=await fetch(API+p,{method:m,headers:h,body});return {status:r.status,data:await r.json().catch(()=>({}))}};
const { signIn } = require('./_auth');
const ok=(n,c,x='')=>console.log(c?'PASS':'FAIL',n,x);
const SENDER='+10000000004',TRAVELER='+10000000014';
const settle=()=>new Promise((r)=>setTimeout(r,800));
const emails=(toPhone,bookingId,kind)=>prisma.outboundMessage.findMany({where:{toPhone,bookingId,kind,channel:{startsWith:'EMAIL'}}});
(async()=>{
 const S=(await signIn(SENDER)).data.accessToken,T=(await signIn(TRAVELER)).data.accessToken;
 const before=await prisma.user.findMany({where:{phone:{in:[SENDER,TRAVELER]}},select:{phone:true,email:true}});
 await prisma.user.update({where:{phone:TRAVELER},data:{email:'traveler-email-test@example.test'}});
 await prisma.user.update({where:{phone:SENDER},data:{email:null}});
 try{
  const tr=await call('POST','/trips',T,{originCity:'Paris',destinationCity:'MailCity'+(Date.now()%1000),departureAt:new Date(Date.now()+864e5*4).toISOString(),maxWeightKg:10,pricePerKg:4,mode:'PLANE'});
  const f=new FormData();f.append('deliveryAddress','b');f.append('weightKg','2');f.append('description','email test');
  const pc=await call('POST','/parcels',S,null,f);
  let r=await call('POST','/bookings',S,{tripId:tr.data.trip.id,parcelRequestId:pc.data.parcel.id});
  const id=r.data.booking.id; ok('booking created',r.status===201);
  await settle();
  const req=await emails(TRAVELER,id,'BOOKING_REQUEST');
  ok('traveler with an email is emailed about the request',req.length===1&&req[0].status==='SENT');
  ok('the record keeps the title only',req[0]?.body==='New parcel request 📦');

  await call('PATCH',`/bookings/${id}/respond`,T,{action:'accept'}); await settle();
  ok('sender without an email gets no email',(await emails(SENDER,id,'BOOKING_RESPONSE')).length===0);
  const inApp=await prisma.notification.findFirst({where:{user:{phone:SENDER},data:{path:['bookingId'],equals:id}}});
  ok('sender without an email still gets the in-app notification',!!inApp);

  r=await call('POST',`/bookings/${id}/messages`,S,{body:'secret door code 4242'}); ok('first chat message sent',r.status===201);
  r=await call('POST',`/bookings/${id}/messages`,S,{body:'second message'}); ok('second chat message sent',r.status===201);
  await settle();
  const chat=await emails(TRAVELER,id,'MESSAGE');
  ok('two quick chat messages send one email',chat.length===1,String(chat.length));
  ok('the chat text is not in the email record',!chat[0]?.body.includes('4242'));
  const bell=await prisma.notification.count({where:{user:{phone:TRAVELER},data:{path:['bookingId'],equals:id},title:{startsWith:'New message'}}});
  ok('in-app notifications still arrive for each message',bell===2,String(bell));
 }finally{
  for(const u of before) await prisma.user.update({where:{phone:u.phone},data:{email:u.email}});
  await prisma.$disconnect();
 }
})();
