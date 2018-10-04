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

const HEIGHT = 20;
const CAMERA_TAKE = {
    heigth: 60,
    width: 100
}

var RECTANGLE_DIMENTIONS = {
    heigth: 0,
    width: 0
}

// Función de inicialización del mapa
function initMap() {
    // Configuración inicial del mapa, almacenado en una variable global
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 24.018495, lng: -104.5480484 },
        zoom: 16,
        mapTypeId: 'satellite'
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
        var polygon = [];
        poly.getPath().forEach(pos => {
            var point = new LatLng(pos.lat(), pos.lng())
            polygonPerim.push(objectToJSON(point));
            polygon.push(point);
        });


        console.log(polygonPerim);
        console.log(MapsLib.distanceOfRoute(polygonPerim));
        console.log("Area of polygon: " + MapsLib.areaOf(polygon).toFixed(3) + " mts2")
    });

    // Evento de terminar la polilinea, al terminar imprime la distancia en kilometros y millas
    google.maps.event.addListener(drawingManager, 'polylinecomplete', function (poly) {
        var polyLine = [];
        poly.getPath().forEach(pos => {
            polyLine.push({ lat: pos.lat(), lng: pos.lng() })
        });
        console.log(MapsLib.distanceOfRoute(polyLine));
    });

    //Evento de terminar el rectangulo
    google.maps.event.addListener(drawingManager, 'rectanglecomplete', function (poly) {

        //Marcadores de las esquinas del rectangulo
        var posMarkerNorthEast = {
            lat: poly.getBounds().getNorthEast().lat(),
            lng: poly.getBounds().getNorthEast().lng()
        }


        var posMarkerSouthWest = {
            lat: poly.getBounds().getSouthWest().lat(),
            lng: poly.getBounds().getSouthWest().lng()
        }

        var posMarkerSouthEast = objectToJSON(MapsLib.intersection(LatLng.objectToLatLng(posMarkerSouthWest),
            cardinalPoints.east,
            LatLng.objectToLatLng(posMarkerNorthEast),
            cardinalPoints.south));

        var posMarkerNorthWest = objectToJSON(MapsLib.intersection(LatLng.objectToLatLng(posMarkerNorthEast),
            cardinalPoints.west,
            LatLng.objectToLatLng(posMarkerSouthWest),
            cardinalPoints.north));



        /* var markerNorthEast = new google.maps.Marker({
            position: posMarkerNorthEast,
            map: map,
        });

        var markerSouthWest = new google.maps.Marker({
            position: posMarkerSouthWest,
            map: map,
        });

        var markerNorthWest = new google.maps.Marker({
            position: posMarkerNorthWest,
            map: map,
        });

        var markerSouthEast = new google.maps.Marker({
            position: posMarkerSouthEast,
            map: map,
        }); */

        // Linea diagonal del rectangulo
        var diagonalPath = [
            posMarkerNorthEast,
            posMarkerSouthWest,
        ];
        var home = posMarkerNorthEast;
        // Dibujar una linea sabiendo solo su punto inicial, la longitud y la dirección a la cúal queremos dibujar
        // Set up de la ruta
        var drone_position = home;

        drone_position = MapsLib.drawStep(CAMERA_TAKE.width / 2, cardinalPoints.west, drone_position);

        var direction = cardinalPoints.south;
        var last_direction;

        // Base y altura
        var distance_width = MapsLib.getDistanceBetweenPoints(posMarkerNorthWest, posMarkerNorthEast) * 1000;
        var distance_height = MapsLib.getDistanceBetweenPoints(posMarkerNorthWest, posMarkerSouthWest) * 1000;

        var distance_traveled = CAMERA_TAKE.width / 2;
        var step;
        // Dibujar la ruta
        while (distance_traveled + CAMERA_TAKE.width <= distance_width) {
            step = (direction == cardinalPoints.west) ? CAMERA_TAKE.width : distance_height;
            if (direction == cardinalPoints.west && distance_traveled + step > distance_width) {
                step = distance_width - distance_traveled;
            }

            drone_position = MapsLib.drawStep(step, direction, drone_position);

            if (direction == cardinalPoints.west) {
                distance_traveled += CAMERA_TAKE.width;
            }

            if (direction != cardinalPoints.west) {
                last_direction = direction;
                direction = cardinalPoints.west;
            } else {
                direction = (last_direction == cardinalPoints.south) ? cardinalPoints.north : cardinalPoints.south;
            }

        };
        // Ultimo paso
        direction = (last_direction == cardinalPoints.south) ? cardinalPoints.north : cardinalPoints.south;
        var step = (direction == cardinalPoints.west) ? CAMERA_TAKE.width : distance_height;
        drone_position = MapsLib.drawStep(step, direction, drone_position);
        // Regreso a casa
        var return_to_home = new google.maps.Polyline({
            map: map,
            path: [drone_position,
                home
            ],
            strokeColor: "#FF0000",
            strokeOpacity: 1.0,
            strokeWeight: 2
        });
        drone_position = home;


        console.log(MapsLib.distanceOfRoute(diagonalPath));
    });

}



