
var geoInfo = new GeoInfo();

var onBSearchClick = function()
{
    var name = $('#name').val();

    if (name.length < 1)
    {
        alert('input object name to search!');
    }
    else
    {
        geoInfo.getInfo(name, 1);
    }
};

$('#bSearch').click(onBSearchClick);