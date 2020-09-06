function initMap() {
    var directionsService = new google.maps.DirectionsService;
    var directionsDisplay = new google.maps.DirectionsRenderer({
        suppressMarkers: true
    });
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 6,
        center: {
            lat: 41.85,
            lng: -87.65
        }
    });
    directionsDisplay.setMap(map);
    this.map = map;
    var startInput = document.getElementById("start");
    var endInput = document.getElementById("end");
    this.startInput = startInput;
    this.endInput = endInput;
    document.getElementById('submit').addEventListener('click', function (e) {
        if (startInput.value && endInput.value) {
            $("i").addClass("fa fa-spinner fa-spin");

            getCordinatesData(directionsService, directionsDisplay);
            e.preventDefault();
        } else {
            window.alert('Please enter Start and End Location to proceed');
        }
    });
    eventForEnterKeyPress("start", startInput, endInput, directionsService, directionsDisplay);
    eventForEnterKeyPress("end", startInput, endInput, directionsService, directionsDisplay);


}

function getCordinatesData(directionsService, directionsDisplay) {
    directionsService.route({
        origin: this.startInput.value,
        destination: this.endInput.value,
        waypoints: [],
        optimizeWaypoints: true,
        travelMode: 'DRIVING'
    }, function (response, status) {
        if (status === 'OK') {
            var maps = this.map;
            //directionsDisplay.setDirections(response);

            var address, title, i = 0,
                j = 0,
                weatherInfoCities = [];
            var Steps = response.routes[0].legs[0].steps;
            var step0 = Steps.shift();
            var stepn = Steps.pop();
            weatherInfoCities.push({
                lat: step0.start_location.lat().toFixed(2),
                lon: step0.start_location.lng().toFixed(2)
            });
            var stepLength = Steps.length,
                counter = Math.floor(stepLength / 4),
                Lat, Long,
                locArray = [];
            locArray[weatherInfoCities[0].lat + "," + weatherInfoCities[0].lon] = true;
            for (i = 0; i < stepLength;) {

                Lat = Steps[i].start_location.lat().toFixed(2);
                Long = Steps[i].start_location.lng().toFixed(2);
                if (!locArray[Lat + "," + Long]) {
                    locArray[Lat + "," + Long] = true;

                    weatherInfoCities.push({
                        lat: Lat,
                        lon: Long
                    });
                }
                i = i + counter;

            }
            if (!locArray[stepn.end_location.lat().toFixed(2) + "," + stepn.end_location.lng().toFixed(2)]) {
                weatherInfoCities.push({
                    lat: stepn.end_location.lat().toFixed(2),
                    lon: stepn.end_location.lng().toFixed(2)
                });
            }
            this.weatherInfoCities = weatherInfoCities;
            if (weatherInfoCities) {
                callBackendAPI(weatherInfoCities, directionsService, directionsDisplay);
            }

            //return cityNames;



        } else {
            window.alert('Directions request failed due to ' + status);
        }
    });

}

function callBackendAPI(cityArray, directionsService, directionsDisplay) {
    var sDate = new Date();
    sDate = sDate.toDateString();

    // DO POST
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: "/",
        data: JSON.stringify(cityArray),
        dataType: 'json',
        success: function (result) {
            if (result.length > 0) {

                debugger;
                console.log(result);
                calculateAndDisplayRoute(directionsService, directionsDisplay, result);
                //window.alert('sucess');
            } else {
                window.alert('Error, No Data Found!!');
            }
        },
        error: function (error) {
            window.alert(error.statusText);
            debugger;
        }
    });


}

function eventForEnterKeyPress(sId, startInput, endInput, directionsService, directionsDisplay) {

    var input = sId === "start" ? startInput : endInput;
    // Execute a function when the user releases a key on the keyboard
    input.addEventListener("keyup", function (event) {
        // Cancel the default action, if needed
        event.preventDefault();
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13 && startInput.value && endInput.value) {
            // Trigger the call to get weather data
            $("i").addClass("fa fa-spinner fa-spin");
            getCordinatesData(directionsService, directionsDisplay);
        }
    });
}


