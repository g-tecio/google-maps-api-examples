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

        //var start = new LatLon(posMarkerNorth.lat, posMarkerNorth.lng);

        var destination = traceDestinationPoint(posMarkerNorth, distance_in_meter, bearing);
        console.log(destination);
        var impactP = new google.maps.Polyline({
            map: map,
            path: [new google.maps.LatLng(posMarkerNorth.lat, posMarkerNorth.lng),
            new google.maps.LatLng(destination.lat, destination.lng)
            ],
            strokeColor: "#FF0000",
            strokeOpacity: 1.0,
            strokeWeight: 2
        });

        var markerDest = new google.maps.Marker({
            position: new google.maps.LatLng(destination.lat, destination.lng),
            map: map
        });


        console.log(distanceOfRoute(diagonalPath));
    });



}



