var fs = require('fs');
var cyc = require("./cyc.js");
var onehtml = require("./onehtml.js");

var stringArray = []
    
fs.readFile("./book.cyc", 'utf8', (err, data) => {  
    if (err) throw err;
    let dataString = data.toString()
    let dataIncludeNum = dataString.search("@include") 
    let dataNew = dataString.slice(dataIncludeNum, -1)
    let dataList = dataNew.replace(/['"]+/g, '').replace(/@include+/g, '').replace(/\n+/g, '').replace(/\r+/g, '')
    let dataSplit = dataList.trim().split(" ")
    console.log(dataSplit)
    console.log(dataSplit.length + " .cyc files found")
    for(i=0; i < dataSplit.length; i +=1 ){
        //Use default readfile for Async > assign numbers to letters > store > shuffle in ascending 
        const stringData = fs.readFileSync("./" + dataSplit[i], 'utf8');
        stringArray.push(stringData)
    }
    console.log(stringArray.length + " .cyc Files Stringified")
    stringCombined = stringArray.join()
    let stringCyc = stringCombined.replace(/,@+/g, " @")
    //HTML Single File Processor
    let stringHTML = cyc(stringCyc, onehtml)
    fs.writeFileSync('book.html', stringHTML, 'utf8');
    //Add Cyc Processors Here
}) 

