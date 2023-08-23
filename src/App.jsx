import { useEffect, createContext, useState } from 'react'
import './App.css'
import ids from './assets/ids.json'
import EnigmaService from './qlik/EnigmaService'
import Interface from './components/interface'

export const AppContext = createContext()

function App() {
  const [enigmaInitialized, setEnigmaInitialized] = useState(false)
  const [context, setContext] = useState()
  useEffect(() => {
    const instances = []
    for (const [appName, appId] of Object.entries(ids)) {
        instances.push(EnigmaService.createInstance( appName, appId ))
    }
    Promise.all(instances.map(instance => instance.init())).then( instances => {
        const context = {}
        instances.forEach((inst) => {
            context[inst.appName] = inst
        })

        setEnigmaInitialized(true)
        setContext(context)
        })
    }, [])

    if(enigmaInitialized) {
        return (
            <AppContext.Provider value = {context}>
                <Interface></Interface>       
            </AppContext.Provider>
        )
    } else {
        return <p>Abrindo apps</p>
    }
}

export default App
