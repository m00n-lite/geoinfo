
/**
 Объект предоставления гео-данных, возвращает данные координат многоугольника описывающего гео-объекта, а
 так же положение его географического центра. После запроса с сервера кеширует эти данные в локальном
 хранилище браузера до конца текущей сессии. Объект является синглетоном.
 **/
var GeoInfo = Backbone.View.extend({
    instance: this,
    latlngs: null,
    name: null,
    /**
     * 0 is for weight, 1 mean
     */
    method: 0,
    /**
     Тип гео-объекта
     */
    type: new Type(),
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
        this.name = name;
        this.type = type;

        var url = 'http://nominatim.openstreetmap.org/search?format=json&polygon_geojson=1&bounded=1&q=';
        url += encodeURIComponent(this.name);
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", url, false);
        xmlHttp.send(null);

        var json = JSON.parse(xmlHttp.responseText);

        if (json.length > 0)
        {
            alert(json[0].display_name);
        }
        else
        {
            alert('no objects found');
        }
    },
    /**
     * Weight center method
     */
    getCenterWeight: function()
    {
        var x = 0;
        var y = 0;
        var z = 0;
        for (var i = 0; i < this.latlngs.length; i++)
        {
            var lat = this.latlngs[i][1];
            var lon = this.latlngs[i][0];
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
    getCenterMean: function()
    {
        var lat, lon;
        var count = this.latlngs.length;

        for (var i = 0; i < count; i++)
        {
            lat += this.latlngs[i][1];
            lon += this.latlngs[i][0];
        }

        var latc = lat / count;
        var lonc = lon / count;
        var c = [lonc, latc];

        return c;
    },
    getArea: function()
    {
        var lam1 = 0, lam2 = 0, beta1 = 0, beta2 = 0, cosB1 = 0, cosB2 = 0;
        var hav = 0;
        var sum = 0;

        function haversine(x)
        {
            return (1.0 - Math.cos(x)) / 2.0;
        }

        for (var j = 0; j < this.latlngs.length; j++)
        {
            var k = j + 1;
            if (j === 0)
            {
                lam1 = this.latlngs[i][0];
                beta1 = this.latlngs[i][1];
                lam2 = lngs[j + 1];
                beta2 = lats[j + 1];
                cosB1 = Math.Cos(beta1);
                cosB2 = Math.Cos(beta2);
            }
            else
            {
                k = (j + 1) % lats.Length;
                lam1 = lam2;
                beta1 = beta2;
                lam2 = lngs[k];
                beta2 = lats[k];
                cosB1 = cosB2;
                cosB2 = Math.Cos(beta2);
            }
            if (lam1 !== lam2)
            {
                hav = haversine(beta2 - beta1) +
                        cosB1 * cosB2 * haversine(lam2 - lam1);
                var a = 2 * Math.asin(Math.Sqrt(hav));
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
        return Math.Abs(sum) * r * r;
    }
});