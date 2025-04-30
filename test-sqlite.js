const Database = require('better-sqlite3');
const db = new Database('test.db');
db.exec('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)');
console.log('¡Base de datos SQLite funciona!');