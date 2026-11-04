const fs=require("fs"),path=require("path"),login=require("ws3-fca");
let config=JSON.parse(fs.readFileSync("./config.json","utf8"));
let statePath="./appstate.json";
if(fs.existsSync("./fbstate.json"))statePath="./fbstate.json";
console.log("State:",statePath);
const cmds=new Map();
fs.readdirSync("./scripts/cmds").forEach(f=>{
 if(f.endsWith(".js")){
  try{
   const c=require(path.join(__dirname,"./scripts/cmds",f));
   if(c.config&&c.config.name)cmds.set(c.config.name.toLowerCase(),c);
  }catch(e){console.log("Skip "+f)}
 }
});
let appState=JSON.parse(fs.readFileSync(statePath,"utf8"));
login({appState},(err,api)=>{
 if(err)return console.error(err);
 console.log("Emperor Started!");
 api.setOptions({listenEvents:true,selfListen:false});
 api.listen(async(err,event)=>{
  if(err)return;
  if(event.type!=="message"&&event.type!=="message_reply")return;
  const body=event.body||"";
  const senderID=(event.senderID||"").toString();
  if(config.autoReact){
   try{
    const ownerID=(config.ownerID||"61593117279214").toString();
    if(senderID===ownerID){
     api.setMessageReaction(config.autoReactEmoji||"👑",event.messageID,()=>{},true);
    }
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
  if(locked&&cmd.config.name!=="lock"){
   const ownerID=(config.ownerID||"").toString();
   const admins=config.adminIDs||config.admin||[];
   if(senderID!==ownerID&&!admins.includes(senderID)){
    return api.sendMessage("ACCESS DENIED - Bot is locked for owner only.",event.threadID);
   }
  }
  try{await cmd.onStart({api,event,args,config,cmds});}catch(e){console.error(e)}
 });
});
