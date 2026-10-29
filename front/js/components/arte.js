/**
 * Ilustrações autorais das peças da vitrine.
 *
 * Cada peça é um SVG inline no mesmo estilo: cabide minimalista, silhueta
 * duotone dentro da paleta da marca, textura de tecido em <pattern> sutil
 * e sombra no chão. IDs de defs são prefixados com a chave da arte para
 * evitar colisão entre múltiplos SVGs no mesmo documento.
 */

import { h } from './dom.js'

const FAINT = '#716C85'
const INK = '#F2EFFA'

function moldura(chave, rotulo, conteudo, comTextura = true) {
  return `<svg viewBox="0 0 200 260" role="img" aria-label="${rotulo}" class="arte-svg">
    <defs>
      <radialGradient id="bg-${chave}" cx="50%" cy="36%" r="78%">
        <stop offset="0%" stop-color="#242033"></stop>
        <stop offset="100%" stop-color="#1B1826"></stop>
      </radialGradient>
      <pattern id="pat-${chave}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <path d="M0 0 H8" stroke="${INK}" stroke-width="0.7" stroke-opacity="0.07" fill="none"></path>
      </pattern>
    </defs>
    <rect x="0" y="0" width="200" height="260" rx="14" fill="url(#bg-${chave})"></rect>
    <ellipse cx="100" cy="243" rx="52" ry="8" fill="#0A0810" opacity="0.5"></ellipse>
    <g stroke="${FAINT}" stroke-width="2" fill="none" stroke-linecap="round">
      <path d="M93 22 a7 7 0 1 1 14 0"></path>
      <path d="M100 22 V34"></path>
      <path d="M100 34 L64 58"></path>
      <path d="M100 34 L136 58"></path>
    </g>
    ${conteudo}
    ${
      comTextura
        ? `<rect x="0" y="0" width="200" height="260" fill="url(#pat-${chave})" rx="14"></rect>`
        : ''
    }
  </svg>`
}

/* ---------------- Peças ---------------- */

