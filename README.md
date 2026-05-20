# hospital-familia-app

Frontend base de `Hospital - Familia`.

## Stack
- Angular 20
- Ionic 8
- Capacitor 8

## Estado inicial
- scaffold frontend creado,
- listo para instalar dependencias y comenzar modulos.

## Configuracion

La URL base del API se define en:

```text
src/environments/environment.ts
src/environments/environment.prod.ts
```

El logout ahora intenta revocar la sesion persistida en backend usando el `refreshToken` antes de limpiar el almacenamiento local.
