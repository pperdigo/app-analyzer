import enigma from 'enigma.js'
import schema from 'enigma.js/schemas/12.1657.0.json'
import qChartTypes from '../assets/qChartTypes.json'
import helperFunctions from './helperFunctions'
import valuesToSearch from '../assets/valuesToSearch.json'

class EnigmaService {
    constructor(appName, appId){
        this.global = null
        this.appName = appName
        this.appId = appId
        this.app = null
    }

    static createInstance(appName, appId) {
        return new EnigmaService(appName, appId)
    }

    async init() {
        return this.getEnigmaGlobal()
            .then(() => this.openApp())
            .then(() => this)
    }

    async getEnigmaGlobal() {
        const session = enigma.create({
            schema,
            // url: `ws://${import.meta.env.QLIK_VITE_HOSTNAME}:${import.meta.env.QLIK_VITE_PORT}/app/engineData`,
            url: `ws://localhost:4848/app/${this.appId}`,
            createSocket: url => new WebSocket(url)
        })
        session.on('opened', () => console.log('Conexão aberta', this.appName))
        session.on('closed', () => console.log('Conexão fechada', this.appName))
        session.on('notification:*', (eventName, data) => console.log(eventName, data, this.appName));

        const global = await session.open()
        this.global = global
        return global
    }

    async openApp() {
        try {
            this.app = await this.global.openDoc(this.appId)  
        } catch (error) {
            console.error('Erro ao abrir o app', this.appName, error)
        }
        return this.app
    }
    
    async getAllInfos() {
        try {
            const allInfos = await this.app.getAllInfos()
            const selection = allInfos.filter(info => ['measure', 'dimension', 'bookmark'].includes(info.qType))
            console.log('allInfos', selection)
        } catch (error) {
            console.log('error getting all infos', error)
        }
    }

    async getMasterObjects() {
        try {
            const objectsInfo = await this.app.getObjects({qTypes: ['masterobject']})
            const objects = await Promise.all(objectsInfo.map(obj => this.app.getObject(obj.qInfo.qId)))

            const properties = await Promise.all(objects.map(obj => obj.getProperties()))
            //filter out master objects of undesired type
            const filteredProps = properties.filter((prop => prop.visualization !== 'filterpane'))

            // //filter out props that dont match the criteria
            const propsOfInterest = filteredProps.filter(helperFunctions.filterCharts)
            const masterObjectInfo = propsOfInterest.map(properties => {
                return {
                    properties,
                    affectedDims: properties.qHyperCubeDef.qDimensions.filter(helperFunctions.findAffectedDims),
                    affectedMeasures: properties.qHyperCubeDef.qMeasures.filter(helperFunctions.findAffectedMeasures)
                }
            })
            return masterObjectInfo
        } catch (error) {
            console.error('Error getting master items: ', error)
        }
    }

    async getCharts() {
        try {
            const objectsInfo = await this.app.getObjects({qTypes: qChartTypes})
            const objects = await Promise.all(objectsInfo.map(obj => this.app.getObject(obj.qInfo.qId)))
            const chartProps = await Promise.all(objects.map(obj => obj.getProperties()))
        
            // const chartsOfInterest = chartProps.filter(helperFunctions.filterCharts)
            const filterMask = chartProps.map(helperFunctions.filterCharts)
            
            const filteredObjs = objects.filter((obj, idx) => filterMask[idx])
            const filterdProps = chartProps.filter((obj, idx) => filterMask[idx])

            const chartInfo = await Promise.all(filteredObjs.map( async (obj, idx) => {
                const properties = filterdProps[idx]
                const linkedSheet = await (await obj.getParent()).getProperties();
                return {
                    properties,
                    affectedDims: properties.qHyperCubeDef.qDimensions.filter(helperFunctions.findAffectedDims),
                    affectedMeasures: properties.qHyperCubeDef.qMeasures.filter(helperFunctions.findAffectedMeasures),
                    linkedSheet
                }
            }))
            return chartInfo
        } catch (error) {
            console.error('Error getting charts: ', error)
        }
    }

