
/**
 Объект предоставления гео-данных, возвращает данные координат многоугольника описывающего гео-объекта, а
 так же положение его географического центра. После запроса с сервера кеширует эти данные в локальном
 хранилище браузера до конца текущей сессии. Объект является синглетоном.
 **/
var GeoInfo = Backbone.View.extend({
    instance: this,
    /**
     * 0 is for weight, 1 mean
     */
    method: 0,
    /**
     Конструктор, должен возвращать всегда один объект (синглетон)
     */
    initialize: function()
    {
        return this.instance;
    },
    /**
     Получение данных по гео-объекту, получает на вход имя и тип, ищет объект в локальном хранилище по
     типу и имени, если не находит, отправляет запрос на сервер для получения данных. Обрабатывает
     полученные данных оставляя только массив данных координат гео-объектов и вычисляет их географический
     центр, при этом для вычисления центра регионов состоящих из нескольких не связанных областей
     используется наибольшая из них. Перед возвращением, кеширует их в локальном хранилище по типу и
     имени. Если объект не найден возвращает false.
     **/
    getInfo: function(name, type)
    {
        if (isLocalStorageAvailable())
        {
            var sessObj = JSON.parse(sessionStorage.getItem(name));

            if (sessObj)
            {
                sessObj.fromCache = true;
                return sessObj;
            }
        }

        /* No obj in sess storage */
        var obj = this.sendQuery(name, type);

        if (obj && isLocalStorageAvailable())
        {
            sessionStorage.setItem(name, JSON.stringify(obj));
        }

        return obj;
    },
    sendQuery: function(name, type)
    {
        var url = 'http://nominatim.openstreetmap.org/search?format=json&polygon_geojson=1&bounded=1&q=';
        url += encodeURIComponent(name);
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", url, false);
        xmlHttp.send(null);

        var json = JSON.parse(xmlHttp.responseText);

        if (json.length > 0)
        {
            /* first result from search */
            var jsonObj = json[0];
            var geoJson = jsonObj.geojson;
            var coords = geoJson.coordinates;
            var polyType = geoJson.type;
            var latlngs;
            if (polyType === 'MultiPolygon')
            {
                latlngs = this.getMaxAreaPoly(coords)[0];
            }
            else if (polyType === 'Polygon')
            {
                latlngs = coords[0];
            }
            else
            {
                return false;
            }

            var center;
            switch (this.method)
            {
                case 0:
                    center = this.getCenterWeight(latlngs);
                    break;
                case 1:
                    center = this.getCenterMean(latlngs);
                    break;
            }

            var obj =
                    {
                        name: name,
                        type: type,
                        displayName: jsonObj.display_name,
                        geoJson: geoJson,
                        center: center,
                        fromCache: false
                    };
            return obj;
        }
        else
        {
            return false;
        }
    },
    /**
     * Weight center method
     */
    getCenterWeight: function(latlngs)
    {
        var x = 0;
        var y = 0;
        var z = 0;
        for (var i = 0; i < latlngs.length; i++)
        {
            var lat = latlngs[i][1];
            var lon = latlngs[i][0];
            lat = lat * Math.PI / 180;
            lon = lon * Math.PI / 180;
            x += Math.cos(lat) * Math.cos(lon);
            y += Math.cos(lat) * Math.sin(lon);
            z += Math.sin(lat);
        }

        var lonc = Math.atan2(y, x);
        var hyp = Math.sqrt(x * x + y * y);
        var latc = Math.atan2(z, hyp);

        latc = latc * 180 / Math.PI;
        lonc = lonc * 180 / Math.PI;
        var c = [lonc, latc];

        return c;
    },
    /**
     * Arithmetic mean center method
     */
    getCenterMean: function(latlngs)
    {
        var lat, lon;
        var count = latlngs.length;

        for (var i = 0; i < count; i++)
        {
            lat += latlngs[i][1];
            lon += latlngs[i][0];
        }

        var latc = lat / count;
        var lonc = lon / count;
        var c = [lonc, latc];

        return c;
    },
    getArea: function(latlngs)
    {
        var lam1 = 0, lam2 = 0, beta1 = 0, beta2 = 0, cosB1 = 0, cosB2 = 0;
        var hav = 0;
        var sum = 0;
        /* earth radius */
        var r = 6371302;

        function haversine(x)
        {
            return (1.0 - Math.cos(x)) / 2.0;
        }

        function toRad(degs)
        {
            return degs * Math.PI / 180;
        }

//        /* Geojson poly is meant to be closed, excluding last coord */
//        latlngs.pop();

        for (var i = 0; i < latlngs.length; i++)
        {

            if (i === 0)
            {
                lam1 = toRad(latlngs[i][0]);
                beta1 = toRad(latlngs[i][1]);
                lam2 = toRad(latlngs[i + 1][0]);
                beta2 = toRad(latlngs[i + 1][1]);
                cosB1 = Math.cos(beta1);
                cosB2 = Math.cos(beta2);
            }
            else
            {
                var j = (i + 1) % latlngs.length;
                lam1 = lam2;
                beta1 = beta2;
                lam2 = toRad(latlngs[j][0]);
                beta2 = toRad(latlngs[j][1]);
                cosB1 = cosB2;
                cosB2 = Math.cos(beta2);
            }

            if (lam1 !== lam2)
            {
                hav = haversine(beta2 - beta1) +
                        cosB1 * cosB2 * haversine(lam2 - lam1);
                var a = 2 * Math.asin(Math.sqrt(hav));
                var b = Math.PI / 2 - beta2;
                var c = Math.PI / 2 - beta1;
                var s = 0.5 * (a + b + c);
                var t = Math.tan(s / 2) * Math.tan((s - a) / 2) *
                        Math.tan((s - b) / 2) * Math.tan((s - c) / 2);
                var excess = Math.abs(4 * Math.atan(Math.sqrt(
                        Math.abs(t))));
                if (lam2 < lam1)
                {
                    excess = -excess;
                }

                sum += excess;
            }
        }
        return Math.abs(sum) * r * r;
    },
    /**
     * Gets multipolygon geojson returns max area poly coords array
     */
    getMaxAreaPoly: function(polys)
    {
        var areaMaps = [];
        for (var i = 0; i < polys.length; i++)
        {
            var poly = polys[i];
            var area;

            /* simple poly */
            if (poly.length === 1)
            {
                area = this.getArea(poly[0]);
            }
            /* poly with holes */
            else
            {
                var ring = this.getArea(poly[0]);
                var holes;

                /* 1 element - first hole */
                for (var i = 1; i < poly.length; i++)
                {
                    holes += this.getArea(poly[i]);
                }

                area = ring - holes;
            }
            console.log(i + ' :' + area);
            /* area to key mapping */
            var areaMap =
                    {
                        key: i,
                        val: area
                    };
            areaMaps.push(areaMap);
        }

        var sortRule = function(a, b) {
            return a.val - b.val;
        };
        areaMaps.sort(sortRule);
        var pop = areaMaps.pop();
        alert('maxarea ' + pop.key + ' area= ' + pop.val);
        return polys[pop.key];
    }
});