/** Native validation messages must not depend on the browser's interface language. */
export function spanishValidationMessage(validity: ValidityState, type: string): string {
  if (validity.valueMissing) return type === "checkbox"
    ? "Marcá esta casilla para continuar."
    : "Completá este campo para continuar.";
  if (validity.typeMismatch) return type === "email"
    ? "Ingresá un correo electrónico válido."
    : "Ingresá una dirección web válida.";
  if (validity.tooShort) return "El texto es demasiado corto. Agregá más caracteres.";
  if (validity.tooLong) return "El texto es demasiado largo. Reducí la cantidad de caracteres.";
  if (validity.rangeUnderflow) return "El valor es menor que el mínimo permitido.";
  if (validity.rangeOverflow) return "El valor supera el máximo permitido.";
  if (validity.stepMismatch || validity.badInput) return "Ingresá un valor válido para este campo.";
  if (validity.patternMismatch) return "Usá el formato indicado para este campo.";
  return "Revisá el valor de este campo.";
}
