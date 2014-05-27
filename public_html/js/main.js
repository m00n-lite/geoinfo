

function displayObjInfo(obj)
{
    /* showing div */
    $('#result').show();

    $('#displayQuery').text(obj.name);
    $('#displayName').text(obj.displayName);
    $('#polygonType').text(obj.geoJson.type);
    $('#center').text(obj.center);
    $('#fromCache').text(obj.fromCache);
}

function onQuerySend()
{
    /* disabling search button to prevent overlapping queries */
    $('#bSearch').prop('disabled', true);
    $('#inProgress').show();
}

function onQueryComplete()
{
    $('#bSearch').prop('disabled', false);
    $('#inProgress').hide();
}

function displayCacheInfo()
{
    if (isLocalStorageAvailable())
    {
        $('#incache').text(sessionStorage.length);
    }
}

var onBSearchClick = function()
{
    var query = $('#query').val();

    if (query.length < 1)
    {
        alert('input object name to search!');
    }
    else
    {
        onQuerySend();
        var obj = geoInfo.getInfo(query, new Type('fd', 'r')); //type is a stub
        onQueryComplete();
        displayCacheInfo();

        if (obj)
        {
            displayObjInfo(obj);
        }
        else
        {
            alert('no objects found');
        }
    }
};


var geoInfo = new GeoInfo();

displayCacheInfo();
$('#bSearch').click(onBSearchClick);