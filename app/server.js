const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const request = require('request');
const app = express()
const apiKey = 'API_KEY';

app.use(express.static('public'));
app.use(express.static('data'));
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());
app.set('view engine', 'ejs')
const config = {
	host: "localhost",
	user: "root",
	password: "password",
	insecureAuth: true,
	database: "mydb"

}

app.get('/', function (req, res, next) {
	res.render('index', {
		weather: null,
		error: null
	});
})

app.post('/', function (req, res, next) {
	var cityArray = req.body,
		cityArrayLat = [],
		cityArrayLon = [],
		sqlQueryStr,
		item;
	this.locArray = [];
	this.uniqueCity = [];
	for (var i = 0; i < cityArray.length; i++) {
		item = cityArray[i].lat + "," + cityArray[i].lon;
		this.locArray[item] = false;
		cityArrayLat[i] = cityArray[i].lat;
		cityArrayLon[i] = cityArray[i].lon;
	}
	this.cityArray = cityArray;
	var cityLatStr = cityArrayLat.join(", ");
	var cityLonStr = cityArrayLon.join(", ");
	var sdate = new Date();
	sdate = sdate.toDateString();
	this.resArray = [];
	var con = mysql.createConnection(config);
	this.con = con;
	var that = this;
	this.con.connect(async function (err) {
		if (err) {
			that.con.end();
			console.log(err);
			//res.status(500).send(err);
			nexr(err);
		} else {
			console.log("Connected!");
			var sql = "SELECT * FROM weather WHERE lat IN (" + cityLatStr + ") AND lng IN (" + cityLonStr + ") AND dated='" + sdate + "'";
			await con.query(sql, function (err, result, fields) {
				if (err) {
					console.log(err);

					next(err);


					//}
				} else {
					that.resArray = [],
						item;
					for (var i = 0; i < result.length; i++) {
						var weatherInfo = {
							City: result[i].city,
							Title: result[i].weatherdesc,
							Temperature: result[i].temp,
							Lat: result[i].lat.toFixed(2),
							Long: result[i].lng.toFixed(2),
							Humidity: result[i].humidity,
							MaxTemp: result[i].maxtemp,
							MinTemp: result[i].mintemp,
							Speed: result[i].speed,
							Icon: result[i].icon,
							TDate: result[i].dated
						}
						item = result[i].lat.toFixed(2) + "," + result[i].lng.toFixed(2);
						that.locArray[item] = true;
						that.resArray.push(weatherInfo);
					}
					var newLocArray = Object.values(that.locArray);
					if (newLocArray.length === that.resArray.length) {
						that.con.end();
						var filtered = that.resArray.filter(isUnique);
						console.log(filtered);
						res.json(filtered);
						return;
						//response sent, no further execution
					}
					createRecord(req, res, sdate);


				}
			});
		}

	});

})

function isUnique(value) {
	if (this.uniqueCity[value.City] === undefined) {
		this.uniqueCity[value.City] = true;
		return value;
	}
}

function postSuccess(res, weatherData) {
	var count = 0,
		item = weatherData.Lat + "," + weatherData.Long;
	this.resArray.push(weatherData);
	this.locArray[item] = true;
	this.newLocArray = Object.values(this.locArray);
	this.newLocArray.forEach(function (item, index) {
		if (item === true) {
			count++;
		}
	});
	if (count >= this.newLocArray.length) {

		res.json(this.resArray);
		console.log(this.resArray);
		return;

	}

}

function querySql(sql, weatherInfo) {
	var that = this;


	return new Promise(async (resolve, reject) => {

		await this.con.query(sql, (err, result) => {
			if (err) {
				console.log(err);
				reject(weatherInfo);
			} else {
				console.log(result);
				if (that.uniqueCity[weatherInfo.City] === undefined) {
					that.uniqueCity[weatherInfo.City] = true;
					that.resArray.push(weatherInfo);
				}
				resolve(weatherInfo);

			}
		});
	});
}
function promisesSuccess(promisesToMake, res) {
	Promise.all(promisesToMake).then(function (weatherData, error) {
		if (error) {
			next(error);
		} else {

			console.log(this.resArray)
			this.con.end();
			res.json(this.resArray);
			return;

		}
	});

}

function createRecord(req, res, sdate) {
	return new Promise((resolve, reject) => {
		var con = mysql.createConnection(config);
		this.con = con;
		//}
		var that = this;
		this.con.connect(async function (err) {
			if (err) {
				console.log(err);
			} else {
				var item,
					promisesToMake = [];
				for (var i = 0; i < that.cityArray.length; i++) {
					item = cityArray[i].lat + "," + cityArray[i].lon;
					if (that.locArray[item] === false) {
						try {
							await readWeatherAPIData(req, res, that.cityArray[i], sdate).then(async function (weatherInfo) {


								var valueStr = "'" + weatherInfo.City + "'," + weatherInfo.Lat + "," + weatherInfo.Long + ",'" + weatherInfo.Temperature + "','" +
									weatherInfo.Title + "','" + weatherInfo.Icon + "','" + weatherInfo.MinTemp + "','" + weatherInfo.MaxTemp + "','" + weatherInfo.Humidity +
									"','" + weatherInfo.Speed + "','" + weatherInfo.TDate + "'";

								console.log("Connected!");
								var sql = "INSERT INTO weather (city, lat, lng, temp, weatherdesc, icon, mintemp, maxtemp, humidity, speed, dated) VALUES (" +
									valueStr + ")";
								try {
									promisesToMake.push(await querySql(sql, weatherInfo));
								}
								catch (err) {
									//next(err);
									console.log('error in inserting a record');
								}



							});
						}
						catch (err) {
							next(err);
						}
					}
				}
				promisesSuccess(promisesToMake, res);


			}

		});


	});
}

function readWeatherAPIData(req, res, loc, sdate) {
	return new Promise(function (resolve, reject) {

		var lat = loc.lat,
			lng = loc.lon;
		let url = `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=imperial&appid=${apiKey}`
		var that = this;
		request(url, function (err, response, body) {
			if (err) {
				next(err);

			} else {
				let weather = JSON.parse(body)
				if (!weather.weather) {
					reject(weather);
				}

				var weatherInfo = {
					City: weather.name,
					Title: weather.weather[0].description,
					Temperature: weather.main.temp,
					Lat: lat,
					Long: lng,
					Humidity: weather.main.humidity,
					MaxTemp: weather.main.temp_max,
					MinTemp: weather.main.temp_min,
					Speed: weather.wind.speed,
					Icon: weather.weather[0].icon,
					TDate: sdate
				};

				resolve(weatherInfo);

			}

		});
	});
}
app.listen(3310, function () {
	console.log('weather app listening on port 3310!')
})