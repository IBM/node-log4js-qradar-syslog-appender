module.exports = function (string) { 
    var buf = new Buffer(string, "base64"); 
    return buf.toString(); 
}

