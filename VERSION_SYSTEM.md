# App Versioning and Build System

## 🎯 **Features Implemented**

### 1. **Version Display in Header**
- **Location**: Top-right corner of the header
- **Size**: Extra small (text-xs) 
- **Information**: Version number + Build ID
- **Style**: Monospace font, gray text, minimal visual impact

### 2. **Dynamic App Naming per Build**
- **Format**: `AmAIke-{version}-{buildId}`
- **Example**: `AmAIke-1.0.0-20251006-143022`
- **Build ID**: `YYYYMMDD-HHMMSS` format for unique identification

## 🚀 **Usage**

### **Development**
```bash
npm run dev
# Shows: v1.0.0 + dev (in header)
```

### **Production Builds**

#### **Regular Build**
```bash
npm run build
# Shows: v1.0.0 + 20251006-143022 (in header)
# Creates: AmAIke-1.0.0-20251006-143022
```

#### **Version Bump + Build**
```bash
# Patch version (1.0.0 → 1.0.1)
npm run build:patch

# Minor version (1.0.1 → 1.1.0)  
npm run build:minor

# Major version (1.1.0 → 2.0.0)
npm run build:major
```

## 📋 **Build Information**

Each build generates:

### **1. Visual Version Display**
```
Header (top-right corner):
┌─────────────┐
│ v1.0.0      │
│ 20251006-143022 │ 
└─────────────┘
```

### **2. Unique Asset Names**
```
dist/assets/
├── index-20251006-143022.abc123.js
├── style-20251006-143022.def456.css
└── logo-20251006-143022.ghi789.png
```

### **3. Build Info File** (`build-info.json`)
```json
{
  "version": "1.0.0",
  "buildId": "20251006-143022", 
  "buildDate": "2025-10-06",
  "buildTime": "14:30:22",
  "appName": "AmAIke-1.0.0-20251006-143022",
  "timestamp": "2025-10-06T14:30:22.123Z"
}
```

## 🎨 **Visual Implementation**

### **Header Layout**
```
┌─────────────────────────────────────────────┐
│                                   v1.0.0   │
│  🗿  AmAIke                    20251006... │
│     Asistente Virtual...                   │
└─────────────────────────────────────────────┘
```

### **Responsive Behavior**
- **Desktop**: Full build ID visible
- **Mobile**: May truncate gracefully due to space
- **Always visible**: Version number

## 🔧 **Technical Details**

### **Environment Variables Injected**
- `VITE_APP_VERSION`: From package.json
- `VITE_BUILD_ID`: Generated timestamp  
- `VITE_BUILD_DATE`: YYYY-MM-DD format
- `VITE_APP_NAME`: Complete app name with version

### **TypeScript Support**
- Full type definitions in `vite-env.d.ts`
- IntelliSense support for all build variables
- Type-safe access to build information

### **Build Process**
1. **Prepare**: Generate build timestamps and info
2. **Inject**: Add variables to Vite environment
3. **Build**: Compile with unique asset names
4. **Generate**: Create build-info.json for reference

## 📊 **Benefits**

- **🔍 Easy Debugging**: Instantly identify which build is running
- **🚀 Cache Busting**: Unique asset names prevent caching issues  
- **📈 Version Tracking**: Clear version progression
- **🎯 Production Ready**: Professional build identification
- **⚡ Automatic**: No manual intervention required

## 🧪 **Testing**

1. **Development**: `npm run dev` → Check header shows "v1.0.0 dev"
2. **Build**: `npm run build` → Check unique build ID appears  
3. **Version Bump**: `npm run build:patch` → Verify version increments
4. **Asset Names**: Check dist/ folder for unique filenames

This system ensures every build is uniquely identifiable and professionally versioned! 🚀