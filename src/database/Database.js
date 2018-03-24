import {MongoClient} from 'mongodb';
import config from '../config';

let database;

MongoClient.connect(config.databaseUrl, (err, client) => {
  if(err) {
    return console.log(err);
  }
  database = client.db('murdokapp');
});

class Database {
  static saveToCollection(collection, data) {
    return database.collection(collection).save(data, (err, response) => {
      if(err) {
        return console.log(err);
      }

      console.log('saved successfully');
    });
  }
  
  static getFromCollection(collection, data) {
    return new Promise((resolve, reject) => {
      database.collection(collection).find(data).toArray((err, response) => {
        if(err) {
          console.log(err);
          return reject(err);
        }
        console.log('found');
        console.log(response);
        return resolve(response); 
      });
    });
  }
}

export default Database;
