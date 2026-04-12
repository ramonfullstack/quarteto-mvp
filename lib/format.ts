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

export function slugIncludes(content: string, search: string) {
  return content.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"));
}
