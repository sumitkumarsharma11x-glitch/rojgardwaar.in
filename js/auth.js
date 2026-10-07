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

function getSafeRedirect() {
  const value=new URLSearchParams(window.location.search).get("redirect");
  if(!value) return "./account.html";
  if(value.startsWith("/") || value.startsWith("./")) {
    if(!value.includes("://") && !value.startsWith("//")) return value;
  }
  return "./account.html";
}

function showOtpStep() {
  const registerForm=document.getElementById("registerForm");
  const otpBox=document.getElementById("otpBox");
  if(registerForm) registerForm.hidden=true;
  if(otpBox) otpBox.hidden=false;
}

async function registerUser(event) {
  event.preventDefault();
  if(!requireConfig()) return;
  const email=document.getElementById("email").value.trim();
  const password=document.getElementById("password").value;
  const name=document.getElementById("name").value.trim();
  const button=event.submitter;
  if(button) button.disabled=true;

  const {data,error}=await supabaseClient.auth.signUp({
    email,password,
    options:{data:{full_name:name}}
  });

  if(button) button.disabled=false;
  if(error) return showMsg(error.message,"error");

  if(data.session) {
    showMsg("Account created successfully. You are verified and logged in.","success");
    setTimeout(()=>{ window.location.href="./account.html"; },700);
    return;
  }

  showOtpStep();
  showMsg("We sent a verification code to your email. Enter it below.","success");
  const otp=document.getElementById("otp");
  if(otp) otp.focus();
}

async function verifySignupOtp(event) {
  event.preventDefault();
  if(!requireConfig()) return;
  const email=document.getElementById("email").value.trim();
  const token=document.getElementById("otp").value.trim();
  if(!/^\d{6,10}$/.test(token)) return showMsg("Please enter the OTP (6–10 digits).","error");

  const button=event.submitter;
  if(button) button.disabled=true;
  const {error}=await supabaseClient.auth.verifyOtp({email,token,type:"email"});
  if(button) button.disabled=false;

  if(error) return showMsg(error.message,"error");

  showMsg("Email verified successfully. You can now log in.","success");
  setTimeout(()=>{
    window.location.href="./login.html?verified=1";
  },700);
}

async function resendSignupOtp() {
  if(!requireConfig()) return;
  const email=document.getElementById("email").value.trim();
  if(!email) return showMsg("Enter your email first.","error");

  const {error}=await supabaseClient.auth.resend({type:"signup",email});
  if(error) return showMsg(error.message,"error");
  showMsg("A new verification code has been sent.","success");
}

async function loginUser(event) {
  event.preventDefault();
  if(!requireConfig()) return;
  const email=document.getElementById("email").value.trim();
  const password=document.getElementById("password").value;
  const {error}=await supabaseClient.auth.signInWithPassword({email,password});
  if(error) return showMsg(error.message,"error");
  window.location.href=getSafeRedirect();
}

function switchLoginMode(mode) {
  const passwordForm=document.getElementById("passwordLoginForm");
  const otpBox=document.getElementById("otpLoginBox");
  const passwordTab=document.getElementById("passwordTab");
  const otpTab=document.getElementById("otpTab");
  const isOtp=mode==="otp";
  if(passwordForm) passwordForm.hidden=isOtp;
  if(otpBox) otpBox.hidden=!isOtp;
  if(passwordTab) passwordTab.classList.toggle("is-active",!isOtp);
  if(otpTab) otpTab.classList.toggle("is-active",isOtp);
  if(isOtp) document.getElementById("otpEmail")?.focus();
}

async function sendLoginOtp(event) {
  if(event?.preventDefault) event.preventDefault();
  if(!requireConfig()) return;
  const email=document.getElementById("otpEmail")?.value.trim();
  if(!email) return showMsg("Enter your email address first.","error");
  const {error}=await supabaseClient.auth.signInWithOtp({
    email,
    options:{shouldCreateUser:false}
  });
  if(error) return showMsg(error.message,"error");
  const verifyBox=document.getElementById("loginOtpVerify");
  if(verifyBox) verifyBox.hidden=false;
  showMsg("An OTP has been sent to your email.","success");
  document.getElementById("loginOtp")?.focus();
}

async function verifyLoginOtp(event) {
  event.preventDefault();
  if(!requireConfig()) return;
  const email=document.getElementById("otpEmail")?.value.trim();
  const token=document.getElementById("loginOtp")?.value.trim();
  if(!/^\d{6,10}$/.test(token)) return showMsg("Please enter the OTP (6–10 digits).","error");
  const {data,error}=await supabaseClient.auth.verifyOtp({email,token,type:"email"});
  if(error) return showMsg(error.message,"error");
  showMsg("Login successful. Redirecting...","success");
  setTimeout(()=>{ window.location.href=getSafeRedirect(); },300);
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