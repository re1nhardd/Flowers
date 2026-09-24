const handler=require('../server');
module.exports=(req,res)=>{
 if(req.query?.route)req.url='/api/'+req.query.route;
 return handler(req,res);
};
