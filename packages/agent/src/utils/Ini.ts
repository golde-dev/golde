interface InitData {
  [section: string]: Record<string, string[] | string | boolean | number>;
}

function readValue(value: string): string | boolean | number {
  const trimmed = value.trim();
  if (
    trimmed === "true" || trimmed === "yes" || trimmed === "on"
  ) {
    return true;
  }
  if (trimmed === "1") {
    console.warn("Ambiguous boolean value: 1, use yes or true instead");
    return true;
  }
  if (
    trimmed === "false" || trimmed === "no" || trimmed === "off"
  ) {
    return false;
  }
  if (trimmed === "0") {
    console.warn("Ambiguous boolean value: 0, use no or false instead");
    return false;
  }

  const numberValue = Number(trimmed);
  return isFinite(numberValue) ? numberValue : trimmed;
}

/**
 * INI parser for
 * @see https://www.freedesktop.org/software/systemd/man/latest/systemd.syntax.html#
 * Currently only supports basic INI files without quoting or escaping.
 */
export class INI {
  private data: InitData;

  constructor(data: InitData = {}) {
    this.data = data;
  }

  public toObject(): InitData {
    return this.data;
  }

  /**
   * Validate and parse object into INI
   */
  public static fromObject(data: Record<string, unknown>) {
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      throw new Error("Invalid data", { cause: "Data is not object" });
    }

    for (const section in data) {
      const sectionData = data[section];
      if (
        typeof sectionData !== "object" || sectionData === null ||
        Array.isArray(sectionData)
      ) {
        throw new Error("Invalid data", {
          cause: "Section data is not object",
        });
      }
      for (const key in sectionData) {
        const sectionValue = (sectionData as Record<string, unknown>)[key];
        if (typeof sectionValue === "string") {
          continue;
        }
        if (typeof sectionValue === "boolean") {
          continue;
        }
        if (Array.isArray(sectionValue)) {
          for (const value of sectionValue) {
            if (typeof value === "string") {
              continue;
            }
          }
        }
        throw new Error("Invalid data", {
          cause: "Section value is not string, boolean or string[]",
        });
      }
    }
    return new INI(data as InitData);
  }

  /**
   * Parse string into INI
   */
  public static fromString(data: string) {
    if (!data) {
      throw new Error("Invalid data", { cause: "Data is empty" });
    }
    const iniData: InitData = {};
    const rawData = data.trim();

    const lines = rawData
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .filter((line) => !line.startsWith("#"))
      .filter((line) => !line.startsWith(";"));

    let currentSection: string | null = null;

    for (const line of lines) {
      if (line.startsWith("[") && line.endsWith("]")) {
        currentSection = line.slice(1, -1);
        iniData[currentSection] = {};
      } else {
        const [key, value] = line.split("=");

        if (!key || !value) {
          throw new Error(`Invalid line: ${line}`);
        }
        if (!currentSection || !rawData) {
          throw new Error(`Invalid ini: ${rawData}`);
        }

        const section = iniData[currentSection];
        const parsedValue = readValue(value);

        if (typeof parsedValue === "string") {
          const existingValue = section[key];
          if (existingValue) {
            if (Array.isArray(existingValue)) {
              existingValue.push(parsedValue);
            } else {
              if (typeof existingValue === "string") {
                section[key] = [existingValue, parsedValue];
              } else {
                throw new Error(`Invalid value for key: ${key}`);
              }
            }
            continue;
          }
        }

        section[key] = parsedValue;
      }
    }
    return new INI(iniData);
  }

  /**
   * Convert INI to string
   */
  public toString(): string {
    const result: string[] = [];
    for (const section in this.data) {
      result.push(`[${section}]`);

      const sectionData = this.data[section];
      for (const key in sectionData) {
        const sectionValue = sectionData[key];

        if (Array.isArray(sectionValue)) {
          for (const value of sectionValue) {
            result.push(`${key}=${value}`);
          }
        } else {
          if (sectionValue === true) {
            result.push(`${key}=yes`);
          }
          if (sectionValue === false) {
            result.push(`${key}=no`);
          }
          if (typeof sectionValue === "string") {
            result.push(`${key}=${sectionValue}`);
          }
        }
      }
      result.push("\n");
    }
    return result.join("\n").trim();
  }
}
