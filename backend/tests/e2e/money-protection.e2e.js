// E2E script — run against the LOCAL dev stack (./dev-local.sh, OTP_BYPASS=true, seeded users). See CLAUDE.md > Testing.
const API=process.env.API||'http://localhost:3000/api';
const prisma=new (require('@prisma/client').PrismaClient)();
const call=async(m,p,t,b,f)=>{const h={};if(t)h.Authorization='Bearer '+t;let body;if(f)body=f;else if(b){h['Content-Type']='application/json';body=JSON.stringify(b)}const r=await fetch(API+p,{method:m,headers:h,body});return {status:r.status,data:await r.json().catch(()=>({}))}};
const { signIn } = require('./_auth');
const login = async (phone) => (await signIn(phone)).data.accessToken;
const day=n=>new Date(Date.now()+864e5*n).toISOString();
let pass=0,fail=0;const T=(id,title,ok,detail='')=>{ok?pass++:fail++;console.log(`${ok?'PASS':'FAIL'} ${id} ${title} ${detail}`)};
const trip=(t,o={})=>call('POST','/trips',t,{originCity:'Paris',destinationCity:'Rabat',departureAt:day(4),maxWeightKg:10,pricePerKg:4,mode:'PLANE',...o});
const parcel=(t,w=2)=>{const f=new FormData();f.append('pickupAddress','a');f.append('deliveryAddress','b');f.append('weightKg',String(w));f.append('description','ba2');return call('POST','/parcels',t,null,f)};
const fullBooking=async(S,Tr,pay=true,w=2)=>{const tr=await trip(Tr,{destinationCity:'Test'+Math.floor(Math.random()*1e5)});const pc=await parcel(S,w);const bk=await call('POST','/bookings',S,{tripId:tr.data.trip.id,parcelRequestId:pc.data.parcel.id});const id=bk.data.booking.id;await call('PATCH',`/bookings/${id}/respond`,Tr,{action:'accept'});if(pay){await call('POST','/payments/intent',S,{bookingId:id});await call('POST',`/payments/${id}/confirm-stub`,S)}return {id,tripId:tr.data.trip.id}};
const track=(Tr,id,status,extra={},photo=false)=>{const f=new FormData();f.append('status',status);for(const k in extra)f.append(k,extra[k]);if(photo)f.append('photo',new Blob([Buffer.from('89504e470d0a1a0a','hex')],{type:'image/png'}),'proof.png');return call('POST',`/tracking/${id}`,Tr,null,f)};
(async()=>{
 const S1=await login('+10000000001'),S2=await login('+10000000002'),S3=await login('+10000000003'),T1=await login('+10000000011'),T2=await login('+10000000012'),AD=await login('+10000000099');
 // --- escrow happy path with code
 let b=await fullBooking(S1,T1);
 let r=await track(T1,b.id,'DELIVERED',{code:'000000'}); T('A2a','DELIVERED before pickup rejected',r.status===400,r.data.message);
 r=await track(T1,b.id,'PICKED_UP'); T('A2b','pickup after payment OK',r.status===201);
 r=await track(T1,b.id,'IN_TRANSIT'); T('A2c','in transit OK',r.status===201);
 r=await track(T1,b.id,'DELIVERED',{code:'000000'}); T('A2d','wrong delivery code rejected',r.status===400,r.data.message);
 r=await track(T1,b.id,'DELIVERED'); T('A2e','missing code rejected',r.status===400);
 const mine=await call('GET',`/bookings/${b.id}`,S1); const code=mine.data.booking.deliveryCode;
 T('A2f','sender can see the delivery code',/^\d{6}$/.test(code||''),code);
 const asTrav=await call('GET',`/bookings/${b.id}`,T1); T('A2g','traveler cannot see the code',asTrav.data.booking.deliveryCode===undefined);
 r=await track(T1,b.id,'DELIVERED',{code}); T('A2h0','correct code WITHOUT photo rejected',r.status===400,r.data.message);
 r=await track(T1,b.id,'DELIVERED',{code},true); T('A2h','correct code + photo completes + releases',r.status===201&&(await prisma.payment.findUnique({where:{bookingId:b.id}})).status==='RELEASED');
 // pickup before payment
 b=await fullBooking(S2,T2,false); r=await track(T2,b.id,'PICKED_UP'); T('A2i','pickup before payment rejected',r.status===400,r.data.message);
 // price lock
 b=await fullBooking(S3,T1,false); r=await call('PATCH',`/trips/${b.tripId}`,T1,{pricePerKg:40}); T('A1','price change blocked while booking active',r.status===409,r.data.message);
 r=await call('PATCH',`/trips/${b.tripId}`,T1,{notes:'bring ID'}); T('A1b','notes still editable',r.status===200);
 r=await call('PATCH',`/trips/${b.tripId}`,T1,{maxWeightKg:1}); T('B6','capacity shrink blocked',r.status===409);
 // cancel after pickup
 b=await fullBooking(S1,T2); await track(T2,b.id,'PICKED_UP');
 r=await call('DELETE',`/bookings/${b.id}`,S1); T('A3','sender cancel after pickup blocked',r.status===409,r.data.message);
 r=await call('POST',`/bookings/${b.id}/dispute`,S1,{reason:'Traveler stopped answering'}); T('A3b','sender can open dispute',r.status===200);
 let disp=await call('GET','/admin/disputes',AD); T('A3c','admin sees dispute',disp.data.disputes?.some(d=>d.id===b.id));
 r=await call('GET','/admin/disputes',S1); T('A3d','non-admin blocked from disputes',r.status===403);
 r=await call('PATCH',`/admin/disputes/${b.id}`,AD,{resolution:'REFUND'}); const p3=await prisma.payment.findUnique({where:{bookingId:b.id}}); const bb=await prisma.booking.findUnique({where:{id:b.id}});
 T('A3e','admin refund resolves dispute',r.status===200&&p3.status==='REFUNDED'&&bb.status==='CANCELLED'&&bb.disputeOutcome==='REFUNDED');
 // failed delivery -> dispute -> release
 b=await fullBooking(S2,T1); await track(T1,b.id,'PICKED_UP'); r=await track(T1,b.id,'FAILED',{note:'recipient absent'});
 const f=await prisma.booking.findUnique({where:{id:b.id}}); T('A4','FAILED delivery opens a dispute',f.status==='DISPUTED'&&f.disputeReason==='recipient absent');
 r=await call('PATCH',`/admin/disputes/${b.id}`,AD,{resolution:'RELEASE'}); const p4=await prisma.payment.findUnique({where:{bookingId:b.id}}); T('A4b','admin release pays traveler',r.status===200&&p4.status==='RELEASED');
 // trip cancel
 b=await fullBooking(S3,T2); r=await call('DELETE',`/trips/${b.tripId}`,T2); const p5=await prisma.payment.findUnique({where:{bookingId:b.id}}); const b5=await prisma.booking.findUnique({where:{id:b.id}});
 T('A5','trip cancel auto-refunds paid booking',r.status===200&&p5.status==='REFUNDED'&&b5.status==='CANCELLED',`payment=${p5.status}`);
 b=await fullBooking(S3,T2); await track(T2,b.id,'PICKED_UP'); r=await call('DELETE',`/trips/${b.tripId}`,T2); T('A5b','trip cancel blocked once parcel collected',r.status===409,r.data.message);
 // validations
 const own=await trip(T1,{destinationCity:'SelfTest'}); const sp=await parcel(T1,1); r=await call('POST','/bookings',T1,{tripId:own.data.trip.id,parcelRequestId:sp.data.parcel.id}); T('B2','self-booking blocked',r.status===400,r.data.message);
 r=await trip(T1,{departureAt:day(-3)}); T('B3','past-dated trip rejected',r.status===400,r.data.message);
 r=await trip(T1,{maxWeightKg:1000000}); T('B4','typo-level weight (1,000,000 kg) rejected',r.status===400,r.data.message);
 r=await trip(T1,{pricePerKg:5000000,destinationCity:'TypoCity'}); T('B4b','typo-level price rejected',r.status===400);
 r=await trip(T1,{pricePerKg:2000,destinationCity:'PremiumCity'}); T('B4c','premium price (2000/kg) allowed',r.status===201);
 r=await parcel(S3,5000); T('B5','5,000 kg parcel rejected',r.status===400);
 r=await parcel(S3,300); T('B5b','300 kg parcel allowed (capacity decides)',r.status===201);
 const f2=new FormData();f2.append('pickupAddress','a');f2.append('deliveryAddress','b');f2.append('weightKg','1');f2.append('description','x');f2.append('estimatedValue','5000'); f2.append('valueCurrency','CHF'); r=await call('POST','/parcels',S3,null,f2); T('B7','high declared value (5000 CHF) allowed',r.status===201&&r.data.parcel.valueCurrency==='CHF');
 r=await call('GET',`/trips/${own.data.trip.id}/bookings`,T1); T('C1','sender phone no longer exposed to traveler',!JSON.stringify(r.data).includes('"phone"'));
 // --- currency
 let c=await trip(T1,{originCity:'Genève',destinationCity:'Rabat'}); T('M1','Geneva departure defaults to CHF',c.data.trip?.currency==='CHF',c.data.trip?.currency);
 c=await trip(T1,{originCity:'Paris'}); T('M2','Paris departure defaults to EUR',c.data.trip?.currency==='EUR');
 c=await trip(T1,{originCity:'Casablanca',destinationCity:'Paris'}); T('M3','Casablanca departure defaults to MAD',c.data.trip?.currency==='MAD',c.data.trip?.currency);
 c=await trip(T1,{originCity:'Paris',currency:'GBP'}); T('M4','explicit currency override respected',c.data.trip?.currency==='GBP');
 c=await trip(T1,{originCity:'Paris',currency:'XYZ'}); T('M5','unknown currency rejected',c.status===400);
 { const ch=await trip(T2,{originCity:'Genève',destinationCity:'MoneyTest'+Date.now()%1000,pricePerKg:2000}); const pcl=await parcel(S2,1); const bk2=await call('POST','/bookings',S2,{tripId:ch.data.trip.id,parcelRequestId:pcl.data.parcel.id}); await call('PATCH',`/bookings/${bk2.data.booking.id}/respond`,T2,{action:'accept'}); const it=await call('POST','/payments/intent',S2,{bookingId:bk2.data.booking.id}); const pay=await prisma.payment.findUnique({where:{bookingId:bk2.data.booking.id}}); T('M6','2,000 CHF/kg booking charged in CHF with 10% fee',pay.currency==='CHF'&&pay.grossAmount===2000&&pay.platformFee===200&&pay.travelerAmount===1800,`${pay.grossAmount} ${pay.currency} fee ${pay.platformFee}`); }
 // legit regression
 b=await fullBooking(S1,T1,false); r=await call('DELETE',`/bookings/${b.id}`,S1); T('R1','sender can still cancel before anything happens',r.status===200);
 console.log(`\n${pass} passed, ${fail} failed`);
 await prisma.$disconnect();
})().catch(e=>{console.error('ERR',e);process.exit(1)});
