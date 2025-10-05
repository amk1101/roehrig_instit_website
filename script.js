// --- Röhrig Institut | script.js (Final Corrected Version) ---

document.addEventListener('DOMContentLoaded', () => {

    // --- Mobile Navigation Toggle ---
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', () => {
            // This toggles the 'active' class on both the menu button and the links list
            navLinks.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
        });

        // Close the mobile menu when a link inside it is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    mobileMenuToggle.classList.remove('active');
                }
            });
        });
    }

    // --- Active Navigation Link Styling ---
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });

    // --- Reveal-on-Scroll Animation ---
    const fadeInElements = document.querySelectorAll('.fade-in');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    fadeInElements.forEach(el => observer.observe(el));


    // --- Dynamic Content Loading from Strapi ---

    const strapiUrl = 'https://worthy-oasis-c5d402c7b2.strapiapp.com';

    // Helper function to format dates
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    };
    
    // Helper function to format date and time
    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' });
    };

    // Helper function to get YouTube embed URL
    const getYouTubeEmbedUrl = (url) => {
        if (!url) return '';
        let videoId = '';
        try {
            const urlObj = new URL(url);
            videoId = urlObj.hostname === 'youtu.be' ? urlObj.pathname.slice(1) : urlObj.searchParams.get('v');
        } catch (e) { console.error("Invalid YouTube URL:", url); return ''; }
        return `https://www.youtube.com/embed/${videoId}`;
    };

    // --- Dynamic Content Loaders ---

    // 1. Load Events (for home page and events page)
    const loadEvents = (gridElementId) => {
        const grid = document.getElementById(gridElementId);
        if (!grid) return;
        
        fetch(`${strapiUrl}/api/events?populate=*`)
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(responseData => {
                const events = responseData.data;
                grid.innerHTML = '';
                if (!events || events.length === 0) {
                    grid.innerHTML = '<p>No upcoming events scheduled at this time.</p>';
                    return;
                }
                events.sort((a, b) => new Date(a.attributes.Date) - new Date(b.attributes.Date));
                events.forEach(event => {
                    const attr = event.attributes;
                    const imageUrl = attr.Image?.data?.attributes?.url ? `${strapiUrl}${attr.Image.data.attributes.url}` : 'image.jpeg';
                    const brochureUrl = attr.Brochure?.data?.attributes?.url ? `${strapiUrl}${attr.Brochure.data.attributes.url}` : '#';
                    
                    let brochureAttributes = 'download';
                    if (brochureUrl !== '#' && !brochureUrl.toLowerCase().endsWith('.pdf')) {
                        brochureAttributes = 'target="_blank" rel="noopener noreferrer"';
                    }
                    
                    grid.innerHTML += `
                        <div class="card program-card">
                            <img src="${imageUrl}" alt="Image for ${attr.Title}" class="event-image">
                            <span class="badge">${formatDate(attr.Date)}</span>
                            <h3 class="title">${attr.Title}</h3>
                            <p class="desc"><strong>Focus:</strong> ${attr.Focus}. ${attr.Description || ''}</p>
                            <a href="${brochureUrl}" class="download-link" ${brochureAttributes}>Download Brochure</a>
                            <a href="register.html?register_for=event-${event.id}" class="btn btn-primary" style="margin-top: 15px;">Register Now</a>
                        </div>
                    `;
                });
            })
            .catch(err => {
                console.error(`Error fetching events for ${gridElementId}:`, err);
                grid.innerHTML = '<p>Could not load events.</p>';
            });
    };
    loadEvents('home-events-grid'); // ID for the grid on the home page
    loadEvents('events-grid');     // ID for the grid on the events page

    // 2. Load Program Page Info
    const nextClassContainer = document.getElementById('next-class-container');
    if (nextClassContainer) {
        fetch(`${strapiUrl}/api/programs`)
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(responseData => {
                const programInfo = responseData.data[0]?.attributes; 
                if (programInfo && programInfo.Program_date && programInfo.topic) {
                    nextClassContainer.innerHTML = `
                        <strong>Next Class:</strong> ${programInfo.topic}<br>
                        <span style="font-size: 1rem; color: var(--text-muted);">${formatDateTime(programInfo.Program_date)}</span>
                    `;
                } else {
                    nextClassContainer.innerHTML = `<p>No upcoming classes are scheduled. Please check back soon.</p>`;
                    nextClassContainer.style.borderLeftColor = 'var(--text-muted)';
                }
            });
    }

    // 3. Load Publications
    const publicationsList = document.getElementById('publications-list');
    if (publicationsList) {
        fetch(`${strapiUrl}/api/publications?populate=*`)
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(responseData => {
                const publications = responseData.data;
                publicationsList.innerHTML = '';
                if (!publications || publications.length === 0) {
                    publicationsList.innerHTML = '<p>No publications uploaded yet.</p>';
                    return;
                }
                publications.forEach(item => {
                    const attr = item.attributes;
                    const pdfUrl = attr.pdf_file?.data?.attributes?.url ? `${strapiUrl}${attr.pdf_file.data.attributes.url}` : '#';
                    publicationsList.innerHTML += `
                        <div class="publication-item">
                            <div class="publication-info">
                                <h3 class="publication-title">${attr.Title}</h3>
                                <p class="publication-meta">By ${attr.Author}</p>
                            </div>
                            <div class="publication-action">
                                <a href="${pdfUrl}" class="btn btn-ghost" download>Download PDF</a>
                            </div>
                        </div>
                    `;
                });
            });
    }

    // 4. Load News Feed
    const newsFeed = document.getElementById('news-feed');
    if (newsFeed) {
        fetch(`${strapiUrl}/api/news-articles`) // Assuming 'news-articles' is the correct API ID
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(responseData => {
                const articles = responseData.data;
                newsFeed.innerHTML = '';
                if (!articles || articles.length === 0) {
                    newsFeed.innerHTML = '<p>No news updates yet.</p>';
                    return;
                }
                articles.sort((a, b) => new Date(b.attributes.publish_date) - new Date(a.attributes.publish_date));
                articles.forEach(item => {
                    const attr = item.attributes;
                    newsFeed.innerHTML += `
                        <article class="news-item">
                            <h3 class="news-title">${attr.Title}</h3>
                            <p class="news-meta">Published on ${formatDate(attr.publish_date)}</p>
                            <div class="news-content">
                                <p>${(attr.about || '').replace(/\n/g, '</p><p>')}</p>
                            </div>
                        </article>
                    `;
                });
            });
    }

    // 5. Load Demo Videos
    const demoVideosGrid = document.getElementById('demo-videos-grid');
    if (demoVideosGrid) {
        fetch(`${strapiUrl}/api/demos`) // Assuming 'demos' is the correct API ID
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(responseData => {
                const videos = responseData.data;
                demoVideosGrid.innerHTML = '';
                if (!videos || videos.length === 0) {
                    demoVideosGrid.innerHTML = '<p>No demo videos uploaded yet.</p>';
                    return;
                }
                videos.forEach(item => {
                    const attr = item.attributes;
                    const embedUrl = getYouTubeEmbedUrl(attr.youtube_link);
                    if (embedUrl) {
                        demoVideosGrid.innerHTML += `
                            <div class="video-card card">
                                <h3 class="video-title">${attr.Title}</h3>
                                <div class="video-responsive">
                                    <iframe src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                                </div>
                            </div>
                        `;
                    }
                });
            });
    }
    
    // All other logic, like registration forms, would go here.
    // This script is now primarily for dynamic content loading.
});