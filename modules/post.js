const fs = require('fs');
const path = require('path');

function Process(req, res){
    let domain = req.get('host').split(':')[0];
    let urlArr = req.originalUrl.replace(/^(\/)/, '').split('/');
    let protocol = req.protocol;
    let cookies = parseCookies(req);
    let GET = false;
    if(req.originalUrl.split('?').length > 1){
        GET = {};
        req.originalUrl.split('?')[1].split('&').forEach((keyVal)=>{
            let splitKey = keyVal.split('=');
            GET[splitKey[0]] = !isNaN(splitKey[1]) ? Number(splitKey[1]) : decodeURI(splitKey[1]);
        });
    }
    let POST = req._body ? req.body : false;
    let postFile = urlArr[0];
    let options = {
        domain,
        protocol,
        urlArr,
        POST,
        GET,
        cookies,
        request: req,
    }
    console.log(urlArr);
    
    try {
        var processor = require(path.join(__dirname, 'post_inc', postFile));
        processor.process(options).then((data) => {
            res.send(data);
        }).catch((err) => {
            console.error(err.message);
            res.send(err.message);
        })
    } catch (err) {
        console.log(err);
        res.sendStatus(500).send('Include File not Found, ' + JSON.stringify(err));
    }
}

function parseCookies (request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}

module.exports.process = Process;