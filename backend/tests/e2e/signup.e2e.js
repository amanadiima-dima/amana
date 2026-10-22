// E2E script — run against the LOCAL dev stack (./dev-local.sh, OTP_BYPASS=true, seeded users). See CLAUDE.md > Testing.
const API='http://localhost:3000/api';
const call=async(m,p,t,b)=>{const h={'Content-Type':'application/json'};if(t)h.Authorization='Bearer '+t;const r=await fetch(API+p,{method:m,headers:h,body:b?JSON.stringify(b):undefined});return {status:r.status,data:await r.json().catch(()=>({}))}};
let pass=0,fail=0;const T=(n,c,x='')=>{c?pass++:fail++;console.log(c?'PASS':'FAIL',n,x)};
(async()=>{
 const phone='+4179'+String(Date.now()).slice(-7);
 await call('POST','/auth/send-otp',null,{phone});
 let r=await call('POST','/auth/verify-otp',null,{phone,code:'000000'}); T('wrong code rejected',r.status===400);
 r=await call('POST','/auth/verify-otp',null,{phone,code:'123456'}); T('new number: verified, asks for a name, NO account yet',r.status===200&&r.data.needsProfile===true&&!!r.data.registrationToken&&!r.data.accessToken);
 const tok=r.data.registrationToken;
 const me=await call('GET','/users/me',null); T('no session issued yet',me.status===401);
 r=await call('POST','/auth/complete-registration',null,{registrationToken:tok,name:'A'}); T('1-letter name rejected',r.status===400);
 r=await call('POST','/auth/complete-registration',null,{registrationToken:'garbage',name:'Maria Lopez'}); T('forged token rejected',r.status===400);
 r=await call('POST','/auth/complete-registration',null,{registrationToken:tok,name:'Maria Lopez'}); T('terms/18+ not accepted is rejected',r.status===400);
 r=await call('POST','/auth/complete-registration',null,{registrationToken:tok,name:'Maria Lopez',acceptTerms:true}); T('valid token + name creates the account and signs in',r.status===200&&!!r.data.accessToken&&r.data.user.name==='Maria Lopez'&&r.data.user.phone===phone);
 const access=r.data.accessToken;
 r=await call('GET','/users/me',access); T('session works',r.status===200&&r.data.user.phone===phone);
 r=await call('POST','/auth/complete-registration',null,{registrationToken:tok,name:'Someone Else',acceptTerms:true}); T('reusing the token does not overwrite the account',r.status===200&&r.data.user.name==='Maria Lopez');
 r=await call('POST','/auth/verify-otp',null,{phone,code:'123456'}); T('same number again: logs in directly (no checkbox, no name)',r.status===200&&!!r.data.accessToken&&!r.data.needsProfile&&r.data.user.name==='Maria Lopez');
 r=await call('POST','/auth/verify-otp',null,{phone,code:'123456',name:'Hacker'}); T('name sent for an existing number is ignored',r.data.user?.name==='Maria Lopez');
 const phone2='+4178'+String(Date.now()).slice(-7);
 r=await call('POST','/auth/verify-otp',null,{phone:phone2,code:'123456',name:'Skip Terms'}); T('name in verify-otp no longer creates an account (terms/18+ must go through complete-registration)',r.status===200&&r.data.needsProfile===true&&!r.data.accessToken&&(await call('POST','/auth/verify-otp',null,{phone:phone2,code:'123456'})).data.needsProfile===true);
 r=await call('POST','/auth/verify-otp',null,{phone:'+10000000001',code:'123456'}); T('seeded existing user logs in directly',r.status===200&&!!r.data.accessToken);
 console.log(`\n${pass} passed, ${fail} failed`);
})();
