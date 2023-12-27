// @refresh reload
import { Router } from '@solidjs/router'
import { FileRoutes } from '@solidjs/start'

import './app.css'

export default function App() {
  return (
    <main>
      <header>
        <h1>
          <a href="/">signal-gl</a>
        </h1>
        <nav>
          <a href="/examples">examples</a>
          <a href="/api">api</a>
          <a href="https://github.com/bigmistqke/signal-gl">github</a>
        </nav>
      </header>
      <Router>
        <FileRoutes />
      </Router>
    </main>
  )
}
