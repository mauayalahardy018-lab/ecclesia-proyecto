# ADR 005 Índice patrimonial

Estado: aceptado provisionalmente el 2026-10-30.

Decisión: función pura que recibe objetos, año de referencia y versión de criterios. Usa puntos de antigüedad, multiplicador por tipo y bonificación INAH; excluye objetos no vigentes. El ejemplo del caso debe dar 35.5. Los parámetros se versionan en datos y no se incrustan en el controlador. Consecuencia: la fecha de referencia y el redondeo se mantienen visibles como preguntas P-02 y P-04.
