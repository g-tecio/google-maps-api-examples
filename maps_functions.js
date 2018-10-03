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

function toRad(x) { return x * Math.PI / 180; }
function toDegrees(x) { return x * 180 / Math.PI; };

// Distancia de un array de posiciones
function distanceOfRoute(route) {

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

// Trazar un punto de destino apartir de un punto inicial, distancia y dirección
function traceDestinationPoint (start, distance, bearing, radius) {
    radius = (radius === undefined) ? 6371e3 : Number(radius);

    var δ = Number(distance) / radius;
    var φ1 = toRad(start.lat), λ1 = toRad(start.lng);
    var θ = toRad(Number(bearing));

    var Δφ = δ * Math.cos(θ);
    var φ2 = φ1 + Δφ;

    if (Math.abs(φ2) > Math.PI/2) φ2 = φ2>0 ? Math.PI-φ2 : -Math.PI-φ2;

    var Δψ = Math.log(Math.tan(φ2/2+Math.PI/4)/Math.tan(φ1/2+Math.PI/4));
    var q = Math.abs(Δψ) > 10e-12 ? Δφ / Δψ : Math.cos(φ1); 

    var Δλ = δ*Math.sin(θ)/q;
    var λ2 = λ1 + Δλ;

    return ({ lat: toDegrees(φ2), lng: (toDegrees(λ2)+540) % 360 - 180 }) 
}
