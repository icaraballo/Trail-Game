// T105 (v88): primer escalón de verificación automática. No es una suite de
// tests: es la red que habría cazado sin que nadie leyera el código el `mental`
// fuera de ámbito de T01 (no-undef) y la variable muerta `push` de T20
// (no-unused-vars). Los ficheros son scripts clásicos que comparten un único
// ámbito global, así que todo lo que define un fichero es visible en los demás:
// por eso `sourceType: 'script'` y no 'module'.
//
// Uso:  npm install  &&  npm run lint
'use strict';

const fs=require('fs');
const path=require('path');

// Los 9 ficheros comparten global. En vez de mantener a mano la lista de
// símbolos exportados, se extraen de las propias declaraciones de nivel raíz.
const SRC=path.join(__dirname,'js');
const globals={G:'writable'};
for(const f of fs.readdirSync(SRC).filter(n=>n.endsWith('.js'))){
  const code=fs.readFileSync(path.join(SRC,f),'utf8');
  for(const m of code.matchAll(/^(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)){
    globals[m[1]]='readonly';
  }
  // Muchos handlers viven como `window.doPace=...` porque los llama un onclick
  // inline del HTML; para el resto de ficheros son globales igual.
  for(const m of code.matchAll(/^window\.([A-Za-z_$][\w$]*)\s*=/gm)){
    globals[m[1]]='readonly';
  }
}

module.exports=[
  {
    files:['js/*.js'],
    languageOptions:{
      ecmaVersion:2022,
      sourceType:'script',
      globals:{
        ...globals,
        window:'readonly', document:'readonly', localStorage:'readonly',
        setTimeout:'readonly', clearTimeout:'readonly', setInterval:'readonly',
        clearInterval:'readonly', requestAnimationFrame:'readonly',
        console:'readonly', navigator:'readonly', alert:'readonly',
        confirm:'readonly', prompt:'readonly', atob:'readonly', btoa:'readonly',
        TextEncoder:'readonly', TextDecoder:'readonly', Uint8Array:'readonly',
        structuredClone:'readonly', getComputedStyle:'readonly', location:'readonly',
      },
    },
    rules:{
      'no-undef':'error',
      // `vars:'local'`: las declaraciones de nivel raíz son de facto las
      // exportaciones de cada fichero — el resto del juego las usa a través del
      // ámbito global compartido, así que marcarlas como no usadas es ruido.
      // Lo que sí interesa cazar es la variable muerta dentro de una función,
      // que es exactamente el caso de T20.
      // 'warn', no 'error': una variable muerta es suciedad, no un fallo, y
      // dejarla en error hacía que `npm run check` saliera en rojo por las 15
      // que quedan de fase 2 — y con `&&` eso impedía que los tests llegaran a
      // ejecutarse. El error de verdad es no-undef, que sí cuelga la partida.
      'no-unused-vars':['warn',{vars:'local',args:'none',caughtErrors:'none',varsIgnorePattern:'^_'}],
    },
  },
];
