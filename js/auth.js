const sbConfig = window.ROJGARDWAAR_SUPABASE || {};
const supabaseClient = (window.supabase && sbConfig.url && sbConfig.anonKey &&
  !sbConfig.url.startsWith("YOUR_") && !sbConfig.anonKey.startsWith("YOUR_"))
  ? window.supabase.createClient(sbConfig.url, sbConfig.anonKey)
  : null;

function showMsg(message, type="info") {
  const el=document.getElementById("authMsg");
  if(!el) return;
  el.textContent=message;
  el.className="auth-msg "+type;
  el.hidden=false;
}

function requireConfig() {
  if(!supabaseClient) {
    showMsg("Supabase configuration is not connected yet. Create the project and add the URL + publishable/anon key.", "error");
    return false;
  }
  return true;
}

async function registerUser(event) {
  event.preventDefault();
  if(!requireConfig()) return;
  const email=document.getElementById("email").value.trim();
  const password=document.getElementById("password").value;
  const name=document.getElementById("name").value.trim();
  const {error}=await supabaseClient.auth.signUp({
    email,password,
    options:{data:{full_name:name}}
  });
  if(error) return showMsg(error.message,"error");
  showMsg("Registration successful. Check your email if email confirmation is enabled, then log in.","success");
}

async function loginUser(event) {
  event.preventDefault();
  if(!requireConfig()) return;
  const email=document.getElementById("email").value.trim();
  const password=document.getElementById("password").value;
  const {error}=await supabaseClient.auth.signInWithPassword({email,password});
  if(error) return showMsg(error.message,"error");
  window.location.href="./account.html";
}

async function loadAccount() {
  if(!requireConfig()) return;
  const {data,error}=await supabaseClient.auth.getUser();
  if(error || !data.user) {
    window.location.href="./login.html";
    return;
  }
  const user=data.user;
  const name=user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const nameEl=document.getElementById("accountName");
  const emailEl=document.getElementById("accountEmail");
  if(nameEl) nameEl.textContent=name;
  if(emailEl) emailEl.textContent=user.email || "";
}

async function logoutUser() {
  if(supabaseClient) await supabaseClient.auth.signOut();
  window.location.href="./login.html";
}