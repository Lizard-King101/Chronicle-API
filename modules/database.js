const mysql = require('mysql');
const con = mysql.createConnection(global.database);
var connected = false;

function Query(sql){
    return new Promise((res)=>{
        Connect().then((err)=>{
            if(err) res({error: err});
            con.query(sql, (err, result)=>{
                if(err) res({error: err});
                res(result);
            })
        })
    })
}

function Select(options){
    return new Promise((res)=>{
        if(!options.table) res({error: 'No Table defined'});
        sql = `SELECT ${options.columns ? options.columns.join(',') : '*'} FROM ${options.table} ${(options.where ? 'WHERE ' + [options.where].join(' ') : '')}`;
        Connect().then((err)=>{
            if(err) res({error: err});
            con.query(sql, (err, result)=>{
                if(err) res({error: err});
                res(result);
            })
        })
    })
}

function GetRow(sql) {
    return new Promise((res) => {
        Query(sql).then((result) => {
            if(result.error) res(result);
            else res(result[0]);
        })
    })
}

function Update(options) {
    return new Promise((res) => {
        if(options.table && options.data && options.where && (Array.isArray(options.where) || typeof options.where == 'string')) {
            new Promise((next) => {
                let set = 'SET ';
                let keys = Object.keys(options.data);
                keys.forEach((key, i) => {
                    let val = options.data[key];
                    if(typeof val == 'boolean') val = val ? 1 : 0;

                    if(i == keys.length - 1) {
                        set += ` ${key} = '${val}'`;
                        next(set);
                    } else {
                        set += ` ${key} = '${val}',`;
                    }
                })
            }).then((set) => {
                let where = Array.isArray(options.where) ? options.where.join(' ') : options.where;
                let sql = `UPDATE ${options.table} ${set} WHERE ${where}`;
                Connect().then((err)=>{
                    if(err) res({error: err});
                    con.query(sql, (err, result)=>{
                        if(err) res({error: err});
                        res(result);
                    })
                })
            })
        } else {
            res({error: 'missing options {table: String, data: Object, where: String[] }'});
        }
    })
}

function Insert(table, data) {
    return new Promise((res) => {
        Query(`INSERT INTO ${table} (${Object.keys(data).join(',')}) VALUES (${"'" + Object.values(data).join("','") + "'"})`).then((result) => {
            if(!result.error) res(result);
            else res(result);
        })
    })
}

function InsertMultiple(table, dataArray) {
    return new Promise(async (res) => {
        if(table && Array.isArray(dataArray)) {
            let firstKeys;
            let newDataArray = [];
            let insertData = [];
            let error = false;
            for(let i = 0; i < dataArray.length; i++) {
                let data = dataArray[i];
                let newData = {};
                if(!firsKeys) {
                    newData = await LoadData(table, data);
                    firstKeys = Object.keys(newData);
                } else {
                    for(let k = 0; k < firstKeys.length; k++) {
                        let key = firstKeys[k];
                        if(data[key]) {
                            newData[key] = data[key];
                        } else {
                            error = true;
                            break;
                        }
                    }
                }
                if(error) break;
                newDataArray.push(newDataArray);
            }

            if(!error) {
                // insert data
                for(let i = 0; i < newDataArray.length; i++) {
                    insertData.push( await Insert(table, newDataArray[i]));
                    if(insertData[i].error) {
                        break;
                    }
                }
                res(insertData);

            } else {
                res(false);
            }

        } else {
            res(false);
        }
    })
}

function LoadData(table, data) {
    return new Promise((res) => {
        Query(`SELECT * from INFORMATION_SCHEMA.COLUMNS where TABLE_NAME='${table}'`).then((columns) => {
            if(data) {
                let returnData = {};
                columns.forEach((column, i) => {
                    let col_name = column.COLUMN_NAME
                    if(data[col_name]) {
                        returnData[col_name] = data[col_name];
                    } else if(column.IS_NULLABLE) {
                        returnData[col_name] = null;
                    }

                    if(columns.length - 1 == i) {
                        res(returnData);
                    }
                });
            } else {
                res(false);
            }
        })
    })
}

function Connect(){
    return new Promise((res)=>{
        if(connected) res();
        else {
            try {
                con.connect((err)=>{
                    if(err) {
                        res(err);
                    } else {
                        connected = true;
                        res();
                    }
                })
            } catch (e) {
            }
        }
    })
}


module.exports.select = Select;
module.exports.query = Query;
module.exports.getRow = GetRow;
module.exports.insert = Insert;
module.exports.insertMultiple = InsertMultiple;
module.exports.update = Update;
module.exports.loadData = LoadData;