// Quick test of TOON parser with 12-month forecast

const sampleToon = `
combinedInsights
  twelveMonthForecast
    - month: "November 2025"
      monthNumber: 3
      numerologyTheme: "Personal Month 3: Creative expression"
      astrologyTheme: "Saturn conjunct natal Moon"
      combinedGuidance: "Balance your emotions"
      keyFocus: "Expression and balance"
    - month: "December 2025"
      monthNumber: 4
      numerologyTheme: "Personal Month 4: Building structure"
      astrologyTheme: "Jupiter trine Sun"
      combinedGuidance: "Focus on foundations"
      keyFocus: "Structure and stability"
    - month: "January 2026"
      monthNumber: 5
      numerologyTheme: "Personal Month 5: Change and freedom"
      astrologyTheme: "Mercury conjunct Saturn"
      combinedGuidance: "Embrace change"
      keyFocus: "Adaptability"
`;

// Simple TOON parser for testing
function parseToon(toonString) {
  const lines = toonString.split('\n');
  const root = {};
  const stack = [{ obj: root, indent: -1 }];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const indent = line.search(/\S/);
    const trimmedLine = line.trim();

    // Handle array items
    if (trimmedLine.startsWith('-')) {
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }

      const currentContext = stack[stack.length - 1];
      const parent = currentContext.arrayParent || currentContext.obj;

      if (!Array.isArray(parent)) {
        console.warn('⚠️  Parent is not an array at line', i);
        continue;
      }

      const content = trimmedLine.substring(1).trim();

      if (content.includes(':')) {
        const newItem = {};
        parent.push(newItem);
        stack.push({ obj: newItem, indent, arrayParent: parent });

        const colonIndex = content.indexOf(':');
        const key = content.substring(0, colonIndex).trim();
        const value = content.substring(colonIndex + 1).trim();
        newItem[key] = value.replace(/^["']|["']$/g, '');
      } else {
        const newItem = {};
        parent.push(newItem);
        stack.push({ obj: newItem, indent, arrayParent: parent });
      }
      continue;
    }

    // Pop stack
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].obj;

    // Key-value pair
    if (trimmedLine.includes(':')) {
      const colonIndex = trimmedLine.indexOf(':');
      const key = trimmedLine.substring(0, colonIndex).trim();
      const value = trimmedLine.substring(colonIndex + 1).trim();
      parent[key] = value.replace(/^["']|["']$/g, '');
    } else {
      // New key
      const key = trimmedLine;
      const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
      const nextIndent = nextLine.search(/\S/);
      const nextTrimmed = nextLine.trim();

      if (nextIndent > indent && nextTrimmed.startsWith('-')) {
        parent[key] = [];
        stack.push({ obj: parent[key], indent, arrayParent: parent[key] });
      } else if (nextIndent > indent) {
        parent[key] = {};
        stack.push({ obj: parent[key], indent });
      } else {
        parent[key] = null;
      }
    }
  }

  return root;
}

console.log('Testing TOON Parser with 12-month forecast...\n');

const result = parseToon(sampleToon);

console.log('✅ Parsed structure:');
console.log(JSON.stringify(result, null, 2));

if (result.combinedInsights?.twelveMonthForecast) {
  const forecast = result.combinedInsights.twelveMonthForecast;
  console.log('\n✅ Twelve Month Forecast:');
  console.log('- Type:', Array.isArray(forecast) ? 'Array' : typeof forecast);
  console.log('- Length:', forecast.length);
  console.log('\n✅ All months:');
  forecast.forEach((month, idx) => {
    console.log(`  ${idx + 1}. ${month.month} (Personal Month ${month.monthNumber})`);
  });
} else {
  console.log('❌ twelveMonthForecast not found!');
}

