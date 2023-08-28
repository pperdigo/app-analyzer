import valuesToSearch from '../assets/valuesToSearch.json'

function checkString(string, valueToSearch) {
    return  (string.toLowerCase().includes('if') || string.includes('{<')) && string.includes(valueToSearch)
}

const helperFunctions = {
    filterCharts(chart) {
        if(chart.qExtendsId){
            return false
        }

        let measures, dimensions

        if(chart.visualization === 'boxplot') {
            measures = chart.boxplotDef.qHyperCubeDef.qMeasures.filter(measure => !measure.qLibraryId)
            dimensions = chart.boxplotDef.qHyperCubeDef.qDimensions.filter(dim => !dim.qLibraryId)
        } else {
            measures = chart.qHyperCubeDef.qMeasures.filter(measure => !measure.qLibraryId)
            dimensions = chart.qHyperCubeDef.qDimensions.filter(dim => !dim.qLibraryId)
        }

        //se measures não for array vazia
        if(measures) {
            const measureDefs = measures.map(measure => measure.qDef.qDef)

            const measureCheck = measureDefs.some(measure => valuesToSearch.find(value => {
                if (!measure) return false
                return checkString(measure, value)
            }))

            if(measureCheck) {
                return true
            }
        }

        //se dimensions não for array vazia
        if(dimensions) {
            const dimensionDefs = dimensions.map(dim => dim.qDef.qFieldDefs)
            const dimCheck = dimensionDefs.some(dim => valuesToSearch.find(value => {
                if (!dim) return false
                return checkString(dim.join('|', value))
            }))

            if(dimCheck) {
                return true
            }
        }

        return false
    },

    filterSheets(sheet){
        const sheetLabel = sheet.props?.labelExpression?.qStringExpression?.qExpr
        if(!sheetLabel) return false
        return valuesToSearch.find(value => checkString(sheetLabel, value))
    },

    filterDimensions(dimension) {
        const definitions = dimension.qDim.qFieldDefs

        return definitions.some(dim => valuesToSearch.find(value => checkString(dim, value)))
    },

    filterMeasures(measure) {
        const definition = measure.qMeasure.qDef

        return valuesToSearch.find(value => checkString(definition, value))
    },

    filterBookmarks(element) {
        return valuesToSearch.some(value => checkString(element, value))
    },

    filterVariable(variable) {        
        if(!variable.qDefinition) {
            return false
        }

        const definition = variable.qDefinition
        return valuesToSearch.find(value => checkString(definition, value))
    },

    filterListBoxes(listbox) {
        const def = listbox.qListObjectDef.qDef.qFieldDefs.join(' | ')

        return valuesToSearch.some((value) => checkString(def, value))
    },

    findAffectedDims(dim) {
        const dimDef = dim.qDef.qFieldDefs.join(' | ')

        return valuesToSearch.some(value => checkString(dimDef, value))
    },

    findAffectedListBoxes(dimDef) {
        return valuesToSearch.some(value => checkString(dimDef, value))
    },

    findAffectedMeasures(measure) { 
        const measureDef = measure?.qDef?.qDef

        if(!measureDef) return false
        return valuesToSearch.some(value => checkString(measureDef, value))
    }
}

export default helperFunctions