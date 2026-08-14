(function(){
  "use strict";
  var API = "/_functions/";           // same-origin: the member's Wix session cookie rides along
  var LOGIN = "/my-foundry";          // members-only gate page: Wix prompts login, then redirects here
  var ME = null;

  // ---------- styles ----------
  var CSS = [
":root{--bg:#0d0b0a;--panel:#161311;--panel2:#1d1917;--line:#2a2523;--ink:#f3ede6;--dim:#b8afa5;--faint:#8a807a;--ember:#e8763a;--ember2:#f0a35e;--gold:#c9a24a;--ok:#7bbf6a}",
"*{box-sizing:border-box}",
"body{margin:0;background:var(--bg);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5}",
".wrap{max-width:860px;margin:0 auto;padding:32px 20px 80px}",
".brand{text-align:center;margin-bottom:8px}",
".brand .k{font-size:11px;letter-spacing:.32em;color:var(--ember);font-weight:700}",
".brand h1{font-family:Georgia,serif;font-size:30px;letter-spacing:.14em;margin:2px 0 0;font-weight:600}",
".brand h1 span{color:var(--ember)}",
".sub{text-align:center;color:var(--faint);font-size:13px;margin-bottom:26px}",
".card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:20px 22px;margin-bottom:18px}",
".card h2{font-family:Georgia,serif;font-size:19px;margin:0 0 4px}",
".card .note{color:var(--faint);font-size:12.5px;margin-bottom:16px}",
".locked{background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:14px 16px;margin-bottom:16px}",
".locked .lk{font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--ember2);margin-bottom:10px}",
".lg{display:grid;grid-template-columns:1fr 1fr;gap:12px 22px}",
".lg .k{font-size:11px;color:var(--faint);margin-bottom:2px}",
".lg .val{font-size:14px;color:var(--ink)}",
"label{display:block;font-size:12px;color:var(--dim);margin:14px 0 5px}",
"input,textarea{width:100%;background:var(--panel2);border:1px solid var(--line);border-radius:9px;color:var(--ink);padding:10px 12px;font-family:inherit;font-size:14px}",
"input:focus,textarea:focus{outline:none;border-color:var(--ember)}",
"textarea{resize:vertical;min-height:64px}",
".btn{display:inline-block;border:none;border-radius:9px;padding:11px 18px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;text-decoration:none}",
".btn.primary{background:linear-gradient(180deg,var(--ember2),var(--ember));color:#1a120c}",
".btn:disabled{opacity:.55;cursor:default}",
".pill{display:inline-block;font-size:11px;padding:3px 10px;border-radius:999px;border:1px solid var(--line);background:var(--panel2);color:var(--dim)}",
".pill.seeker{color:var(--ember2)}.pill.builder{color:var(--gold)}.pill.sovereign{color:var(--ok)}",
".msg{border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin-bottom:10px;background:var(--panel2)}",
".msg .top{display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px}",
".msg .who{font-weight:600}.msg .who.me{color:var(--ember2)}",
".msg .when{color:var(--faint)}",
".msg .subj{font-size:13.5px;font-weight:600;margin-bottom:3px}",
".msg .bd{font-size:13.5px;color:var(--dim);white-space:pre-wrap}",
".empty{color:var(--faint);font-size:13px;padding:8px 0}",
".center{min-height:80vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}",
".center p{color:var(--faint);max-width:420px;margin:16px 0 22px}",
"#toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%) translateY(20px);background:#241d18;border:1px solid var(--line);color:var(--ink);padding:11px 18px;border-radius:10px;opacity:0;transition:.25s;font-size:13.5px;pointer-events:none;z-index:9}",
"#toast.show{opacity:1;transform:translateX(-50%) translateY(0)}",
"@media(max-width:560px){.lg{grid-template-columns:1fr}}"
  ].join("");

  function injectStyle(){ var s=document.createElement("style"); s.textContent=CSS; document.head.appendChild(s); var t=document.createElement("div"); t.id="toast"; document.body.appendChild(t); }

  function esc(s){ return (s==null?"":String(s)).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c];}); }
  function toast(t){ var el=document.getElementById("toast"); if(!el) return; el.textContent=t; el.classList.add("show"); clearTimeout(el._t); el._t=setTimeout(function(){el.classList.remove("show");},2600); }
  function fmtDate(d){ if(!d) return ""; try{ var x=new Date(d); return x.toLocaleDateString(undefined,{month:"short",day:"numeric"})+" "+x.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"}); }catch(e){ return ""; } }
  function root(){ return document.getElementById("foundryRoot"); }
  function val(id){ var e=document.getElementById(id); return e?e.value:""; }

  function api(path, body){
    return fetch(API+path,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify(body||{})})
      .then(function(r){ return r.json().then(function(j){ return {s:r.status,j:j}; }); });
  }

  function load(){
    api("memberData").then(function(res){
      if(res.s!==200 || !res.j || res.j.error){ showLogin(); return; }
      ME=res.j; render();
    }).catch(showLogin);
  }

  function showLogin(){
    root().innerHTML =
      '<div class="wrap"><div class="center"><div class="brand"><div class="k">STARKE</div><h1>FO<span>U</span>NDRY</h1></div>'+
      '<p>Sign in with the password you set from your welcome email to open your Foundry.</p>'+
      '<a class="btn primary" href="'+LOGIN+'">Sign in</a></div></div>';
  }

  function idBlock(){
    var m=ME;
    var rows='<div><div class="k">Name</div><div class="val">'+esc(m.name)+'</div></div>'+
             '<div><div class="k">Email</div><div class="val">'+esc(m.email)+'</div></div>'+
             (m.phone?'<div><div class="k">Phone</div><div class="val">'+esc(m.phone)+'</div></div>':'')+
             (m.address?'<div><div class="k">Address</div><div class="val">'+esc(m.address)+'</div></div>':'');
    return '<div class="locked"><div class="lk">Your identity, locked from your application</div><div class="lg">'+rows+'</div></div>';
  }

  function profileCard(){
    var m=ME, html='<div class="card"><h2>Your profile</h2>';
    if(m.role==="coach"){
      html+='<div class="note">Your bench tier is <span class="pill">'+esc(m.tier||"â")+'</span>. Keep your public profile current.</div>';
      html+=idBlock();
      html+='<label>Primary lane</label><input id="c_lane" maxlength="120" value="'+esc(m.primaryLane)+'">';
      html+='<label>Secondary lanes</label><input id="c_lanes2" maxlength="240" value="'+esc(m.secondaryLanes)+'" placeholder="Comma separated">';
      html+='<label>Public bio</label><textarea id="c_bio" maxlength="2000" placeholder="How founders should understand your edge.">'+esc(m.bio)+'</textarea>';
    } else {
      html+='<div class="note">Your stage is <span class="pill '+esc((m.stage||"").toLowerCase())+'">'+esc(m.stage||"Seeker")+'</span> &middot; week '+esc(m.week||1)+'. The fields below are yours to shape.</div>';
      html+=idBlock();
      html+='<label>The one line of what you are building</label><input id="f_build" maxlength="300" value="'+esc(m.buildLine)+'" placeholder="A ... that ... for ...">';
      html+='<label>Your governing metric</label><input id="f_metric" maxlength="300" value="'+esc(m.metric)+'" placeholder="The one number that tells you it is working">';
      html+='<label>About you</label><textarea id="f_bio" maxlength="2000" placeholder="A few lines on who you are and what you are here to build.">'+esc(m.bio)+'</textarea>';
    }
    html+='<div style="margin-top:16px"><button class="btn primary" id="saveBtn">Request profile change</button><div class="note" style="margin-top:8px">Your profile is locked once set. Submitting sends a change request to Ethan; approved changes are applied within about a week.</div></div></div>';
    return html;
  }

  function inboxCard(){
    var msgs=ME.messages||[];
    var list=msgs.length? msgs.map(function(x){
      var mine = x.fromRole!=="admin";
      return '<div class="msg"><div class="top"><span class="who'+(mine?" me":"")+'">'+esc(mine?"You":(x.fromName||"Ethan"))+'</span><span class="when">'+esc(fmtDate(x._createdDate))+'</span></div>'+
             (x.subject?'<div class="subj">'+esc(x.subject)+'</div>':'')+'<div class="bd">'+esc(x.body)+'</div></div>';
    }).join('') : '<div class="empty">No messages yet. Send Ethan a note below.</div>';
    return '<div class="card"><h2>Messages</h2><div class="note">Your direct line to Ethan. He reads and replies from the Foundry admin desk.</div>'+
      '<div id="msgList">'+list+'</div>'+
      '<label>Subject</label><input id="m_subj" maxlength="200" placeholder="What is this about?">'+
      '<label>Message</label><textarea id="m_body" maxlength="4000" placeholder="Write to Ethan..."></textarea>'+
      '<div style="margin-top:14px"><button class="btn primary" id="sendBtn">Send to Ethan</button></div></div>';
  }

  function coachExtra(){ return (ME && ME.role === "coach") ? coachDeskCard() : ""; }

  function coachDeskCard(){
    return '<div class="card"><h2>Your founders</h2>'+
      '<div class="note">Every founder assigned to you. Log each weekly session, set homework, and hand a founder to another coach when the stage calls for it.</div>'+
      '<div id="coachDesk"><div class="empty">Loading your roster...</div></div></div>';
  }

  var COACH_ROSTER = null;

  function ensureCoachCSS(){
    if(document.getElementById("coachCSS")) return;
    var s = document.createElement("style"); s.id = "coachCSS";
    s.textContent = [
      ".fblock{border:1px solid var(--line);border-radius:12px;padding:14px;margin:12px 0;background:var(--panel2)}",
      ".fhead{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap}",
      ".fname{font-weight:600;font-size:16px}",
      ".fmeta{color:var(--faint);font-size:13px}",
      ".fhist{margin:10px 0}",
      ".flog{border-top:1px solid var(--line);margin-top:10px;padding-top:10px}",
      ".frow{display:flex;gap:8px;align-items:center;margin:6px 0}",
      ".frow .wk{width:84px}",
      ".frow2{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}",
      ".handoff{margin-top:10px;border-top:1px dashed var(--line);padding-top:10px}",
      "#coachDesk select{background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:9px}",
      ".btn.ghost{background:transparent;border:1px solid var(--line);color:var(--dim)}"
    ].join(String.fromCharCode(10));
    document.head.appendChild(s);
  }

  function loadCoachDesk(){
    ensureCoachCSS();
    api("coachData").then(function(res){
      var host = document.getElementById("coachDesk");
      if(!host) return;
      if(res.s !== 200 || !res.j || res.j.error){ host.innerHTML = '<div class="empty">Could not load your roster. Refresh to try again.</div>'; return; }
      COACH_ROSTER = res.j;
      var fs = res.j.founders || [];
      if(!fs.length){ host.innerHTML = '<div class="empty">No founders are assigned to you yet. Ethan assigns founders from the admin desk; they appear here when he does.</div>'; return; }
      host.innerHTML = fs.map(founderBlock).join("");
      wireCoachDesk();
    }).catch(function(){
      var host = document.getElementById("coachDesk");
      if(host) host.innerHTML = '<div class="empty">Could not reach the server. Refresh to try again.</div>';
    });
  }

  function founderBlock(f){
    var sess = f.sessions || [];
    var hist = sess.length ? sess.map(function(s){
      var wk = s.week ? ("Wk " + esc(s.week)) : "";
      var st = s.status ? ('<span class="pill">' + esc(s.status) + '</span>') : "";
      return '<div class="msg"><div class="top"><span class="who">' + wk + ' ' + st + '</span><span class="when">' + esc(fmtDate(s._createdDate)) + '</span></div>' +
        (s.notes ? ('<div class="bd">' + esc(s.notes) + '</div>') : "") +
        (s.homeworkPicked ? ('<div class="subj">Homework: ' + esc(s.homeworkPicked) + '</div>') : "") +
        (s.handoffNote ? ('<div class="bd"><em>Handoff note: ' + esc(s.handoffNote) + '</em></div>') : "") + '</div>';
    }).join("") : '<div class="empty">No sessions logged yet.</div>';

    var fid = esc(f.id);
    return '<div class="fblock" data-fid="' + fid + '">' +
      '<div class="fhead"><div><span class="fname">' + esc(f.name || "Founder") + '</span> ' +
        '<span class="pill ' + esc((f.stage || "").toLowerCase()) + '">' + esc(f.stage || "Seeker") + '</span> ' +
        '<span class="fmeta">week ' + esc(f.week || 1) + '</span></div>' +
        '<div class="fmeta">' + esc(f.email || "") + '</div></div>' +
      (f.buildLine ? ('<div class="note">Building: ' + esc(f.buildLine) + (f.metric ? (' / Metric: ' + esc(f.metric)) : "") + '</div>') : "") +
      '<div class="fhist">' + hist + '</div>' +
      '<div class="flog"><label>Log a session</label>' +
        '<div class="frow"><input type="number" min="1" max="45" class="wk" value="' + esc(f.week || 1) + '" title="Week">' +
          '<select class="st"><option value="logged">logged</option><option value="held">held</option><option value="missed">missed</option><option value="advanced">advanced</option></select></div>' +
        '<textarea class="nt" maxlength="8000" placeholder="Session notes..."></textarea>' +
        '<input class="hw" maxlength="3000" placeholder="Homework for this week">' +
        '<div class="frow2"><button class="btn primary logBtn" data-fid="' + fid + '">Save session</button>' +
          '<button class="btn ghost hoBtn" data-fid="' + fid + '">Hand off...</button></div>' +
        '<div class="handoff" style="display:none">' +
          '<label>Hand off to another coach</label>' +
          '<input class="toc" maxlength="80" placeholder="Destination coach ID">' +
          '<textarea class="hn" maxlength="4000" placeholder="Why you are handing this founder off..."></textarea>' +
          '<div class="frow2"><button class="btn primary doHoBtn" data-fid="' + fid + '">Confirm handoff</button></div>' +
        '</div>' +
      '</div></div>';
  }

  function findBlock(el){ while(el && el !== document){ if(el.classList && el.classList.contains("fblock")) return el; el = el.parentNode; } return null; }

  function wireCoachDesk(){
    var host = document.getElementById("coachDesk");
    if(!host || host._wired) return; host._wired = true;
    host.addEventListener("click", function(ev){
      var t = ev.target; if(!t || !t.classList) return;
      if(t.classList.contains("logBtn")){ logCoachSession(t); }
      else if(t.classList.contains("hoBtn")){ var b = findBlock(t); if(b){ var h = b.querySelector(".handoff"); if(h){ h.style.display = (h.style.display === "none" ? "block" : "none"); } } }
      else if(t.classList.contains("doHoBtn")){ doHandoff(t); }
    });
  }

  function logCoachSession(btn){
    var b = findBlock(btn); if(!b) return;
    var fid = b.getAttribute("data-fid");
    var wk = b.querySelector(".wk"), st = b.querySelector(".st"), nt = b.querySelector(".nt"), hw = b.querySelector(".hw");
    var notes = nt ? nt.value : "", homework = hw ? hw.value : "";
    if(!notes.trim() && !homework.trim()){ toast("Add notes or homework first."); return; }
    btn.disabled = true; btn.textContent = "Saving...";
    api("logSession", { founderId: fid, week: wk ? wk.value : "", status: st ? st.value : "logged", notes: notes, homework: homework }).then(function(res){
      btn.disabled = false; btn.textContent = "Save session";
      if(res.s !== 200 || !res.j || res.j.error){ toast("Could not save the session."); return; }
      toast("Session logged."); loadCoachDesk();
    }).catch(function(){ btn.disabled = false; btn.textContent = "Save session"; toast("Could not reach the server."); });
  }

  function doHandoff(btn){
    var b = findBlock(btn); if(!b) return;
    var fid = b.getAttribute("data-fid");
    var toc = b.querySelector(".toc"), hn = b.querySelector(".hn");
    var to = toc ? toc.value.trim() : "";
    if(!to){ toast("Enter the destination coach ID first."); return; }
    btn.disabled = true; btn.textContent = "Handing off...";
    api("handoffFounder", { founderId: fid, toCoachId: to, note: hn ? hn.value : "" }).then(function(res){
      btn.disabled = false; btn.textContent = "Confirm handoff";
      if(res.s !== 200 || !res.j || res.j.error){ toast("Handoff failed. Check the coach ID."); return; }
      toast("Founder handed off."); loadCoachDesk();
    }).catch(function(){ btn.disabled = false; btn.textContent = "Confirm handoff"; toast("Could not reach the server."); });
  }

  function render(){
    root().innerHTML =
      '<div class="wrap"><div class="brand"><div class="k">STARKE</div><h1>FO<span>U</span>NDRY</h1></div>'+
      '<div class="sub">Welcome, '+esc((ME.name||"").split(" ")[0])+'. This is your private Foundry.</div>'+
      profileCard()+coachExtra()+inboxCard()+'</div>';
    var sv=document.getElementById("saveBtn"); if(sv) sv.addEventListener("click",function(){ saveProfile(sv); });
    var sn=document.getElementById("sendBtn"); if(sn) sn.addEventListener("click",function(){ sendMsg(sn); });
    if(ME && ME.role === "coach"){ loadCoachDesk(); }
  }

  function saveProfile(btn){
    var lines=[];
    if(ME.role==="coach"){ lines.push("Primary lane: "+val("c_lane")); lines.push("Secondary lanes: "+val("c_lanes2")); lines.push("Bio: "+val("c_bio")); }
    else { lines.push("Build line: "+val("f_build")); lines.push("Metric: "+val("f_metric")); lines.push("Bio: "+val("f_bio")); }
    var body="Profile change request from "+(ME.name||"")+" ("+(ME.email||"")+"): "+lines.join(" / ");
    btn.disabled=true; btn.textContent="Sending...";
    api("memberSend", {subject:"Profile change request", body:body}).then(function(res){
      btn.disabled=false; btn.textContent="Request profile change";
      if(res.s!==200||!res.j||res.j.error){ toast("Could not send your request. Try again."); return; }
      toast("Request sent to Ethan. Profile changes are reviewed and applied within about a week.");
    }).catch(function(){ btn.disabled=false; btn.textContent="Request profile change"; toast("Could not reach the server."); });
  }
  function sendMsg(btn){
    var subj=val("m_subj"), bd=val("m_body");
    if(!bd.trim()){ toast("Write a message first."); return; }
    btn.disabled=true; btn.textContent="Sending...";
    api("memberSend", {subject:subj, body:bd}).then(function(res){
      btn.disabled=false; btn.textContent="Send to Ethan";
      if(res.s!==200||!res.j||res.j.error){ toast("Could not send. Try again."); return; }
      toast("Sent to Ethan.");
      api("memberData").then(function(r2){ if(r2.s===200 && r2.j && !r2.j.error){ ME=r2.j; render(); } });
    }).catch(function(){ btn.disabled=false; btn.textContent="Send to Ethan"; toast("Could not reach the server."); });
  }

  if(document.readyState==="loading"){ document.addEventListener("DOMContentLoaded",function(){ injectStyle(); load(); }); }
  else { injectStyle(); load(); }
})();
