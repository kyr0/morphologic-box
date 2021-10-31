const baseDataDefaultValue = `Categ. Dimens.	1. Carbonify	2. Carbon Neutral - Standard	3. Carbon Neutral - Advanced	4. Carbon Positive Australia	5. Team Climate	6. More	7. More	8. More	9. More	10. More
Type of provider	For profit	Non-profit / Institute	Non-profit / NGO	Non-profit / Government						
Type of calculation	Web	App	Excel	App + Web available						`

const morphDataDefaultValue = `Categ. Dimens.	1. Carbonify	2. Carbon Neutral - Standard	3. Carbon Neutral - Advanced	4. Carbon Positive Australia	5. Team Climate	6 Lol	7. More	8. More	9. More	10. More
Line Color (hex)	#2DCBD7	Green	blue	purple	grey	Red	grey	grey	grey	grey
Type of provider	Non-profit / NGO	For profit	For profit	Non-profit / NGO	For profit	For profit	Non-profit / NGO	For profit	Non-profit / NGO	For profit
Type of calculation	Web	Web	Excel	Web	Web	Web	Web	Excel	App	App`

const $ = (selector, parentEl) => document.querySelector(selector, parentEl) 
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
const categorySelectorEl = $('#categorySelector')
const optionSelectorEl = $('#optionSelector')
const linePaddingLeft = -10
const dotRadius = 4
const dotColor = '#77777788'

let hasMorphDataChanged = true
let isFilterActive = false
let categoryOptionFilterActive = []
let showDimensions = []
let headingElMap = {}
let categoryElMap = {}
let dimensionNames = []
let categoryNames = []
let graphColorMap = {}
let tableData = []
let morphData = []
let headerHeight = 50

let errors = {}
let warnings = {}

/*
  categoryDimensionFilterIndex[categoryName][optionName] = [dimensionName1, ...]
*/
let categoryDimensionFilterIndex = {}

// --- functions

const getDuplicates = values => values.filter((item, index) => values.indexOf(item) !== index && item.trim() !== '')

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

const switchAllFilters = (evt) => {

    if (isFilterActive) {
        // enable all
        showDimensions = dimensionNames
    } else {
        // disable all
        showDimensions = []
    }
    isFilterActive = !isFilterActive

    render(false /* dont reset filter */)
    evt.stopPropagation();
}

