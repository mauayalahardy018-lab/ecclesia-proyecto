# ADR 002 Arquitectura por módulos y capas

Estado: aceptado provisionalmente el 2026-10-30.

Decisión: módulos de dominio con rutas, servicio, repositorio y esquema; funciones puras para cálculo y transiciones. Controladores solo adaptan HTTP. dependency-cruiser detecta ciclos y dependencias inversas. Consecuencia: más archivos, pero reglas verificables y reutilizables.
