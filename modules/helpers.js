module.exports.dateFormatUTC = function (date) {
    let wd;
    if(date instanceof Date) wd = date;
    else wd = new Date(date);
    return `${wd.getUTCFullYear()}-${wd.getUTCMonth() + 1}-${wd.getUTCDate()} ${wd.getUTCHours()}:${wd.getUTCMinutes()}:${wd.getUTCSeconds()}`;
}

module.exports.dateFormat = function (date) {
    let wd;
    if(date instanceof Date) wd = date;
    else wd = new Date(date);
    return `${wd.getFullYear()}-${wd.getMonth() + 1}-${wd.getDate()} ${wd.getHours()}:${wd.getMinutes()}:${wd.getSeconds()}`;
}
