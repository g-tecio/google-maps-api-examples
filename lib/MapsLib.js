class MapsLib {
    // Distancia entre 2 puntos teniendo latitud y longitud
    static getDistanceBetweenPoints(start, end, units) {

        let earthRadius = {
            miles: 3958.8,
            km: 6371
        };

        var R = earthRadius[units || 'km'];
        var lat1 = start.lat;
        var lon1 = start.lng;
        var lat2 = end.lat;
        var lon2 = end.lng;

        var dLat = MapsLib.toRad((lat2 - lat1));
        var dLon = MapsLib.toRad((lon2 - lon1));
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(MapsLib.toRad(lat1)) * Math.cos(MapsLib.toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;

        return d;
    }

    static toRad(x) { return x * Math.PI / 180; }
    static toDegrees(x) { return x * 180 / Math.PI; };

    // Distancia de un array de posiciones
    static distanceOfRoute(route) {

        let result = {
            miles: 0,
            km: 0
        }
        for (let i = 0; i < route.length - 1; i++) {
            result.km = result.km + MapsLib.getDistanceBetweenPoints(route[i], route[i + 1], "km");
            result.miles = result.miles + MapsLib.getDistanceBetweenPoints(route[i], route[i + 1], "miles");
        }
        return result;
    }

    // Trazar un punto de destino apartir de un punto inicial, distancia y dirección
    static traceDestinationPoint(start, distance, bearing, radius) {
        radius = (radius === undefined) ? 6371e3 : Number(radius);

        var δ = Number(distance) / radius;
        var φ1 = MapsLib.toRad(start.lat), λ1 = MapsLib.toRad(start.lng);
        var θ = MapsLib.toRad(Number(bearing));

        var Δφ = δ * Math.cos(θ);
        var φ2 = φ1 + Δφ;

        if (Math.abs(φ2) > Math.PI / 2) φ2 = φ2 > 0 ? Math.PI - φ2 : -Math.PI - φ2;

        var Δψ = Math.log(Math.tan(φ2 / 2 + Math.PI / 4) / Math.tan(φ1 / 2 + Math.PI / 4));
        var q = Math.abs(Δψ) > 10e-12 ? Δφ / Δψ : Math.cos(φ1);

        var Δλ = δ * Math.sin(θ) / q;
        var λ2 = λ1 + Δλ;

        return ({ lat: MapsLib.toDegrees(φ2), lng: (MapsLib.toDegrees(λ2) + 540) % 360 - 180 })
    }

    static objectToLatLng(pos_object) {
        return new LatLng(pos_object.lat, pos_object.lng);
    }

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

if (Number.prototype.toRadians === undefined) {
    Number.prototype.toRadians = function () { return this * Math.PI / 180; };
}

if (Number.prototype.toDegrees === undefined) {
    Number.prototype.toDegrees = function () { return this * 180 / Math.PI; };
}
