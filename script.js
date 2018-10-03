var map;
var polygonPerim = [];
var rectangle = [];
// Puntos cardinales convertidos a angulos
var cardinalPoints = {
    north: 0,
    east: 90,
    south: 180,
    west: 270
}

// Función de inicialización del mapa
function initMap() {
    // Configuración inicial del mapa, almacenado en una variable global
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 24.018495, lng: -104.5480484 },
        zoom: 15
    });

    // Herramientas de dibujo de google maps, se da de alta las opciones de dichas herramientas
    var drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.MARKER,
        drawingControl: true,
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            //He
            drawingModes: ['marker', 'polyline', 'polygon', 'rectangle']
        },
        markerOptions: { icon: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png' },

    });
    drawingManager.setMap(map);

    // Evento de terminar el poligono, al terminar imprime la distancia en kilometros y millas del perimetro
    google.maps.event.addListener(drawingManager, 'polygoncomplete', function (poly) {
        poly.getPath().forEach(pos => {
            polygonPerim.push({ lat: pos.lat(), lng: pos.lng() })
        });
        console.log(polygonPerim);
        console.log(distanceOfRoute(polygonPerim));
    });

    // Evento de terminar la polilinea, al terminar imprime la distancia en kilometros y millas
    google.maps.event.addListener(drawingManager, 'polylinecomplete', function (poly) {
        poly.getPath().forEach(pos => {
            polygonPerim.push({ lat: pos.lat(), lng: pos.lng() })
        });
        console.log(polygonPerim);
        console.log(distanceOfRoute(polygonPerim));
    });

    //Evento de terminar el rectangulo
    google.maps.event.addListener(drawingManager, 'rectanglecomplete', function (poly) {
        console.log(poly);
        console.log(poly.getBounds().getNorthEast());
        console.log(poly.getBounds().getSouthWest());

        //Marcadores de las esquinas del rectangulo
        var posMarkerNorth = {
            lat: poly.getBounds().getNorthEast().lat(),
            lng: poly.getBounds().getNorthEast().lng()
        }

        var markerNorth = new google.maps.Marker({
            position: posMarkerNorth,
            map: map,
        });
        var posMarkerSouth = {
            lat: poly.getBounds().getSouthWest().lat(),
            lng: poly.getBounds().getSouthWest().lng()
        }

        var markerSouth = new google.maps.Marker({
            position: posMarkerSouth,
            map: map,
        });

        // Linea diagonal del rectangulo
        var diagonalPath = [
            posMarkerNorth,
            posMarkerSouth,
        ];


        var diagonal = new google.maps.Polyline({
            path: diagonalPath,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2,
            map: map
        });

        // Dibujar una linea sabiendo solo su punto inicial, la longitud y la dirección a la cúal queremos dibujar
        var distance_in_meter = 300;
        var bearing = cardinalPoints.west;

        var start = new LatLon(posMarkerNorth.lat, posMarkerNorth.lng);

        var destination = start.rhumbDestinationPoint(distance_in_meter, bearing);
        var impactP = new google.maps.Polyline({
            map: map,
            path: [new google.maps.LatLng(posMarkerNorth.lat, posMarkerNorth.lng),
            new google.maps.LatLng(destination.lat, destination.lon)
            ],
            strokeColor: "#FF0000",
            strokeOpacity: 1.0,
            strokeWeight: 2
        });

        var markerDest = new google.maps.Marker({
            position: new google.maps.LatLng(destination.lat, destination.lon),
            map: map
        });


        console.log(distanceOfRoute(diagonalPath));
    });



}


// Distancia entre 2 puntos teniendo latitud y longitud
function getDistanceBetweenPoints(start, end, units) {

    let earthRadius = {
        miles: 3958.8,
        km: 6371
    };

    var R = earthRadius[units || 'km'];
    var lat1 = start.lat;
    var lon1 = start.lng;
    var lat2 = end.lat;
    var lon2 = end.lng;

    var dLat = toRad((lat2 - lat1));
    var dLon = toRad((lon2 - lon1));
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;

    return d;
}

function toRad(x) {
    return x * Math.PI / 180;
}

// Distancia de un array de posiciones
function distanceOfRoute(route) {
    console.log(route);
    let result = {
        miles: 0,
        km: 0
    }
    for (let i = 0; i < route.length - 1; i++) {
        result.km = result.km + getDistanceBetweenPoints(route[i], route[i + 1], "km");
        result.miles = result.miles + getDistanceBetweenPoints(route[i], route[i + 1], "miles");
    }
    return result;
}
