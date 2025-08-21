document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('nav a');
    const contentEl = document.getElementById('content');
    const searchInput = document.getElementById('search');
  
    const routes = {
      '#overview': { title: 'Overview', renderer: renderOverview },
      '#architecture': { title: 'Architecture', renderer: renderArchitecture },
      '#repo-structure': { title: 'Repository Structure', renderer: renderRepoStructure },
      '#tech-stack': { title: 'Tech Stack', renderer: renderTechStack },
      '#dependency-graphs': { title: 'Dependency Graphs', renderer: renderDependencyGraphs },
      '#components': { title: 'Components', renderer: renderComponents },
      '#api-specs': { title: 'API Specs', renderer: renderApiSpecs },
      '#build-release': { title: 'Build & Release', renderer: renderBuildRelease },
      '#getting-started': { title: 'Getting Started', renderer: renderGettingStarted },
      '#deployment': { title: 'Deployment', renderer: renderDeployment },
      '#readme': { title: 'README', renderer: renderReadme },
      '#data': { title: 'Raw Data', renderer: renderRawData },
    };
  
    async function loadData(name) {
      try {
        const response = await fetch(`./data/${name}.json`);
        if (!response.ok) throw new Error(`Failed to load ${name}.json`);
        const json = await response.json();
        return json.data;
      } catch (error) {
        console.error(error);
        return null;
      }
    }
  
    function renderError(message) {
      contentEl.innerHTML = `<div class="error"><h2>Error</h2><p>${message}</p></div>`;
    }
  
    async function router() {
      const hash = window.location.hash || '#overview';
      const route = routes[hash];
  
      if (route) {
        document.title = `doxxy | ${route.title}`;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === hash);
        });
        contentEl.innerHTML = `<h2>${route.title}</h2><div class="loading">Loading...</div>`;
        try {
          await route.renderer();
          // After rendering, find and process mermaid diagrams
          mermaid.run({
              nodes: contentEl.querySelectorAll('.mermaid')
          });
        } catch (e) {
          renderError(`Could not render page: ${e.message}`);
        }
      } else {
        renderError('Page not found.');
      }
    }
  
    // --- Render Functions ---
  
    async function renderOverview() {
      const data = await loadData('overview');
      if (!data) return renderError('Could not load overview data.');
      
      let frameworks = data.frameworks.length > 0? data.frameworks.join(', ') : 'Not detected';
      
      contentEl.innerHTML = `
        <h2>${data.name || 'Project Overview'} <small>${data.version || ''}</small></h2>
        <p>${data.description || 'No description provided.'}</p>
        <div class="card-grid">
          <div class="card"><h3>Package Manager</h3><p>${data.packageManager}</p></div>
          <div class="card"><h3>Monorepo?</h3><p>${data.isMonorepo? 'Yes' : 'No'}</p></div>
          <div class="card"><h3>Frameworks</h3><p>${frameworks}</p></div>
        </div>
        <h3>Scripts</h3>
        ${renderJsonAsTable(data.scripts,)}
      `;
    }
  
    async function renderArchitecture() {
        const graphData = await loadData('graph');
        const componentData = await loadData('components');
        const gettingStartedData = await loadData('getting_started');
        if (!graphData ||!componentData ||!gettingStartedData) return renderError('Could not load architecture data.');
  
        const { moduleGraph } = graphData;
        const topLevelFolders = {};
        Object.keys(moduleGraph).forEach(file => {
            const folder = file.split('/');
            if (!topLevelFolders[folder]) topLevelFolders[folder] = new Set();
            moduleGraph[file].forEach(dep => {
                const depFolder = dep.split('/');
                if (folder!== depFolder) {
                    topLevelFolders[folder].add(depFolder);
                }
            });
        });
  
        let archGraph = 'graph TD\n';
        Object.keys(topLevelFolders).forEach(folder => {
            archGraph += `  ${folder}["${folder}"]\n`;
            [...topLevelFolders[folder]].forEach(dep => {
                if (topLevelFolders[dep]) { // Only draw edges to other top-level folders
                    archGraph += `  ${folder} --> ${dep}\n`;
                }
            });
        });
        
        contentEl.innerHTML = `
          <h2>High-Level Architecture</h2>
          <p>This diagram shows the dependencies between the top-level folders in the repository, based on module imports.</p>
          <div class="mermaid">${archGraph}</div>
          
          <h2>Setup & Installation Flow</h2>
          <p>A flowchart representing the typical developer setup process based on package scripts and environment files.</p>
          <div class="mermaid">${gettingStartedData.setupFlowchart}</div>
        `;
    }
  
    async function renderRepoStructure() {
        contentEl.innerHTML = `<h2>Repository Structure</h2><p>This feature is not yet implemented.</p>`;
    }
  
    async function renderTechStack() {
      const data = await loadData('tech_stack');
      if (!data) return renderError('Could not load tech stack data.');
      contentEl.innerHTML = `
        <h2>Technology Stack</h2>
        <h3>Frameworks</h3>
        <ul>${data.frameworks.map(f => `<li>${f}</li>`).join('') || '<li>Not detected</li>'}</ul>
        <h3>Dependencies</h3>
        ${renderJsonAsTable(data.dependencies, ['Package', 'Version'])}
        <h3>Dev Dependencies</h3>
        ${renderJsonAsTable(data.devDependencies, ['Package', 'Version'])}
      `;
    }
  
    async function renderDependencyGraphs() {
      const data = await loadData('graph');
      if (!data) return renderError('Could not load dependency graph data.');
      contentEl.innerHTML = `
        <h2>Module Dependency Graph</h2>
        <p>This graph shows how modules import each other. The graph may be truncated for large repositories.</p>
        <div class="mermaid">${data.moduleDependencyGraph}</div>
      `;
    }
  
    async function renderComponents() {
      const data = await loadData('components');
      if (!data) return renderError('Could not load component data.');
      let folderHtml = Object.entries(data.byFolder).map(([folder, info]) => `
        <div class="component-folder">
          <h4>${folder} (${info.count} components)</h4>
          <ul>
            ${info.components.map(c => `<li>${c.name} (Props: ${c.props.join(', ') || 'none'})</li>`).join('')}
          </ul>
        </div>
      `).join('');
      contentEl.innerHTML = `
        <h2>React Components (Total: ${data.total})</h2>
        <p>Components are grouped by their folder location.</p>
        <div class="mermaid">${data.componentGraph}</div>
        ${folderHtml}
      `;
    }
  
    async function renderApiSpecs() {
      const endpoints = await loadData('api_endpoints');
      const openapi = await loadData('openapi');
      if (!endpoints ||!openapi) return renderError('Could not load API data.');
      
      const tableHtml = `
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Path / URL</th>
              <th>Type</th>
              <th>File</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            ${endpoints.map(ep => `
              <tr>
                <td><span class="method-${ep.method.toLowerCase()}">${ep.method}</span></td>
                <td><code>${ep.pathOrUrl}</code></td>
                <td>${ep.sourceType}</td>
                <td>${ep.file}:${ep.line}</td>
                <td>${ep.description}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
  
      contentEl.innerHTML = `
        <h2>API Endpoints & Calls</h2>
        ${tableHtml}
        <h2>OpenAPI Specification (Best-Effort)</h2>
        <pre><code>${JSON.stringify(openapi, null, 2)}</code></pre>
      `;
    }
  
    async function renderBuildRelease() {
      const data = await loadData('build_release');
      if (!data) return renderError('Could not load build & release data.');
      contentEl.innerHTML = `
        <h2>Build & Release Pipelines</h2>
        ${data.workflows.map(wf => `
          <div class="card">
            <h3>${wf.provider}</h3>
            <p><strong>File:</strong> <code>${wf.file}</code></p>
            <p><strong>Jobs:</strong> ${wf.jobNames.join(', ')}</p>
          </div>
        `).join('') || '<p>No CI/CD configuration files found.</p>'}
      `;
    }
  
    async function renderGettingStarted() {
      const data = await loadData('getting_started');
      if (!data) return renderError('Could not load getting started data.');
      contentEl.innerHTML = `
        <h2>Installation & Setup</h2>
        <div class="mermaid">${data.setupFlowchart}</div>
        <h3>Common Scripts</h3>
        ${renderJsonAsTable(data.scripts, (val) => val? `<code>npm run ${val.command}</code> (${val.script})` : 'N/A')}
        <h3>Environment Variables</h3>
        <p>The following environment variables were detected in <code>.env*</code> files. Values are not shown.</p>
        <ul>${data.detectedEnvVars.map(v => `<li><code>${v}</code></li>`).join('')}</ul>
      `;
    }
  
    async function renderDeployment() {
      const data = await loadData('deployment');
      if (!data) return renderError('Could not load deployment data.');
      contentEl.innerHTML = `
        <h2>Deployment Infrastructure</h2>
        <div class="card-grid">
          <div class="card">
            <h3>Docker</h3>
            <p>${data.hasDockerfile? `Found Dockerfiles: <ul>${data.dockerfilePaths.map(p => `<li>${p}</li>`).join('')}</ul>` : 'No Dockerfile found.'}</p>
          </div>
          <div class="card">
            <h3>Docker Compose</h3>
            <p>${data.hasCompose? `Found Compose files: <ul>${data.composePaths.map(p => `<li>${p}</li>`).join('')}</ul>` : 'No Docker Compose files found.'}</p>
          </div>
          <div class="card">
            <h3>Kubernetes</h3>
            <p>${data.hasKubernetes? `Found k8s manifests: <ul>${data.kubernetesPaths.map(p => `<li>${p}</li>`).join('')}</ul>` : 'No Kubernetes manifests found.'}</p>
          </div>
        </div>
      `;
    }
  
    async function renderReadme() {
      const data = await loadData('readme_html');
      if (!data) return renderError('Could not load README data.');
      contentEl.innerHTML = `<div class="readme-content">${data}</div>`;
    }
  
    async function renderRawData() {
      const dataFiles = Object.keys(routes).filter(r => r!== '#data' && r!== '#readme').map(r => r.substring(1));
      let html = `<h2>Raw Analysis Data</h2><p>Inspect the raw JSON data generated by the analyzers.</p>`;
      for (const file of dataFiles) {
        const data = await loadData(file);
        html += `
          <h3>${file}.json</h3>
          <pre><code>${JSON.stringify(data, null, 2)}</code></pre>
        `;
      }
      contentEl.innerHTML = html;
    }
    
    function renderJsonAsTable(data, headers, valueFormatter) {
      if (!data || Object.keys(data).length === 0) return '<p>None found.</p>';
      const formatValue = valueFormatter || ((val) => `<code>${val}</code>`);
      return `
        <table>
          <thead><tr><th>${headers}</th><th>${headers}</th></tr></thead>
          <tbody>
            ${Object.entries(data).map(([key, value]) => `
              <tr><td>${key}</td><td>${formatValue(value)}</td></tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
    
    // --- Event Listeners ---
    
    window.addEventListener('hashchange', router);
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const listItems = contentEl.querySelectorAll('li, tr');
      listItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm)? '' : 'none';
      });
    });
  
    // Initial load
    mermaid.initialize({ startOnLoad: false });
    router();
  });