const PECAS = {
  'vestido-longo': moldura(
    'vestido-longo',
    'Ilustração de vestido longo',
    `<g stroke="#8B5CF6" stroke-width="3" stroke-linecap="round">
        <path d="M80 58 L84 84" fill="none"></path>
        <path d="M120 58 L116 84" fill="none"></path>
      </g>
      <path d="M84 82 Q100 98 116 82 L118 128 L82 128 Z" fill="#A78BFA"></path>
      <path d="M82 128 C68 170 60 200 58 225 L142 225 C140 200 132 170 118 128 Z" fill="#A78BFA"></path>
      <path d="M82 128 L118 128" stroke="#8B5CF6" stroke-width="2"></path>
      <path d="M138 195 L142 225" stroke="#8B5CF6" stroke-width="1.5"></path>`
  ),
  blazer: moldura(
    'blazer',
    'Ilustração de blazer de alfaiataria',
    `<path d="M72 58 L52 64 L48 168 L66 170 Z" fill="#38BDF8"></path>
      <path d="M128 58 L148 64 L152 168 L134 170 Z" fill="#38BDF8"></path>
      <path d="M72 58 L128 58 L131 178 L69 178 Z" fill="#38BDF8"></path>
      <path d="M72 58 L100 112 L88 130 L76 96 Z" fill="#818CF8"></path>
      <path d="M128 58 L100 112 L112 130 L124 96 Z" fill="#818CF8"></path>
      <path d="M100 112 L100 178" stroke="#1B1826" stroke-width="1.5"></path>
      <circle cx="100" cy="142" r="2.5" fill="#818CF8"></circle>
      <circle cx="100" cy="154" r="2.5" fill="#818CF8"></circle>`
  ),
  camisa: moldura(
    'camisa',
    'Ilustração de camisa social',
    `<path d="M76 58 L54 64 L50 158 L70 160 Z" fill="#A78BFA"></path>
      <path d="M124 58 L146 64 L150 158 L130 160 Z" fill="#A78BFA"></path>
      <path d="M50 158 L70 160 L69 170 L49 168 Z" fill="#F2EFFA" opacity="0.85"></path>
      <path d="M150 158 L130 160 L131 170 L151 168 Z" fill="#F2EFFA" opacity="0.85"></path>
      <path d="M76 58 L124 58 L127 176 L73 176 Z" fill="#A78BFA"></path>
      <path d="M88 58 L100 76 L75 68 Z" fill="#F2EFFA"></path>
      <path d="M112 58 L100 76 L125 68 Z" fill="#F2EFFA"></path>
      <path d="M100 76 L100 176" stroke="#F2EFFA" stroke-width="1.5" opacity="0.9"></path>
      <circle cx="100" cy="96" r="2" fill="#F2EFFA"></circle>
      <circle cx="100" cy="112" r="2" fill="#F2EFFA"></circle>
      <circle cx="100" cy="128" r="2" fill="#F2EFFA"></circle>
      <circle cx="100" cy="144" r="2" fill="#F2EFFA"></circle>
      <circle cx="100" cy="160" r="2" fill="#F2EFFA"></circle>`
  ),
  saia: moldura(
    'saia',
    'Ilustração de saia midi com pregas',
    `<g stroke="#716C85" stroke-width="1.5">
        <path d="M70 58 L80 94" fill="none"></path>
        <path d="M130 58 L120 94" fill="none"></path>
      </g>
      <path d="M78 92 L122 92 L121 106 L79 106 Z" fill="#38BDF8"></path>
      <path d="M79 106 C68 150 62 185 60 210 L140 210 C138 185 132 150 121 106 Z" fill="#2DD4BF"></path>
      <g stroke="#38BDF8" stroke-width="1.2" opacity="0.6">
        <path d="M100 106 L100 210" fill="none"></path>
        <path d="M88 108 L80 210" fill="none"></path>
        <path d="M112 108 L120 210" fill="none"></path>
      </g>`
  ),
  'vestido-festa': moldura(
    'vestido-festa',
    'Ilustração de vestido de festa',
    `<path d="M78 72 L122 72 L120 126 L80 126 Z" fill="#F472B6"></path>
      <path d="M80 126 C62 160 48 200 46 228 L154 228 C152 200 138 160 120 126 Z" fill="#F472B6"></path>
      <path d="M62 182 Q82 172 100 182 Q118 172 138 182" stroke="#A78BFA" stroke-width="2" fill="none"></path>
      <path d="M54 206 Q78 196 100 206 Q122 196 146 206" stroke="#A78BFA" stroke-width="2" fill="none"></path>
      <g fill="#A78BFA">
        <circle cx="90" cy="86" r="1.6"></circle>
        <circle cx="108" cy="98" r="1.6"></circle>
        <circle cx="100" cy="112" r="1.6"></circle>
      </g>`
  ),
  conjunto: moldura(
    'conjunto',
    'Ilustração de conjunto em duas peças',
    `<g stroke="#716C85" stroke-width="1.5">
        <path d="M72 58 L80 64" fill="none"></path>
        <path d="M128 58 L120 64" fill="none"></path>
      </g>
      <path d="M80 62 L120 62 L122 102 L78 102 Z" fill="#F472B6"></path>
      <path d="M78 114 L122 114 C116 150 112 178 110 196 L90 196 C88 178 84 150 78 114 Z" fill="#FB923C"></path>
      <path d="M78 114 L122 114" stroke="#F472B6" stroke-width="2.5"></path>`
  ),
  noiva: moldura(
    'noiva',
    'Ilustração de vestido de noiva',
    `<path d="M62 58 C42 110 38 180 46 240 C70 234 130 234 154 240 C162 180 158 110 138 58 Z"
          fill="#A78BFA" opacity="0.16"></path>
      <g stroke="#F2EFFA" stroke-width="2.5" stroke-linecap="round">
        <path d="M84 58 L87 86" fill="none"></path>
        <path d="M116 58 L113 86" fill="none"></path>
      </g>
      <path d="M87 86 Q100 102 113 86 L115 132 L85 132 Z" fill="#F2EFFA"></path>
      <path d="M85 132 C68 175 58 215 56 236 L144 236 C142 215 132 175 115 132 Z" fill="#F2EFFA"></path>
      <path d="M85 132 L115 132" stroke="#A78BFA" stroke-width="2"></path>
      <g stroke="#B2AEC2" stroke-width="1" opacity="0.4">
        <path d="M92 140 L88 232" fill="none"></path>
        <path d="M108 140 L112 232" fill="none"></path>
      </g>`
  ),
  kimono: moldura(
    'kimono',
    'Ilustração de kimono',
    `<path d="M78 58 L34 76 L26 168 L66 172 Z" fill="#FB923C"></path>
      <path d="M122 58 L166 76 L174 168 L134 172 Z" fill="#FB923C"></path>
      <path d="M78 58 L122 58 L128 192 L72 192 Z" fill="#FB923C"></path>
      <path d="M84 58 L100 122 L116 58 L110 58 L100 108 L90 58 Z" fill="#F472B6" opacity="0.92"></path>
      <path d="M82 138 L118 138 L118 154 L82 154 Z" fill="#F472B6"></path>
      <circle cx="118" cy="146" r="5" fill="#F472B6"></circle>`
  ),
  camiseta: moldura(
    'camiseta',
    'Ilustração de camiseta de alfaiataria',
    `<path d="M76 58 L54 68 L58 108 L76 104 Z" fill="#38BDF8"></path>
      <path d="M124 58 L146 68 L142 108 L124 104 Z" fill="#38BDF8"></path>
      <path d="M76 58 L124 58 L128 174 L72 174 Z" fill="#38BDF8"></path>
      <path d="M86 58 Q100 74 114 58" stroke="#2DD4BF" stroke-width="4.5" fill="none" stroke-linecap="round"></path>
      <path d="M72 164 L128 164" stroke="#2DD4BF" stroke-width="1.5" opacity="0.7"></path>`
  ),
}

/* ---------------- API pública ---------------- */

export const ARTES = [
  { id: 'vestido-longo', rotulo: 'Vestido longo' },
  { id: 'blazer', rotulo: 'Blazer' },
  { id: 'camisa', rotulo: 'Camisa' },
  { id: 'saia', rotulo: 'Saia' },
  { id: 'vestido-festa', rotulo: 'Vestido de festa' },
  { id: 'conjunto', rotulo: 'Conjunto' },
  { id: 'noiva', rotulo: 'Vestido de noiva' },
  { id: 'kimono', rotulo: 'Kimono' },
  { id: 'camiseta', rotulo: 'Camiseta' },
]

/** Cartão de arte pronto para inserir (proporção 200×260). */
export function artePeca(arte = 'vestido-longo', classe = '') {
  return h('div', {
    class: `arte-peca${classe ? ` ${classe}` : ''}`,
    innerHTML: PECAS[arte] ?? PECAS['vestido-longo'],
  })
}
