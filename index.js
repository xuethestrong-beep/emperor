const fs=require("fs"),path=require("path");
let m; try{m=require("ws3-fca");}catch{m=require("fca-unofficial");}
let login=m.default||m.login||m;
let appState=JSON.parse(process.env.APPSTATE);
let Groq=require("groq-sdk");
let groq=new Groq({apiKey:process.env.GROQ_API_KEY});
console.log("FENG - META AI MODE");
const OWNER=process.env.OWNER_UID||"61570228081320";

try{
 let http=require("http");
 let s=http.createServer((_,r)=>{r.end("FENG META AI");});
 s.on("error",()=>{});
 s.listen(process.env.PORT||8080);
}catch{}

let cmds=new Map();
let memory={};
function loadCmds(){
 cmds.clear();
 let folders=["./scripts/cmds","./cmds"];
 for(let folder of folders){
  if(fs.existsSync(folder)){
   fs.readdirSync(folder).filter(f=>f.endsWith(".js")).forEach(file=>{
    try{
     delete require.cache[require.resolve(path.join(process.cwd(),folder,file))];
     let cmd=require(path.join(process.cwd(),folder,file));
     let name=(cmd.config?.name||file.replace(".js","")).toLowerCase();
     cmds.set(name,cmd);
     console.log(`✅ Loaded ${name}`);
    }catch(e){console.log(`❌ ${file}`);}
   });
  }
 }
}
loadCmds();

function startBot(){
 login({appState,forceLogin:true,listenEvents:true,logLevel:"silent"},(err,api)=>{
  if(err){console.log("APPSTATE EXPIRED");return;}
  let botID=api.getCurrentUserID();
  console.log(`FENG ONLINE ${botID} - META AI MODE`);
  api.setOptions({listenEvents:true,selfListen:false,updatePresence:false});

  api.listenMqtt(async(e,event)=>{
   if(e){setTimeout(startBot,5000);return;}
   if(!event.body||event.senderID==botID) return;
   let body=event.body.trim();
   let tid=event.threadID;
   let low=body.toLowerCase();

   // === YOUR CUSTOM CMDS STILL WORK WITH ! ===
   if(body.startsWith("!")){
    let args=body.slice(1).split(/ +/);
    let name=args[0].toLowerCase();
    let restArgs=args.slice(1);
    if(cmds.has(name)){
     try{
      let cmd=cmds.get(name);
      let message={reply:(t)=>api.sendMessage(t,tid,event.messageID)};
      await cmd.onStart({api,event,args:restArgs,message,threadID:tid,prefix:"!",ownerID:OWNER});
      return;
     }catch(err){console.log(`ERR ${name}: ${err.message}`);}
    }
   }

   // === META AI / CHATGPT MODE ===
   // Triggers when: says "feng" OR replies to bot OR mentions bot
   let isTriggered = low.includes("feng") || 
                     event.messageReply?.senderID==botID ||
                     low.startsWith("ai ") ||
                     low.startsWith("bot ");

   if(!isTriggered) return;

   // Clean prompt
   let prompt = body.replace(/feng/gi,"").replace(/@feng/gi,"").trim();
   if(!prompt) prompt = "hi";

   if(!memory[tid]) memory[tid]=[];
   memory[tid].push({role:"user", content: prompt});
   if(memory[tid].length>10) memory[tid].shift();

   api.sendTypingIndicator(tid);
   
   try{
    let res=await groq.chat.completions.create({
     model:"llama-3.1-8b-instant",
     messages:[
      {role:"system", content:"You are FENG from Laoag City, Ilocos. You are friendly, funny, Taglish, short 20-60 words, like Meta AI. Owner is Boss Feng. Never say you are Meta AI. Time is Asia/Manila."},
      ...memory[tid]
     ],
     max_tokens:300,
     temperature:0.8
    });
    let answer=res.choices[0].message.content.trim();
    memory[tid].push({role:"assistant", content: answer});
    api.sendMessage(answer, tid, event.messageID);
   }catch(err){
    console.log("GROQ ERR:", err.message);
    if(err.message.includes("API_KEY")){
     api.sendMessage("❌ Add GROQ_API_KEY in Railway Variables! Get at console.groq.com", tid, event.messageID);
    }
   }
  });
 });
}
startBot();
