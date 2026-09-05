import { Landings } from './Landings'
import './App.css'

function App() {
  return (
    <main className="page">
      <header className="masthead">
        <p className="eyebrow">ABLE Activator Program</p>
        <h1>
          Two ways to tell
          <br />
          the same story.
        </h1>
        <p className="standfirst">
          Both pages cover the six-weekend programme. They open differently.
          Pick one to read it in full.
        </p>
      </header>

      <Landings />
    </main>
  )
}

export default App

