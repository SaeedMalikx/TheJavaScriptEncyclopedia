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
    console.log(dataSplit.length + " .cyc files found")
    for(i=0; i < dataSplit.length; i +=1 ){
        const stringData = fs.readFileSync("./" + dataSplit[i], 'utf8');
        stringArray.push(stringData)
    }
    console.log(stringArray.length + " .cyc Files Stringified")

    // One For Each Chapter-Async
    // Figure out a better solution for missing links (modify the onehtml rule file)
    // The current solution still has working links for those inside the chapter and for those outside, nothing happens
    for(i=0; i < stringArray.length; i +=1 ){
        let chapterHTML = cyc(stringArray[i], onehtml)
        let slicedSplit = dataSplit[i].slice(0,-4)
        let modChapterHTML = chapterHTML.replace(/MISSING LINK/g, '')
        fs.writeFile(slicedSplit + '.html', modChapterHTML, (err) => {
            if (err) throw err;
            console.log(slicedSplit + '.html has been saved!');
          });
    }
    
    //HTML Single File Processor
    stringCombined = stringArray.join()
    let stringCyc = stringCombined.replace(/,@+/g, " @")
    let stringHTML = cyc(stringCyc, onehtml)
    fs.writeFile('book.html', stringHTML, (err) => {
        if (err) throw err;
        console.log('book.html has been saved!');
      });
    
    //Add Cyc Processors Here
}) 

