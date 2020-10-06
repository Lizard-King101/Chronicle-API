
const resource = require('./resource');
const path = require('path');
var db = require('./database');



const mime = {
    'js': 'application/javascript',
    'map': 'application/octet-stream'
}

// main function of get file
function Process(req, res, app){

    // split the request domain
    var domain = req.get('host').split(':')[0];
    //if( global.devDomains.indexOf(domain) > -1) domain = 'npanel.io';

    // split url into array eg: domain.com/account/settings -> ["account", "settings"] 
    var urlArr = req.originalUrl.split('?')[0].replace(/^\/+|\/+$/g, '').split('/');
    // parse get peramiters
    var GET = false;
    if(req.originalUrl.split('?').length > 1){
        GET = {};
        req.originalUrl.split('?')[1].split('&').forEach((keyVal)=>{
            let splitKey = keyVal.split('=');
            GET[splitKey[0]] = !isNaN(splitKey[1]) ? Number(splitKey[1]) : decodeURI(splitKey[1]);
        });
    }

    // http or https
    var protocol = req.protocol;


    if(resource.isResource(urlArr)){
        let options = false;
        let lastUrl = urlArr[urlArr.length - 1];
        let fileExt = lastUrl.split('.').pop();
        if(Object.keys(mime).indexOf(fileExt) > -1){
            options = {type: mime[fileExt]};
        }
        
        if (urlArr[0].match(/^[_]+[a-z]+/gm)) {
            
            resource.send(res, path.join(global.paths.root, 'public', urlArr[0].substr(1), urlArr.slice(1).join('/')), options);
        } else {
            
            resource.send(res, path.join(global.paths.root, 'www', urlArr.join('/')), options);
        }
    } else {
        resource.send(res, path.join(global.paths.root, 'www/index.html'));
    }

}

module.exports.process = Process;