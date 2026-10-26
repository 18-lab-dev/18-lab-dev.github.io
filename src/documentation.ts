import { mountShell } from './shell';
import './styles/docs.css';
import './styles/documentation.css';

mountShell('docs', 'DOC');
const search = document.querySelector<HTMLInputElement>('[data-doc-search]');
search?.addEventListener('input', () => {
  const query = search.value.trim().toLowerCase();
  for (const item of document.querySelectorAll<HTMLElement>('.docs-side li')) {
    item.hidden = !item.textContent?.toLowerCase().includes(query);
  }
});