    async getSheets() {
        try {
            const objectsInfo = await this.app.getObjects({qTypes: ['sheet']})
            const objects = await Promise.all(objectsInfo.map(obj => this.app.getObject(obj.qInfo.qId)))
            const sheetProps = await Promise.all(objects.map(obj => obj.getProperties()))
            const sheetLayouts = await Promise.all(objects.map(obj => obj.getLayout()))

            const sheetInfo = objects.map((obj, idx) => {
                return {
                    props: sheetProps[idx],
                    layout: sheetLayouts[idx]
                }
            })

            const sheetsOfInterest = sheetInfo.filter(helperFunctions.filterSheets)
            return sheetsOfInterest
        } catch (error) {
            console.error('Error getting sheets: ', error)
        }
    }

    async getDimensions() {
        try {
            const objectsInfo = await this.app.getAllInfos()
            const dimensions = objectsInfo.filter(obj => obj.qType === 'dimension')
            const objects = await Promise.all(dimensions.map(obj => this.app.getDimension(obj.qId)))
            const properties = await Promise.all(objects.map(obj => obj.getProperties()))
            const propsOfInterest = properties.filter(helperFunctions.filterDimensions)
            return propsOfInterest
        } catch (error) {
            console.error('Error getting dimensions: ', error)
        }
    }
    
    async getMeasures() {
        try {
            const objectsInfo = await this.app.getAllInfos()
            const measures = objectsInfo.filter(obj => obj.qType === 'measure')
            const objects = await Promise.all(measures.map(obj => this.app.getMeasure(obj.qId)))
            const properties = await Promise.all(objects.map(obj => obj.getProperties()))
            const propsOfInterest = properties.filter(helperFunctions.filterMeasures)
            return propsOfInterest
        } catch (error) {
            console.error('Error getting measures: ', error)
        }
    }

    async getBookmarks() {
        try {
            const objectsInfo = await this.app.getAllInfos()
            const bookmarks = objectsInfo.filter(obj => obj.qType === 'bookmark')
            const objects = await Promise.all(bookmarks.map(obj => this.app.getBookmark(obj.qId)))

            const properties = await Promise.all(objects.map(obj => obj.getProperties()))
            const setAnalyses = await Promise.all(objects.map(obj => this.app.getSetAnalysis({
                qStateName: '$',
                qBookmarkId: obj.id
            })))

            const filterMask = setAnalyses.map(helperFunctions.filterBookmarks)
            
            const filteredProps = properties.filter((obj, idx) => filterMask[idx])
            const filteredSetAnalyses = setAnalyses.filter((setAnalysis, idx) => filterMask[idx])

            return filteredProps.map((props, idx) => {
                return {
                    props,
                    setAnalysis: filteredSetAnalyses[idx]
                }
            })
        } catch (error) {
            console.error('Error getting bookmarks: ', error)
        }
    }

    async getVariables() {
        try {
            const variables = await this.app.getVariables({qType: 'variable'})
            
            const varsOfInterest = variables.filter(helperFunctions.filterVariable)
            return varsOfInterest
        } catch (error) {
            console.error('Error getting variables: ', error)
        }
    }

