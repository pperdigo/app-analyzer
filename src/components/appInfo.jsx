import { useContext } from "react";
import { AppContext } from "../App";

const AppInfo = () => {
    const app = useContext(AppContext).IVL
    // console.log(app)
    // app.getAllProperties().then((props) => console.log('all props', props))
    // app.getAllLayouts().then((layouts) => {
    //     console.log('all layouts: ', layouts)
    //     const masterItem = layouts[0];
    //     console.log('masterItem', masterItem)
    //     const childIds = masterItem.qChildList.qItems.map(child => child.qInfo.qId)
    //     console.log('childIds', childIds)
    //     Promise.all(childIds.map(id => app.app.getObject(id)))
    //         .then((childObjects) => Promise.all(childObjects.map(childObject => childObject.getLayout())))
    //         .then(childLayouts => console.log('child layouts', childLayouts))
        
    // })

    app.getMasterObjects()
        .then((obj) => console.log('getMasterObjects', obj))

    app.getCharts()
        .then((obj) => console.log('all charts', obj))

    app.getSheets()
        .then((obj) => console.log('getSheets', obj))

    app.getDimensions()
        .then((obj) => console.log('getDimensions', obj))

    app.getMeasures()
        .then((obj) => console.log('getMeasures', obj))

    app.getBookmarks()
        .then((obj) => console.log('getBookmarks', obj))

    app.getVariables()
        .then((obj) => {
            console.log('variables', obj)
            // console.log(obj.filter(obj => 
            //                 obj.qDefinition.includes('Linha Produção') 
            //                 ||
            //                 obj.qDefinition.includes('Processo Principal') 
            // ))
        })

    // app.app.getAllInfos().then((infos) => {
    //     const qtypes = new Set(infos.map(i => i.qType ))
    //     console.log('types', qtypes)
    // })

    // app.app.getObjects({qTypes: [
    //     "masterobject",
    //     "sheet",
    //     "table",
    //     "combochart",
    //     "kpi",
    //     "pivot-table",
    //     "qlik-multi-kpi",
    //     "waterfallchart",
    //     "barchart",
    //     "piechart",
    //     "dimension",
    //     "measure",
    //     "bookmark"
    // ]}).then((objs) => console.log('all infos', objs))

    // app.getAllInfos().then((infos) => {
    //     const objectRefs = infos.filter(i => ['appprops', 'LoadModel'].includes(i.qType))
    //     console.log('objectRefs', objectRefs)
    //     const objects = objectRefs.map(obj => app.getObject(obj.qId))
    //     Promise.all(objects).then(objs => {
    //         objs.forEach(obj => {
    //             obj.getProperties().then(props => console.log('props', props))
    //         })
    //     })
    // })

    // app.getObjects({qTypes: ['appprops']}).then(appProps => console.log('appProps', appProps))
    // app.getObjects({qTypes: ['LoadModel']}).then(LoadModel => console.log('LoadModel', LoadModel))
    return ( 
        <div className="col-10">
            content
        </div>
    );
}
 
export default AppInfo;