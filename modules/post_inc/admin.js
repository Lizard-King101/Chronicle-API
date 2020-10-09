const db = require('../database');
const bcrypt = require('bcryptjs');
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const notifications = require('../notifications');
const helpers = require('../helpers');

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


        switch(action) {
            /* SIGNIN ACTIONS */
            case 'signin':
                if(POST.email && POST.pass ){
                    db.query(`SELECT * FROM accounts WHERE email = '${POST.email.toLowerCase()}'`).then( async (result)=>{
                        if(result && !result.error){
                            let user = result[0];
                            let permissions = (await db.query(`SELECT * FROM permissions WHERE user = '${user.id}'`)).map(m => m.type);
                            if(POST.pass === user.password && permissions.includes('super_admin')){
                                if(!user.auth_token || user.auth_token == '' || user.auth_token == 'null') {
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
                if(auth && POST.user){
                    let user = POST.user;
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
            
            /* USER ACTIONS */
            case 'list':
                if(POST && POST.table && POST.order_by && POST.order) {
                    let table = ({users: 'accounts', raffles: 'raffles', not: 'notifications'})[POST.table];
                    let columns = ['*']
                    if(table == 'raffles') columns.push(' (SELECT COUNT(*) FROM tickets ti WHERE ti.raffle_id = t.id) as tickets_sold')
                    if(table) {
                        let page = POST.page && typeof POST.page == 'number' ? POST.page * 20 : 0;
                        new Promise((next) => {
                            let order = ` ORDER BY t.${POST.order_by} ${POST.order}`;
                            next(`SELECT ${columns.join(',')} FROM ${table} t ${order} LIMIT 20 OFFSET ${page}`);
                        }).then(async (q) => {
                            let total = (await db.query(`SELECT COUNT(*) as total FROM ${table}`))[0]['total'];
                            db.query(q).then((result) => {
                                if(result && !result.error){
                                    res({total, data: result});
                                } else {
                                    res(false);
                                }
                            });
                        });
                    } else {
                        res(false);
                    }
                } else {
                    res(false);
                }
                break;
            case 'user':
                console.log(POST);
                if(POST.id) {
                    let id = POST.id;
                    delete POST.id;
                    for(let key of Object.keys(POST)) {
                        let value = POST[key];
                        if(value == 'null') {
                            POST[key] = null;
                        }
                    }
                    db.update({table: 'accounts', data: POST, where: ` id = '${id}'`}).then((result) => {
                        res(result)
                    })
                } else {
                    db.insert('accounts', POST).then((result) => {
                        res(result)
                    })
                }
                break;

            case 'user_transactions':
                let transactions = await db.query(`SELECT t.*, c.symbol, c.accuracy FROM transactions t JOIN currencies c ON (c.id = t.currency) WHERE t.user_id = '${POST.user_id}' ORDER BY t.dt_submited DESC LIMIT 20`);
                let currencies = await db.query(`SELECT * FROM currencies`);
                let balances = await db.query(`SELECT ac.currency, ac.balance, c.symbol, c.accuracy FROM account_balances ac JOIN currencies c ON (c.id = ac.currency) WHERE ac.user_id = '${POST.user_id}'`);
                res({
                    transactions,
                    currencies,
                    balances
                })
                break;
            case 'submit_transaction':
                if(POST.user_id) {
                    let balance = await db.getRow(`SELECT * FROM account_balances ac JOIN currencies c ON (c.id = ac.currency) WHERE ac.user_id = '${POST.user_id}' AND ac.currency = '${POST.transaction.currency}'`);
                    let currency = await db.getRow(`SELECT * FROM currencies WHERE id = '${POST.transaction.currency}'`);
                    let tmp = POST.transaction;
                    tmp.user_id = POST.user_id;
                    tmp.dt_submited = helpers.dateFormatUTC(new Date());
                    console.log('TMP', tmp);
                    if(balance) {
                        
                        let modify = tmp.type == 'credit' ? tmp.amount : -tmp.amount;
                        let newBalance = balance.balance = balance.balance + modify;
                        console.log(newBalance);
                        if(newBalance >= 0) {
                            db.update({table: 'account_balances', data: {balance: newBalance}, where: `user_id = ${POST.user_id} AND currency = ${POST.transaction.currency}`});
                            db.insert('transactions', tmp);
                            tmp.symbol = currency.symbol;
                            tmp.accuracy = currency.accuracy;
                            res({balance: balance, transaction: tmp});
                        } else {
                            res({err: 'Cannot create negative balance'});
                        }
                    } else if(POST.transaction.type == 'credit'){
                        
                        let bal = {
                            user_id: POST.user_id,
                            currency: POST.transaction.currency,
                            balance: tmp.amount
                        }
                        db.insert('account_balances', bal);
                        db.insert('transactions', tmp);
                        bal.symbol = currency.symbol;
                        bal.accuracy = currency.accuracy;
                        tmp.symbol = currency.symbol;
                        tmp.accuracy = currency.accuracy;
                        res({balance: bal, transaction: tmp});
                    } else {
                        res({err: 'Cannot create negative balance'});
                    }
                } else {
                    res({err: 'No user supplied'});
                }
                break;

            /* END ACTIONS */
            default: 
                rej({message: `Action '${action}' not found in: admin.js`});
                break;
        }
        setTimeout(() => {
            rej({message: `No resolve for action ${action} in admin.js`});
        }, 5000);
    })
}

function createID() {
    return new Date().getTime().toString(36).substr(2, 9);
}

module.exports.process = Process;