/* Lifeline demo: browser localStorage is the persistence layer; there is no server backend. */
const KEYS = { donors: "lifeline_donors_v1", drives: "lifeline_drives_v1", requests: "lifeline_requests_v1", users: "lifeline_users_v1", messages: "lifeline_messages_v1", session: "lifeline_session_v1" };
const BLOOD_TYPES = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];
const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
function read(key, fallback=[]) { try { const value=JSON.parse(localStorage.getItem(key)); return value ?? fallback; } catch { return fallback; } }
function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function id() { return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
function escapeHTML(value="") { return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
let toastTimer;
function toast(message) { const el=$("#toast"); el.textContent=message; el.classList.add("show"); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove("show"),2800); }
function seedDemoData() {
  if (!localStorage.getItem(KEYS.donors)) write(KEYS.donors, [
    {id:id(),name:"Aarav Sharma",blood:"A+",city:"Kanpur",phone:"9000000001",email:"",available:true},
    {id:id(),name:"Priya Verma",blood:"O+",city:"Lucknow",phone:"9000000002",email:"",available:true},
    {id:id(),name:"Rohan Singh",blood:"B+",city:"Kanpur",phone:"9000000003",email:"",available:false},
    {id:id(),name:"Ananya Gupta",blood:"AB+",city:"Delhi",phone:"9000000004",email:"",available:true},
    {id:id(),name:"Kabir Patel",blood:"O-",city:"Kanpur",phone:"9000000005",email:"",available:true},
    {id:id(),name:"Meera Das",blood:"A-",city:"Jaipur",phone:"9000000006",email:"",available:true},
    {id:id(),name:"Ishaan Roy",blood:"B-",city:"Mumbai",phone:"9000000007",email:"",available:true},
    {id:id(),name:"Sara Khan",blood:"AB-",city:"Lucknow",phone:"9000000008",email:"",available:false}
  ]);
  if (!localStorage.getItem(KEYS.drives)) write(KEYS.drives, [
    {id:id(),title:"Community Blood Donation Camp",city:"Kanpur",date:"2027-01-15"},
    {id:id(),title:"Donate & Save Lives",city:"Lucknow",date:"2027-02-08"}
  ]);
}
function renderBloodGrid() {
  const donors=read(KEYS.donors);
  $("#bloodGrid").innerHTML=BLOOD_TYPES.map(type=>{
    const count=donors.filter(d=>d.blood===type).length;
    return `<button class="blood-tile" data-blood="${type}" aria-label="Search ${type} donors"><span class="blood-drop">♧</span><strong>${type}</strong><small>${count} ${count===1?"donor":"donors"}</small></button>`;
  }).join("");
}
function renderDonors() {
  const blood=$("#filterBlood").value, city=$("#filterCity").value.trim().toLowerCase(), name=$("#filterName").value.trim().toLowerCase();
  const donors=read(KEYS.donors).filter(d=>(!blood||d.blood===blood)&&(!city||d.city.toLowerCase().includes(city))&&(!name||d.name.toLowerCase().includes(name)));
  $("#resultCount").textContent=`${donors.length} ${donors.length===1?"donor":"donors"}`;
  $("#donorResults").innerHTML=donors.length?donors.map(d=>`<article class="donor-card"><div class="donor-top"><div class="avatar">${escapeHTML(d.name.slice(0,1).toUpperCase())}</div><div><h3>${escapeHTML(d.name)}</h3><p>⌖ ${escapeHTML(d.city)}</p></div><span class="blood-badge">${escapeHTML(d.blood)}</span></div><p>☎ ${escapeHTML(d.phone)}</p>${d.email?`<p>✉ ${escapeHTML(d.email)}</p>`:""}<span class="availability ${d.available?"":"off"}">${d.available?"Available to contact":"Currently unavailable"}</span></article>`).join(""):`<div class="empty-state">No donors match your search. Try another city or blood group.</div>`;
}
function renderDrives() {
  const drives=read(KEYS.drives).sort((a,b)=>a.date.localeCompare(b.date));
  $("#driveResults").innerHTML=drives.length?drives.map(d=>`<article class="drive-card"><button data-delete-drive="${d.id}" title="Delete event" aria-label="Delete event">×</button><p class="drive-date">${escapeHTML(d.date)}</p><h3>${escapeHTML(d.title)}</h3><p>⌖ ${escapeHTML(d.city)}</p></article>`).join(""):`<div class="empty-state">No events yet. Add a blood drive above.</div>`;
}
function showModal(type) {
  const backdrop=$("#modalBackdrop"), title=$("#modalTitle"), content=$("#modalContent");
  const forms={
    emergency:{title:"Emergency Blood Request",html:`<form id="emergencyForm"><label>Patient / requester name<input name="name" required maxlength="80"></label><label>Required blood group<select name="blood" required><option value="">Choose blood group</option>${BLOOD_TYPES.map(x=>`<option>${x}</option>`).join("")}</select></label><label>City / hospital location<input name="city" required maxlength="100"></label><label>Contact phone<input name="phone" type="tel" required maxlength="20"></label><label>Urgency<select name="urgency"><option>Urgent</option><option>Within 24 hours</option><option>Planned</option></select></label><button class="primary-button">Save emergency request</button><p class="form-note">This demo only saves the request on this device. For a real emergency, contact local emergency services and a hospital blood bank directly.</p></form>`},
    donor:{title:"Become a Donor",html:`<p>Register your donor profile in the Donate Blood section.</p><button class="primary-button" id="goDonate">Open donor form</button>`},
    signup:{title:"Create your Lifeline account",html:`<form id="authForm" data-mode="signup"><label>Full name<input name="name" required maxlength="80"></label><label>Email<input name="email" type="email" required maxlength="120"></label><label>Password<input name="password" type="password" minlength="6" required></label><button class="primary-button">Create account</button><p class="modal-switch">Already registered? <button type="button" data-auth-switch="signin">Sign in</button></p><p class="form-note">Demo accounts are stored locally in this browser. Do not use a real password.</p></form>`},
    signin:{title:"Sign in to Lifeline",html:`<form id="authForm" data-mode="signin"><label>Email<input name="email" type="email" required maxlength="120"></label><label>Password<input name="password" type="password" required></label><button class="primary-button">Sign in</button><p class="modal-switch">New to Lifeline? <button type="button" data-auth-switch="signup">Create account</button></p><p class="form-note">Local demo sign-in only; this is not secure authentication.</p></form>`}
  };
  const form=forms[type]||forms.emergency; title.textContent=form.title;content.innerHTML=form.html;backdrop.hidden=false;
}
function closeModal(){ $("#modalBackdrop").hidden=true; }
function formData(form){return Object.fromEntries(new FormData(form).entries());}
$("#donorForm").addEventListener("submit",e=>{e.preventDefault();const data=formData(e.currentTarget);const donors=read(KEYS.donors);donors.unshift({id:id(),name:data.name.trim(),blood:data.blood,city:data.city.trim(),phone:data.phone.trim(),email:data.email.trim(),available:!!e.currentTarget.elements.available.checked});write(KEYS.donors,donors);e.currentTarget.reset();e.currentTarget.elements.available.checked=true;renderBloodGrid();renderDonors();toast("Donor profile saved in this browser.");$("#find").scrollIntoView({behavior:"smooth"});});
$("#driveForm").addEventListener("submit",e=>{e.preventDefault();const d=formData(e.currentTarget);const drives=read(KEYS.drives);drives.push({id:id(),title:d.title.trim(),city:d.city.trim(),date:d.date});write(KEYS.drives,drives);e.currentTarget.reset();renderDrives();toast("Blood drive event saved.");});
$("#contactForm").addEventListener("submit",e=>{e.preventDefault();const messages=read(KEYS.messages);messages.push({...formData(e.currentTarget),createdAt:new Date().toISOString()});write(KEYS.messages,messages);e.currentTarget.reset();toast("Message saved locally.");});
$("#searchBtn").addEventListener("click",renderDonors);
["filterBlood","filterCity","filterName"].forEach(s=>$("#"+s).addEventListener("input",renderDonors));
$("#clearFilters").addEventListener("click",()=>{$("#filterBlood").value="";$("#filterCity").value="";$("#filterName").value="";renderDonors();});
$("#bloodGrid").addEventListener("click",e=>{const btn=e.target.closest("[data-blood]");if(btn){$("#filterBlood").value=btn.dataset.blood;renderDonors();$("#find").scrollIntoView({behavior:"smooth"});}});
$("#driveResults").addEventListener("click",e=>{const btn=e.target.closest("[data-delete-drive]");if(!btn)return;write(KEYS.drives,read(KEYS.drives).filter(d=>d.id!==btn.dataset.deleteDrive));renderDrives();toast("Event deleted.");});
$("#menuToggle").addEventListener("click",()=>$("#navLinks").classList.toggle("open"));
$("#navLinks").addEventListener("click",e=>{if(e.target.closest("a"))$("#navLinks").classList.remove("open");});
$$("[data-open]").forEach(btn=>btn.addEventListener("click",()=>showModal(btn.dataset.open)));
$("#modalClose").addEventListener("click",closeModal);
$("#modalBackdrop").addEventListener("click",e=>{if(e.target.id==="modalBackdrop")closeModal();});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
$("#modalContent").addEventListener("click",e=>{const auth=e.target.closest("[data-auth-switch]");if(auth){showModal(auth.dataset.authSwitch);return;}if(e.target.id==="goDonate"){closeModal();$("#donate").scrollIntoView({behavior:"smooth"});}});
$("#modalContent").addEventListener("submit",e=>{
  e.preventDefault();const form=e.target,data=formData(form);
  if(form.id==="emergencyForm"){const requests=read(KEYS.requests);requests.unshift({...data,id:id(),createdAt:new Date().toISOString()});write(KEYS.requests,requests);closeModal();toast("Emergency request saved locally. Contact a hospital blood bank directly.");return;}
  if(form.id==="authForm"){
    const users=read(KEYS.users),email=data.email.trim().toLowerCase();
    if(form.dataset.mode==="signup"){
      if(users.some(u=>u.email===email)){toast("An account with this email already exists.");return;}
      users.push({id:id(),name:data.name.trim(),email,password:data.password});write(KEYS.users,users);write(KEYS.session,{name:data.name.trim(),email});closeModal();toast("Demo account created on this device.");
    }else{
      const user=users.find(u=>u.email===email&&u.password===data.password);
      if(!user){toast("Email or password not found in this browser.");return;}
      write(KEYS.session,{name:user.name,email:user.email});closeModal();toast(`Welcome back, ${user.name}!`);
    }
  }
});
$("#accessibilityBtn").addEventListener("click",()=>{document.body.classList.toggle("large-text");toast("Accessibility demo: use your browser zoom for more text sizing options.");});
$("#voiceBtn").addEventListener("click",()=>toast("Voice search is a demo control. Type a donor name or city in Find Donors."));
$("#languageBtn").addEventListener("click",()=>toast("Language options can be added to a future version."));
$$("a.nav-link").forEach(a=>a.addEventListener("click",()=>{$$("a.nav-link").forEach(x=>x.classList.toggle("active",x===a));}));
seedDemoData();renderBloodGrid();renderDonors();renderDrives();
