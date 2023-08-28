import { useContext, useState } from "react";
import { AppContext } from "../App";
import jsonToCsvExport from 'json-to-csv-export'

const Interface = () => {
    const context = useContext(AppContext)
    const [selApp, setSelApp] = useState()

    const generateReport = async () => {
        console.log('start analysis for', selApp.appName)
        const [
            masterItems,
            charts,
            sheets,
            dimensions,
            measures,
            bookmarks,
            variables,
            filterPanes,
        ] = await Promise.all([
            selApp.getMasterObjects(),
            selApp.getCharts(),
            selApp.getSheets(),
            selApp.getDimensions(),
            selApp.getMeasures(),
            selApp.getBookmarks(),
            selApp.getVariables(),
            selApp.getFilterPanes(),
        ]) 

        console.log('result:', {
            masterItems,
            charts,
            sheets,
            dimensions,
            measures,
            bookmarks,
            variables,
            filterPanes,
        })

        downloadBookmarks(bookmarks)
        downloadCharts(charts)
        downloadSheets(sheets)
        downloadMasterItems(masterItems)
        downloadDimensions(dimensions)
        downloadMeasures(measures)
        downloadVariables(variables)
        downloadFilterPane(filterPanes)

        console.log('end analysis for ', selApp.appName)
    }

    const removeCRLF = (string) => {
        return string?.replaceAll('\r', '')?.replaceAll('\n', '')?.replaceAll('\t', '')
    }

    const downloadFilterPane = (filterPanes) => {
        const filterPaneCSV = filterPanes.map((filterPane) => {
            return {
                "Id": filterPane.filterPane.qInfo.qId,
                "Nome": filterPane.filterPane.title,
                "Filtro afetado": filterPane.affectedDim,
                "Pasta (Id)": filterPane.sheetProps?.qInfo?.qId,
                "Pasta (Nome)": filterPane.sheetProps?.qMetaDef?.title,
                "Pasta Publicada?": filterPane.sheetLayout.qMeta?.published
            }
        })

        jsonToCsvExport({
            data: filterPaneCSV,
            filename: `${selApp.appName}_filterpanes.csv`,
            headers: ['Id do Painel de Filtro', 'Nome do Painel de Filtro', 'Filtro afetado do Painel de Filtro', 'Pasta (Id) do Painel de Filtro', 'Pasta (Nome) do Painel de Filtro'],
            delimiter: '|'
        })
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
            headers: ['Id do Bookmark', 'Nome do Bookmark', 'Set Analysis do Bookmark'],
            delimiter: '|'
        })
    }

    const downloadCharts = (charts) => {
        const chartsCSV = charts.map(item => {
            const affectedDims = item.affectedDims?.length || 0
            const affectedMeasures = item.affectedMeasures?.length || 0
            const maxExpressions = Math.max(affectedDims, affectedMeasures)

            const lines = []
            for(let i = 0; i < maxExpressions - 1; ++i){
                let currDimDef
                let currMeasureDef
                if (i < affectedDims) currDimDef = item.affectedDims[i].qDef.qFieldDefs.join(' | ') 
                if (i < affectedMeasures) currMeasureDef = item.affectedMeasures[i].qDef.qDef

                const title = item.properties.title.qStringExpression ? item.properties.title.qStringExpression.qExpr : item.properties.title
                lines.push({
                    Id: item.properties.qInfo.qId,
                    Nome: title,
                    "Tipo de Visualização": item.properties.visualization,
                    "Dimensão Impactada": removeCRLF(currDimDef),
                    "Medida Impactada": removeCRLF(currMeasureDef),
                    "Pasta (ID)": item.linkedSheetProps.qInfo.qId,
                    "Pasta (Nome)":item.linkedSheetLayout.qMetaDef.title,
                    "Pasta Publicada?":item.linkedSheetLayout.qMeta?.published
                })
                
            }
            return lines
        })

        jsonToCsvExport({
            data: chartsCSV.flat(),
            filename: `${selApp.appName}_charts.csv`,
            headers: ['Id da Visualização', 'Nome da Visualização', "Tipo de Visualização da Visualização", "Dimensão Impactada da Visualização", "Medida Impactada da Visualização", "Pasta (ID) da Visualização", "Pasta (Nome) da Visualização"],
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
            headers: ['Id da Pasta', 'Nome da Pasta', 'Expressão de Título da Pasta', 'Publicada?'],
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
            headers: ['Id do Item Mestre', 'Nome do Item Mestre', "Tipo de Visualização do Item Mestre", "Dimensão Impactada do Item Mestre", "Medida Impactada do Item Mestre"],
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
            headers: ['Id da Dimensão', 'Nome da Dimensão', 'Expressão da Dimensão'],
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
            headers: ['Id da Medida', 'Nome da Medida', 'Expressão da Medida'],
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
            headers: ['Id da Variável', 'Nome da Variável', 'Expressão da Variável'],
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