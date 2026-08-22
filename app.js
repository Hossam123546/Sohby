const $ = (id) => document.getElementById(id);
let mode = "login";
let me = null;

function toast(message){
  const el = $("toast"); el.textContent = message; el.classList.add("show");
  setTimeout(()=>el.classList.remove("show"),2200);
}
async function api(path, options={}){
  const res = await fetch(path, {
    credentials:"include",
    headers:{"Content-Type":"application/json",...(options.headers||{})},
    ...options
  });
  let data = {};
  try { data = await res.json(); } catch {}
  if(!res.ok) throw new Error(data.error || "حدث خطأ");
  return data;
}
function setMode(next){
  mode = next;
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active", b.dataset.mode===mode));
  $("nameField").classList.toggle("hidden", mode!=="register");
  $("usernameField").classList.toggle("hidden", mode!=="register");
  $("authSubmit").textContent = mode==="login" ? "دخول" : "إنشاء الحساب";
  $("authError").textContent = "";
  $("password").autocomplete = mode==="login" ? "current-password" : "new-password";
}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));

$("authForm").addEventListener("submit", async e=>{
  e.preventDefault();
  $("authError").textContent="";
  const payload = {
    email:$("email").value.trim(),
    password:$("password").value
  };
  if(mode==="register"){
    payload.displayName=$("displayName").value.trim();
    payload.username=$("username").value.trim();
  }
  $("authSubmit").disabled=true;
  try{
    const data = await api(mode==="login"?"/api/login":"/api/register",{method:"POST",body:JSON.stringify(payload)});
    me=data.user; showApp(); await loadPosts();
    $("authForm").reset();
  }catch(err){$("authError").textContent=err.message}
  finally{$("authSubmit").disabled=false}
});

function showApp(){
  $("authView").classList.add("hidden");
  $("appView").classList.remove("hidden");
  $("profileName").textContent=me.displayName;
  $("profileUsername").textContent="@"+me.username;
  $("profileBio").textContent=me.bio || "أهلاً بيك في صحبي 👋";
  $("profileAvatar").textContent=(me.displayName||"ص").slice(0,1);
  $("composerAvatar").textContent=(me.displayName||"ص").slice(0,1);
}
async function loadMe(){
  try{
    const data=await api("/api/me");
    if(data.user){me=data.user;showApp();await loadPosts();return true}
  }catch{}
  return false;
}
async function loadPosts(){
  const data=await api("/api/posts");
  const box=$("posts"); box.innerHTML="";
  $("empty").classList.toggle("hidden", data.posts.length>0);
  for(const p of data.posts){
    const article=document.createElement("article");
    article.className="post card";
    article.innerHTML=`
      <div class="post-head">
        <div class="avatar small">${escapeHtml((p.display_name||"ص").slice(0,1))}</div>
        <div class="post-meta">
          <div class="post-name">${escapeHtml(p.display_name)}</div>
          <div class="post-username">@${escapeHtml(p.username)} · ${formatDate(p.created_at)}</div>
        </div>
      </div>
      <div class="post-content">${escapeHtml(p.content)}</div>
      ${p.user_id===me.id?`<div class="post-actions"><button class="delete" data-id="${p.id}">حذف المنشور</button></div>`:""}
    `;
    box.appendChild(article);
  }
  box.querySelectorAll(".delete").forEach(btn=>btn.addEventListener("click",async()=>{
    if(!confirm("تحذف المنشور؟")) return;
    try{await api("/api/posts",{method:"DELETE",body:JSON.stringify({id:btn.dataset.id})});toast("تم حذف المنشور");loadPosts()}
    catch(e){toast(e.message)}
  }));
}
$("postContent").addEventListener("input",()=> $("counter").textContent=`${$("postContent").value.length} / 1000`);
$("postBtn").addEventListener("click",async()=>{
  $("postError").textContent="";
  const content=$("postContent").value.trim();
  if(!content){$("postError").textContent="اكتب حاجة الأول";return}
  $("postBtn").disabled=true;
  try{await api("/api/posts",{method:"POST",body:JSON.stringify({content})});$("postContent").value="";$("counter").textContent="0 / 1000";toast("اتنشر بنجاح");await loadPosts()}
  catch(e){$("postError").textContent=e.message}
  finally{$("postBtn").disabled=false}
});
$("refreshBtn").addEventListener("click",loadPosts);
$("logoutBtn").addEventListener("click",async()=>{try{await api("/api/logout",{method:"POST"})}catch{} location.reload()});
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function formatDate(s){return new Date(s).toLocaleString("ar-EG",{dateStyle:"medium",timeStyle:"short"})}
loadMe();