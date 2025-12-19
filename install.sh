#!/bin/bash

# Script de instalación de GitX

echo "🚀 Instalando GitX..."
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    echo "Por favor instala Node.js >= 18.0.0 desde https://nodejs.org"
    exit 1
fi

# Verificar versión de Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versión $NODE_VERSION detectada"
    echo "GitX requiere Node.js >= 18.0.0"
    exit 1
fi

echo "✓ Node.js $(node -v) detectado"

# Verificar Git
if ! command -v git &> /dev/null; then
    echo "❌ Git no está instalado"
    echo "Por favor instala Git desde https://git-scm.com"
    exit 1
fi

echo "✓ Git $(git --version) detectado"
echo ""

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Error al instalar dependencias"
    exit 1
fi

echo "✓ Dependencias instaladas"
echo ""

# Compilar proyecto
echo "🔨 Compilando proyecto..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error al compilar proyecto"
    exit 1
fi

echo "✓ Proyecto compilado"
echo ""

# Hacer ejecutable el CLI
chmod +x dist/cli.js

# Instalar globalmente
echo "🌍 Instalando GitX globalmente..."
npm link

if [ $? -ne 0 ]; then
    echo "❌ Error al instalar GitX globalmente"
    echo "Intenta con: sudo npm link"
    exit 1
fi

echo "✓ GitX instalado globalmente"
echo ""

# Verificar instalación
if command -v gitx &> /dev/null; then
    echo "✅ ¡Instalación exitosa!"
    echo ""
    echo "Comandos disponibles:"
    echo "  gitx migrate  → Importar tu configuración actual"
    echo "  gitx doctor   → Diagnosticar problemas"
    echo "  gitx list     → Ver tus perfiles"
    echo "  gitx --help   → Ver todos los comandos"
    echo ""
    echo "Para empezar, ejecuta: gitx migrate"
else
    echo "⚠️  GitX instalado pero no disponible en PATH"
    echo "Intenta cerrar y abrir tu terminal nuevamente"
fi
