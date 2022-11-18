"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbQuery = void 0;
async function dbQuery(db, query, values) {
    return new Promise((resolve, reject) => {
        db.query(query, values, (err, result) => {
            if (err)
                reject(err);
            resolve(result);
        });
    });
}
exports.dbQuery = dbQuery;
