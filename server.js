var http = require('http');
var app = require('express')();
var child_process = require('child_process');
var bodyParser = require('body-parser')
var fs = require('fs');
var bot = require("superagent")

app.use(bodyParser.json());

app.all('*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST');
    res.header('Access-Control-Allow-Headers', 'accept, content-type, x-parse-application-id, x-parse-rest-api-key, x-parse-session-token');
    res.header('X-XSS-Protection', '1; mode=block')
    res.header('X-Frame-Options', 'DENY')
    res.header('X-Content-Type-Options', 'nosniff')
    if ('OPTIONS' == req.method) {
      res.sendStatus(200);
    }
    else {
      next();
    }
});

app.post('/', function(req, res) {
  var name = req.body.repository.repo_name;
  var tag = req.body.push_data.tag;
  var repo = name.split("/")[1]
  var dir = "/podcontroller/deployments/"
  if(tag === "latest") {
    var version = "latest"
    var namespace = "siep-produccion"
    var directory = dir+namespace+"/"+repo
  } else if (tag === "developer") {
    var repo = "dev-"+repo
    var version = "developer"
    var namespace = "siep-desarrollo"
    var directory = dir+namespace+"/"+repo
  }

if (fs.existsSync(directory)){
     dir = child_process.exec('kubectl set image deployment/'+repo+' '+repo+'='+name+':'+version+' --namespace='+namespace+' && kubectl apply -f '+directory+'/deployment.yaml', function(err, stdout, stderr) {
        if (err) { console.log(err) } else {
              console.log(stdout)
            bot.post(process.env.BOT).send({msg: "Se actualizo el repositorio "+name+" de "+namespace}).end(function(err, respuesta){
              if(err) { console.log(err) }
        }) 
         } 
});
     dir.on('exit', function (code) { console.log(code) });
} else {
  console.log("El directorio no existe "+ directory)
}  
});

http.createServer(app).listen(process.env.PORT, function() {
    console.log('Server started: Listening');
});
