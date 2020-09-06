var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  insecureAuth: true,
  database: "mydb"

});

con.connect(function (err) {
  if (err) {
    con.query("ALTER TABLE weather ADD Date VARCHAR(255)", function (err, result) {
      if (err) {
        console.log(err);
      }
      else {
        console.log(result);
      }
    });

  } else {
    console.log("Connected!");
  }

});