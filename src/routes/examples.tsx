import { A } from '@solidjs/router'
import { For, ParentProps } from 'solid-js'

import styles from "./examples.module.css"

export default function (props: ParentProps) {
  const examples = Object.keys(import.meta.glob('./examples/*.tsx'))
    .filter(v => !v.includes('index'))
    .map(v => v.replace('./', ''))
    .sort((a,b) => a < b ? -1 : 1)
    .map(v => v.split('.').slice(0, -1).join('').split('/').slice(1).join('/'))


  console.log('examples', examples)
  
  return (
    <div class={styles.page}>
      <ul>
        <For each={examples}>
          {(example) => (
            <li class={styles.list}>
              <A href={`./${example}`}>
                {example.split('_').slice(1).join(' ')}
              </A>
            </li>
          )}
        </For>
      </ul>
      {props.children}
    </div>
  )
}
