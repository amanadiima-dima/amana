// E2E script — run against the LOCAL dev stack (./dev-local.sh, OTP_BYPASS=true, seeded users). See CLAUDE.md > Testing.
const API='http://localhost:3000/api';
const prisma=new (require('@prisma/client').PrismaClient)();
const call=async(m,p,t,b,f)=>{const h={};if(t)h.Authorization='Bearer '+t;let body;if(f)body=f;else if(b){h['Content-Type']='application/json';body=JSON.stringify(b)}const r=await fetch(API+p,{method:m,headers:h,body});return {status:r.status,data:await r.json().catch(()=>({}))}};
const login=async(phone)=>{await call('POST','/auth/send-otp',null,{phone});const r=await call('POST','/auth/verify-otp',null,{phone,code:'123456'});return r.data.accessToken};
const ok=(n,c,x='')=>console.log(c?'PASS':'FAIL',n,x);
(async()=>{
 const S=await login('+10000000005'),T=await login('+10000000013');
 const tr=await call('POST','/trips',T,{originCity:'Paris',destinationCity:'TipCity'+(Date.now()%1000),departureAt:new Date(Date.now()+864e5*4).toISOString(),maxWeightKg:10,pricePerKg:4,mode:'PLANE'});
 const f=()=>{const x=new FormData();x.append('pickupAddress','a');x.append('deliveryAddress','b');x.append('weightKg','2');x.append('description','tip test');return x};
 const pc=await call('POST','/parcels',S,null,f());
 let r=await call('POST','/bookings',S,{tripId:tr.data.trip.id,parcelRequestId:pc.data.parcel.id,priorityTip:-5}); ok('negative tip rejected',r.status===400);
 r=await call('POST','/bookings',S,{tripId:tr.data.trip.id,parcelRequestId:pc.data.parcel.id,priorityTip:100}); ok('booking with tip created',r.status===201&&r.data.booking.priorityTip===100);
 const id=r.data.booking.id;
 const tb=await call('GET',`/trips/${tr.data.trip.id}/bookings`,T); ok('traveler sees the tip on the request',tb.data.bookings[0].priorityTip===100);
 await call('PATCH',`/bookings/${id}/respond`,T,{action:'accept'}); await call('POST','/payments/intent',S,{bookingId:id});
 const pay=await prisma.payment.findUnique({where:{bookingId:id}});
 ok('payment = 2kg×4 + 100 tip = 108, fee 10.80, traveler 97.20',pay.grossAmount===108&&pay.platformFee===10.8&&pay.travelerAmount===97.2,`${pay.grossAmount}/${pay.platformFee}/${pay.travelerAmount}`);
 await prisma.$disconnect();
})();
