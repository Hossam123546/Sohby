const {currentUser}=require("./_auth");
module.exports=async(req,res)=>{
  res.setHeader("Content-Type","application/json");
  try{res.statusCode=200;res.end(JSON.stringify({user:await currentUser(req)}))}
  catch(e){console.error(e);res.statusCode=500;res.end(JSON.stringify({error:"تعذر قراءة الجلسة"}))}
};