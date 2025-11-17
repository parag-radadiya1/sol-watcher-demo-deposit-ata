/**
 * TOON (Token Oriented Object Notation) Parser
 * Converts TOON format to JSON
 * 
 * TOON format is more token-efficient for LLMs:
 * - Uses indentation instead of braces
 * - Eliminates quotes where possible
 * - More compact syntax
 * 
 * Example TOON:
 * numerology
 *   coreNumbers
 *     lifePath
 *       number: 5
 *       meaning: "The Freedom Seeker"
 *     pinnacles
 *       - number: 5
 *         ageRange: "0-28"
 */

export class ToonParser {
  /**
   * Parse TOON format string to JSON object
   */
  static parse(toonString: string): any {
    const lines = toonString.split('\n');
    const root = {};
    const stack: Array<{ obj: any; indent: number; isArray?: boolean }> = [
      { obj: root, indent: -1 },
    ];

    let currentArrayItem: any = null;
    let arrayItemIndent = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip empty lines
      if (!line.trim()) continue;

      const indent = this.getIndentLevel(line);
      const trimmedLine = line.trim();

      // Skip comments
      if (trimmedLine.startsWith('#') || trimmedLine.startsWith('//')) continue;

      // Handle array items (lines starting with -)
      if (trimmedLine.startsWith('-')) {
        const parent = stack[stack.length - 1].obj;

        // Ensure parent is an array
        if (!Array.isArray(parent)) {
          console.warn('Found array item but parent is not an array');
          continue;
        }

        // Get the content after the dash
        const content = trimmedLine.substring(1).trim();

        if (content.includes(':')) {
          // This is an object array item with inline property
          currentArrayItem = {};
          arrayItemIndent = indent;
          parent.push(currentArrayItem);
          stack.push({ obj: currentArrayItem, indent, isArray: false });

          // Parse the inline property
          const colonIndex = content.indexOf(':');
          const key = content.substring(0, colonIndex).trim();
          const value = content.substring(colonIndex + 1).trim();
          currentArrayItem[key] = this.parseValue(value);
        } else if (content) {
          // Simple value array item
          parent.push(this.parseValue(content));
        } else {
          // Multi-line object array item
          currentArrayItem = {};
          arrayItemIndent = indent;
          parent.push(currentArrayItem);
          stack.push({ obj: currentArrayItem, indent, isArray: false });
        }

        continue;
      }

      // Pop stack until we find the right parent
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }

      const parent = stack[stack.length - 1].obj;

      // Check if this is a key-value pair
      if (trimmedLine.includes(':')) {
        const colonIndex = trimmedLine.indexOf(':');
        const key = trimmedLine.substring(0, colonIndex).trim();
        const value = trimmedLine.substring(colonIndex + 1).trim();

        if (Array.isArray(parent)) {
          // Adding property to current array item
          parent[parent.length - 1][key] = this.parseValue(value);
        } else {
          parent[key] = this.parseValue(value);
        }
      } else {
        // This is a new object/array key
        const key = trimmedLine;

        // Look ahead to determine if this should be an array or object
        const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
        const nextIndent = this.getIndentLevel(nextLine);
        const nextTrimmed = nextLine.trim();

        if (nextIndent > indent && nextTrimmed.startsWith('-')) {
          // This is an array
          parent[key] = [];
          stack.push({ obj: parent[key], indent, isArray: true });
        } else if (nextIndent > indent) {
          // This is an object
          parent[key] = {};
          stack.push({ obj: parent[key], indent, isArray: false });
        } else {
          // Empty value
          parent[key] = null;
        }
      }
    }

    return root;
  }

  /**
   * Get indentation level (number of spaces)
   */
  private static getIndentLevel(line: string): number {
    let count = 0;
    for (const char of line) {
      if (char === ' ') count++;
      else if (char === '\t') count += 2; // Treat tab as 2 spaces
      else break;
    }
    return count;
  }

  /**
   * Parse a value from TOON format
   */
  private static parseValue(value: string): any {
    const trimmed = value.trim();

    // Empty value
    if (!trimmed) return null;

    // Boolean
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;

    // Null
    if (trimmed === 'null') return null;

    // Number
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return parseFloat(trimmed);
    }

    // Array (inline format: [1, 2, 3] or ["a", "b", "c"])
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const arrayContent = trimmed.slice(1, -1);
      if (!arrayContent.trim()) return [];

      return arrayContent.split(',').map((item) => {
        const parsed = this.parseValue(item.trim());
        return parsed;
      });
    }

    // String (with quotes)
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed.slice(1, -1);
    }

    // String (without quotes) - return as-is
    return trimmed;
  }

  /**
   * Clean TOON response from AI (remove markdown code blocks)
   */
  static cleanToonResponse(response: string): string {
    let cleaned = response.trim();

    // Remove ```toon or ``` markers
    cleaned = cleaned.replace(/^```toon?\s*/i, '');
    cleaned = cleaned.replace(/^```\s*/i, '');
    cleaned = cleaned.replace(/```\s*$/, '');

    return cleaned;
  }

  /**
   * Validate that TOON response has required structure for astrology reading
   */
  static validateAstrologyReading(obj: any): boolean {
    return !!(obj && obj.numerology && obj.astrology && obj.combinedInsights);
  }
}
