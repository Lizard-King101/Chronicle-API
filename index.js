const path = require('path');
const Cors = require('cors');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const session = require('express-session');
const frameguard = require('frameguard');
const fs = require('fs');

const http = require('http').createServer(app);
const io = require('socket.io').listen(http);

var args = {};
process.argv.slice(2).forEach((arg)=> {
  let split = arg.split('=');
  if(split.length > 1){
    args[split[0]] = split[1];
  } else {
    args[arg] = true;
  }
});
let deploy = ( process.env.deploy || args.deploy );
const port = deploy ? 80 : 3000; 

// setup global object
global.paths = {
    root: __dirname,
    modules: path.join(__dirname, 'modules')
};
global.io = io;
if(deploy) {
  global.database = JSON.parse(fs.readFileSync(path.join(__dirname, 'deploydb.conf.json')));
} else {
  global.database = JSON.parse(fs.readFileSync(path.join(__dirname, 'db.conf.json')));
}
global.random = JSON.parse(fs.readFileSync(path.join(__dirname, 'random.conf.json')));


const post = require(path.join(global.paths.modules, 'post'));
const get = require(path.join(global.paths.modules, 'get'));
const socket_module = require(path.join(global.paths.modules, 'socket'));

// setup session managment
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'some secret change later',
  resave: true,
  saveUninitialized: true,
  cookie: { 
    expires: 300000,
    secure: false,
    sameSite: true
  }
}));

app.use(frameguard())
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ limit: '10mb', extended: false }))
// parse application/json
app.use(bodyParser.json({limit: '10mb'}))
app.use(Cors());

// get and post processors
//app.use("/_profile", express.static(path.join(__dirname, 'profiles')));
app.get('*', (req,res)=>{get.process(req,res,app)});
app.post('*', post.process);
io.on('connection', (socket)=>{ socket_module.process(socket); });
// socket_module.resumeTimers();

// run server and listen on defined port
http.listen(port, ()=>{
    console.log('Listening on port: '+port);
})
