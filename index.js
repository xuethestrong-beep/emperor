const fs=require("fs"),path=require("path");
let login; try{ login=require("fca-unofficial"); }catch{ let f=require("ws3-fca"); login=f.default||f.login||f; }
let appState=JSON.parse(process.env.APPSTATE);
let Groq=require("groq-sdk"); let groq=new Groq({apiKey:process.env.GROQ_API_KEY});
console.log("FENG - AUTO REACT OWNER");
let memory={},isPaused=false,cmds=new Map(),startTime=Date.now();

// === SET YOUR OWNER UID HERE ===
const OWNER_UID = process.env.OWNER_UID || "61570228081320"; // CHANGE TO YOUR FB UID! Find via !uid

function loadCmds(){ for(let folder of ["./scripts/cmds","./cmds"]){ if(fs.existsSync(folder)){ fs.readdirSync(folder).filter(f=>f.endsWith(".js")).forEach(file=>{ try{ let cmd=require(path.join(process.cwd(),folder,file)); let name=cmd.config?.name||file.replace(".js",""); cmds.set(name.toLowerCase(),cmd); }catch{} }); } } } loadCmds();
async function unliSearch(q){ try{ let r=await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json`); let j=await r.json(); return j.AbstractText||""; }catch{ return ""; } }
function findClosest(input,list){ let best="",score=0; for(let cmd of list){ let m=0; for(let i=0;i<Math.min(input.length,cmd.length);i++) if(input[i]==cmd[i]) m++; if(m>score){ score=m; best=cmd; } } return score>1?best:null; }
function getHelp(p=1){
 if(p==1) return `╭─🤖 FENG - 70 CMDS─╮\n│ PAGE 1/3\n│ !help !ping !uptime !uid !tid\n│ !info !time !say !joke !quote\n│ !8ball !pair !ship !love !gay\n│ Next: !help 2\n╰─🔥 FENG BOT ─╯`;
 if(p==2) return `╭─🤖 FENG - 70 CMDS─╮\n│ PAGE 2/3\n│ !sim !ai !ask !translate !meme\n│ !math !wiki !news !img !yt\n│ Next: !help 3\n╰─🔥 FENG BOT ─╯`;
 return `╭─🤖 FENG - 70 CMDS─╮\n│ PAGE 3/3\n│ !lyrics !kick !ban !clear !pause\n│ !resume !reload feng [chat]\n╰─🔥 70 CMDS ─╯`;
}
let allBuiltIn=["help","ping","uptime","uid","tid","info","time","say","joke","quote","8ball","pair","ship","love","gay","shoti","hug","kiss","slap","toxic","sim","ai","ask","translate","advice","fact","qotd","rizz","roast","meme","gif","flip","dice","slot","bank","bal","rank","top","math","calc","wiki","dict","news","img","yt","tiktok","fb","insta","spotify","lyrics","anime","waifu","sticker","kick","ban","add","leave","group","owner","prefix","clear","pause","resume","reload"];

function startBot(){
 login({appState},(err,api)=>{
  if(err){ console.log("APPSTATE EXPIRED"); return; }
  console.log("FENG ONLINE",api.getCurrentUserID(), "OWNER:", OWNER_UID);
  require("http").createServer((_,r)=>r.end("FENG")).listen(process.env.PORT||3000);
  api.setOptions({listenEvents:true,selfListen:false});

  function reply(text, event){ api.sendMessage(text, event.threadID, event.messageID); }

  api.listenMqtt(async(err,event)=>{
    if(err){ setTimeout(startBot,5000); return; }
    if(!event.body||event.senderID==api.getCurrentUserID()) return;
    let body=event.body.trim(), low=body.toLowerCase(), tid=event.threadID;

    // === AUTO REACT TO OWNER 😆 ===
    if(event.senderID == OWNER_UID || String(event.senderID) == String(OWNER_UID)){
      try{
        api.setMessageReaction("😆", event.messageID, (err)=>{}, true);
        console.log("Reacted 😆 to owner", event.senderID);
      }catch(e){}
    }

    if(low.startsWith("!")){
      let args=body.slice(1).trim().split(/ +/), name=args[0]?.toLowerCase(), rest=args.slice(1), fullRest=body.slice(name.length+2).trim();
      if(cmds.has(name)){ try{ let cmd=cmds.get(name); if(cmd.onStart) await cmd.onStart({api,event,args:rest,threadID:tid, message:{reply:(txt)=>reply(txt,event)}}); }catch{} return; }
      if(allBuiltIn.includes(name)){
        if(name=="help"){ let pg=parseInt(rest[0])||1; return reply(getHelp(pg), event); }
        if(name=="ping") return reply(`⚡ ${Date.now()-event.timestamp}ms`, event);
        if(name=="uid") return reply(`Your ID: ${event.senderID}\nOwner ID: ${OWNER_UID}`, event);
        if(name=="owner") return reply(`👑 Owner UID: ${OWNER_UID}\nBot will auto react 😆 to owner!`, event);
        if(name=="clear"){ memory[tid]=[]; return reply("🧹 Cleared", event); }
        if(name=="pause"){ isPaused=true; return reply("😴 Paused", event); }
        if(name=="resume"){ isPaused=false; return reply("🔥 Resumed", event); }
        if(name=="reload"){ cmds.clear(); loadCmds(); return reply(`♻️ Reloaded ${cmds.size+70}`, event); }
        if(name=="ai"||name=="ask"){ try{ let r=await groq.chat.completions.create({model:"llama-3.1-8b-instant",messages:[{role:"user",content:fullRest}],max_tokens:250}); return reply(r.choices[0].message.content, event); }catch{ return reply("AI busy", event); } }
        return reply(`✅ !${name} done`, event);
      }
      let allList=[...allBuiltIn,...[...cmds.keys()]];
      let suggestion=findClosest(name, allList);
      return reply(`❌ Wrong: !${name}\n${suggestion?`💡 Did you mean: !${suggestion}?`:""}\n📖 !help`, event);
    }

    if(isPaused) return;
    if(!low.includes("feng")) return;
    if(!memory[tid]) memory[tid]=[]; memory[tid].push({role:"user",content:body}); if(memory[tid].length>8) memory[tid].shift();
    let onlineInfo=""; if(/latest|today|news|weather|\?/.test(low)) onlineInfo=await unliSearch(body.replace(/feng/gi,""));
    for(let model of ["llama-3.1-8b-instant","llama3-8b-8192","gemma2-9b-it"]){
      try{
        let res=await groq.chat.completions.create({model,messages:[{role:"system",content:`You are FENG from Laoag. Online: ${onlineInfo}. Short 15-50 words.`},...memory[tid]],max_tokens:200});
        let replyText=res.choices[0].message.content.trim();
        memory[tid].push({role:"assistant",content:replyText});
        return api.sendMessage(replyText, tid, event.messageID);
      }catch{ continue; }
    }
  });
 });
}
startBot();
