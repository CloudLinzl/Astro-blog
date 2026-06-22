---
title: Guía del Tema
published: 2025-01-26
updated: 2025-04-13
tags:
  - Tema de Blog
  - Guía
pin: 99
lang: es
abbrlink: theme-guide
---

Retypeset es un tema de blog estático basado en el framework [Astro](https://astro.build/). Esta guía presenta cómo modificar la configuración del tema y crear nuevos artículos, ayudándote a configurar rápidamente tu blog personal.

## Configuración del Tema

Personaliza tu blog mediante la modificación del archivo de configuración [src/config.ts](https://github.com/radishzzz/astro-theme-retypeset/blob/master/src/config.ts).

### Información del Sitio

```ts
site: {
  // título del sitio
  title: 'Retypeset'
  // subtítulo del sitio
  subtitle: 'Revive the beauty of typography'
  // descripción del sitio
  description: 'Retypeset is a static blog theme...'
  // usar título/subtítulo/descripción en varios idiomas desde src/i18n/ui.ts en lugar de los estáticos de arriba
  i18nTitle: true // true | false
  // nombre del autor
  author: 'radishzz'
  // url del sitio
  url: 'https://retypeset.radishzz.cc'
  // ruta base
  // directorio raíz para todas las páginas y recursos
  base: '/' // ej., '/blog', '/docs'
  // url del favicon
  // formatos recomendados: svg, png o ico
  favicon: '/icons/favicon.svg' // o https://example.com/favicon.svg
}
```

### Color del Tema

```ts
color: {
  // modo de tema predeterminado
  mode: 'light' // light | dark | auto
  // modo claro
  light: {
    // color primario
    // usado para títulos, hover, etc
    primary: 'oklch(25% 0.005 298)'
    // color secundario
    // usado para texto de publicaciones
    secondary: 'oklch(40% 0.005 298)'
    // color de fondo
    background: 'oklch(96% 0.005 298)'
    // color de resaltado
    // usado para barra de navegación, texto seleccionado, etc
    highlight: 'oklch(0.93 0.195089 103.2532 / 0.5)'
  }
  // modo oscuro
  dark: {
    // color primario
    primary: 'oklch(92% 0.005 298)'
    // color secundario
    secondary: 'oklch(77% 0.005 298)'
    // color de fondo
    background: 'oklch(22% 0.005 298)'
    // color de resaltado
    highlight: 'oklch(0.93 0.195089 103.2532 / 0.2)'
  }
}
```

### Configuración Global

```ts
global: {
  // idioma predeterminado
  // idioma de la ruta raíz del sitio '/'
  locale: 'zh' // de | en | es | fr | ja | ko | pl | pt | ru | zh | zh-tw
  // más idiomas
  // genera rutas multilingües como '/en/' '/es/'
  // no incluir el código de idioma anterior nuevamente, puede ser un array vacío []
  moreLocales: ['en', 'es', 'ja', 'ru', 'zh-tw'] // ['de', 'en', 'es', 'fr', 'ja', 'ko', 'pl', 'pt', 'ru', 'zh', 'zh-tw']
  // estilo de fuente de la publicación
  fontStyle: 'sans' // sans | serif
  // formato de fecha de la publicación
  // YYYY-MM-DD | MM-DD-YYYY | DD-MM-YYYY | MMM D YYYY | D MMM YYYY
  // 2025-04-13, 04-13-2025, 13-04-2025, Apr 13 2025，13 Apr 2025
  dateFormat: 'YYYY-MM-DD'
  // activar tabla de contenidos
  toc: true // true | false
  // activar renderizado matemático katex
  katex: true // true | false
  // reducir movimiento
  reduceMotion: false // true | false
}
```

### Sistema de Comentarios

```ts
comment: {
  // habilitar sistema de comentarios
  enabled: true // true | false
  // sistema de comentarios giscus
  giscus: {
    repo: ''
    repoId: ''
    category: ''
    categoryId: ''
    mapping: 'pathname'
    strict: '0'
    reactionsEnabled: '1'
    emitMetadata: '0'
    inputPosition: 'bottom'
  }
  // sistema de comentarios twikoo
  twikoo: {
    envId: ''
    // version: la versión frontend puede cambiarse en package.json
  }
  // sistema de comentarios waline
  waline: {
    // URL del servidor
    serverURL: 'https://retypeset-comment.radishzz.cc'
    // URL de emojis
    emoji: [
      'https://unpkg.com/@waline/emojis@1.2.0/tw-emoji'
      // 'https://unpkg.com/@waline/emojis@1.2.0/bmoji'
      // más emojis: https://waline.js.org/en/guide/features/emoji.html
    ]
    // búsqueda de gif
    search: false // true | false
    // cargador de imágenes
    imageUploader: false // true | false
  }
}
```

### SEO

```ts
seo: {
  // ID de Twitter
  twitterID: '@radishzz_'
  // verificación del sitio
  verification: {
    // google search console
    google: 'AUCrz5F1e5qbnmKKDXl2Sf8u6y0kOpEO1wLs6HMMmlM'
    // herramientas para webmasters de bing
    bing: '64708CD514011A7965C84DDE1D169F87'
    // webmaster de yandex
    yandex: ''
    // búsqueda baidu
    baidu: ''
  }
  // google analytics
  googleAnalyticsID: ''
  // umami analytics
  umamiAnalyticsID: 'dab0e4b9-9cbf-43c3-af60-b09d3b545c38'
  // verificación de folo
  folo: {
    // ID de feed
    feedID: ''
    // ID de usuario
    userID: ''
  }
  // clave de acceso apiflash
  // generar capturas de pantalla del sitio web para imágenes de open graph
  // obtén tu clave de acceso en: https://apiflash.com/
  apiflashKey: ''
}
```

### Configuración del Pie de Página

```ts
footer: {
  // enlaces sociales
  links: [
    {
      name: 'RSS',
      url: '/atom.xml', // o /rss.xml
    },
    {
      name: 'GitHub',
      url: 'https://github.com/radishzzz/astro-theme-retypeset',
    },
    {
      name: 'Email',
      url: 'email@radishzz.cc',
    }
    // {
    //   name: 'X',
    //   url: 'https://x.com/radishzz_',
    // },
  ]
  // año de inicio del sitio web
  startYear: 2025
}
```

### Precargar Recursos

```ts
preload: {
  // URL de alojamiento de imágenes
  // optimizar imágenes remotas y generar marcadores de posición de baja calidad
  imageHostURL: 'image.radishzz.cc'
  // js personalizado de google analytics
  // para usuarios que proxean scripts de seguimiento a un dominio personalizado
  customGoogleAnalyticsJS: ''
  // js personalizado de umami analytics
  // para usuarios que auto-alojan umami o proxean scripts de seguimiento a un dominio personalizado
  customUmamiAnalyticsJS: 'https://views.radishzz.cc/script.js'
}
```

## Configuración Adicional

Además del archivo de configuración `src/config.ts`, algunas opciones de configuración se encuentran en otros archivos.

### Resaltado de Sintaxis

Temas de resaltado de sintaxis para bloques de código.

```ts
// astro.config.ts

shikiConfig: {
  // Temas disponibles: https://shiki.style/themes
  // El color de fondo sigue el tema del blog por defecto, no el tema de resaltado de sintaxis
  themes: {
    light: 'github-light' // Tema claro
    dark: 'github-dark' // Tema oscuro
  }
}
```

### Extracto de Artículo

Cantidad de caracteres para extractos automáticos de artículos.

```ts
// src/utils/description.ts

const excerptLengths: Record<ExcerptScene, {
  cjk: number // Chino, Japonés, Coreano
  other: number // Otros idiomas
}> = {
  list: { // Lista de publicaciones en página principal
    cjk: 120, // Extrae automáticamente los primeros 120 caracteres
    other: 240, // Extrae automáticamente los primeros 240 caracteres
  },
}
```

### Open Graph

Estilos de [tarjetas sociales Open Graph](https://orcascan.com/tools/open-graph-validator?url=https%3A%2F%2Fretypeset.radishzz.cc%2Fes%2Fposts%2Ftheme-guide%2F).

```ts
// src/pages/og/[...image].ts

getImageOptions: (_path, page) => ({
  logo: {
    path: './public/icons/og-logo.png', // Ruta local requerida y formato PNG
    size: [250], // Ancho del logo
  },
  font: {
    title: { // Título
      families: ['Noto Sans SC'], // Fuente
      weight: 'Bold', // Peso
      color: [34, 33, 36], // Color
      lineHeight: 1.5, // Altura de línea
    },
  },
  fonts: [ // Rutas de fuentes (locales o remotas)
    'https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/SubsetOTF/SC/NotoSansSC-Bold.otf',
    'https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/SubsetOTF/SC/NotoSansSC-Regular.otf',
  ],
  bgGradient: [[242, 241, 245]], // Color de fondo
  // Más configuraciones: https://github.com/delucis/astro-og-canvas/tree/latest/packages/astro-og-canvas
})
```

### Canal RSS

Estilos de [página del feed RSS](https://retypeset.radishzz.cc/es/atom.xml).

```html
<!-- public/feeds/xxx-style.xsl -->

<style type="text/css">
body{color:oklch(25% 0.005 298)} /* Color de fuente */
.bg-white{background-color:oklch(0.96 0.005 298)!important} /* Color de fondo */
.text-gray{color:oklch(0.25 0.005 298 / 75%)!important} /* Color de fuente secundario */
</style>
```

## Creación de un Nuevo Artículo

Ejecuta `pnpm new-post <filename>` para crear un nuevo artículo, que luego puede editarse en el directorio `src/content/posts/`.

```bash
pnpm new-post                      ->  src/content/posts/new-post.md
pnpm new-post first-post           ->  src/content/posts/first-post.md
pnpm new-post 2025/03/first-post   ->  src/content/posts/2025/03/first-post.md
pnpm new-post first-post.mdx       ->  src/content/posts/first-post.mdx
```

### Front Matter

Solo los campos `title` y `published` son obligatorios, todas las demás configuraciones pueden omitirse.

```markdown
---
# Obligatorio
title: Guía del Tema
published: 2025-01-26

# Opcional
description: Los primeros 240 caracteres del artículo se seleccionarán automáticamente como extracto.
updated: 2025-03-26
tags:
  - Tema de Blog
  - Guía

# Avanzado, Opcional
draft: true/false
pin: 0-99
toc: true/false
lang: de/en/es/fr/ja/ko/pl/pt/ru/zh/zh-tw
abbrlink: theme-guide
---
```

### Configuración Avanzada

#### draft

Marca el artículo como borrador. Cuando se establece como true, el artículo no se puede publicar y solo está disponible para vista previa en desarrollo local. El valor predeterminado es false.

#### pin

Fija el artículo en la parte superior. Cuanto mayor sea el número, mayor será la prioridad del artículo fijado. El valor predeterminado es 0, lo que significa que no está fijado.

#### toc

Genera tabla de contenidos. Muestra encabezados de h2 a h4. Determinado por la configuración global `global.toc` por defecto, pero puede ser modificada individualmente en cada artículo.

#### lang

Especifica el idioma del artículo. Solo se puede especificar un idioma. Si no se especifica, el artículo se mostrará en todas las rutas de idioma por defecto.

```md
# src/config.ts
# locale: 'en'
# moreLocales: ['es', 'ru']

# lang: ''
src/content/posts/apple.md   ->  example.com/posts/apple/
                             ->  example.com/es/posts/apple/
                             ->  example.com/ru/posts/apple/
# lang: en
src/content/posts/apple.md   ->  example.com/posts/apple/
# lang: es
src/content/posts/apple.md   ->  example.com/es/posts/apple/
# lang: ru
src/content/posts/apple.md   ->  example.com/ru/posts/apple/
```

#### abbrlink

Personaliza la URL del artículo. Solo puede contener letras minúsculas, números y guiones `-`.

```md
# src/config.ts
# locale: 'en'
# moreLocales: ['es', 'ru']
# lang: 'es'

# abbrlink: ''
src/content/posts/apple.md           ->  example.com/es/posts/apple/
src/content/posts/guide/apple.md     ->  example.com/es/posts/guide/apple/
src/content/posts/2025/03/apple.md   ->  example.com/es/posts/2025/03/apple/

# abbrlink: 'banana'
src/content/posts/apple.md           ->  example.com/es/posts/banana/
src/content/posts/guide/apple.md     ->  example.com/es/posts/banana/
src/content/posts/2025/03/apple.md   ->  example.com/es/posts/banana/
```

### Formato de Texto Mixto

Ejecuta `pnpm format-posts` para optimizar el formato en los archivos Markdown dentro del directorio `src/content/`. Este comando corrige automáticamente los espacios entre caracteres CJK (Chino, Japonés, Coreano) y latinos, ajusta los signos de puntuación y mejora la legibilidad general del texto.

```bash
pnpm format-posts
🔍 Scanning Markdown files...
📦 Found 56 Markdown files
✅ src/content/posts/guides/Theme Guide-ja.md
✅ src/content/posts/guides/Theme Guide-zh-tw.md
✅ src/content/posts/guides/Theme Guide-zh.md
✨ Formatted 3 files successfully
```
