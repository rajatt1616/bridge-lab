const api = {
  analyze: async (data) => {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error('Analysis failed (' + response.status + ')');
    }
    return response.json();
  },
  presets: () => fetch('/api/presets').then(r => r.json()),
  preset: (name) => fetch('/api/presets/' + name).then(r => r.text())
};
