const fs=require("fs");
let m; try{m=require("ws3-fca");}catch{m=require("fca-unofficial");}
let login=m.default||m.login||m;
let appState=JSON.parse(process.env.APPSTATE);
let Groq=require("groq-sdk");
let groq=new Groq({apiKey:process.env.GROQ_API_KEY});
let memory={},isPaused=false;
const OWNER=process.env.OWNER_UID||"61570228081320";
console.log("FENG REAL");

// HTTP SAFE
try{
 let http=require("http");
 let s=http.createServer((_,r)=>{r.end("FENG");});
 s.on("error",()=>{});
 s.listen(process.env.PORT||8080);
}catch{}

function getHelp(){
 return `FENG BOT 70 CMDS:
!help !ping !uid !tid !info !time !say
!joke !quote !fact !advice !qotd !rizz !roast !toxic
!8ball !gay !love !pair !ship
!kiss !hug !slap
!flip !dice !slot !math
!sim !ai !ask
!meme !bank !bal !rank !top
!wiki !owner !clear !pause !resume
Chat: feng hi`;
}

let jokes=["Why chicken cross road? To other side!","I'm so good at sleeping I can do it with eyes closed!","Why don't scientists trust atoms? They make up everything!"];
let quotes=["Be yourself, everyone else is taken","Life is what happens when busy making plans"];
let facts=["Octopus has 3 hearts","Honey never spoils","Bananas are berries"];
let roasts=["You are not dumb, you have bad luck thinking","I'd agree but then we'd both be wrong"];

function R(a){return a[Math.floor(Math.random()*a.length)];}

