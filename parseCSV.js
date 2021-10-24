const parseCSV = (strData, strDelimiter = ",") => {

    if (!strData) strData = '   ';

    const objPattern = new RegExp((
        // delimiters
        "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

        // quoted fields
        "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

        // standard fields
        "([^\"\\" + strDelimiter + "\\r\\n]*))"
    ),  "gi" // global and case insensitive
    )


    // create an array to hold our data. Give the array a default empty first row
    const arrData = [[]]

    // create an array to hold our individual pattern matching groups
    let arrMatches = null

    // keep looping over the regular expression matches
    // until we can no longer find a match
    while (arrMatches = objPattern.exec(strData)) {

        // get the delimiter that was found
        const strMatchedDelimiter = arrMatches[1]

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter
        if (strMatchedDelimiter.length && strMatchedDelimiter !== strDelimiter) {

            // since we have reached a new row of data, add an empty row to our data array.
            arrData.push([])
        }

        let strMatchedValue

        // now that we have our delimiter out of the way,
        // let's check to see which kind of value we captured (quoted or unquoted)
        if (arrMatches[2]) {
            // we found a quoted value. When we capture this value, unescape any double quotes
            strMatchedValue = arrMatches[2].replace(new RegExp( "\"\"", "g" ), "\"")

        } else {
            strMatchedValue = arrMatches[3]
        }
        arrData[arrData.length - 1].push(strMatchedValue)
    }
    return arrData
}
