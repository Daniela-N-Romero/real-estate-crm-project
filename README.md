# 🏢 Real Estate CRM & Public Portal

![Estado](https://img.shields.io/badge/Status-Portfolio_Demo-success)
![Stack](https://img.shields.io/badge/Stack-Node.js_Express_PostgreSQL-blue)
![Deploy](https://img.shields.io/badge/Deploy-Render_&_Neon-purple)

Plataforma integral *Full Stack* diseñada para la gestión operativa y comercial de una empresa inmobiliaria. El sistema combina un portal público de búsqueda avanzada con un panel de administración (CRM) para la gestión de propiedades, propietarios y redes de colegas.

---

## 🚀 Demo en Vivo

Podes probar la aplicación desplegada aquí:
🔗 **[Ver Proyecto Online](https://real-estate-crm-project.onrender.com)**

### 🔑 Credenciales de Acceso (Admin)
Para acceder al Panel de Gestión, utiliza estas credenciales de prueba:
- **URL Admin:** `/admin/login.html`
- **Usuario:** `demo@admin.com`
- **Contraseña:** `admin123`

---

## 💡 Decisiones de Diseño y Funcionalidades Clave

Este proyecto no es solo un CRUD; simula la lógica de negocio real de una inmobiliaria.

### 1. Gestión de "Colegas" y Mapa Privado
El negocio inmobiliario se basa en la colaboración.
- **Problemática:** A veces no tenemos la propiedad que el cliente busca, pero un colega sí.
- **Solución:** Implementé un **Mapa Privado** (visible solo para admins) que muestra tanto nuestra cartera ("Propia") como la de "Colegas".
- **Intermediación (White-labeling):** El sistema permite gestionar PDFs de propiedades de colegas. La idea es poder descargar/enviar la ficha técnica de la propiedad de un tercero, pero presentada bajo nuestra marca, protegiendo así el contacto con el cliente final.

### 2. Simulación de Datos Realista (Data Realism)
Para este portfolio, no quería una base de datos vacía o con datos "lorem ipsum" sin sentido.
- **Geolocalización Real:** Los datos generados ("Seeders") sitúan las propiedades en el corredor sur de Buenos Aires (Berazategui, Quilmes, Hudson) con coordenadas reales para que el mapa sea funcional.
- **Estado de Recursos (Marketing):**
    - En la vida real, no siempre tenemos las fotos, videos o planos (PDF) listos al momento de cargar la propiedad.
    - **Lógica del Demo:** El script de llenado de BBDD genera intencionalmente un **70% de propiedades con recursos completos** (Video/PDF) y un **30% sin ellos**.
    - **Utilidad:** Esto permite visualizar en el Dashboard qué propiedades tienen "faltantes" (marcados con ❌), sirviendo como alerta para que el equipo de marketing sepa qué materiales debe producir.

---

## 🛠️ Stack Tecnológico e Infraestructura

### Backend
- **Node.js & Express:** Arquitectura MVC (Model-View-Controller) con capas de Servicios (`PropertyService`) para desacoplar la lógica de negocio.
- **PostgreSQL:** Base de datos relacional robusta.
- **Sequelize ORM:** Manejo de modelos, relaciones (1:N) y validaciones.
- **Seguridad:** Autenticación vía **JWT**, hashing de contraseñas con `bcryptjs` y protección de rutas.

### Frontend
- **HTML5, SASS/SCSS & Bootstrap 5:** Diseño responsivo y limpio.
- **JavaScript (Vanilla):** Lógica del lado del cliente para mapas interactivos (**Leaflet.js**), formularios dinámicos y consumo de APIs.

### Infraestructura & Despliegue (Portfolio)
- **Base de Datos:** Alojada en **Neon Tech** (PostgreSQL Serverless) con conexión segura SSL.
- **Aplicación:** Desplegada en **Render**.
- **Seeding Automático:** Script personalizado que regenera la base de datos con 50 propiedades, agentes y propietarios ficticios en cada despliegue para mantener el entorno de demo siempre listo.

### Infraestructura del Proyecto Real (Producción)
Este repositorio es una adaptación de un sistema real que desarrollé e implementé para el cliente. En el entorno productivo real, la arquitectura es más compleja:
- **Servidor:** VPS Linux administrado (Ubuntu).
- **Web Server:** Nginx configurado como Reverse Proxy y servidor de estáticos.
- **Network & Seguridad:** Implementación de **Cloudflare** para gestión de DNS, protección DDoS y CDN.
- **Ciclo de Vida (SDLC):** Establecí un flujo de trabajo profesional con un entorno de **QA (Quality Assurance)** separado. Esto permite desplegar y probar nuevas funcionalidades en un subdominio de pruebas antes de impactar en el sitio de Producción.

---

## 🌱 Poblado de Base de Datos (Seeding)

Para evitar la carga manual de datos, desarrollé un sistema de generación de datos mock:
1.  **`generateMockData.js`:** Crea archivos JSON con datos coherentes (nombres latinos, teléfonos locales, precios lógicos según moneda y tipo).
2.  **`seedDatabase.js`:** Lee estos JSONs y utiliza `Sequelize BulkCreate` para insertar masivamente propiedades, usuarios y relaciones, asignando imágenes reales de Unsplash según la categoría (Industrial, Vivienda, etc.).

---

## ⚙️ Instalación Local

Si deseas correr este proyecto en tu máquina:

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/Daniela-N-Romero/real-estate-crm-project.git](https://github.com/Daniela-N-Romero/real-estate-crm-project.git)
    cd real-estate-crm-project
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno:**
    Crear un archivo `.env` y configurar tus credenciales de base de datos local (PostgreSQL).

4.  **Sembrar la Base de Datos:**
    ```bash
    npm run seed
    ```

5.  **Iniciar el Servidor:**
    ```bash
    npm run dev
    ```
    Visita `http://localhost:3000`.

---

## 🚧 Estado del Proyecto

Actualmente, esta es una versión **Demo/Portfolio**.
Funcionalidades como la exportación a Excel, edición avanzada de perfiles de usuario y otras funcionalidades más complejas están en el roadmap de desarrollo o presentes en la versión privada del cliente.

---

**Desarrollado por Daniela Romero**
*Full Stack Developer*
