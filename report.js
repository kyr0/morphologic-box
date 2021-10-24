
const baseDataDefaultValue = `Categ./Dimens.	1. Carbonify	2. Carbon Neutral - Standard	3. Carbon Neutral - Advanced	4. Carbon Positive Australia	5. Team Climate
Type of provider	For profit	Non-profit / Institute	Non-profit / NGO	Non-profit / Government	
Type of calculation	Web	App	Excel	App + Web available	`

const morphDataDefaultValue = `Categ./Dimens.	1. Carbonify	2. Carbon Neutral - Standard	3. Carbon Neutral - Advanced	4. Carbon Positive Australia	5. Team Climate
Line Color (hex)	#2DCBD7	red	blue	purple	grey
Type of provider	Non-profit / NGO	For profit	For profit	Non-profit / NGO	For profit
Type of calculation	Web	Web	Web	Web	Web`

const $ = (selector) => document.querySelector(selector) 
const svgNS = 'http://www.w3.org/2000/svg'
const baseDataEl = $('#baseData')
const morphDataEl = $('#morphData')
const graphEl = $('#graph')
const tableEl = $('#table')
const legendEl = $('#legend')
const errorEl = $('#error')
const warnEl = $('#warn')
const switchAllEl = $('#switchAll')
const resetBaseDataEl = $('#resetBaseData')
const resetMorphDataEl = $('#resetMorphData')
const visuEl = $('.visualization')
const linePaddingLeft = 20
const dotRadius = 4
const dotColor = '#77777788'

let isFilterActive = false;
let showDimensions = []
let headingElMap = {}
let categoryElMap = {}
let dimensionNames = []
let categoryNames = []
let graphColorMap = {}
let tableData = []
let morphData = []

let errors = {}
let warnings = {}

// --- functions

const getDuplicates = values => values.filter((item, index) => values.indexOf(item) != index)

const showError = (name, ...msg) => {
    errors[name] = 'ERROR: ' + msg.map(value => value || 'undefined').join(' ')
    let message = '';
    Object.keys(errors).forEach(error => message += errors[error] + '\n')

    errorEl.innerText = message;
    errorEl.setAttribute('class', '')
};
const showWarning = (name, ...msg) => {
    warnings[name] = 'WARNING: ' + msg.map(value => value || 'undefined').join(' ')
    let message = '';
    Object.keys(warnings).forEach(warning => message += warnings[warning] + '\n')

    warnEl.innerText = message;
    warnEl.setAttribute('class', '')
}

const clearError = (name) => {

    if (!name) {
        errors = {}
    } else {
        delete errors[name];
    }

    if (Object.keys(errors).length === 0) {
        errorEl.setAttribute('class', 'hide')
    }
};
const clearWarn = (name) => {

    if (!name) {
        warnings = {}
    } else {
        delete warnings[name];
    }

    if (Object.keys(warnings).length === 0) {
        warnEl.setAttribute('class', 'hide')
    }
}

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

const switchAllFilters = () => {
    if (isFilterActive) {
        // enable all
        showDimensions = dimensionNames
    } else {
        // disable all
        showDimensions = []
    }
    isFilterActive = !isFilterActive

    render(false)
}

// render table from base data CSV
const renderTable = () => {
    tableEl.innerHTML = ''

    let doThrow;
    headingElMap = {}
    categoryElMap = {}
    dimensionNames = []
    categoryNames = []

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

        if (i > 0 && getDuplicates(row).length > 0) {
            showError('DUPLICATE_BASE_DATA_ENTRY', 'There is a duplicate property of category', categoryName, '! n times: ', getDuplicates(row))
            doThrow = "DUPLICATE_BASE_DATA_ENTRY"
        }
    }

    if (doThrow) {
        throw doThrow;
    } else {
        clearError('DUPLICATE_BASE_DATA_ENTRY')
    }
}

