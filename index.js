const fs=require("fs"),path=require("path"),login=require("ws3-fca");
let config=JSON.parse(fs.readFileSync("./config.json","utf8"));

let appState=null;
let statePath="ENV";
const possible=["./appstate.json","./fbstate.json","appstate.json","fbstate.json"];
for(const p of possible){
 if(fs.existsSync(p)){
  try{appState=JSON.parse(fs.readFileSync(p,"utf8"));statePath=p;break;}catch(e){}
 }
}
if(!appState){
 const envNames=["APPSTATE","FBSTATE","appstate","fbstate"];
 for(const name of envNames){
  if(process.env[name]){
   try{appState=JSON.parse(process.env[name]);statePath="ENV:"+name;break;}catch(e){}
  }
 }
}
if(!appState){console.log("Files:",fs.readdirSync("./"));throw new Error("NO APPSTATE FOUND");}

console.log("State:",statePath);

const cmds=new Map();
if(fs.existsSync("./scripts/cmds")){
 fs.readdirSync("./scripts/cmds").forEach(f=>{
  if(f.endsWith(".js")){
   try{
    const c=require(path.join(__dirname,"./scripts/cmds",f));
    if(c.config&&c.config.name)cmds.set(c.config.name.toLowerCase(),c);
   }catch(e){console.log("Skip "+f);}
  }
 });
}

login({appState},(err,api)=>{
 if(err){console.error(err);return;}
 console.log("Emperor Started!");
   // KEEP ALIVE + ANTI CRASH
  require("http").createServer((a,b)=>b.end("Alive")).listen(process.env.PORT||3000);
  process.on("uncaughtException", e=>console.log(e));
  process.on("unhandledRejection", e=>console.log(e));
 api.setOptions({listenEvents:true,selfListen:false});
 api.listen((err,event)=>{
  if(err)return;
  if(event.type!=="message"&&event.type!=="message_reply")return;
  const body=event.body||"";
  const senderID=(event.senderID||"").toString();
    if(config.autoReact){
   try{
    const ownerID=(config.ownerID||"").toString();
    const admins=config.adminIDs||config.admin||[];
    const allAdmins=[ownerID,...admins.map(a=>a.toString())];
    if(allAdmins.includes(senderID)){
     api.setMessageReaction(config.autoReactEmoji||"👑",event.messageID,()=>{},true);
    }
   }catch(e){}
  }
  
  const lockPath=path.join(__dirname,"locked.json");
  let locked=false;
  if(fs.existsSync(lockPath)){
   try{locked=JSON.parse(fs.readFileSync(lockPath,"utf8")).locked;}catch(e){}
  }
    const args=body.slice(config.prefix.length).trim().split(/ +/);
  const cmd=cmds.get(args[0].toLowerCase());

  // MAKE ALL COMMANDS REPLY (PUT HERE - BEFORE CHECKING CMD)
  const origSend = api.sendMessage;
  api.sendMessage = (msg, tid, mid) => origSend.call(api, msg, tid || event.threadID, mid || event.messageID);

  if(!cmd){
   // IF NO "!" = AUTO REPLY LIKE META AI WITH GEMINI
   if(!body.startsWith(config.prefix)){
     try{
       const { GoogleGenerativeAI } = require("@google/generative-ai");
       const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
       const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
       const result = await model.generateContent(`You are Feng, friendly AI. User: ${body}`);
       return api.sendMessage(result.response.text(), event.threadID, event.messageID);
     }catch(e){ return; }
   }
   // IF WRONG COMMAND WITH "!"
   return api.sendMessage({
    body: "ᴛʜᴇ ᴄᴏᴍᴍᴀɴᴅ ʏᴏᴜ ᴀʀᴇ ᴜꜱɪɴɢ ᴅᴏᴇꜱ ɴᴏᴛ ᴇxɪꜱᴛ, ᴛʏᴘᴇ !ʜᴇʟᴘ ᴛᴏ ꜱᴇᴇ ᴀʟʟ ᴀᴠᴀɪʟᴀʙʟᴇ ᴄᴏᴍᴍᴀɴᴅꜱ"
   }, event.threadID, event.messageID);
      }
  const disPath=path.join(__dirname,"disabled.json");
  if(fs.existsSync(disPath)){
   try{
    const data=JSON.parse(fs.readFileSync(disPath,"utf8"));
    const name=args[0].toLowerCase();
    const globalList=data.global||data.disabled||[];
    const threadList=(data.threads&&data.threads[event.threadID])||[];
    if(globalList.includes(name)||threadList.includes(name)){
     return api.sendMessage("Command "+name+" is disabled "+(threadList.includes(name)?"in this group":"globally")+" by owner.",event.threadID);
    }
   }catch(e){}
  }
  if(locked&&cmd.config.name!=="lock"){
   const ownerID=(config.ownerID||"").toString();
   const admins=config.adminIDs||config.admin||[];
   if(senderID!==ownerID&&!admins.includes(senderID)){
    return api.sendMessage("ACCESS DENIED - Bot locked owner only.",event.threadID);
   }
  }
  try{cmd.onStart({api,event,args,config,cmds});}catch(e){console.error(e);}
 });
});
