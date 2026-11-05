const fs=require("fs"),path=require("path");
const login=require("ws3-fca");

let appState;
if(process.env.APPSTATE){
try{
appState=JSON.parse(process.env.APPSTATE);
console.log("Using APPSTATE from Railway!");
}catch(e){
console.log("APPSTATE parse error, using file");
appState=JSON.parse(fs.readFileSync(path.join(__dirname,"appstate.json"),"utf8"));
}
}else{
appState=JSON.parse(fs.readFileSync(path.join(__dirname,"appstate.json"),"utf8"));
}

login({appState},(err,api)=>{
if(err){
console.error("LOGIN FAILED:",err.error||err);
return;
}
console.log("Emperor Started with Gemini 2.5!");

require("http").createServer((a,b)=>b.end("Emperor Alive - Gemini 2.5")).listen(process.env.PORT||3000);

api.setOptions({listenEvents:true,selfListen:false,updatePresence:true});

api.listen(async(err,event)=>{
if(err)return;
if(event.type!=="message"&&event.type!=="message_reply")return;
const body=(event.body||"").trim();
if(!body)return;

try{
const {GoogleGenerativeAI}=require("@google/generative-ai");
const genAI=new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// SPECIFIC MODEL 2.5 FLASH
const model=genAI.getGenerativeModel({model:"gemini-2.5-flash"});
const result=await model.generateContent(body);
const text=result.response.text();
api.sendMessage(text,event.threadID,event.messageID);
}catch(e){
console.log("Gemini error:",e.message);
api.sendMessage("Gemini 2.5 Error: "+e.message,event.threadID,event.messageID);
}
});
});
