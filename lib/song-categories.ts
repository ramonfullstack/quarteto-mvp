export const songCategories = [
  "Quarteto",
  "Grupo",
  "Solo",
  "Coral",
  "Dueto",
  "Trio",
  "Instrumental",
  "Especial",
] as const;

export const categoryFilterOptions = ["Todas", ...songCategories] as const;
