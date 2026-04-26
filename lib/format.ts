export function formatDisplayDate(value: string) {
  if (!value) {
    return "Sem data";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function formatRelativeStamp(value: string) {
  if (!value) {
    return "Agora";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatFileSize(value: number | null) {
  if (!value || value <= 0) {
    return "Tamanho indisponivel";
  }

  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function slugIncludes(content: string, search: string) {
  return content.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"));
}
