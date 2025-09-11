# Manual Técnico - Funciones del Servidor

## Información General

### Descripción del Sistema
Sistema de evaluación de catedráticos desarrollado con Node.js y Express.js que proporciona una API REST para gestionar usuarios, profesores, cursos, publicaciones y comentarios. Utiliza MySQL Workbench como gestor de base de datos.

### Tecnologías del Servidor
- **Runtime**: Node.js
- **Framework**: Express.js
- **Base de Datos**: MySQL con MySQL Workbench
- **Autenticación**: JSON Web Tokens (JWT)
- **Encriptación**: Bcrypt
- **Pool de Conexiones**: MySQL2

## Instalación de Dependencias

### Requisitos Previos
- Node.js versión 16 o superior
- npm (Node Package Manager)
- MySQL Server
- MySQL Workbench

### Dependencias Principales
El servidor requiere las siguientes dependencias que deben instalarse:

#### Dependencias de Producción
- **express**: Framework web para Node.js
- **mysql2**: Driver MySQL con soporte para promesas
- **jsonwebtoken**: Implementación de JSON Web Tokens
- **bcrypt**: Biblioteca para hash de contraseñas
- **cors**: Middleware para Cross-Origin Resource Sharing
- **dotenv**: Cargador de variables de entorno

### Proceso de Instalación

#### 1. Inicialización del Proyecto
```bash
npm init -y
```

#### 2. Instalación de Dependencias
```bash
npm install express mysql2 jsonwebtoken bcrypt cors dotenv
```

#### 3. Configuración de package.json
El archivo package.json debe incluir la configuración de módulos ES6:
```json
{
  "type": "module"
}
```


---

## Arquitectura del Servidor

### Estructura Principal
El servidor está organizado en una arquitectura modular con las siguientes capas:
- **Capa de Aplicación**: Express.js con middleware personalizado
- **Capa de Rutas**: Endpoints organizados por funcionalidad
- **Capa de Datos**: Pool de conexiones MySQL
- **Capa de Seguridad**: JWT y encriptación de contraseñas

### Configuración de Base de Datos
El sistema utiliza MySQL Workbench para la administración de la base de datos, con un pool de conexiones configurado para optimizar el rendimiento y manejo de múltiples solicitudes concurrentes.

---

## Funciones Principales del Servidor

### 1. Gestión de Usuarios

#### Registro de Usuarios
- Validación de datos de entrada obligatorios
- Verificación de unicidad de registro académico y correo
- Encriptación de contraseñas con bcrypt
- Inserción segura en base de datos

#### Autenticación
- Verificación de credenciales contra base de datos
- Generación de tokens JWT con expiración de 24 horas
- Validación de contraseñas encriptadas
- Manejo de sesiones de usuario

#### Gestión de Perfil
- Obtención de datos del usuario autenticado
- Actualización de información personal
- Restablecimiento de contraseñas
- Búsqueda de usuarios por registro académico

### 2. Gestión de Profesores

#### Consulta de Profesores
- Obtención de listado completo de profesores
- Búsqueda por ID específico
- Búsqueda por términos (nombres o apellidos)
- Búsqueda exacta por nombre y apellido

#### Relación con Cursos
- Obtención de cursos impartidos por profesor
- Consultas relacionales con tabla de cursos
- Filtrado de información académica

### 3. Gestión de Cursos

#### Consulta de Cursos
- Obtención de nombres únicos de cursos
- Consulta de cursos con identificadores
- Ordenamiento alfabético de resultados
- Eliminación de duplicados mediante GROUP BY

### 4. Sistema de Publicaciones

#### Creación de Publicaciones
- Validación de tokens JWT requeridos
- Verificación de existencia de cursos y profesores
- Inserción con referencias opcionales a cursos/profesores
- Obtención de publicación creada con datos relacionados

#### Consulta de Publicaciones
- Obtención de todas las publicaciones con información completa
- Filtrado por usuario específico (requiere autenticación)
- Filtrado por curso específico
- Filtrado por profesor específico (requiere autenticación)
- Ordenamiento cronológico descendente

### 5. Sistema de Comentarios

#### Gestión de Comentarios
- Creación de comentarios en publicaciones
- Validación de existencia de publicación
- Obtención de comentarios por publicación
- Información completa de autores de comentarios

