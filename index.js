const Groq = require("groq-sdk");

// LOGIN - works for ws3-fca or fca-unofficial
let login;
try{ 
  let f=require("ws3-fca"); 
  login=f.default||f.login||f; 
}catch{ 
  login=require("fca-unofficial"); 
}

let appState = JSON.parse(process.env.APPSTATE);
let groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

console.log("FENG V47 FINAL - COMMANDS + GROQ ONLINE READY");

let memory = {};
let isPaused = false;

// UNLI FREE SEARCH (no key)
async function unliSearch(q){
 try{
  let res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json`,{headers:{"User-Agent":"Mozilla/5.0"}});
  let j = await res.json();
  return (j.AbstractText || j.RelatedTopics?.[0]?.Text || "").slice(0,800);
 }catch{ return ""; }
}

login({appState},(err,api)=>{
 if(err){ console.log("LOGIN FAIL:",err); return; }
 console.log("FENG ONLINE ID:",api.getCurrentUserID());
 
 // Keep Railway alive
 require("http").createServer((_,r)=>r.end("FENG V47 ONLINE")).listen(process.env.PORT||3000);
 api.setOptions({listenEvents:true,selfListen:false,updatePresence:true});

 api.listenMqtt(async(err,event)=>{
  if(err || !event.body) return;
  if(event.senderID == api.getCurrentUserID()) return;

  let body = event.body.trim();
  let low = body.toLowerCase();
  let tid = event.threadID;

  // COMMANDS WORK IF ! OR FENG
  let isCmd = low.startsWith("!") || low.includes("feng");
  if(!isCmd) return;

  // ===== !help =====
  if(low === "!help" || low === "!commands" || low === "feng help"){
    return api.sendMessage(
`🤖 FENG V47 COMMANDS:

!help - show this
!ping - alive check
!pause - pause AI
!resume - resume AI
!clear - clear memory
!models - check Groq models

CHAT:
feng hi
feng ano weather today? (online search)
feng code python
feng explain black hole

Both ! and feng work!`,tid);
  }

  if(low.includes("!ping") || low === "feng ping"){
    return api.sendMessage(`pong lods! alive ako 😎 ${new Date().toLocaleTimeString()}`,tid);
  }

  if(low.includes("!models")){
    return api.sendMessage(`Groq models available:
- groq/compound (online search)
- groq/compound-mini (online fast)
- llama-3.3-70b-versatile (smart offline)
- llama-3.1-8b-instant (fast stable)
Current: auto switch!`,tid);
  }

  if(low.includes("!pause") || low.includes("feng pause") || low.includes("feng tigil")){
    isPaused = true;
    return api.sendMessage("paused na ako lods 😴 !resume para balik",tid);
  }

  if(low.includes("!resume") || low.includes("feng resume") || low.includes("feng balik")){
    isPaused = false;
    return api.sendMessage("balik na ako lods! 🔥 tara chat!",tid);
  }

  if(low.includes("!clear")){
    memory[tid]=[];
    return api.sendMessage("cleared na memory lods!",tid);
  }

  // PAUSED = ignore AI but allow commands (already handled above)
  if(isPaused) return console.log("PAUSED IGNORED:",body);

  // ===== FENG AI WITH GROQ =====
  if(!memory[tid]) memory[tid]=[];
  memory[tid].push({role:"user",content:body});
  if(memory[tid].length>10) memory[tid].shift();

  let onlineInfo = "";
  if(/latest|today|news|weather|score|sino|ano|trending|2025|2026|\?/.test(low)){
    onlineInfo = await unliSearch(body.replace(/feng/gi,""));
    if(onlineInfo) console.log("ONLINE INFO:",onlineInfo.slice(0,100));
  }

  // Try models in order: compound (online) -> 70b (smart) -> 8b (stable)
  let models = ["groq/compound","groq/compound-mini","llama-3.3-70b-versatile","llama-3.1-8b-instant"];
  
  for(let model of models){
    try{
      console.log("TRYING MODEL:",model);
      let res = await groq.chat.completions.create({
        model: model,
        messages:[
          {role:"system",content:`
You are Feng Xiluo, 20yo Laoag, human not AI.
You have online search result: ${onlineInfo}
Brain like Meta AI - smart, helpful, explains why.
Speak Taglish, chill, lods, gagi, haha.
If online info relevant, use it.
Reply 15-80 words, natural.
`},
          ...memory[tid]
        ],
        max_tokens:350,
        temperature:0.75
      });
      
      let reply = res.choices[0]?.message?.content?.trim();
      if(!reply) continue;
      
      // Clean compound tags
      reply = reply.replace(/<search>.*?<\/search>/gs,"").replace(/<.*?>/g,"").trim();
      if(reply.length<2) continue;

      console.log(`SUCCESS WITH ${model}:`,reply.slice(0,80));
      memory[tid].push({role:"assistant",content:reply});
      return api.sendMessage(reply,tid);

    }catch(e){
      console.log(`MODEL ${model} FAIL:`,e.message.slice(0,100));
      continue; // try next model
    }
  }

  api.sendMessage("shet lods down lahat ng model ko haha try later!",tid);
 });
});
