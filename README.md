# AmAIke - Asistente de El Eco de Tandil

AmAIke es un asistente virtual de inteligencia artificial desarrollado para El Eco de Tandil, un periódico local de Tandil, Argentina. Este asistente permite a los usuarios buscar información específica en el contenido del sitio web de El Eco de manera conversacional.

## 🚀 Características

- **Búsqueda Inteligente**: Utiliza Google Gemini AI para buscar información específica en eleco.com.ar
- **Interfaz Conversacional**: Chat intuitivo y fácil de usar
- **Fuentes Verificadas**: Solo muestra información de artículos publicados en El Eco de Tandil
- **Recopilación Estructurada de Información**: Sistema avanzado para recopilar tips de noticias con datos estructurados
- **Validación de Datos**: Verificación automática de la completitud de la información
- **Envío Automático**: Integración con API backend y fallback a email
- **Citas Automáticas**: Siempre incluye enlaces a los artículos fuente

## 🛠️ Tecnologías

- **React 19** con TypeScript
- **Google Gemini AI** (Gemini 2.5 Flash)
- **Vite** como build tool
- **Tailwind CSS** para estilos
- **React Markdown** para renderizado de contenido

## 📋 Prerrequisitos

- Node.js (versión 18 o superior)
- npm o yarn
- API Key de Google Gemini AI

## 🔧 Instalación

1. **Clona el repositorio**
   ```bash
   git clone <repository-url>
   cd amaike---asistente-de-el-eco-de-tandil
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno**
   Crea un archivo `.env` en la raíz del proyecto:
   ```env
   API_KEY=tu_api_key_de_google_gemini
   REACT_APP_TIP_SUBMISSION_URL=https://api.eleco.com.ar/tips
   REACT_APP_SUBMISSION_API_KEY=tu_api_key_para_submisiones
   ```

4. **Ejecuta el proyecto en modo desarrollo**
   ```bash
   npm run dev
   ```

## 🏗️ Estructura del Proyecto

```
├── components/           # Componentes React
│   ├── ChatInput.tsx    # Input para mensajes del usuario
│   ├── ChatMessage.tsx  # Componente para mostrar mensajes
│   ├── Header.tsx       # Cabecera de la aplicación
│   ├── LoadingIndicator.tsx # Indicador de carga
│   ├── SourceLink.tsx   # Enlaces a fuentes
│   ├── TipConfirmation.tsx # Confirmación de datos recopilados
│   └── TipSubmissionStatus.tsx # Estado del envío de tips
├── services/            # Servicios
│   ├── geminiService.ts # Integración con Google Gemini
│   └── tipSubmissionService.ts # Servicio para envío de tips
├── constants.ts         # Constantes y prompt del sistema
├── types.ts           # Definiciones de tipos TypeScript
├── App.tsx            # Componente principal
└── index.tsx          # Punto de entrada
```

## 🤖 Cómo Funciona AmAIke

### Sistema de Búsqueda
1. **Consulta del Usuario**: El usuario hace una pregunta en el chat
2. **Procesamiento AI**: Google Gemini procesa la consulta con búsqueda web habilitada
3. **Filtrado de Fuentes**: Solo se muestran resultados de eleco.com.ar
4. **Respuesta Contextual**: AmAIke responde basándose únicamente en el contenido del periódico
5. **Recopilación de Tips**: Si no se encuentran artículos relevantes, AmAIke ofrece la opción de recopilar información nueva

### Características Especiales
- **Recopilación Estructurada de Tips**: Sistema avanzado que recopila información de manera estructurada (qué, cuándo, dónde, quién, cómo)
- **Detección Inteligente**: Identifica cuando no se encuentra información útil, incluso si hay resultados parciales
- **Validación de Plausibilidad**: Evalúa si la información aportada es lógicamente posible
- **Validación de Completitud**: Verifica que todos los campos necesarios estén completos
- **Categorización Automática**: Clasifica los tips por categoría (accidente, crimen, política, etc.)
- **Niveles de Urgencia**: Determina la prioridad del tip (baja, media, alta)
- **Envío Automático**: Integración con API backend con fallback a email
- **Citas Obligatorias**: Siempre incluye enlaces a los artículos fuente

## 🎯 Casos de Uso

- **Búsqueda de Información**: Buscar noticias específicas sobre eventos locales
- **Consulta de Funcionarios**: Consultar información sobre funcionarios municipales
- **Exploración de Temas**: Encontrar artículos sobre temas específicos de Tandil
- **Recopilación de Tips**: Cuando no se encuentra información, recopilar nuevos datos de usuarios
- **Envío de Información**: Enviar tips y noticias estructuradas a la redacción

## 🔒 Configuración de Seguridad

- La API Key debe mantenerse segura y no compartirse
- El archivo `.env` está incluido en `.gitignore`
- Solo se procesan consultas relacionadas con el contenido de El Eco

## 📝 Scripts Disponibles

- `npm run dev` - Ejecuta el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es propiedad de El Eco de Tandil. Todos los derechos reservados.

## 📞 Contacto

Para consultas sobre el proyecto, contactar con el equipo de desarrollo de El Eco de Tandil.

---

**AmAIke** - Tu asistente de noticias de El Eco de Tandil 🗞️