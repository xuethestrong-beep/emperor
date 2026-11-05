const fs=require("fs"),path=require("path");
let m; try{m=require("ws3-fca");}catch{m=require("fca-unofficial");}
let login=m.default||m.login||m;
let appState=JSON.parse(process.env.APPSTATE);
console.log("FENG - PURE CUSTOM ONLY");
const OWNER=process.env.OWNER_UID||"61570228081320";

try{
 let http=require("http");
 let s=http.createServer((_,r)=>{r.end("FENG PURE CUSTOM");});
 s.on("error",()=>{});
 s.listen(process.env.PORT||8080);
}catch{}

let cmds=new Map();
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
    }catch(e){console.log(`❌ ${file} ${e.message}`);}
   });
  }
 }
}
loadCmds();

function startBot(){
 login({appState,forceLogin:true,listenEvents:true,logLevel:"silent"},(err,api)=>{
  if(err){console.log("APPSTATE EXPIRED");return;}
  console.log(`FENG ONLINE ${api.getCurrentUserID()} - ${cmds.size} CUSTOM CMDS ONLY`);
  api.setOptions({listenEvents:true,selfListen:false,updatePresence:false});

  api.listenMqtt(async(e,event)=>{
   if(e){setTimeout(startBot,5000);return;}
   if(!event.body||event.senderID==api.getCurrentUserID()) return;
   let body=event.body.trim();
   let tid=event.threadID;

   if(!body.startsWith("!")) return;
   let args=body.slice(1).split(/ +/);
   let name=args[0].toLowerCase();
   let restArgs=args.slice(1);

   if(!cmds.has(name)) return;

   try{
    let cmd=cmds.get(name);
    if(cmd.onStart) await cmd.onStart({api,event,args:restArgs});
    else if(cmd.run) await cmd.run({api,event,args:restArgs});
   }catch(err){
    console.log(`ERR ${name}: ${err.message}`);
   }
  });
 });
}
startBot();
