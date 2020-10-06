const path = require('path');
const fs = require('fs');
const db = require('../database');
const Rand  = require('random-org');
const random = new Rand(global.random);
const bcrypt = require('bcryptjs');
const Timer = require('../timer');

var io = global.io;
var connected = global.socketio.connected;

var timers = {

}

function Process(socket) {
    socket.on('register', (user) => {
        if(user) {
            socket.user_id = user.id;
            socket.app = 'mobile';
            connected.users[user.id] = socket.id;
            io.sockets.in('admin').emit('metric-users', Object.keys(connected.users).length);
            socket.join('users');
        } else {
            socket.emit('register-request');
        }
    });

    socket.on('reserve-ticket', async (data) => {
        let ticket = data.ticket;
        let edit = data.edit;
        let cart_id;
        let itemExsists;
        let reserved_nums = [];
        let expired_nums = [];
        //5 * 6
        let expires = new Date().getTime() + 5 * 60 * 1000;

        let cart = await db.getRow(`SELECT * FROM carts WHERE user = '${socket.user_id}'`);
        let items = await db.query(`SELECT ci.item_id, ci.cart_id, GROUP_CONCAT(ci.ticket_num) as ticket_nums FROM cart_items ci JOIN carts c ON (c.id = ci.cart_id) WHERE c.user = '${socket.user_id}' GROUP BY ci.item_id`);
        
        // track items left
        let count_update = -ticket.count;
        let delete_item = false;
        
        // check if cart exsists else create and get id
        if(!cart) {
            cart = await db.insert('carts', {user: socket.user_id});
            cart_id = cart.insertId;
        } else {
            cart_id = cart.id;
        }

        // check if target items is currently added to 
        if(items.length > 0) {
            for(let item of items) {
                if(item.item_id == ticket.item_id) {
                    itemExsists = item;
                    break;
                }
            };
        }
        console.log(items);
        if(itemExsists) {
            let last_nums = itemExsists.ticket_nums.split(',');
            
            let insert_nums = reserved_nums = ticket.ticket_nums.filter(n => !last_nums.includes(n));
            let data = {
                item_id: ticket.item_id,
                cart_id: cart_id
            }
            if(insert_nums.length > 0) {
                for(let n = 0; n < insert_nums.length; n ++) {
                    data.ticket_num = insert_nums[n];
                    db.insert('cart_items', data);
                }
            }
            let delete_nums = last_nums.filter(n => !ticket.ticket_nums.includes(n));
            if(delete_nums.length > 0 && edit) {
                expired_nums = delete_nums;
                let q = `DELETE FROM cart_items WHERE item_id = '${ticket.item_id}' AND ticket_num in (${`'` + delete_nums.join(`','`) + `'`})`;
                console.log('DELETE CI', q)
                db.query(q);
                
            }
        } else {
            let data = {
                item_id: ticket.item_id,
                cart_id: cart_id
            }
            for(let i = 0; i < ticket.ticket_nums.length; i++) {
                let num = ticket.ticket_nums[i];
                data.ticket_num = num;
                let info = await db.insert('cart_items', data);
                if(info && !info.error) {
                    reserved_nums.push(num);
                }
            }
        }
        
        if(!timers[socket.user_id]) {
            timers[socket.user_id] = {};
        }
        
        console.log(reserved_nums, expired_nums);

        // if(timers[socket.user_id][cart_id]) {
        //     if(delete_item) {
        //         timers[socket.user_id][cart_id].cancel();
        //         delete timers[socket.user_id][cart_id];
        //     } else {
        //         timers[socket.user_id][cart_id].updateExpiration(expires);
        //     }
        // } else {
        //     let timer =  new Timer();
        //     timer.at(expires).subscribe(() => {onItemExpire(cart_id)});
        //     timers[socket.user_id][cart_id] = timer;
        // }

        io.sockets.in('users').emit('reservation-update', [{item_id: ticket.item_id, reserved_nums, expired_nums, user: socket.user_id}]);
        socket.emit('cart-update');
    })

    socket.on('cart-checkout', async () => {
        let items = await db.query(`SELECT ci.ticket_num, ci.item_id, c.user, c.id as cart_id, r.ticket_price, r.title FROM cart_items ci JOIN carts c ON (c.id = ci.cart_id) JOIN raffles r ON (r.id = ci.item_id) WHERE c.user = '${socket.user_id}'`);
        let balance = (await db.getRow(`SELECT balance FROM accounts where id = '${socket.user_id}'`)).balance;
        console.log('USER BALANCE', balance);
        let cart_id;
        let updated_items = [];
        let transactions = items.reduce(function(o, cur) {
            var occurs = o.reduce(function(n, item, i) {
                return (item.item_id === cur.item_id) ? i : n;
            }, -1);
            if (occurs >= 0) {
                o[occurs].ticket_price += cur.ticket_price;
                if(o[occurs].amount) o[occurs].amount += 1;
                else o[occurs].amount = 2;
            } else {
                o = o.concat([cur]);
            }
            return o;
        }, []);
        console.log(transactions);
        let total = transactions.map(m => m.ticket_price).reduce((o, cur) => {o += cur});
        if(balance >= total) {
            for(let trans of transactions) {
                let tmp = {
                    user_id: socket.user_id,
                    type: 'purchase',
                    amount: trans.ticket_price,
                    description: `Buy ${trans.amount ? trans.amount : 1} of ${trans.title} at $${trans.ticket_price} ID: ${trans.item_id}`,
                    dt_submited: new Date()
                }
                db.insert('payment_transactions', tmp);
                balance -= trans.ticket_price;
            }
            db.update({table: 'accounts', data: {balance}, where: `id = ${socket.user_id}`});

            if(items && items.length > 0) {
                let tickets = [];
                random.generateDecimalFractions({
                    n: items.length,
                    decimalPlaces: 10
                }).then(async (randomData) => {
                    for(let i = 0; i < items.length; i++) {
                        item = items[i];
                        if(!cart_id) cart_id = item.cart_id;
                        if(!updated_items.includes(item.item_id)) updated_items.push(item.item_id);
                        let randomValue = randomData.random.data[i];
                        let salt = await bcrypt.genSalt(10);
                        let hash = await bcrypt.hash(randomValue + '', salt);
                        let ticket = {
                            ticket_num: item.ticket_num,
                            user_id: item.user,
                            raffle_id: item.item_id,
                            ticket_random: randomValue,
                            ticket_hash: hash
                        }
                        db.insert('tickets', ticket);
                    }

                    db.query(`DELETE FROM cart_items WHERE cart_id = '${cart_id}'`);
                    io.sockets.in('users').emit('purchase-update', updated_items);
                    io.sockets.in('admin').emit('cart-purchased');
                    socket.emit('cart-purchased');
                })
                
            }

        } else {
            socket.emit('cart-error', {message: `Insufficient funds in account: $${balance}, need $${total} `});
        }
    })
}

async function onItemExpire(id) {
    await db.query(`DELETE FROM cart_items WHERE cart_id = '${id}'`);
    let items = await db.query(`SELECT GROUP_CONCAT(ci.ticket_num) as expired_nums, ci.item_id, c.user FROM cart_items ci JOIN carts c ON (c.id = ci.cart_id) WHERE item_id IN (SELECT DISTINCT item_id FROM cart_items WHERE cart_id = '${id}') GROUP BY ci.item_id`)
    items.map(m => { m.expired_nums = m.expired_nums.split(','); return m; });
    io.sockets.in('users').emit('reservation-update', items);
    if(connected.users[item.user]) io.sockets.connected[connected.users[item[0].user]].emit('cart-update');
}

module.exports.process = Process;