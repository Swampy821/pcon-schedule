'use strict';

const  MongoClient = require('mongodb').MongoClient
const data = require('./export.json');
const connUrl = 'mongodb://localhost:27017/PP';
const dateFormat = require('dateformat');
const formatStyle = 'mm/dd/yyyy';

function convertObj(obj) {
    return {
        day: dateFormat(new Date(obj.start_date), formatStyle),
        endday: dateFormat(new Date(obj.end_date), formatStyle),
        time: obj.start_time,
        endtime: obj.end_time,
        title: obj.name,
        topic: obj.event_type,
        room: obj.venue,
        blurb: obj.description,
        allday: false,
        presenter: (obj.speakers ? obj.speakers[0].name : 'TBA'),
        active: true
    };
}




let globalDb;
let globalCollection
(() => {
    return new Promise((resolve, reject) => {
        MongoClient.connect(connUrl, function(err, db) {
            if(err) {
                reject(err);
            } else {
                resolve(db);
            }
        });
    })
})()
    .then((db) => {
        globalDb = db;
        globalCollection = db.collection('sched');
        return Promise.resolve({
            db: db,
            collection: db.collection('sched')
        });
    })
    .then(({db, collection}) => {
        let promiseArray = [];
        data.forEach((item) => {
            promiseArray.push(new Promise((resolve, reject) => {
                collection.updateOne(
                    { title : item.title }, 
                    { $set: item }, (err, result) =>{
                    if(err) {
                        reject(err);
                    } else {
                        resolve({result, item});
                    }
                });
            }))
        });

        return Promise.all(promiseArray);
    })
    .then((res) => {
        let insertArray = [];
        insertArray = res.map((item) => {
            if(item.result.result.nModified === 0) {
                return item;
            }
        });
        return Promise.all(insertArray.map((insert) => {
            return new Promise((resolve, reject) => {
                console.log(convertObj(insert.item));
                globalCollection.insertMany([convertObj(insert.item)], (err, result) => {
                        if(err) {
                            reject(err);
                        }else{
                            resolve(result);
                        }
                    });
            });
        }));
 
    })

    .then((res) => {

        globalDb.close();
    })

    .catch((err) => {
        console.error(err);
        console.error("ERROR");
    });





// data.forEach((item) => {
//     console.log(item);
// });
