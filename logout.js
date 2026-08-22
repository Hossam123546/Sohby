const {deleteSession}=require("./_auth");
module.exports=async(req,res)=>{
  if(req.method!=="POST"){res.statusCode=405;return res.end()}
  try{await deleteSession(req,res);res.statusCode=200;res.setHeader("Content-Type","application/json");res.end(JSON.stringify({ok:true}))}
  catch(e){console.error(e);res.statusCode=500;res.end(JSON.stringify({error:"تعذر تسجيل الخروج"}))}
};