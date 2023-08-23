import valuesToSearch from '../assets/valuesToSearch.json'

const helperFunctions = {
    filterCharts(chart) {
        if(chart.qExtendsId){
            return false
        }

        const measures = chart.qHyperCubeDef.qMeasures.filter(dim => !dim.qLibraryId)
        const dimensions = chart.qHyperCubeDef.qDimensions.filter(dim => !dim.qLibraryId)


        //se measures não for array vazia
        if(measures) {
            const measureDefs = measures.map(measure => measure.qDef.qDef)
            
            const measureCheck = measureDefs.some(measure => valuesToSearch.find(value => measure.toUpperCase().includes(value)))

            if(measureCheck) return true
        }

        //se dimensions não for array vazia
        if(dimensions) {
            const dimensionDefs = dimensions.map(dim => dim.qDef.qFieldDefs)
            const dimCheck = dimensionDefs.some(dim => valuesToSearch.find(value => dim.join('|').toUpperCase().includes(value)))

            if(dimCheck) return true
        }
    },

    filterSheets(sheet){
        const sheetLabel = sheet.props?.labelExpression?.qStringExpression?.qExpr.toUpperCase()
        if(!sheetLabel) return false
        return valuesToSearch.find(value => sheetLabel.includes(value))
    },

    filterDimensions(dimension) {
        const definitions = dimension.qDim.qFieldDefs

        return definitions.some(dim => valuesToSearch.find(value => dim.toUpperCase().includes(value)))
    },

    filterMeasures(measure) {
        const definition = measure.qMeasure.qDef.toUpperCase()

        return valuesToSearch.find(value => definition.includes(value))
    },

    // filterBookmarks(fieldsOfInterest) {
    //     return (element) => {
    //         console.log(fieldsOfInterest, element)

    //         return fieldsOfInterest.some((fieldName => element.selectionFields.includes(fieldName)))
    //     }
    // },

    filterBookmarks(element) {
        return valuesToSearch.some(value => element.toUpperCase().includes(value))
    },

    filterVariable(variable) {        
        if(!variable.qDefinition) {
            return false
        }

        const definition = variable.qDefinition.toUpperCase()
        return valuesToSearch.find(value => definition.includes(value))
    },

    findAffectedDims(dim) {
        const dimDef = dim.qDef.qFieldDefs.join(' | ').toUpperCase()

        return valuesToSearch.some(value => dimDef.includes(value))
    },

    findAffectedMeasures(measure) { 
        const measureDef = measure?.qDef?.qDef?.toUpperCase()

        return valuesToSearch.some(value => measureDef?.includes(value))
    }
}

export default helperFunctions