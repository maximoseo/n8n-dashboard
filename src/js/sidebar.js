// Sidebar Navigation
export function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebarToggle');
  const links = document.querySelectorAll('.sidebar-link');
  
  if (!sidebar || !toggle) return;

  // Toggle sidebar on mobile
  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    document.body.classList.toggle('sidebar-open');
  });

  // Active link highlighting
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const section = link.dataset.section;
      
      // Don't change active state for external links (Paperclip)
      if (link.classList.contains('sidebar-paperclip')) return;
      
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      // Scroll to section
      if (section === 'dashboard') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (section === 'workflows') {
        e.preventDefault();
        document.querySelector('.workflows-section')?.scrollIntoView({ behavior: 'smooth' });
      } else if (section === 'analytics') {
        e.preventDefault();
        document.querySelector('.analytics-section')?.scrollIntoView({ behavior: 'smooth' });
      } else if (section === 'filters') {
        e.preventDefault();
        document.querySelector('.advanced-filters')?.scrollIntoView({ behavior: 'smooth' });
      } else if (section === 'urls-previewer' || section === 'kw-research') {
        e.preventDefault();
        document.getElementById('seo-tooling')?.scrollIntoView({ behavior: 'smooth' });
        window.dispatchEvent(new CustomEvent('seoProductTabRequested', { detail: { tab: section === 'urls-previewer' ? 'urls' : 'kw' } }));
      } else {
        const targetSection = document.getElementById(section);
        if (targetSection) {
          e.preventDefault();
          targetSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
      
      // Close sidebar on mobile
      if (window.innerWidth <= 1024) {
        sidebar.classList.remove('open');
      }
    });
  });

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 1024 && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
}
