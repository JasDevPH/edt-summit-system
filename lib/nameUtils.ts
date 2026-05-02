export function buildFullname(
  lastname: string,
  firstname: string,
  middlename: string,
  suffix: string
): string {
  return [lastname, firstname, middlename, suffix].join(",");
}

export function parseFullname(fullname: string) {
  const parts = fullname.split(",");
  if (parts.length >= 4) {
    return {
      lastname: parts[0]?.trim() || "",
      firstname: parts[1]?.trim() || "",
      middlename: parts[2]?.trim() || "",
      suffix: parts[3]?.trim() || "",
    };
  }
  // Backward compat: old format "Lastname, Firstname Middlename"
  const lastname = parts[0]?.trim() || "";
  const firstAndMiddle = (parts[1]?.trim() || "").split(" ").filter(Boolean);
  const firstname = firstAndMiddle[0] || "";
  const middlename = firstAndMiddle.slice(1).join(" ") || "";
  return { lastname, firstname, middlename, suffix: "" };
}

export function formatFullname(fullname: string): string {
  const { lastname, firstname, middlename, suffix } = parseFullname(fullname);
  const rest = [firstname, middlename, suffix].filter(Boolean).join(" ");
  if (lastname && rest) return `${lastname}, ${rest}`;
  return lastname || rest || fullname;
}
