const fs = require('fs');
const path = require('path');
const resources = [
    "js", 
    "png", 
    "jpeg",
    "jpg",
    "gif",
    "ico",
    "svg",
    "css",
    "map",
    "ttf",
    "woff",
    "woff2",
    "mp4",
    "webm"
]
function IsResource(urlArr){
    // if last element of array ends with a resource file extension
    return resources.indexOf(urlArr[urlArr.length - 1].split('.').pop()) > -1;
}

function Get(res, dir, urlArr){
    Send(res, path.join(dir, 'resources', urlArr.join('/')) );
}

function Send(res, resourcePath, options = false){
    // determin if file exsist
    if (options) {
        if (options.type) {
            res.set('Content-Type', options.type);
        }
    }
    fs.access(decodeURI(resourcePath), fs.F_OK, (err)=>{
        if(err){
            // resolve the request with a 404
            
            res.status(404).send('Not found');
        }else{
            // stream file to user

            fs.createReadStream(decodeURI(resourcePath)).pipe(res);
        }
    })
}

module.exports.get = Get;
module.exports.send = Send;
module.exports.isResource = IsResource;