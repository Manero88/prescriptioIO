const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'prescriptionio'
});

connection.connect((err) => {
  if (err) {
    console.error('Fout bij het verbinden met de database: ' + err.stack);
    return;
  }
  console.log('Verbonden met de database als id ' + connection.threadId);
});

module.exports = connection;