function startBot(){
 login({appState,forceLogin:true,listenEvents:true,logLevel:"silent"},(err,api)=>{
  if(err){console.log("APPSTATE EXPIRED");console.log(err);return;}
  console.log("FENG ONLINE",api.getCurrentUserID());
  api.setOptions({listenEvents:true,selfListen:false,updatePresence:false});
  
  api.listenMqtt(async(e,event)=>{
   if(e){setTimeout(startBot,5000);return;}
   if(!event.body||event.senderID==api.getCurrentUserID()) return;
   let body=event.body.trim();
   let low=body.toLowerCase();
   let tid=event.threadID;

   if(String(event.senderID)==String(OWNER)){
    try{api.setMessageReaction("😆",event.messageID,()=>{},true);}catch{}
   }

   if(low.startsWith("!")){
    let args=body.slice(1).split(/ +/);
    let name=args[0].toLowerCase();
    let rest=body.slice(name.length+1).trim();
    
    if(name=="help") return api.sendMessage(getHelp(),tid,event.messageID);
    if(name=="ping") return api.sendMessage(`⚡ ${Date.now()-event.timestamp}ms FENG ONLINE`,tid,event.messageID);
    if(name=="uid") return api.sendMessage(`UID: ${event.senderID} Thread: ${tid}`,tid,event.messageID);
    if(name=="tid") return api.sendMessage(`Thread: ${tid}`,tid,event.messageID);
    if(name=="owner") return api.sendMessage(`👑 Owner: ${OWNER} 😆 ON\nBot: ${api.getCurrentUserID()}`,tid,event.messageID);
    if(name=="info") return api.sendMessage(`🤖 FENG BOT\nOwner: ${OWNER}\n70 cmds\nPrefix: !`,tid,event.messageID);
    if(name=="time") return api.sendMessage(`⏰ ${new Date().toLocaleString("en-PH",{timeZone:"Asia/Manila"})}`,tid,event.messageID);
    if(name=="say") return api.sendMessage(rest||"Say what? !say hi",tid,event.messageID);
    if(name=="joke") return api.sendMessage(`😂 ${R(jokes)}`,tid,event.messageID);
    if(name=="quote") return api.sendMessage(`💭 "${R(quotes)}"`,tid,event.messageID);
    if(name=="fact") return api.sendMessage(`🧠 ${R(facts)}`,tid,event.messageID);
    if(name=="advice") return api.sendMessage(`💡 Drink water, take break, keep going!`,tid,event.messageID);
    if(name=="rizz") return api.sendMessage(`😏 Rizz: ${Math.floor(Math.random()*100)}%`,tid,event.messageID);
    if(name=="roast"||name=="toxic") return api.sendMessage(`🔥 ${R(roasts)}`,tid,event.messageID);
    if(name=="8ball"){
     let a=["Yes!","No","Maybe","Definitely","Never","Ask again","100%"];
     return api.sendMessage(`🎱 ${rest||"?"} -> ${R(a)}`,tid,event.messageID);
    }
    if(name=="gay"){
     let p=Math.floor(Math.random()*101);
     let n=Object.values(event.mentions||{})[0]||"You";
     return api.sendMessage(`🌈 Gay Check: ${n} is ${p}% gay! ${p>50?"Slay!":"Straight 😆"}`,tid,event.messageID);
    }
    if(name=="love"){
     let p=Math.floor(Math.random()*101);
     let n=Object.values(event.mentions||{})[0]||"You";
     return api.sendMessage(`❤️ Love meter ${n}: ${p}%`,tid,event.messageID);
    }
    if(name=="ship"||name=="pair"){
     let ments=Object.values(event.mentions||{});
     let txt=ments.length>=2?`${ments[0]} + ${ments[1]}`:ments[0]?`${ments[0]} + You`:"You + Someone";
     let p=Math.floor(Math.random()*101);
     return api.sendMessage(`💞 Ship: ${txt} = ${p}% ${p>80?"Perfect!":p>50?"Good":"Bruh 😆"}`,tid,event.messageID);
    }
    if(name=="kiss"){
     let n=Object.values(event.mentions||{})[0]||"someone";
     return api.sendMessage(`💋 You kissed ${n}! Mwah! 😘`,tid,event.messageID);
    }
    if(name=="hug"){
     let n=Object.values(event.mentions||{})[0]||"someone";
     return api.sendMessage(`🤗 You hugged ${n}! So sweet!`,tid,event.messageID);
    }
    if(name=="slap"){
     let n=Object.values(event.mentions||{})[0]||"someone";
     return api.sendMessage(`👋 You slapped ${n}! Ouch! 😆`,tid,event.messageID);
    }
    if(name=="flip") return api.sendMessage(`🪙 ${Math.random()>0.5?"Heads!":"Tails!"}`,tid,event.messageID);
    if(name=="dice") return api.sendMessage(`🎲 Rolled: ${Math.floor(Math.random()*6)+1}`,tid,event.messageID);
    if(name=="slot"){
     let em=["🍒","🍋","🔔","💎","7️⃣"];
     let s=[R(em),R(em),R(em)];
     let win=s[0]==s[1]&&s[1]==s[2]?"JACKPOT!":"Try again!";
     return api.sendMessage(`🎰 [ ${s.join(" | ")} ]\n${win}`,tid,event.messageID);
    }
    if(name=="math"||name=="calc"){
     try{let res=eval(rest);return api.sendMessage(`🧮 ${rest} = ${res}`,tid,event.messageID);}catch{return api.sendMessage(`❌ Use: !math 2+2`,tid,event.messageID);}
    }
    if(name=="ai"||name=="ask"){
     try{
      let r=await groq.chat.completions.create({model:"llama-3.1-8b-instant",messages:[{role:"user",content:rest||"hi"}],max_tokens:300});
      return api.sendMessage(r.choices[0].message.content,tid,event.messageID);
     }catch{return api.sendMessage("AI busy",tid,event.messageID);}
    }
    if(name=="sim"){
     try{
      let f=await fetch(`https://api.simsimi.net/v2/?text=${encodeURIComponent(rest)}&lc=en`);
      let j=await f.json();
      return api.sendMessage(j.success||"Sim busy",tid,event.messageID);
     }catch{return api.sendMessage("Sim busy",tid,event.messageID);}
    }
    if(name=="clear"){memory[tid]=[];return api.sendMessage("🧹 Cleared!",tid,event.messageID);}
    if(name=="pause"){isPaused=true;return api.sendMessage("😴 Paused, !resume to wake",tid,event.messageID);}
    if(name=="resume"){isPaused=false;return api.sendMessage("🔥 FENG back!",tid,event.messageID);}
    if(name=="bank"||name=="bal") return api.sendMessage(`🏦 Balance: $${Math.floor(Math.random()*1000)}`,tid,event.messageID);
    return api.sendMessage(`❌ Unknown !${name}\nTry !help`,tid,event.messageID);
   }

   if(isPaused) return;
   if(!low.includes("feng")) return;
   if(!memory[tid]) memory[tid]=[];
   memory[tid].push({role:"user",content:body});
   if(memory[tid].length>8) memory[tid].shift();
   try{
    let r=await groq.chat.completions.create({model:"llama-3.1-8b-instant",messages:[{role:"system",content:"You are FENG from Laoag, friendly funny, 20-60 words."},...memory[tid]],max_tokens:200});
    let txt=r.choices[0].message.content.trim();
    memory[tid].push({role:"assistant",content:txt});
    api.sendMessage(txt,tid,event.messageID);
   }catch{}
  });
 });
}
startBot();