function calculateAndDisplayRoute(directionsService, directionsDisplay, weatherData) {
    this.weatherData = weatherData;
    if (!this.markerArray) {
        this.markerArray = [];
    }
    var waypts = [],
        address;
    /* for (var i = 0; i < weatherData.length; i++) {
        if(this.startInput.value.toUpperCase().search(weatherData[i].City.toUpperCase()) === -1 || this.endInput.value.toUpperCase().search(weatherData[i].City.toUpperCase()) === -1 ) {
        address = weatherData[i].City;
        waypts.push({
            location: address,
            stopover: true
        });
        } 
    	

    } */
    for (var i = 0; i < this.markerArray.length; i++) {
        this.markerArray[i].setMap(null);
    }

    directionsService.route({
        origin: this.startInput.value,
        destination: this.endInput.value,
        waypoints: [],
        optimizeWaypoints: true,
        travelMode: 'DRIVING'
    }, function (response, status) {
        if (status === 'OK') {
            //response.routes[0].legs.shift();
            var maps = this.map;
            directionsDisplay.setDirections(response);
            var weatherData = this.weatherData,
                address, title, i = 0,
                j = 0,
                weatherInfo = {};
            for (i = 0; i < weatherData.length; i++) {
                if (this.startInput.value.toUpperCase().search(weatherData[i].City.toUpperCase()) > -1) {
                    position = response.routes[0].legs[0].start_location;
                } else if (this.endInput.value.toUpperCase().search(weatherData[i].City.toUpperCase()) > -1) {
                    position = response.routes[0].legs[0].end_location;
                } else {
                    position = { lat: parseFloat(weatherData[i].Lat), lng: parseFloat(weatherData[i].Long) };
                    //position = i < response.routes[0].legs.length - 1 ? response.routes[0].legs[i].start_location : response.routes[0].legs[i].end_location;
                    //title = i < response.routes[0].legs.length - 1 ? response.routes[0].legs[i].start_address : response.routes[0].legs[i].end_address;					
                }
                makeMarker(position, weatherData[i], maps);



            }
            $("i").removeClass("fa fa-spinner fa-spin");

        } else {
            window.alert('Directions request failed due to ' + status);
        }
    });
}


function makeMarker(position, weatherInfo, map) {
    var iconUrl = "http://openweathermap.org/img/w/" + weatherInfo.Icon + ".png";
    var contentString = '<div id="content">' +
        '<div id="weatherInfo">' +
        '</div>' +
        '<h3 id="heading" class="firstHeading">' + weatherInfo.City + '</h3>' +
        '<div id="bodyContent">' +
        '<p><b>Weather Information: </b><br/>' +
        '<img src="' + iconUrl + '"><br/>' +
        weatherInfo.Title + '<br/>' +
        'Temperataure: ' + weatherInfo.Temperature + '&#176; F<br/>' +
        'Low: ' + weatherInfo.MinTemp + '&#176; F<br/>' +
        'High: ' + weatherInfo.MaxTemp + '&#176; F<br/>' +
        'Humidity: ' + weatherInfo.Humidity + '%<br/>' +
        'Wind Speed: ' + weatherInfo.Speed + ' mph</p>' +
        '</div>' +
        '</div>';
    var infowindow = new google.maps.InfoWindow({
        content: contentString
    });
    var icons = {
        start: new google.maps.MarkerImage(
            // URL
            //'https://maps.google.com/mapfiles/kml/pal4/icon44.png',
            iconUrl,
            // (width,height)
            new google.maps.Size(44, 32),
            // The origin point (x,y)
            new google.maps.Point(0, 0),
            // The anchor point (x,y)
            new google.maps.Point(22, 32)
        )
    };

    var mark = new google.maps.Marker({
        title: weatherInfo.City,
        // label: title,
        // icon: "http://openweathermap.org/img/w/"+ weatherInfo.Icon + ".png",
        icon: icons.start,
        animation: google.maps.Animation.DROP,
        position: position,
        map: map
    });
    mark.addListener('click', function () {
        infowindow.open(map, mark);
    });
    //mark.setMap(map);
    //mark.setPosition(position);


    this.markerArray.push(mark);

}