const renderGraph = () => {

    graphColorMap = {}
    graphEl.innerHTML = ''

    if (getDuplicates(dimensionNames).length > 0) {
        showError('DUPLICATE_DIMENSION', 'Duplicate dimensions found: ', getDuplicates(dimensionNames))
    } else {
        clearError('DUPLICATE_DIMENSION')
    }

    dimensionNames.forEach((dimensionName, columnIndex) => {
        
        // don't render dimension if not included in filter
        if (!showDimensions.includes(dimensionName)) return;

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

        morphData.forEach((morph, rowIndex) => {

            let value = morph[columnIndex+1];

            if (rowIndex === 0) {
                return; // column/dimension names; skip
            }

            if (rowIndex === 1) { // color values
                graphColorMap[dimensionName] = String(value)
                return;
            };
            let categoryName = categoryNames[rowIndex-2]

            lineColor = graphColorMap[dimensionName];
            let targetCategoryEl = categoryElMap[categoryName][value];

            if (!targetCategoryEl) {
                showWarning('CANNOT_FIND_ELEMENT_BASE_DATA', 'Cannot find element', value, 'for category', categoryName, 'in base data!')
            }

            lineCoords[rowIndex-1] = {
                x1: lineCoords[rowIndex-2].x2,
                y1: lineCoords[rowIndex-2].y2,
                x2: targetCategoryEl.offsetLeft + linePaddingLeft,
                y2: targetCategoryEl.offsetTop + targetCategoryEl.clientHeight / 2,
            }

            dotCoords[rowIndex-1] = {
                cx: targetCategoryEl.offsetLeft + linePaddingLeft,
                cy: targetCategoryEl.offsetTop + targetCategoryEl.clientHeight / 2,
                r: dotRadius
            }
        })

        // draw lines
        lineCoords.forEach((lineCoord) => {

            lineCoord.stroke = lineColor

            if (!lineColor || lineColor == 'undefined') {
                showError('CANNOT_FIND_LINE_COLOR', 'At least one dimension color is missing! Check morph data, second row!')
                throw "CANNOT_FIND_LINE_COLOR"
            } else {
                clearError('CANNOT_FIND_LINE_COLOR')
            }

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
        parsedData = parseCSV(rawData, rawData.indexOf("\t") > -1 ? "\t" : ',')
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
        morphData = getData(morphDataEl.value)
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
    // ignore errors as we show warnings
    // and errors are OK cases when data
    // is undergoing interactive editing
    try {
        parseTableBaseData()
        renderTable()
        syncGraphSizeWithTableSize()
        parseGraphData()
        renderGraph()
        renderLegend()

        clearError()
        clearWarn()

    } catch(e) {
        console.error(e)
    }   
}

window.addEventListener('load', () => {

    // restore initially
    restore(baseDataEl, 'baseData', baseDataDefaultValue)
    restore(morphDataEl, 'morphData', morphDataDefaultValue)

    render()
})

const store = (name, data) => {
    localStorage.setItem(name, data)
}

const restore = (el, name, defaultValue) => {
    el.value = localStorage.getItem(name) ? localStorage.getItem(name) : defaultValue
}

// --- event listeners

resetBaseDataEl.addEventListener('click', () => {
    store('baseData', baseDataDefaultValue)
    restore(baseDataEl, 'baseData')
    render()
})

resetMorphDataEl.addEventListener('click', () => {
    store('morphData', morphDataDefaultValue)
    restore(morphDataEl, 'morphData')
    render()
})


// render table on change of base data
baseDataEl.addEventListener('keyup', (evt) => {
    store('baseData', evt.target.value)
    render()
})
morphDataEl.addEventListener('keyup', (evt) => {
    store('morphData', evt.target.value)
    render()
})
switchAllEl.addEventListener('click', switchAllFilters)
window.addEventListener('resize', render)
window.addEventListener('beforeprint', render)

new ResizeObserver(render).observe(visuEl)