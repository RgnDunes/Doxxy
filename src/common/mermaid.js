export function generateDependencyGraph(graphData, maxNodes = 50) {
    const nodes = Object.keys(graphData);
    if (nodes.length === 0) return 'graph TD\n  Empty["No dependencies found"];';
  
    let definition = 'graph TD\n';
    const nodesToRender = nodes.slice(0, maxNodes);
  
    nodesToRender.forEach(node => {
      definition += `  ${sanitizeId(node)}["${node}"]\n`;
      if (graphData[node]) {
        graphData[node].forEach(dep => {
          if (nodesToRender.includes(dep)) {
            definition += `  ${sanitizeId(node)} --> ${sanitizeId(dep)}\n`;
          }
        });
      }
    });
  
    if (nodes.length > maxNodes) {
      definition += `  subgraph legend\n    Truncated["Graph truncated to ${maxNodes} nodes for clarity."]\n  end\n`
    }
  
    return definition;
  }
  
  export function generateComponentGraph(componentMap) {
      let definition = 'graph TD\n';
      const folders = Object.keys(componentMap);
      if (folders.length === 0) return 'graph TD\n  Empty;';
  
      folders.forEach(folder => {
          definition += `  subgraph ${sanitizeId(folder)} ["${folder}"]\n`;
          componentMap[folder].components.forEach(comp => {
              definition += `    ${sanitizeId(comp.name)}["${comp.name}"]\n`;
          });
          definition += '  end\n';
      });
  
      // Add connections between components based on imports
      folders.forEach(folder => {
          componentMap[folder].components.forEach(comp => {
              comp.imports.forEach(imp => {
                  const targetComp = findComponentByImport(imp, componentMap);
                  if (targetComp) {
                      definition += `  ${sanitizeId(comp.name)} --> ${sanitizeId(targetComp.name)}\n`;
                  }
              });
          });
      });
  
      return definition;
  }
  
  export function generateSetupFlowchart(scripts, envFiles) {
    let definition = 'graph TD\n';
    definition += '  A(Start) --> B{Clone Repository}\n';
    definition += '  B --> C(Install Dependencies: `npm install`)\n';
  
    if (envFiles.length > 0) {
      const envFileNames = envFiles.map(f => f.name).join(', ');
      definition += `  C --> D[Configure Environment: Create ${envFileNames}]\n`;
      definition += '  D --> E{Run Development Server}\n';
    } else {
      definition += '  C --> E{Run Development Server}\n';
    }
  
    const devScript = Object.keys(scripts).find(s => ['dev', 'start', 'serve'].includes(s));
    if (devScript) {
      definition += `  E --> F\n`;
    } else {
      definition += `  E --> F["No standard 'dev' script found"]\n`;
    }
    
    const testScript = Object.keys(scripts).find(s => s.startsWith('test'));
    if (testScript) {
      definition += `  F --> G{Run Tests}\n`;
      definition += `  G --> H\n`;
      definition += `  H --> I(End)\n`
    } else {
      definition += `  F --> I(End)\n`;
    }
    
    return definition;
  }
  
  function sanitizeId(id) {
    // Mermaid IDs cannot contain certain characters.
    return id.replace(/[^a-zA-Z0-9_]/g, '_');
  }
  
  function findComponentByImport(importName, componentMap) {
      for (const folder in componentMap) {
          const found = componentMap[folder].components.find(c => c.name === importName);
          if (found) return found;
      }
      return null;
  }