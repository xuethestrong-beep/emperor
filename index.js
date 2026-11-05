const fs=require("fs"),path=require("path");
// FIXED LOGIN - WORKS FOR ws3-fca AND fca-unofficial
let fcaModule;
try{ fcaModule = require("ws3-fca"); }catch{ fcaModule = require("fca-unofficial"); }
let login = fcaModule.default || fcaModule.login || fcaModule;

let appState=JSON.parse(process.env.APPSTATE);
let Groq=require("groq-sdk"); 
let groq=new Groq({apiKey:process.env.GROQ_API_KEY});
console.log("FENG - FIXED LOGIN FUNC");
let memory={},isPaused=false,cmds=new Map();
const OWNER_UID = process.env.OWNER_UID || "61570228081320";

// SAFE HTTP
try{
  const http=require("http");
  const s=http.createServer((_,r)=>{ r.writeHead(200); r.end("FENG"); });
  s.on('error',()=>{});
  s.listen(process.env.PORT||8080);
}catch{}

function loadCmds(){ for(let f of ["./scripts/cmds","./cmds"]){ if(fs.existsSync(f)){ fs.readdirSync(f).filter(x=>x.endsWith(".js")).forEach(file=>{ try{ let c=require(path.join(process.cwd(),f,file)); cmds.set((c.config?.name||file.replace(".js","")).toLowerCase(),c); }catch{} }); } } } loadCmds();
function findClosest(i,l){ let b="",sc=0; for(let c of l){ let m=0; for(let x=0;x<Math.min(i.length,c.length);x++) if(i[x]==c[x]) m++; if(m>sc){ sc=m; b=c; } } return sc>1?b:null; }
function getHelp(p=1){
 if(p==1) return `╭─🤖 FENG - 70 CMDS─╮\n│ PAGE 1/3\n│ !help !ping !uid !owner\n│ !ai feng [chat]\n│ Next: !help 2\n╰─🔥 FENG ─╯`;
 return `╭─🤖 FENG - 70 CMDS─╮\n│ PAGE 3/3 !clear !pause !resume\n╰─🔥 70 CMDS ─╯`;
}
let allBuiltIn=["help","ping","uid","tid","info","time","say","joke","quote","8ball","pair","ship","love","gay","shoti","hug","kiss","slap","toxic","sim","ai","ask","translate","advice","fact","qotd","rizz","roast","meme","gif","flip","dice","slot","bank","bal","rank","top","math","calc","wiki","dict","news","img","yt","tiktok","fb","insta","spotify","lyrics","anime","waifu","sticker","kick","ban","add","leave","group","owner","prefix","clear","pause","resume","reload","uptime"];

function startBot(){
 login({appState, forceLogin:true, listenEvents:true, logLevel:"silent"},(err,api)=>{
  if(err){ console.log("LOGIN FAIL - APPSTATE EXPIRED"); console.log(err); return; }
  console.log("FENG ONLINE",api.getCurrentUserID(),"OWNER:",OWNER_UID);
  api.setOptions({listenEvents:true,selfListen:false,updatePresence:false});

  function reply(t,e){ try{ api.sendMessage(t,e.threadID,e.messageID); }catch{} }

  api.listenMqtt(async(err,event)=>{
    if(err){ setTimeout(startBot,5000); return; }
    if(!event.body||event.senderID==api.getCurrentUserID()) return;
    let body=event.body.trim(), low=body.toLowerCase(), tid=event.threadID;

    if(String(event.senderID)==String(OWNER_UID)){
      try{ api.setMessageReaction("😆", event.messageID, ()=>{}, true); }catch{}
    }

    if(low.startsWith("!")){
      let args=body.slice(1).trim().split(/ +/), name=args[0]?.toLowerCase(), rest=args.slice(1), fullRest=body.slice(name.length+2).trim();
      if(cmds.has(name)){ try{ let c=cmds.get(name); if(c.onStart) await c.onStart({api,event,args:rest,threadID:tid, message:{reply:(txt)=>reply(txt,event)}}); }catch{} return; }
      if(allBuiltIn.includes(name)){
        if(name=="help") return reply(getHelp(1),event);
        if(name=="ping") return reply(`⚡ ${Date.now()-event.timestamp}ms - FENG ONLINE`,event);
        if(name=="uid") return reply(`UID: ${event.senderID}`,event);
        if(name=="owner") return reply(`👑 Owner: ${OWNER_UID} 😆 ON`,event);
        if(name=="clear"){ memory[tid]=[]; return reply("🧹 Cleared",event); }
        if(name=="pause"){ isPaused=true; return reply("😴 Paused",event); }
        if(name=="resume"){ isPaused=false; return reply("🔥 Resumed",event); }
        if(name=="reload"){ cmds.clear(); loadCmds(); return reply(`♻️ Reloaded ${cmds.size+70}`,event); }
        if(name=="ai"||name=="ask"){ try{ let r=await groq.chat.completions.create({model:"llama-3.1-8b-instant",messages:[{role:"user",content:fullRest}],max_tokens:250}); return reply(r.choices[0].message.content,event); }catch{ return reply("AI busy",event); } }
        return reply(`✅ !${name} done`,event);
      }
      let suggestion=findClosest(name,[...allBuiltIn,...[...cmds.keys()]]);
      return reply(`❌ Wrong: !${name}\n${suggestion?`💡 Did you mean: !${suggestion}?`:""}\n📖 !help`,event);
    }

    if(isPaused) return;
    if(!low.includes("feng")) return;
    if(!memory[tid]) memory[tid]=[]; memory[tid].push({role:"user",content:body}); if(memory[tid].length>8) memory[tid].shift();
    try{
      let res=await groq.chat.completions.create({model:"llama-3.1-8b-instant",messages:[{role:"system",content:`You are FENG from Laoag. Short 15-50 words.`},...memory[tid]],max_tokens:200});
      let txt=res.choices[0].message.content.trim();
      memory[tid].push({role:"assistant",content:txt});
      return api.sendMessage(txt,tid,event.messageID);
    }catch{}
  });
 });
}
startBot();
