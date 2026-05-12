# Guía de contribución — ResidenciasPro

## Ramas

| Rama        | Propósito                              |
|-------------|----------------------------------------|
| `main`      | Producción. Solo merge desde `develop` con PR aprobado |
| `develop`   | Integración continua                   |
| `feat/*`    | Nuevas funcionalidades                 |
| `fix/*`     | Corrección de bugs                     |
| `chore/*`   | Tareas de mantenimiento (deps, config) |
| `docs/*`    | Solo documentación                     |

## Flujo de trabajo

```bash
# 1. Crear rama desde develop
git checkout develop
git pull origin develop
git checkout -b feat/RES-18-crud-residentes

# 2. Desarrollar con commits frecuentes
git add .
git commit -m "feat(residentes): agregar validación de documento único"

# 3. Push y abrir Pull Request hacia develop
git push origin feat/RES-18-crud-residentes
```

## Convención de commits (Conventional Commits)

```
<tipo>(<scope>): <descripción en imperativo, minúsculas>
```

**Tipos permitidos:**

| Tipo       | Cuándo usar |
|------------|-------------|
| `feat`     | Nueva funcionalidad |
| `fix`      | Corrección de bug |
| `chore`    | Deps, configuración, scripts |
| `docs`     | Solo documentación |
| `refactor` | Refactorización sin cambio de comportamiento |
| `test`     | Agregar o corregir tests |
| `ci`       | Cambios en GitHub Actions |
| `perf`     | Mejoras de rendimiento |

**Scopes sugeridos:** `auth`, `residentes`, `pagos`, `reportes`, `comunicados`, `pqr`, `db`, `api`, `frontend`

**Ejemplos:**
```
feat(pagos): agregar cálculo de intereses de mora
fix(residentes): corregir búsqueda por apellido con tildes
chore(deps): actualizar pg a 8.12.0
test(auth): agregar tests de JWT expirado
```

## Pull Requests

- Título del PR en formato Conventional Commits
- Referenciar el issue de Jira: `Closes RES-18`
- Requiere al menos 1 aprobación antes de mergear a `develop`
- `main` solo recibe merge al finalizar una fase completa

## Tests

```bash
cd backend
npm test             # Ejecutar todos los tests
npm run test:watch   # Modo watch durante desarrollo
```

Cobertura mínima requerida: **70%** en módulos de pagos y residentes.
