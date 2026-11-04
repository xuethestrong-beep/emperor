const fs=require("fs"),path=require("path"),login=require("ws3-fca");
let config=JSON.parse(fs.readFileSync("./config.json","utf8"));

let appState=null;
let statePath="ENV VARIABLE";

// 1. Try files first
const possible=["./appstate.json","./fbstate.json","./appstate.txt","./fbstate.txt","fbstate.json","appstate.json"];
for(const p of possible){
 if(fs.existsSync(p)){
  try{
   appState=JSON.parse(fs.readFileSync(p,"utf8"));
   statePath=p;
   break;
  }catch(e){}
 }
}

// 2. Try Railway ENV Variables if no file
if(!appState){
 const envNames=["APPSTATE","FBSTATE","appstate","fbstate","APPSTATE_JSON","FBSTATE_JSON"];
 for(const name of envNames){
  if(process.env[name]){
   try{
    appState=JSON.parse(process.env[name]);
    statePath="ENV:"+name;
    console.log("Found appstate in ENV:",name);
    break;
   }catch(e){
    try{
     // Try base64 or double parse
     appState=JSON.parse(Buffer.from(process.env[name],"base64").toString());
     statePath="ENV:"+name+"(base64)";
     break;
    }catch(e2){}
   }
  }
 }
}

if(!appState){
 console.log("Root files:",fs.readdirSync("./"));
 if(fs.existsSync("/app"))console.log("/app files:",fs.readdirSync("/app"));
 throw new Error("NO APPSTATE FOUND! Add variable APPSTATE in Railway > Variables");
}

console.log("State source:",statePath);

const cmds=new Map();
if(fs.existsSync("./scripts/cmds")){
 fs.readdirSync("./scripts/cmds").forEach(f=>{
  if(f.endsWith(".js")){
   try{
    const c=require(path.join(__dirname,"./scripts/cmds",f));
    if(c.config&&c.config.name)cmds.set(c.config.name.toLowerCase(),c);
   }catch(e){console.log("Skip "+f+": "+e.message)}
  }
 });
}

login({appState},(err,api)=>{
 if(err)return console.error("LOGIN FAIL:",err);
 console.log("Emperor Started! 👑");
 api.setOptions({listenEvents:true,selfListen:false});
 api.listen(async(err,event)=>{
  if(err)return;
  if(event.type!=="message"&&event.type!=="message_reply")return;
  const body=event.body||"";
  const senderID=(event.senderID||"").toString();
  if(config.autoReact){
   try{
    const ownerID=(config.ownerID||"61593117279214").toString();
    if(senderID===ownerID)api.setMessageReaction(config.autoReactEmoji||"👑",event.messageID,()=>{},true);
   }catch(e){}
  }
  if(!body.startsWith(config.prefix))return;
  const lockPath=path.join(__dirname,"locked.json");
  let locked=false;
  if(fs.existsSync(lockPath)){
   try{locked=JSON.parse(fs.readFileSync(lockPath,"utf8")).locked;}catch(e){}
  }
  const args=body.slice(config.prefix.length).trim().split(/ +/);
  const cmd=cmds.get(args[0].toLowerCase());
  if(!cmd)return;
    // DISABLE CHECK
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
  if(locked&&cmd.config.name!=="lock"){
   const ownerID=(config.ownerID||"").toString();
   const admins=config.adminIDs||config.admin||[];
   if(senderID!==ownerID&&!admins.includes(senderID)){
    return api.sendMessage("ACCESS DENIED - Bot locked owner only.",event.threadID);
   }
  }
  try{await cmd.onStart({api,event,args,config,cmds});}catch(e){console.error(e)}
 });
});
