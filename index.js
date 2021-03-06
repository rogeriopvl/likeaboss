http   = require('http')
https  = require('https')
fs     = require('fs')
url    = require('url')

req    = require('request')
server = require('node-router').getServer()
im     = require('imagemagick')

function fetch(query,cb){
    var google = 'http://ajax.googleapis.com/ajax/services/search/images?v=1.0&rsz=8&q=' + encodeURI(query)
        req({uri:google}, function (e, resp, body) {
            result = JSON.parse(body)['responseData']['results'][0]

            if(result)
            cb(result['unescapedUrl'])
            else
            cb("https://img.skitch.com/20111124-bqnf4a22pqxabc6pw4912g2i8e.jpg")
        });
}

function download(match, output, addText){
    fetch(match, function(file){
        var uri  = url.parse(file)
        , host = uri.hostname
        , path = uri.pathname

        if(uri.protocol == "https:")
        var r = https
        else
        var r = http

        request = r.get({host: host, path: path}, function(res){
            res.setEncoding('binary')
            var img = ''

            res.on('data', function(chunk) {
                img += chunk
            })

        res.on('end', function(){
            fs.writeFile(output, img, 'binary', function (err) {
                if (err) console.log(err);
            })
            addText()
        })
        })
    })
}

server.get("/", function(request, response){
    fs.readFile(__dirname + '/index.html', function(err, data){
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write(data, 'utf-8');
        response.end();
    }
    );
})

server.get("/favicon.ico", function(request, response){
    return ""
})

server.get(new RegExp("^/(.*)(?:.jpg)?$"), function(request, response, match) {
    var msg   = ""
    , match = escape(match)
    , chars = match.length

    var aux = match.split('.');
    match = aux.length == 2 && aux[1] == 'jpg' ? aux[0] : match;

    if(chars < 5)
        msg = '"' + match.toUpperCase() + ' LIKE A BOSS!"'
    else
        msg = '"' + match.toUpperCase() + '\n LIKE A BOSS!"'

    var output = "/tmp/likeaboss-" + Math.floor(Math.random(10000000)*10000000) + '.jpg'
    download(match, output, function(){
        var args = [
        output,
    '-strokewidth', '2',
    '-stroke', 'black',
    '-fill', 'white',
    '-pointsize', '50',
    '-gravity', 'center',
    '-weight', '800',
    '-resize', '500x',
    '-draw', 'text 0,100 ' + unescape(msg),
    output
        ]

        im.convert(args, function(){
            fs.readFile(output, function (err, data) {
                if (err) console.log(err);
                response.writeHead(200, {'Content-Type': 'image/jpeg' })
                response.end(data)
            });
        })
    })
})

server.listen(process.env.PORT || 8080, '0.0.0.0')
