const fs=require("fs"),path=require("path");
const login=require("ws3-fca");

let appState;
try{
if(process.env.APPSTATE){
appState=JSON.parse(process.env.APPSTATE);
console.log("Using APPSTATE Railway");
}else{
appState=JSON.parse(fs.readFileSync(path.join(__dirname,"appstate.json"),"utf8"));
}
}catch(e){console.error("Appstate error",e);}

login({appState},(err,api)=>{
if(err){console.error(err);return;}
console.log("Emperor V2 - Gemini 3.8 Ready!");
require("http").createServer((a,b)=>b.end("V2 Alive")).listen(process.env.PORT||3000);
api.setOptions({listenEvents:true,selfListen:false});

api.listen(async(err,event)=>{
if(err)return;
if(event.type!=="message"&&event.type!=="message_reply")return;
let body=(event.body||"").trim();
if(!body||event.senderID==api.getCurrentUserID())return;

const args=body.split(" ");
const cmd=args[0].toLowerCase();

// COMMANDS
if(cmd=="!help"||cmd=="!menu"||cmd=="!cmd"){
return api.sendMessage(`👑 EMPEROR BOT - Gemini 3.8 Flash 👑

Commands:
!help - show this menu
!ai [question] - ask AI
!clear - clear chat (admin)

Just type anything and AI will reply!

Examples:
what's 1+1
who is president of PH
write me a poem
`,event.threadID,event.messageID);
}

if(cmd=="!ai"){
body=args.slice(1).join(" ");
if(!body)return api.sendMessage("Use: !ai what is 1+1",event.threadID);
}

try{
const {GoogleGenerativeAI}=require("@google/generative-ai");
const genAI=new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model=genAI.getGenerativeModel({
model:"gemini-3.8-flash",
systemInstruction:"You are Emperor Bot, a helpful funny AI. Answer short and direct. If asked 1+1 say 2. Don't say 'How can I help you today' every time, just answer the question."
});
const result=await model.generateContent(body);
let text=result.response.text();
if(!text)text="Hi! Ask me anything!";
api.sendMessage(text,event.threadID,event.messageID);
}catch(e){
console.log(e.message);
try{
const {GoogleGenerativeAI}=require("@google/generative-ai");
const genAI=new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model=genAI.getGenerativeModel({model:"gemini-3.5-flash"});
const r=await model.generateContent(body);
api.sendMessage(r.response.text(),event.threadID,event.messageID);
}catch(e2){
api.sendMessage("Error: "+e.message,event.threadID);
}
}
});
});
