
const $ = (selector) => document.querySelector(selector) 
const svgNS = 'http://www.w3.org/2000/svg'
const baseDataEl = $('#baseData')
const associationDataEl = $('#morphData')
const graphEl = $('#graph')
const tableEl = $('#table')
const legendEl = $('#legend')
const linePaddingLeft = 15
const dotRadius = 4
const dotColor = '#77777788'

let isFilterActive = false;
let showDimensions = []
let headingElMap = {}
let categoryElMap = {}
let dimensionNames = []
let categoryNames = []
let graphColorMap = {}
let tableData = [];
let assocData = [];

// --- functions


const renderLegend = () => {

    legendEl.innerHTML = ''

    dimensionNames.forEach((dimensionName) => {
        let checkBoxEl = document.createElement('input')
        let legendEntryEl = document.createElement('span')

        checkBoxEl.setAttribute('type', 'checkbox')
        checkBoxEl.setAttribute('name', dimensionName)

        checkBoxEl.checked = showDimensions.indexOf(dimensionName) > -1

        legendEntryEl.innerText = dimensionName
        //legendEntryEl.style.color = graphColorMap[dimensionName]

        checkBoxEl.addEventListener('change', (evt) => {
            if (!evt.target.checked) {
                isFilterActive = true
                showDimensions = showDimensions.filter((dimensionName) => evt.target.name !== dimensionName)
            } else {
                showDimensions.push(dimensionName)
            }
            render(false /* dont reset filter */);
        })
        
        legendEl.appendChild(checkBoxEl)
        legendEl.appendChild(legendEntryEl)
    })
}

// render table from base data CSV
const renderTable = () => {
    tableEl.innerHTML = ''

    headingElMap = {}
    categoryElMap = {}
    dimensionNames = []

    for (let i=0; i<tableData.length; i++) {

        const row = tableData[i]
        let rowEl = document.createElement('tr')
        let categoryName;
        let dimensionName;

        for (let j=0; j<row.length; j++) {
            let td = document.createElement(i === 0 ? 'th' : 'td')
            td.innerHTML = row[j]

            if (i === 0) {
                dimensionName = row[j]

                // not the first column
                if (j > 0) {
                    dimensionNames.push(dimensionName)

                    if (!isFilterActive) {
                        showDimensions.push(dimensionName)
                    }
                }
                headingElMap[dimensionName] = td;
            }

            if (j === 0) {
                td.setAttribute('class', 'category')
                categoryName = row[j]
                if (i > 0) {
                    categoryNames.push(categoryName)
                }
                categoryElMap[categoryName] = {}
            } else {
                categoryElMap[categoryName][row[j]] = td
            }
            rowEl.appendChild(td)
        }
        tableEl.appendChild(rowEl)
    }

    syncGraphSizeWithTableSize();
}

const renderGraph = () => {

    graphColorMap = {}
    graphEl.innerHTML = ''

    showDimensions.forEach((dimensionName, columnIndex) => {

        let lineCoords = []
        let dotCoords = []
        let lineColor
        let targetDimensionEl = headingElMap[dimensionName]

        lineCoords[0] = {
            x1: targetDimensionEl.offsetLeft + targetDimensionEl.clientWidth / 2,
            y1: targetDimensionEl.offsetTop + targetDimensionEl.clientHeight,
            x2: targetDimensionEl.offsetLeft + targetDimensionEl.clientWidth / 2,
            y2: targetDimensionEl.offsetTop + targetDimensionEl.clientHeight
        }

        assocData.forEach((association, rowIndex) => {

            let value = association[columnIndex];
            if (rowIndex === 0) {
                graphColorMap[dimensionName] = value
                return;
            };
            let categoryName = categoryNames[rowIndex-1]

            lineColor = graphColorMap[dimensionName];
            let targetCategoryEl = categoryElMap[categoryName][value];

            lineCoords[rowIndex] = {
                x1: lineCoords[rowIndex-1].x2,
                y1: lineCoords[rowIndex-1].y2,
                x2: targetCategoryEl.offsetLeft + linePaddingLeft,
                y2: targetCategoryEl.offsetTop + targetCategoryEl.clientHeight / 2,
            }

            dotCoords[rowIndex] = {
                cx: targetCategoryEl.offsetLeft + linePaddingLeft,
                cy: targetCategoryEl.offsetTop + targetCategoryEl.clientHeight / 2,
                r: dotRadius
            }
        })

        // draw lines
        lineCoords.forEach((lineCoord) => {

            lineCoord.stroke = lineColor
            lineCoord['stroke-width'] = 2
            //lineCoord['stroke-dasharray'] = `${columnIndex} ${rowIndex}`
            lineCoord['stroke-dasharray'] = `2 ${columnIndex+1}`
            
            const line = document.createElementNS(svgNS, 'line')

            for (let attrName in lineCoord) {
                line.setAttributeNS(null, attrName, lineCoord[attrName])
            }
            graphEl.appendChild(line)
        })

        // draw dots
        dotCoords.forEach((dotCoord) => {

            dotCoord.fill = dotColor
            
            const circle = document.createElementNS(svgNS, 'circle')

            for (let attrName in dotCoord) {
                circle.setAttributeNS(null, attrName, dotCoord[attrName])
            }
            graphEl.appendChild(circle)
        })
    })
}

const getData = (rawData) => {
    let parsedData;
    try {
        parsedData = parseCSV(rawData)
    } catch(e) {}

    // filter out empty rows
    parsedData = parsedData.filter((row) => row[0].trim() !== "")

    return parsedData;
}

const parseTableBaseData = () => {
    try {
        tableData = getData(baseDataEl.value)
    } catch(e) {}
}

const parseGraphData = () => {
    try {
        assocData = getData(associationDataEl.value)
    } catch(e) {}
}

const syncGraphSizeWithTableSize = () => {
    graphEl.style.width = tableEl.clientWidth
    graphEl.style.height = tableEl.clientHeight

    let svgWidth = graphEl.style.width.split('px')[0];
    let svgHeight = graphEl.style.height.split('px')[0];

    graphEl.setAttributeNS(null, 'viewBox', `0 0 ${svgWidth} ${svgHeight}`)
    graphEl.setAttributeNS(null, 'width', svgWidth)
    graphEl.setAttributeNS(null, 'height', svgHeight)
}

const resetFilter = () => {
    showDimensions = []
    isFilterActive = false
}

// --- initialization
const render = (doResetFilter = true) => {
    if (doResetFilter) {
        resetFilter()
    }
    parseTableBaseData()
    renderTable()
    syncGraphSizeWithTableSize()
    parseGraphData()
    renderGraph()
    renderLegend()
}

window.addEventListener('load', () => {
    render();
})

// --- event listeners

// render table on change of base data
baseDataEl.addEventListener('keyup', render)
associationDataEl.addEventListener('keyup', render)
window.addEventListener('resize', render)