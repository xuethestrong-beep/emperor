const fs=require("fs"),path=require("path");
let m; try{m=require("ws3-fca");}catch{m=require("fca-unofficial");}
let login=m.default||m.login||m;
let appState=JSON.parse(process.env.APPSTATE);
console.log("FENG FIXED VERSION");
const OWNER=process.env.OWNER_UID||"61570228081320";

try{
 let http=require("http");
 let s=http.createServer((_,r)=>{r.end("FENG");});
 s.on("error",()=>{});
 s.listen(process.env.PORT||8080);
}catch{}

let cmds=new Map();
function loadCmds(){
 cmds.clear();
 if(fs.existsSync("./scripts/cmds")){
  fs.readdirSync("./scripts/cmds").filter(f=>f.endsWith(".js")).forEach(file=>{
   try{
    delete require.cache[require.resolve(path.join(process.cwd(),"scripts/cmds",file))];
    let cmd=require(path.join(process.cwd(),"scripts/cmds",file));
    let name=(cmd.config?.name||file.replace(".js","")).toLowerCase();
    cmds.set(name,cmd);
    console.log(`✅ Loaded ${name}`);
   }catch(e){console.log(`❌ ${file}: ${e.message}`);}
  });
 }
}
loadCmds();

function startBot(){
 login({appState,forceLogin:true,listenEvents:true,logLevel:"silent"},(err,api)=>{
  if(err){console.log("APPSTATE EXPIRED");return;}
  console.log(`FENG ONLINE ${api.getCurrentUserID()} - ${cmds.size} CMDS`);
  api.setOptions({listenEvents:true,selfListen:false,updatePresence:false});

  api.listenMqtt(async(e,event)=>{
   try{
    if(e){return;}
    if(!event.body||event.senderID==api.getCurrentUserID()) return;
    let body=event.body.trim();
    let tid=event.threadID;
    if(!body.startsWith("!")) return;
    let args=body.slice(1).split(/ +/);
    let name=args[0].toLowerCase();
    let restArgs=args.slice(1);
    if(!cmds.has(name)) return;

    let cmd=cmds.get(name);
    let message={reply:(t,cb)=>api.sendMessage(t,tid,event.messageID,cb), send:(t,cb)=>api.sendMessage(t,tid,cb)};
    
    // FIXED OBJECT - No typing indicator bug
    let obj={
      api, event, args:restArgs, message,
      threadsData:{get:async()=>({}),set:async()=>{}},
      usersData:{get:async()=>({}),set:async()=>{}},
      role:String(event.senderID)==String(OWNER)?2:0,
      prefix:"!", ownerID:OWNER, botID:api.getCurrentUserID(),
      getLang:(t)=>t
    };
    
    if(cmd.onStart) await cmd.onStart(obj);
    else if(cmd.run) await cmd.run(obj);
    console.log(`✅ Ran !${name}`);
   }catch(err){
    console.log(`ERR ${err.message}`);
   }
  });
 });
}
startBot();
