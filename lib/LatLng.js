class LatLng {
    constructor(lat, lng) {
        if (!(this instanceof LatLng)) return new LatLng(lat, lng);

        this.lat = Number(lat);
        this.lng = Number(lng);
    }
    bearingTo (point) {
        if (!(point instanceof LatLng)) throw new TypeError('point is not LatLng object');

        // tanθ = sinΔλ⋅cosφ2 / cosφ1⋅sinφ2 − sinφ1⋅cosφ2⋅cosΔλ
        // see mathforum.org/library/drmath/view/55417.html for derivation

        var φ1 = this.lat.toRadians(), φ2 = point.lat.toRadians();
        var Δλ = (point.lon - this.lon).toRadians();
        var y = Math.sin(Δλ) * Math.cos(φ2);
        var x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
        var θ = Math.atan2(y, x);

        return (θ.toDegrees() + 360) % 360;
    };

    equals (point) {
        if (!(point instanceof LatLng)) throw new TypeError('point is not LatLng object');

        if (this.lat != point.lat) return false;
        if (this.lng != point.lng) return false;

        return true;
    };

    finalBearingTo (point) {
        if (!(point instanceof LatLng)) throw new TypeError('point is not LatLng object');
    
        // get initial bearing from destination point to this point & reverse it by adding 180°
        return ( point.bearingTo(this)+180 ) % 360;
    };

    static areaOf(polygon, radius) {
        // uses method due to Karney: osgeo-org.1560.x6.nabble.com/Area-of-a-spherical-polygon-td3841625.html;
        // for each edge of the polygon, tan(E/2) = tan(Δλ/2)·(tan(φ1/2) + tan(φ2/2)) / (1 + tan(φ1/2)·tan(φ2/2))
        // where E is the spherical excess of the trapezium obtained by extending the edge to the equator

        var R = (radius === undefined) ? 6371e3 : Number(radius);

        // close polygon so that last point equals first point
        var closed = polygon[0].equals(polygon[polygon.length - 1]);
        if (!closed) polygon.push(polygon[0]);

        var nVertices = polygon.length - 1;

        var S = 0; // spherical excess in steradians
        for (var v = 0; v < nVertices; v++) {
            var φ1 = polygon[v].lat.toRadians();
            var φ2 = polygon[v + 1].lat.toRadians();
            var Δλ = (polygon[v + 1].lng - polygon[v].lng).toRadians();
            var E = 2 * Math.atan2(Math.tan(Δλ / 2) * (Math.tan(φ1 / 2) + Math.tan(φ2 / 2)), 1 + Math.tan(φ1 / 2) * Math.tan(φ2 / 2));
            S += E;
        }

        if (isPoleEnclosedBy(polygon)) S = Math.abs(S) - 2 * Math.PI;

        var A = Math.abs(S * R * R); // area in units of R

        if (!closed) polygon.pop(); // restore polygon to pristine condition

        return A;

        // returns whether polygon encloses pole: sum of course deltas around pole is 0° rather than
        // normal ±360°: blog.element84.com/determining-if-a-spherical-polygon-contains-a-pole.html
        function isPoleEnclosedBy(polygon) {
            // TODO: any better test than this?
            var ΣΔ = 0;
            var prevBrng = polygon[0].bearingTo(polygon[1]);
            for (var v = 0; v < polygon.length - 1; v++) {
                var initBrng = polygon[v].bearingTo(polygon[v + 1]);
                var finalBrng = polygon[v].finalBearingTo(polygon[v + 1]);
                ΣΔ += (initBrng - prevBrng + 540) % 360 - 180;
                ΣΔ += (finalBrng - initBrng + 540) % 360 - 180;
                prevBrng = finalBrng;
            }
            var initBrng = polygon[0].bearingTo(polygon[1]);
            ΣΔ += (initBrng - prevBrng + 540) % 360 - 180;

            var enclosed = Math.abs(ΣΔ) < 90; // 0°-ish
            return enclosed;
        }
    };
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
function traceDestinationPoint(start, distance, bearing, radius) {
    radius = (radius === undefined) ? 6371e3 : Number(radius);

    var δ = Number(distance) / radius;
    var φ1 = toRad(start.lat), λ1 = toRad(start.lng);
    var θ = toRad(Number(bearing));

    var Δφ = δ * Math.cos(θ);
    var φ2 = φ1 + Δφ;

    if (Math.abs(φ2) > Math.PI / 2) φ2 = φ2 > 0 ? Math.PI - φ2 : -Math.PI - φ2;

    var Δψ = Math.log(Math.tan(φ2 / 2 + Math.PI / 4) / Math.tan(φ1 / 2 + Math.PI / 4));
    var q = Math.abs(Δψ) > 10e-12 ? Δφ / Δψ : Math.cos(φ1);

    var Δλ = δ * Math.sin(θ) / q;
    var λ2 = λ1 + Δλ;

    return ({ lat: toDegrees(φ2), lng: (toDegrees(λ2) + 540) % 360 - 180 })
}

function objectToLatLng(pos_object) {
    return new LatLng(pos_object.lat, pos_object.lng);
}

if (Number.prototype.toRadians === undefined) {
    Number.prototype.toRadians = function () { return this * Math.PI / 180; };
}

if (Number.prototype.toDegrees === undefined) {
    Number.prototype.toDegrees = function () { return this * 180 / Math.PI; };
}