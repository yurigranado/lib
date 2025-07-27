const routes = {
  login: 'login.html',
  cadastrarEmpresa: 'cadastroEmpresaSupabase.html',
  cadastrarTerceirizada: 'cadastroTerceirzada.html',
  selecionarTerceirizada: 'selecionar_terceirizada.html',
  exportar: 'exportar.html'
};

async function loadPage(page) {
  const url = routes[page] || routes.login;
  const res = await fetch(url);
  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, 'text/html');
  const app = document.getElementById('app');
  app.innerHTML = doc.body.innerHTML;
  document.title = doc.title || 'Lib';

  doc.querySelectorAll('script').forEach(oldScript => {
    const newScript = document.createElement('script');
    if (oldScript.src) {
      newScript.src = oldScript.src;
    } else {
      newScript.textContent = oldScript.textContent;
    }
    app.appendChild(newScript);
  });

  history.pushState({page}, '', '/');
}

window.addEventListener('popstate', e => {
  const page = e.state?.page || 'login';
  loadPage(page);
});

window.addEventListener('DOMContentLoaded', () => loadPage('login'));

function navigate(page) {
  loadPage(page);
}
