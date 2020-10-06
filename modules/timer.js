const { Subject } = require("rxjs");

function Timer(date) {
    this.timeout = null;
    this.timeSubject = null;

    this.at = (date) => {
        this.timeSubject = new Subject();
        let expiration = 0;
        if(date instanceof Date) {
            expiration = date.getTime();
        } else if(typeof date == 'number') {
            expiration = date;
        } else {
            this.timeSubject.next(false);
        }
        this.timeout = setTimeout(() => {this.timeSubject.next(true)}, expiration - new Date().getTime());
        return this.timeSubject;
    }

    this.cancel = () => {
        clearTimeout(this.timeout);
    }

    this.updateExpiration = (date) => {
        clearTimeout(this.timeout);
        let expiration = 0;
        if(date instanceof Date) {
            expiration = date.getTime();
        } else if(typeof date == 'number') {
            expiration = date;
        } else {
            this.timeSubject.next(false);
        }
        this.timeout = setTimeout(() => {this.timeSubject.next(true)}, expiration - new Date().getTime());
    }
}

module.exports = Timer;