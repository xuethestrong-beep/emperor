const fs=require("fs"),path=require("path");
const login=require("ws3-fca");
let appState;
if(process.env.APPSTATE||process.env.appstate){
try{appState=JSON.parse(process.env.APPSTATE||process.env.appstate);
console.log("Using APPSTATE from Railway!");}catch(e){
console.log("APPSTATE error, trying file");appState=JSON.parse(fs.readFileSync(path.join(__dirname,"appstate.json"),"utf8"));}
}else{appState=JSON.parse(fs.readFileSync(path.join(__dirname,"appstate.json"),"utf8"));}
let config={};try{config=JSON.parse(fs.readFileSync(path.join(__dirname,"config.json"),"utf8"));}catch{}
login({appState},(err,api)=>{
if(err){console.error("LOGIN FAILED:",err);return;}
console.log("Emperor Started!");
require("http").createServer((a,b)=>b.end("Alive")).listen(process.env.PORT||3000);
process.on("uncaughtException",e=>console.log(e.message));
process.on("unhandledRejection",e=>console.log(e.message));
api.setOptions({listenEvents:true,selfListen:false});
api.listen(async(err,event)=>{
if(err)return;
if(event.type!=="message"&&event.type!=="message_reply")return;
const body=event.body||"";if(!body)return;
try{
const{GoogleGenerativeAI}=require("@google/generative-ai");
const genAI=new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model=genAI.getGenerativeModel({model:"gemini-1.5-flash"});
const result=await model.generateContent(body);
api.sendMessage(result.response.text(),event.threadID,event.messageID);
}catch(e){console.log("Gemini error:",e.message);api.sendMessage("Error: "+e.message,event.threadID);}});});
