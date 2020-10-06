const formidable = require('formidable');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const db = require('../database');
const wheel = require('../wheel');
const email = require('../email');
const io = global.io;

const allowedActions = [
    'signin',
    'check-auth',
    'create-account',
    'check-auth'
];

function Process(options) {
    let POST = options.POST;
    let GET = options.GET;
    let urlArr = options.urlArr;
    let action = urlArr[1];
    let req = options.request;
    let cookies = options.cookies;

    let auth = cookies['x-auth'] || req.headers['x-auth'];
    
    if(Object.keys(POST).length = 0) POST = null;
    
    return new Promise(async (res, rej) => {
        let user;
        if(auth) {
            user = await db.getRow(`SELECT * FROM accounts WHERE auth_token = '${auth}'`);
        }
        if(!allowedActions.includes(action)) {
            if(!auth && !user) {
                console.log("SIGNOUT");
                res({error: true, signout: true});
            } else if (user && !user.autherized) {
                console.log("GET AUTH", action);
                res({error: true, getAuth: true});
            }
        }
        
        switch(action) {
            case 'signin':
                if(POST.email && POST.pass ){
                    db.getRow(`SELECT * FROM accounts WHERE email = '${POST.email.toLowerCase()}'`).then(async (result)=>{
                        console.log(result);
                        if(result && !result.error){
                            let user = result;
                            if(POST.pass === user.password){
                                if(!user.auth_token || user.auth_token == '') {
                                    let salt = await bcrypt.genSalt(10);
                                    let hash = await bcrypt.hash(user.username, salt);
                                    user.auth_token = hash;
                                    db.update({
                                        table: 'accounts',
                                        data: {auth_token: hash},
                                        where: `id = ${user.id}`
                                    }).then((data) => {
                                        console.log(data);

                                        req.session.user = user;
                                        res(user);
                                    })
                                } else {
                                    req.session.user = user;
                                    res(user);
                                }
                                
                            }else{
                                res(false);
                            }
                        } else {
                            res(false);
                        }
                    })
                }
                break;
            case 'check-signin':
                if(auth && user){
                    user.email = user.email.toLowerCase();
                    db.query(`SELECT * FROM accounts WHERE email = '${user.email}' AND auth_token = '${auth}'`).then((result)=>{
                        console.log(result);
                        if(result && !result.error){
                            res(result);
                        } else {
                            res(false);
                        }
                    });
                } else {
                    res(false);
                }
                break;
            case 'create-account':
                if(POST.account) {
                    let user = await db.loadData('accounts', POST.account);
                    user.email = user.email.toLowerCase();
                    let account = await db.getRow(`SELECT * FROM accounts WHERE email = '${user.email}'`);
                    if(!account || account.length == 0) {
                        let salt = await bcrypt.genSalt(10);
                        let hash = await bcrypt.hash(user.username, salt);
                        user.auth_token = hash;
                        let auth_key = user.auth_key = Math.floor(1000 + Math.random() * 9000)
                        db.insert('accounts', user);
                        //let email_info = email.sendEmail(user.email, 'Account Confirmation', `Your 4 digit Authentication key is ${auth_key}`);
                        res({getAuth: true, auth_key})
                    } else {
                        res({account: true});
                    }
                }
                break;
            case 'check-auth':
                let result = await db.getRow(`SELECT * FROM accounts WHERE email = '${POST.email}' AND auth_key = '${POST.auth_key}'`);
                if(result) {
                    db.update({table: 'accounts', data: {autherized: 1}, where: `id = '${result.id}'`})
                    res(result);
                } else {
                    res(false);
                }
                break;

            case 'list-categories':
                db.query('SELECT * FROM categories').then((result) => {
                    console.log('CATEGORIES',result);
                    if(result && !result.error){
                        res(result);
                    } else {
                        res(false);
                    }
                });
                break;
            /* RAFFLE ACTIONS */
            case 'list-raffles':
                new Promise((next) => {
                    let order = 'ORDER BY r.created DESC';
                    let join = '';
                    let q = '';
                    if(POST.order_by && POST.order) {
                        order = `ORDER BY r.${POST.order_by} ${POST.order}`
                    }
                    let now = new Date().toISOString();
                    let where = `WHERE r.visible <= '${now}' AND r.drawing >= '${now}' `;
                    if(typeof POST.active !== 'undefined') {
                        order = 'ORDER BY r.drawing DESC';
                        if(!POST.active) {
                            where = `WHERE r.drawing <= '${now}' `;
                        }
                    }
                    if(POST.where) {
                        for(let i = 0; i < POST.where.length; i++) {
                            let key = Object.keys(POST.where[i])[0];
                            let value = POST.where[i][key];
                            where += `AND ${key} ${value} `;
                        }
                    }
                    if(POST.user) {
                        join = `JOIN tickets t ON (t.raffle_id = r.id)`;
                        where += `AND t.user_id = '${POST.user}' `;
                        q = `SELECT r.category, r.id as raffle_id, r.title, r.ticket_price, COUNT(*) as count, (SELECT url FROM raffle_resources rr WHERE r.id = rr.raffle LIMIT 1) as resources FROM raffles r ${join} ${where} GROUP BY r.id ${order}`;
                    } else {
                        q = `SELECT *, (SELECT url FROM raffle_resources rr WHERE r.id = rr.raffle LIMIT 1) as resources, (SELECT COUNT(*) FROM tickets t WHERE r.id = t.raffle_id) as tickets_sold FROM raffles r ${join} ${where} ${order}`;
                    }
                    
                    console.log(q);
                    
                    next(q);
                }).then((q) => {
                    db.query(q).then((result) => {
                        if(result && !result.error){
                            res(result);
                        } else {
                            res(false);
                        }
                    });
                });
                break;
            case 'get-raffle':
                if(POST.raffle) {
                    new Promise(async next => {
                        let where = `WHERE id = ${POST.raffle}`;
                        let q = `SELECT *, (SELECT url FROM raffle_resources rr WHERE r.id = rr.raffle LIMIT 1) as resources, (SELECT COUNT(*) FROM tickets t WHERE r.id = t.raffle_id) as tickets_sold FROM raffles r ${where}`;
                        let raffle = await db.getRow(q);
                        raffle.resources = await db.query(`SELECT * FROM raffle_resources WHERE raffle = ${raffle.id}`);
                        next(raffle);
                    }).then((result) => {
                        res(result);
                    })
                } else {
                    res(false);
                }
                break;

            case 'get-raffle-data': 
            console.log('GET RAFFLE DATA');
                if(POST.raffle) {
                    wheel.getVariables(POST.raffle).then((variables) => {
                        res(variables);
                    })
                } else {
                    res(false);
                }
                break;

            case 'get-ticket-availability':
                if(POST.raffle_id) {
                    let reserved_tickets = await db.query(`SELECT ci.ticket_num FROM cart_items ci WHERE ci.item_id = ${POST.raffle_id}`);
                    reserved_tickets = reserved_tickets.map(m => m.ticket_num)
                    let purchased_tickets = await db.query(`SELECT t.ticket_num, a.profile, a.username, a.first_name, a.last_name FROM tickets t JOIN accounts a ON (a.id = t.user_id) WHERE t.raffle_id = '${POST.raffle_id}'`);
                    res({reserved_tickets, purchased_tickets});
                }
                break;
            case 'get-reservations': 
                if(POST.item_id) {
                    
                    let cart = await db.query(`SELECT ci.ticket_num FROM cart_items ci WHERE ci.item_id = ${POST.item_id}`);
                    let purchased = await db.query(`SELECT t.ticket_num FROM tickets t WHERE t.raffle_id = '${POST.item_id}'`);
                    let reserves = cart.length > 0 && purchased.length > 0 ? cart.concat(purchased) : cart.length > 0 ? cart : purchased;
                    console.log('RESERVED ' + POST.item_id, reserves.length, cart.length, purchased.length);
                    res(reserves);
                } else {
                    res(false);
                }
                break;

            case 'get-cart':
                if(POST.user) {
                    let items = await db.query(`SELECT ci.item_id, COUNT(*) as count, GROUP_CONCAT(ci.ticket_num) as ticket_nums, r.title as name, r.category, r.ticket_price as unit_price, rr.url as image FROM cart_items ci JOIN raffles r ON (r.id = ci.item_id) LEFT JOIN raffle_resources rr ON (rr.raffle = ci.item_id) JOIN carts c ON (c.id = ci.cart_id) WHERE c.user = '${POST.user}'`);
                    if(items && !items.error) {
                        res(items.filter(i => i.item_id != null));
                    } else {
                        res(false);
                    }
                } else {
                    res(false)
                }
                break;

            case 'fund-account':
                // handle charging card on file
                let balance = (await db.getRow(`SELECT balance FROM accounts where id = '${POST.user_id}'`)).balance;
                let newBalance = balance + POST.amount
                await db.update({table: 'accounts', data: {balance: newBalance}, where: `id = ${POST.user_id}`});
                let trans = {
                    user_id: POST.user_id,
                    type: 'fund',
                    amount: POST.amount,
                    description: `User Funded Account with option ID: ${POST.payment}`,
                    dt_submited: new Date()
                }
                await db.insert('payment_transactions', trans);
                io.in('admin').emit('user-fund');
                res({balance: newBalance});
                break;
            case 'profile-picture':
                var form = new formidable.IncomingForm();
                form.parse(req, (err, fields, files) => {
                    let file = files['profile'];
                    let id = createID();
                    let name = id + '.' + file.type.split('/').pop();
                    let data = {
                        profile: '_profiles/'+name
                    }
                    let dest = path.join(global.paths.root, 'public/profiles', name);
                    try {
                        fs.unlink(path.join(global.paths.root, 'public', user.profile.substr(1)), () => { });
                    } catch (error) {
                        console.log('unlink error', error.message);
                     }
                    db.update({table: 'accounts', data, where: `id = '${user.id}'`}).then((result)=>{
                        let stream = fs.createWriteStream(dest);
                        fs.createReadStream(file.path).pipe(stream);
                        res(true);
                    })
                });
                break;
            case 'update-account':
                if(POST.push_token && user) {
                    db.update({table: 'accounts', data: POST, where: `id = '${user.id}'`});
                }
                break;
            default: 
                rej({message: `Action '${action}' not found in: user.js`});
                break;
        }
    })
}

function createID() {
    return new Date().getTime().toString(36).substr(2, 9);
}

module.exports.process = Process;