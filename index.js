const fs=require("fs"),path=require("path");
const login=require("ws3-fca");

let appState;
try{
if(process.env.APPSTATE) appState=JSON.parse(process.env.APPSTATE);
else appState=JSON.parse(fs.readFileSync(path.join(__dirname,"appstate.json"),"utf8"));
}catch(e){}

login({appState},(err,api)=>{
if(err){console.error(err);return;}
console.log("Emperor V4 - Only Reply Mode!");
require("http").createServer((a,b)=>b.end("V4")).listen(process.env.PORT||3000);
api.setOptions({listenEvents:true,selfListen:false});
const botID=api.getCurrentUserID();

api.listen(async(err,event)=>{
if(err)return;
if(event.type!=="message" && event.type!=="message_reply")return;
let body=(event.body||"").trim();
if(!body)return;
if(event.senderID==botID)return; // don't reply to self

// === ONLY REPLY LOGIC ===
const lower=body.toLowerCase();
const isFeng=lower.includes("feng");
const isReplyToBot=event.type==="message_reply";

let shouldReply=false;

// Check if reply is to bot
if(isReplyToBot){
// ws3-fca has messageReply info
if(event.messageReply && event.messageReply.senderID==botID){
shouldReply=true;
console.log("Reply to bot detected!");
}else{
// If we can't check senderID, treat any reply as trigger (you can make it strict later)
shouldReply=true;
}
}

if(isFeng){
shouldReply=true;
console.log("Feng trigger detected!");
}

// If not triggered, IGNORE
if(!shouldReply){
console.log("Ignored:",body.slice(0,20));
return;
}

// Remove "feng" word from question to make AI answer cleaner
let prompt=body.replace(/feng/gi,"").trim();
if(!prompt) prompt="hi";

if(prompt.toLowerCase()=="!help"){
return api.sendMessage(`👑 FENG BOT 👑
Only replies when:
1. You reply to my message
2. You say "feng"

Try: reply to this or type "feng what's 1+1"`,event.threadID);
}

try{
const {GoogleGenerativeAI}=require("@google/generative-ai");
const genAI=new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const models=["gemini-2.0-flash","gemini-3.5-flash","gemini-1.5-flash-latest","gemini-2.5-flash"];
let reply="";

for(const m of models){
try{
console.log("Trying",m,"for:",prompt);
const model=genAI.getGenerativeModel({model:m});
const result=await model.generateContent(prompt);
reply=result.response.text();
if(reply)break;
}catch(e){continue;}
}

if(!reply) reply="Google busy, try again later master!";
api.sendMessage(reply,event.threadID,event.messageID);

}catch(e){
console.log(e.message);
api.sendMessage("Error: "+e.message.slice(0,100),event.threadID);
}
});
});