// render table from base data CSV
const renderTable = () => {

    // invalidate index cache
    if (hasMorphDataChanged) {
        categoryDimensionFilterIndex = {}
    }
    tableEl.innerHTML = ''

    let doThrow;
    headingElMap = {}
    categoryElMap = {}
    dimensionNames = []
    categoryNames = []

    // pre-scan for max options length
    let maxOptionsLength = 0
    let dimensionsLength = 0
    let maxOptionsLengths = []
    
    for (let i=0; i<tableData.length; i++) {
        const rowData = tableData[i].filter((item) => item.trim() !== '')
        if (i===0) {
            dimensionsLength = rowData.length
        } else {

            let shownDimensionsLength = isFilterActive ? showDimensions.length : dimensionsLength
            maxOptionsLengths[i] = Math.round(shownDimensionsLength / rowData.length)
            
            if (rowData.length > maxOptionsLength) {
                maxOptionsLength = rowData.length
            }
        }
    }
    maxOptionsLength -= 1 // first column
    dimensionsLength -= 1 // first column

    // scale each option to multiple columns in case there are 
    // more more dimensions than options
    let colspanForOptions = Math.round(dimensionsLength / maxOptionsLength)


    for (let i=0; i<tableData.length; i++) {

        const row = tableData[i]
        let rowEl = document.createElement(i === 0 ? 'thead' : 'tr')
        let categoryName;
        let dimensionName;

        for (let j=0; j<row.length; j++) {

            if (row[j].trim() === '') continue

            const td = document.createElement(i === 0 ? 'th' : 'td')
            const caption = document.createElement('span')
            caption.setAttribute('class', i === 0 ? 'caption' : 'cell')

            caption.innerText = row[j]

            td.appendChild(caption)

            if (i === 0) {
                dimensionName = row[j]


                // not the first column
                if (j > 0) {

                    dimensionNames.push(dimensionName)

                    
                    if (!isFilterActive) {

                        if (showDimensions.indexOf(dimensionName) === -1) {
                            showDimensions.push(dimensionName)
                        }
                    }
                    

                    if (isFilterActive && showDimensions.indexOf(dimensionName) === -1) {
                        continue;
                    }
                }
                headingElMap[dimensionName] = td;
            }

            if (j > 0 && i > 0) {
                // first column of category rows
                td.style.height = `${Math.round(20 * (2 + showDimensions.length/100))}px`
            }
            
            if (j > 0 && i > 0) {
                // apply colSpan to option columns
                td.colSpan = maxOptionsLengths[i]//colspanForOptions

                // -- build category/option filter index data structure
                if (typeof categoryDimensionFilterIndex[categoryName] === 'undefined') {
                    categoryDimensionFilterIndex[categoryName] = {}
                }

                if (typeof categoryDimensionFilterIndex[categoryName][td.innerText] === 'undefined') {
                    categoryDimensionFilterIndex[categoryName][td.innerText] = []
                }
                // -- end build category/option filter index data structure
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

// fill category selector with <option> elements
const renderCategorySelector = (selectedValue) => {

    categorySelectorEl.innerHTML = ''

    const allCategoryOption = document.createElement('option')
    allCategoryOption.value = 'all'
    allCategoryOption.name = 'all'
    allCategoryOption.innerText = 'All'
    categorySelectorEl.appendChild(allCategoryOption)

    for (let i=0; i<categoryNames.length; i++) {
        const categoryOption = document.createElement('option')
        categoryOption.value = categoryNames[i]
        categoryOption.name = categoryNames[i]
        categoryOption.innerText = categoryNames[i]
        categorySelectorEl.appendChild(categoryOption)
    }

    if (selectedValue) {
        categorySelectorEl.value = selectedValue;
    } else {
        categorySelectorEl.value = allCategoryOption.value;
    }
}

// fill option selector with <option> elements
const renderOptionSelector = (selectedValue) => {

    if (categorySelectorEl.value !== 'all') {

        optionSelectorEl.innerHTML = ''

        const unknownOptionsOption = document.createElement('option')
        unknownOptionsOption.value = 'unknown'
        unknownOptionsOption.name = 'unknown'
        unknownOptionsOption.innerText = 'Please select a category'
        optionSelectorEl.appendChild(unknownOptionsOption)

        const options = Object.keys(categoryElMap[categorySelectorEl.value]);

        categoryOptionFilterActive[0] = categorySelectorEl.value;

        options.forEach((optionValue) => {

            const optionsOption = document.createElement('option')
            optionsOption.value = optionValue
            optionsOption.name = optionValue
            optionsOption.innerText = optionValue
            optionSelectorEl.appendChild(optionsOption)
        })

        if (selectedValue) {

            categoryOptionFilterActive[1] = selectedValue;

            optionSelectorEl.value = selectedValue;
        } else {
            optionSelectorEl.value = unknownOptionsOption.value;
        }
    } else {

        optionSelectorEl.innerHTML = ''

        const unknownOptionsOption = document.createElement('option')
        unknownOptionsOption.value = 'unknown'
        unknownOptionsOption.name = 'unknown'
        unknownOptionsOption.innerText = 'Please select a category'
        optionSelectorEl.appendChild(unknownOptionsOption)

        optionSelectorEl.value = unknownOptionsOption.value
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

            // build index
            if (hasMorphDataChanged) {
                categoryDimensionFilterIndex[categoryName][value].push(dimensionName)
            }

            if (!targetCategoryEl) {
                showWarning('CANNOT_FIND_ELEMENT_BASE_DATA', 'Cannot find element', value, 'for category', categoryName, 'in base data!')
            }

            let leftPadding = 0;

            if (targetCategoryEl && targetCategoryEl.childNodes[0] && targetCategoryEl.childNodes[0].offsetLeft) {
                leftPadding = targetCategoryEl.childNodes[0].offsetLeft;
            }

            lineCoords[rowIndex-1] = {
                x1: lineCoords[rowIndex-2].x2,
                y1: lineCoords[rowIndex-2].y2,
                x2: targetCategoryEl.offsetLeft + linePaddingLeft + leftPadding,
                y2: targetCategoryEl.offsetTop + targetCategoryEl.clientHeight / 2,
            }

            dotCoords[rowIndex-1] = {
                cx: targetCategoryEl.offsetLeft + linePaddingLeft + leftPadding,
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

            if (lineDotted) {
                lineCoord['stroke-dasharray'] = `2 ${columnIndex/2+1}`
            }

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

    const captions = document.querySelectorAll('#table th span')
    let columnHeight = 20;

    Object.keys(headingElMap).forEach((heading, index) => {

        const headingCaptionEl = captions[index];

        if (headingCaptionEl) {

            if (headingCaptionEl.clientWidth > columnHeight) {
                columnHeight = headingCaptionEl.clientWidth; // bc of transform
            }
        }
    })

    Object.keys(headingElMap).forEach((heading) => {
        const headingEl = headingElMap[heading]
        headingEl.style.height = `${columnHeight}px`
    });

    const categoryEls = document.querySelectorAll('#table .category')
    Object.keys(categoryElMap).forEach((category, index) => {
        if (index === 0) return
        const categoryEl = categoryEls[index]

        if (categoryEl) {
            //categoryEl.style.height = `${columnHeight}px`
        }
    })

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
    categoryOptionFilterActive = []
    isFilterActive = false
}

const filterByCategoryAndOption = () => {

    if (categoryDimensionFilterIndex[categorySelectorEl.value] && categorySelectorEl.value !== 'all') {

        if (categoryDimensionFilterIndex[categorySelectorEl.value][optionSelectorEl.value]) {

            isFilterActive = true
            showDimensions = categoryDimensionFilterIndex[categorySelectorEl.value][optionSelectorEl.value]

            console.log('filterByCategoryAndOption', showDimensions)
            categoryOptionFilterActive = [categorySelectorEl.value, optionSelectorEl.value]
        
            render(false)

        } else {
            console.error('Optiion ', optionSelectorEl.value, ' cannot be found in index! Category: ', categorySelectorEl.value)
        }

    } if (categorySelectorEl.value === 'all') {

        // 'all' selected again; reset filter
        render()
    }
}

const updateDimensionCount = () => {
    $('#dimensionCount').innerText = showDimensions.length
}

// --- initialization
const render = (doResetFilter = true) => {

    if (doResetFilter === true) {
        resetFilter()
    }
    // ignore errors as we show warnings
    // and errors are OK cases when data
    // is undergoing interactive editing
    try {


        parseTableBaseData()

        renderTable()
        renderCategorySelector(categoryOptionFilterActive[0])
        renderOptionSelector(categoryOptionFilterActive[1])
        syncGraphSizeWithTableSize()
        parseGraphData()
        renderGraph()

        renderLegend()

        clearError()
        clearWarn()

        updateDimensionCount()

        hasMorphDataChanged = false

    } catch(e) {
        console.error(e)
    }   
}

window.addEventListener('load', () => {

    // restore initially
    restore(baseDataEl, 'baseData', baseDataDefaultValue)
    restore(morphDataEl, 'morphData', morphDataDefaultValue)

    hasMorphDataChanged = true

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
    evt.stopPropagation();
})


// render table on change of base data
baseDataEl.addEventListener('keyup', (evt) => {
    store('baseData', evt.target.value)
    render()
    evt.stopPropagation();
})
morphDataEl.addEventListener('keyup', (evt) => {
    store('morphData', evt.target.value)
    hasMorphDataChanged = true
    render()
    hasMorphDataChanged = false
    evt.stopPropagation();
})
switchAllEl.addEventListener('click', switchAllFilters)

tableEl.addEventListener('scroll', () => render(false /* dont reset filter */))
tableEl.addEventListener('resize', () => render(false /* dont reset filter */))
window.addEventListener('resize', () => render(false /* dont reset filter */))
window.addEventListener('beforeprint', () => render(false /* dont reset filter */))

new ResizeObserver(render).observe(visuEl)

// -- show hide data and controls
let showControls = true;
$('.toggleControls').addEventListener('click', () => {

    if (!showControls) {
        $('#tableContainer').setAttribute('class', '')
    } else {
        $('#tableContainer').setAttribute('class', 'tableContainerResize')
    }
    showControls = !showControls
})

// -- line dotted toggle

let lineDotted = false
$('.toggleLineDotted').addEventListener('click', () => {

    lineDotted = !lineDotted

    render(false)
})

// -- category/option selector
categorySelectorEl.addEventListener('change', () => {

    renderOptionSelector()

    // changed back to all
    if (categorySelectorEl.value === 'all') {
        filterByCategoryAndOption()
    }
})
optionSelectorEl.addEventListener('change', () => filterByCategoryAndOption())