    async getFilterPanes() {
        const objectsInfo = await this.app.getObjects({qTypes: ['listbox']})
        const objects = await Promise.all(objectsInfo.map(obj => this.app.getObject(obj.qInfo.qId)))

        const objProperties = await Promise.all(objects.map(obj => obj.getProperties()))

        const filterMask = objProperties.map(helperFunctions.filterListBoxes)

        const filteredObjects = objects.filter((obj, idx) => filterMask[idx])
        const filteredProps = objProperties.filter((obj, idx) => filterMask[idx])

        const affectedFilterPanes = await Promise.all(filteredObjects.map(obj => obj.getParent()))

        
        const sheets = await Promise.all(affectedFilterPanes.map(async filterPane => {
            if (filterPane.genericType === 'masterobject') return ''
            return (await filterPane.getParent()).getProperties()
        }))
        
        console.log('props', filteredProps)
        console.log('sheets', sheets)
        const filterPaneInfo = filteredObjects.map((obj, idx) => {
            // const filterPane = affectedFilterPanes[idx]
            const props = filteredProps[idx]
            const dimDef = filteredProps[idx].qListObjectDef.qDef.qFieldDefs.join(' | ')
            const sheet = sheets[idx]
            return {
                filterPane: props,
                affectedDim: dimDef,
                sheet: sheet
            }
        })

        return filterPaneInfo
    }
    async getScript() {
        try {
            return await this.app.getScript()
        } catch (error) {
            console.error('Error getting script: ', error)
        }
    }
    async getFieldsOfInterest() {
        const tablesAndKeys = await this.app.getTablesAndKeys({
            qWindowSize: {qcx: 0, qcy: 0},
            qNullSize: {qcx: 0, qcy: 0},
            qCellHeight: 0,
            qSyntheticMode: false,
            qIncludeSysVars: false
        })

        const fieldNameList = tablesAndKeys.qtr.flatMap(table => table.qFields).map(field => field.qName)

        const qDataPage = [
            {
              "qTop": 0,
              "qHeight": 100,
            //   "qHeight": 10000,
              "qLeft": 0,
              "qWidth": 1
            }
        ]

        // const allListDefs = {}
        
        // fieldNameList.forEach((fieldName, index) => {
        //     allListDefs[index] = {
        //         qListObjectDef: {
        //             qStateName: '$',
        //             qDef: {
        //                 qFieldDefs: [fieldName]
        //             },
        //             qInitialDataFetch: qDataPage

        //         }
        //     }
        // })

        const allListDefs = fieldNameList.map((fieldName) => {
            return {
                qListObjectDef: {
                    qStateName: '$',
                    qDef: {
                        qFieldDefs: [fieldName]
                    },
                    qInitialDataFetch: qDataPage

                }
            }
        })

        const sessionObject = await this.app.createSessionObject({
            qInfo:{
                qId: 'my-custom-obj',
                qType: 'ListObject'
            },
            allListDefs
        })

        // const allPossibleValues = await Promise.all(fieldNameList.map( async (fieldName, index) => {
        //     console.log('current', {
        //         qPath: `/allListDefs/qListObjectDef_${index}`,
        //         qPages: qDataPage
        //     })
        //     return await sessionObject.getListObjectData({
        //         qPath: `/allListDefs/qListObjectDef_${index}`,
        //         qPages: qDataPage
        //     })
        // }))

        // console.log(allPossibleValues)
        
        // const allPossibleValues = await sessionObject.getListObjectData({
        //     qPath: '/allListDefs/0/qListObjectDef',
        //     qPages: qDataPage
        // })

        const allPossibleValues = await sessionObject.getLayout()
        console.log('all possible values', allPossibleValues)

        const fieldsOfInterest = allPossibleValues.allListDefs.filter((fieldList) => {
            const fieldName = fieldList.qListObject.qDimensionInfo.qFallbackTitle
            const fieldNamesToIgnore = ['id', 'comentario', 'comentário', 'descrição', 'descricao']

            if(fieldNamesToIgnore.some(nameToIgnore => fieldName.toLowerCase().includes(nameToIgnore))) return false

            const data = fieldList.qListObject.qDataPages[0].qMatrix
            const allValues = data.map(row => row[0]?.qText).join(' | ')
            return valuesToSearch.some(value => allValues.includes(value))
        })

        console.log(fieldsOfInterest.map(field => [field.qListObject.qDimensionInfo.qFallbackTitle, field.qListObject.qDataPages]))
        return fieldsOfInterest.map(field => field.qListObject.qDimensionInfo.qFallbackTitle)
    }

    async getAllProperties() {
        try {
            const objectsInfo = await this.app.getObjects({qTypes: qChartTypes})
            console.log(objectsInfo)

            const objects = await Promise.all(objectsInfo.map(obj => this.app.getObject(obj.qInfo.qId)))

            const properties = await Promise.all(objects.map(obj => obj.getProperties()))

            //filter out master objects of undesired type
            const filteredproperties = properties.filter((obj => obj.visualization !== 'filterpane'))
            return filteredproperties
        } catch (error) {
            console.error('Error getting properties: ', error)
        }
    }

    async getAllLayouts() {
        try {
            const objectsInfo = await this.app.getObjects({qTypes: qChartTypes})
            console.log(objectsInfo)

            const objects = await Promise.all(objectsInfo.map(obj => this.app.getObject(obj.qInfo.qId)))

            const layouts = await Promise.all(objects.map(obj => obj.getLayout()))

            //filter out master objects of undesired type
            const filteredlayouts = layouts.filter((obj => obj.visualization !== 'filterpane'))
            return filteredlayouts
        } catch (error) {
            console.error('Error getting layouts: ', error)
        }
    }

}

export default EnigmaService