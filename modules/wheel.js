const db = require('./database');
const Rand  = require('random-org');
const random = new Rand(global.random);

var players = 0;
var drag = 0.004;
var angle = 0;
var velCut = 0.004;
var velocity = 0;
var minVel = .2;
var maxVel = .6;
var snap;
var randomWinner;

function GetVariables(raffle_id) {
    return new Promise(async (res) => {
        let variables = await db.getRow(`SELECT * FROM raffle_variables WHERE id ='${raffle_id}'`);
        if(variables) {
            variables.user_tickets = await GetUserTickets(raffle_id);
            res(variables);
        } else {
            GenerateVariables(raffle_id).then((variables) => {
                res(variables);
            })
        }
    })
}

function GenerateVariables(raffle_id) {
    return new Promise(async (res) => {
        let user_tickets = await GetUserTickets(raffle_id);
        random.generateDecimalFractions({
            n: 2,
            decimalPlaces: 14
        }).then(async (randomData) => {
            let [winnerRand, velocityRand] = randomData.random.data;
            players = user_tickets.length;
            snap = 360 / players
            randomWinner = Math.round(winnerRand * (players - 1)) + 1;
            velocity = velocityRand * maxVel + minVel;
            angle = FindStartAngle(randomWinner);
            let winner = user_tickets[randomWinner - 1];
            let variables = {
                id: raffle_id,
                players,
                drag,
                angle,
                velocity,
                velocity_cut: velCut,
                winning_ticket_num: winner.ticket_num,
                winning_ticket_id: winner.ticket_id,
                winning_player: winner.user_id
            }
            db.insert('raffle_variables', variables).then((result) => {
                variables.user_tickets = user_tickets;
                res(variables);
            })
        });

        
        
    })
}

function FindStartAngle(winner) {
    let testVel = velocity;
    let targetAngle = -((winner - 1) * snap);
    while(testVel > velCut){
        let radians = degrees_to_radians(targetAngle);
        testVel -= testVel * drag;
        radians += testVel * .166;
        targetAngle = radians_to_degrees(radians);
    }
    let rSnap = Math.random() * snap - snap / 2;
    // let rSnap = 0;
    let randomness = clamp(rSnap, -snap/2 + .03, snap/2 - .03);
    let predictedStartAngle = (360 - targetAngle % 360) + randomness;
    return predictedStartAngle;
}

function GetUserTickets(raffle_id) {
    return db.query(`SELECT t.id as ticket_id, t.ticket_num, t.ticket_random,  a.username, a.profile, a.id as user_id FROM tickets t LEFT JOIN accounts a ON (a.id = t.user_id) WHERE t.raffle_id = '${raffle_id}' ORDER BY t.ticket_random ASC`);
}

/* HELPER FUNCTIONS */

function radians_to_degrees(radians){
    return radians * (180/Math.PI);
}

function degrees_to_radians(degrees){
    return degrees * (Math.PI/180);
}

function clamp(value, min, max){
    return Math.min(Math.max(value ,min) , max);
}

module.exports.getVariables = GetVariables;