#### Consultas Relacionales
- Unión con tabla de usuarios para datos de autor
- Unión con tabla de publicaciones para contexto
- Conteo de comentarios por publicación
- Ordenamiento cronológico de comentarios

### 6. Cursos Aprobados

#### Registro de Cursos
- Validación de existencia de usuario y curso
- Prevención de duplicados
- Inserción en tabla relacional
- Obtención de información completa del registro

#### Consulta de Historial Académico
- Obtención de cursos aprobados por usuario
- Información completa con datos de profesor y créditos
- Formateo de respuesta con separación de usuario y cursos

#### Gestión de Registros
- Eliminación de cursos aprobados
- Validaciones de existencia antes de eliminación
- Cálculo de suma de créditos por lista de cursos
- Manejo de arrays de IDs de cursos

---

## Funciones de Seguridad

### Middleware de Autenticación
- Extracción de token desde headers Authorization
- Verificación de firma JWT
- Validación de expiración de token
- Inyección de userId en request para rutas protegidas

### Encriptación de Contraseñas
- Hash con salt rounds configurables
- Comparación segura durante autenticación
- Actualización de contraseñas con re-encriptación

### Validaciones de Entrada
- Verificación de campos obligatorios
- Validación de formatos de datos
- Prevención de inyección SQL mediante prepared statements
- Manejo de errores de validación

---

## Funciones de Base de Datos

### Pool de Conexiones
- Configuración de límite de conexiones concurrentes
- Manejo automático de conexiones
- Liberación automática de recursos
- Reintentos automáticos en caso de fallos

### Operaciones CRUD
- Create: Inserción de nuevos registros
- Read: Consultas simples y complejas con JOINs
- Update: Modificación de registros existentes
- Delete: Eliminación con validaciones previas

### Consultas Relacionales
- JOINs entre múltiples tablas
- LEFT JOINs para datos opcionales
- GROUP BY para eliminación de duplicados
- COUNT para conteos de registros relacionados

---

### Middleware Global
- CORS para permitir requests cross-origin
- Parsing de JSON con límite de 10MB
- Logging de requests con timestamp
- Manejo de errores centralizados

---

## Funciones de Utilidad

### Testing de Conectividad
- Función para probar conexión a base de datos
- Endpoint /health para verificación de estado
- Logging de estados de conexión
- Manejo de errores de conectividad

### Manejo de Errores
- Middleware global para captura de errores
- Logging detallado de errores
- Respuestas estructuradas de error
- Diferenciación entre entorno de desarrollo y producción

### Formateo de Respuestas
- Estructura consistente de respuestas JSON
- Mensajes descriptivos de éxito y error
- Códigos de estado HTTP apropiados
- Metadatos adicionales cuando es relevante

---

## Configuración del Servidor

### Variables de Entorno
El servidor utiliza variables de entorno para configuración:
- Credenciales de base de datos
- Puerto del servidor
- Clave secreta JWT
- Modo de ejecución

### Inicialización
- Verificación de conexión a MySQL Workbench al inicio
- Configuración de middlewares globales
- Registro de rutas por módulos
- Inicio del servidor HTTP en puerto configurado

---

## Endpoints del Servidor

### Usuarios (/api/usuarios)
- Registro, autenticación y gestión de perfil
- Búsqueda y listado de usuarios
- Restablecimiento de contraseñas

### Profesores (/api/profesores)
- Consulta y búsqueda de profesores
- Obtención de cursos por profesor

### Cursos (/api/cursos)
- Listado de cursos únicos
- Consulta de cursos con IDs

### Publicaciones (/api/publicaciones)
- Creación y consulta de publicaciones
- Filtros por usuario, curso y profesor

### Comentarios (/api/comentarios)
- Creación de comentarios
- Consulta por publicación

### Cursos Aprobados (/api/cursos-aprobados)
- Registro y consulta de historial académico
- Cálculo de créditos totales

---

## Manejo de Estados y Errores

### Códigos de Estado HTTP
- 200: Operaciones exitosas
- 201: Recursos creados exitosamente
- 400: Datos de entrada inválidos
- 401: Falta de autenticación
- 403: Token inválido
- 404: Recurso no encontrado
- 409: Conflictos de datos
- 500: Errores internos del servidor

### Logging del Sistema
- Registro de requests entrantes con timestamp
- Logging de errores con stack trace
- Diferenciación por nivel de log según entorno
- Información de debugging en desarrollo