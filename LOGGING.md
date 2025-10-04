# 📊 Sistema de Logging de Uso - AmAIke

Este sistema permite rastrear el uso de AmAIke durante la fase de pruebas usando **Airtable** como base de datos.

## 🚀 Configuración Rápida con Airtable

### Paso 1: Crear Base en Airtable
1. Ve a [Airtable](https://airtable.com) y crea una nueva base
2. Crea una tabla llamada **"Usage Logs"**
3. Agrega estos campos:
   - `Timestamp` (Date & Time)
   - `User Query` (Single line text)
   - `Response Length` (Number)
   - `Sources Found` (Number)
   - `Has Call to Action` (Checkbox)
   - `Session ID` (Single line text)

### Paso 2: Obtener Credenciales
1. Ve a [Airtable Developer Hub](https://airtable.com/create/tokens)
2. Crea un **Personal Access Token**
3. Copia el **Base ID** de tu base (está en la URL o en la documentación de la API)

### Paso 3: Configurar Variables de Entorno
Crea un archivo `.env` con:
```bash
VITE_API_KEY=your_gemini_api_key
VITE_AIRTABLE_API_KEY=your_airtable_token
VITE_AIRTABLE_BASE_ID=your_base_id
VITE_AIRTABLE_TABLE_NAME=Usage Logs
```

### Opción Alternativa: Solo Console Logs
Si no quieres configurar Airtable, los logs aparecerán solo en la consola del navegador.

## 📈 Qué se Registra

Cada consulta del usuario registra:
- **Timestamp**: Cuándo se hizo la consulta
- **User Query**: La pregunta del usuario
- **Response Length**: Longitud de la respuesta del AI
- **Sources Found**: Cantidad de fuentes encontradas
- **Has Call-to-Action**: Si se mostró el botón "¿Me querés contar más?"
- **Session ID**: Identificador único de sesión

## 🔍 Ver los Logs

### En Desarrollo:
- Los logs aparecen en la consola del navegador
- Widget de estadísticas en la esquina inferior derecha

### En Producción:
- Configura un webhook o API endpoint
- Los logs se envían automáticamente

## 🛠️ Configuración para Vercel

1. **Variables de Entorno en Vercel:**
```bash
VITE_API_KEY=your_gemini_api_key
VITE_AIRTABLE_API_KEY=your_airtable_token
VITE_AIRTABLE_BASE_ID=your_base_id
VITE_AIRTABLE_TABLE_NAME=Usage Logs
```

2. **Deploy:**
```bash
npm run build
vercel --prod
```

## 📊 Ventajas de Airtable

- **Interfaz visual** para ver los logs
- **Filtros y vistas** personalizadas
- **Exportación** a Excel/CSV
- **Gráficos** automáticos
- **Colaboración** en tiempo real
- **Gratis** hasta 1,200 registros por base

## 📊 Ejemplo de Log

```json
{
  "timestamp": "2025-01-03T22:30:45.123Z",
  "userQuery": "¿Qué pasó con Santamarina?",
  "responseLength": 245,
  "sourcesFound": 3,
  "hasCallToAction": false,
  "sessionId": "session_1704312645123_abc123def"
}
```

## 🎯 Beneficios

- **Análisis de uso**: Qué preguntas hacen los usuarios
- **Efectividad del AI**: Qué tan bien responde
- **Call-to-Action**: Cuándo se activa el flujo de tips
- **Sesiones**: Seguimiento de usuarios únicos
- **Debugging**: Identificar problemas en producción

## 🔧 Personalización

Para agregar más datos al log, edita `services/usageLogger.ts`:

```typescript
const logData: UsageLog = {
  // ... datos existentes
  userAgent: navigator.userAgent,
  referrer: document.referrer,
  // ... más campos
};
```
