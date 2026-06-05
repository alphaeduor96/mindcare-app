#!/bin/bash

# =====================================================
# Script para crear el super usuario administrador
# MindCare - Red de Psicólogos Profesional
# =====================================================

echo "🚀 Creando super usuario administrador..."
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuración
API_URL="https://idnusdgnaohphbdoezch.supabase.co/functions/v1/make-server-0e77298f/auth/signup"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkbnVzZGduYW9ocGhiZG9lemNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MDA2NjYsImV4cCI6MjA5MjM3NjY2Nn0.ngmdlFFKDAyZkVm16p96k1tdXeNTcEwTCRZv33KDOPc"

# Datos del administrador
ADMIN_EMAIL="admin@mindcare.com"
ADMIN_PASSWORD="MindCare2026!"
ADMIN_NOMBRE="Administrador"
ADMIN_APELLIDO="MindCare"
ADMIN_TELEFONO="+52 33 1234 5678"

# Crear el usuario
echo "📧 Email: $ADMIN_EMAIL"
echo "🔑 Contraseña: $ADMIN_PASSWORD"
echo ""
echo "Enviando solicitud..."

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\",
    \"nombre\": \"$ADMIN_NOMBRE\",
    \"apellido\": \"$ADMIN_APELLIDO\",
    \"rol\": \"admin\",
    \"telefono\": \"$ADMIN_TELEFONO\"
  }")

# Separar respuesta y código HTTP
HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

echo ""

if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✅ ¡Super usuario administrador creado exitosamente!${NC}"
  echo ""
  echo -e "${YELLOW}📋 CREDENCIALES DE ACCESO:${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📧 Email:      $ADMIN_EMAIL"
  echo "🔑 Contraseña: $ADMIN_PASSWORD"
  echo "👤 Rol:        Administrador"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo -e "${GREEN}🎉 ¡Listo! Ahora puedes iniciar sesión con estas credenciales.${NC}"
  echo ""
  echo "Desde el panel de administración podrás crear:"
  echo "  • Psicólogos afiliados"
  echo "  • Empresas asociadas"
  echo "  • Empleados de empresas"
  echo ""
else
  echo -e "${RED}❌ Error al crear el usuario (HTTP $HTTP_CODE)${NC}"
  echo ""
  echo "Respuesta del servidor:"
  echo "$HTTP_BODY"
  echo ""

  # Si el error es que el usuario ya existe, mostrar las credenciales de todos modos
  if echo "$HTTP_BODY" | grep -q "already registered\|already exists\|ya existe"; then
    echo -e "${YELLOW}⚠️  El usuario ya existe. Puedes usar estas credenciales:${NC}"
    echo ""
    echo "📧 Email:      $ADMIN_EMAIL"
    echo "🔑 Contraseña: $ADMIN_PASSWORD"
    echo ""
  fi
fi
