import { mountShell } from './shell';
import './styles/docs.css';
import './styles/documentation.css';

mountShell('docs', 'DOC');

const search = document.querySelector<HTMLInputElement>('[data-doc-search]');
search?.addEventListener('input', () => {
  const query = search.value.trim().toLowerCase();
  for (const group of document.querySelectorAll<HTMLElement>('.docs-side .side-group')) {
    let visible = 0;
    for (const item of group.querySelectorAll<HTMLElement>('li')) {
      item.hidden = !item.textContent?.toLowerCase().includes(query);
      if (!item.hidden) visible++;
    }
    group.hidden = visible === 0;
  }
});

/* ------------------------------------------------------------------ copy buttons */

for (const block of document.querySelectorAll<HTMLElement>('.prose .code-block')) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'copy mono';
  button.textContent = 'Copy';
  button.addEventListener('click', async () => {
    await navigator.clipboard.writeText(block.querySelector('code')!.textContent!);
    button.textContent = 'Copied';
    setTimeout(() => (button.textContent = 'Copy'), 1400);
  });
  block.append(button);
}

/* ------------------------------------------------------------------ code groups → tabs */

document.querySelectorAll<HTMLElement>('[data-code-group]').forEach((group, g) => {
  const panels = [...group.querySelectorAll<HTMLElement>(':scope > .code-block')];
  const tablist = document.createElement('div');
  tablist.className = 'cg-tabs mono';
  tablist.setAttribute('role', 'tablist');
  const tabs = panels.map((panel, i) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.id = `cg${g}-tab${i}`;
    tab.textContent = panel.dataset.tab ?? `Tab ${i + 1}`;
    tab.setAttribute('role', 'tab');
    panel.id = `cg${g}-panel${i}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    tab.setAttribute('aria-controls', panel.id);
    tablist.append(tab);
    return tab;
  });
  const select = (index: number, focus = false) => {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    if (focus) tabs[index].focus();
  };
  tablist.addEventListener('click', (event) => {
    const tab = (event.target as Element).closest<HTMLButtonElement>('[role=tab]');
    if (tab) select(tabs.indexOf(tab));
  });
  tablist.addEventListener('keydown', (event) => {
    const current = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (current < 0) return;
    const moves: Record<string, number> = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: tabs.length - 1 };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select((next + tabs.length) % tabs.length, true);
  });
  group.prepend(tablist);
  group.classList.add('is-tabbed');
  select(0);
});

/* ------------------------------------------------------------------ outline + scrollspy */

const headings = [...document.querySelectorAll<HTMLHeadingElement>('.prose h2[id], .prose h3[id]')];
const outlineLinks = new Map(
  [...document.querySelectorAll<HTMLAnchorElement>('[data-outline] a')].map((a) => [a.dataset.target!, a] as const),
);
const progress = document.querySelector<HTMLElement>('[data-progress]');
const article = document.querySelector<HTMLElement>('.docs-main');

function updateSpy(): void {
  if (!article || !progress) return;
  const line = innerHeight * 0.3;
  let current = headings[0];
  for (const h of headings) if (h.getBoundingClientRect().top < line) current = h;
  for (const [id, a] of outlineLinks) a.toggleAttribute('data-active', id === current?.id);
  const box = article.getBoundingClientRect();
  const read = Math.min(1, Math.max(0, (innerHeight * 0.5 - box.top) / box.height));
  progress.textContent = `${String(Math.round(read * 100)).padStart(3, '0')}%`;
  document.documentElement.style.setProperty('--read', String(read));
}

addEventListener('scroll', updateSpy, { passive: true });
updateSpy();
