const {db}=require("./_db");
const {currentUser}=require("./_auth");
function json(res,status,data){res.statusCode=status;res.setHeader("Content-Type","application/json");res.end(JSON.stringify(data))}
module.exports=async(req,res)=>{
  try{
    const user=await currentUser(req);
    if(!user) return json(res,401,{error:"سجّل الدخول أولاً"});
    const sql=db();
    if(req.method==="GET"){
      const posts=await sql`
        select p.id,p.user_id,p.content,p.created_at,u.username,u.display_name
        from posts p join users u on u.id=p.user_id
        order by p.created_at desc limit 50`;
      return json(res,200,{posts});
    }
    if(req.method==="POST"){
      const content=String(req.body?.content||"").trim();
      if(!content) return json(res,400,{error:"المنشور فارغ"});
      if(content.length>1000) return json(res,400,{error:"المنشور أطول من اللازم"});
      const rows=await sql`insert into posts(user_id,content) values(${user.id},${content}) returning id,user_id,content,created_at`;
      return json(res,201,{post:rows[0]});
    }
    if(req.method==="DELETE"){
      const id=req.body?.id;
      if(!id) return json(res,400,{error:"معرف المنشور مطلوب"});
      await sql`delete from posts where id=${id} and user_id=${user.id}`;
      return json(res,200,{ok:true});
    }
    return json(res,405,{error:"Method not allowed"});
  }catch(e){console.error(e);return json(res,500,{error:"تعذر تنفيذ العملية"})}
};