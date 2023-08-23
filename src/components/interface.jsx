import { useContext, useState } from "react";
import { AppContext } from "../App";
import jsonToCsvExport from 'json-to-csv-export'

const Interface = () => {
    const context = useContext(AppContext)
    const [selApp, setSelApp] = useState()

    const generateReport = async () => {
        const [
            masterItems,
            charts,
            sheets,
            dimensions,
            measures,
            bookmarks,
            variables,
        ] = await Promise.all([
            selApp.getMasterObjects(),
            selApp.getCharts(),
            selApp.getSheets(),
            selApp.getDimensions(),
            selApp.getMeasures(),
            selApp.getBookmarks(),
            selApp.getVariables(),
        ]) 

        console.log('items de interesse: ', {
            masterItems,
            charts,
            sheets,
            dimensions,
            measures,
            bookmarks,
            variables
        })

        downloadBookmarks(bookmarks)
        downloadCharts(charts)
        downloadSheets(sheets)
        downloadMasterItems(masterItems)
        downloadDimensions(dimensions)
        downloadMeasures(measures)
        downloadVariables(variables)
    }

    const removeCRLF = (string) => {
        return string?.replaceAll('\r', '')?.replaceAll('\n', '')?.replaceAll('\t', '')
    }

    const downloadBookmarks = (bookmarks) => {
        const bookmarksCSV = bookmarks.map(bkm => {
            return {
                Id: bkm.props.qInfo.qId,
                Nome: bkm.props.qMetaDef.title,
                "Set Analysis": removeCRLF(bkm.setAnalysis)
            }
        })

        jsonToCsvExport({
            data: bookmarksCSV,
            filename: `${selApp.appName}_bookmarks.csv`,
            delimiter: '|'
        })
    }

    const downloadCharts = (charts) => {
        const chartsCSV = charts.map(item => {
            const affectedDims = item.affectedDims.length
            const affectedMeasures = item.affectedMeasures.length
            const maxExpressions = Math.max(affectedDims, affectedMeasures)

            const lines = []
            for(let i = 0; i < maxExpressions - 1; ++i){
                let currDimDef
                let currMeasureDef
                if (i < affectedDims) currDimDef = item.affectedDims[i].qDef.qFieldDefs.join(' | ') 
                if (i < affectedMeasures) currMeasureDef = item.affectedMeasures[i].qDef.qDef
                console.log(item)
                lines.push({
                    Id: item.properties.qInfo.qId,
                    Nome: item.properties.title,
                    "Tipo de Visualização": item.properties.visualization,
                    "Dimensão Impactada": removeCRLF(currDimDef),
                    "Medida Impactada": removeCRLF(currMeasureDef),
                    "Pasta (ID)": item.linkedSheet.qInfo.qId,
                    "Pasta (Nome)":item.linkedSheet.qMetaDef.title,
                })
                
            }
            return lines
        })

        console.log(chartsCSV.flat())
        jsonToCsvExport({
            data: chartsCSV.flat(),
            filename: `${selApp.appName}_charts.csv`,
            delimiter: '|'
        })
    }
    
    const downloadSheets = (sheets) => {
        const sheetsCSV = sheets.map(sheet => {
            return {
                Id: sheet.props.qInfo.qId,
                Nome: sheet.props.qMetaDef.title,
                Expressão: removeCRLF(sheet.props.labelExpression.qStringExpression.qExpr),
                "Publicada?": sheet.layout.qMeta?.published
            }
        })

        jsonToCsvExport({
            data: sheetsCSV,
            filename: `${selApp.appName}_sheets.csv`,
            delimiter: '|'
        })
    }

    const downloadMasterItems = (masterItems) => {
        const masterItemCSV = masterItems.map(item => {
            const affectedDims = item.affectedDims.length
            const affectedMeasures = item.affectedMeasures.length
            const maxExpressions = Math.max(affectedDims, affectedMeasures)

            const lines = []
            for(let i = 0; i < maxExpressions - 1; ++i){
                let currDimDef
                let currMeasureDef
                if (i < affectedDims) currDimDef = item.affectedDims[i].qDef.qFieldDefs.join(' | ') 
                if (i < affectedMeasures) currMeasureDef = item.affectedMeasures[i].qDef.qDef
                
                lines.push({
                    Id: item.properties.qInfo.qId,
                    Nome: item.properties.qMetaDef.title,
                    "Tipo de Visualização": item.properties.visualization,
                    "Dimensão Impactada": removeCRLF(currDimDef),
                    "Medida Impactada": removeCRLF(currMeasureDef)
                })
            }
            return lines
        })

        jsonToCsvExport({
            data: masterItemCSV.flat(),
            filename: `${selApp.appName}_masterItems.csv`,
            delimiter: '|'
        })
    }

    const downloadDimensions = (dimensions) => {
        const dimensionsCSV = dimensions.map(dim => {
            return {
                Id: dim.qInfo.qId,
                Nome: dim.qMetaDef.title,
                Expressão: removeCRLF(dim.qDim.qFieldDefs.join(' | '))
            }
        })

        jsonToCsvExport({
            data: dimensionsCSV,
            filename: `${selApp.appName}_dimensions.csv`,
            delimiter: '|'
        })
    }

    const downloadMeasures = (measures) => {
        const measuresCSV = measures.map(measure => {
            return {
                Id: measure.qInfo.qId,
                Nome: measure.qMetaDef.title,
                Expressão: removeCRLF(measure.qMeasure.qDef)
            }
        })

        jsonToCsvExport({
            data: measuresCSV,
            filename: `${selApp.appName}_measures.csv`,
            delimiter: '|'
        })
    }

    const downloadVariables = (variables) => {
        const variablesCSV = variables.map(variable => {
            return {
                Id: variable.qInfo.qId,
                Nome: variable.qName,
                Expressão: removeCRLF(variable.qDefinition)
            }
        })

        jsonToCsvExport({
            data: variablesCSV,
            filename: `${selApp.appName}_variables.csv`,
            delimiter: '|'
        })
    }

    const downloadScript = async () => {
        const script = await selApp.getScript()

        const file = new File([script], `${selApp.appName}_script.inc`, {
            type: 'text/plain'
        })

        function download() {
            const link = document.createElement('a')
            const url = URL.createObjectURL(file)
            
            link.href = url
            link.download = file.name
            document.body.appendChild(link)
            link.click()
            
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
        }

        download()
    }

    return ( 
        <div style={{display: 'flex', flexDirection: 'column'}}>
            <select defaultValue = '' name ='app-selector' onChange={(event)=>setSelApp(context[event.target.value])}>
                <option value="" disabled hidden>Escolha o app</option>
                {
                    Object.entries(context)
                        .map(appName => <option key={appName[0]}>{appName[0]}</option>)
                }
            </select>
            <button style = {{marginTop: '20px'}} onClick={generateReport}>Baixar relatórios</button>
            <button style = {{marginTop: '20px'}} onClick={downloadScript}>Baixar script</button>
        </div> 
    );
}
 
export default Interface;