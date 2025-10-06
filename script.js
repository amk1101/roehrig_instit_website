// --- Röhrig Institut | script.js (Final Version with All Fixes) ---

document.addEventListener('DOMContentLoaded', () => {

    // --- Mobile Navigation Toggle (with Fix) ---
    // --- Mobile Navigation Toggle (robust) ---
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navLinks = document.querySelector('.nav-links'); // if you have two menus, target the mobile one explicitly (e.g., '#mobile-nav-links')

if (mobileMenuToggle && navLinks) {
  mobileMenuToggle.addEventListener('click', (e) => {
    e.preventDefault(); // safe even if the toggle is an <a>
    navLinks.classList.toggle('active');
    mobileMenuToggle.classList.toggle('active');
  });

  // Close menu after clicking any link
  navLinks.addEventListener('click', (e) => {
    if (e.target.matches('a')) {
      navLinks.classList.remove('active');
      mobileMenuToggle.classList.remove('active');
    }
  });
} else {
  console.warn('Mobile menu toggle or .nav-links not found in DOM.');
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
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });
    fadeInElements.forEach(el => observer.observe(el));


    // --- Global Variables & Helper Functions ---
    const strapiUrl = 'https://worthy-oasis-c5d402c7b2.strapiapp.com';

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    };
    
    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('en-GB', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const getYouTubeEmbedUrl = (url) => {
        if (!url) return '';
        let videoId = '';
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname === 'youtu.be') {
                videoId = urlObj.pathname.slice(1);
            } else {
                videoId = urlObj.searchParams.get('v');
            }
        } catch (e) { console.error("Invalid YouTube URL:", url); return ''; }
        return `https://www.youtube.com/embed/${videoId}`;
    };

    // --- Dynamic Content Loaders ---
    const eventsApiUrl = `${strapiUrl}/api/events?populate=*`;

    // 1. Load Events
    const loadEvents = (gridElementId) => {
  const grid = document.getElementById(gridElementId);
  if (!grid) return;

  fetch(eventsApiUrl)
    .then(res => res.json())
    .then(responseData => {
      const events = responseData.data;
      grid.innerHTML = "";

      if (!events || events.length === 0) {
        grid.innerHTML = '<p>Keine bevorstehenden Veranstaltungen.</p>';
        return;
      }

      // Sort by date (earliest first)
      events.sort((a, b) => new Date(a.Date) - new Date(b.Date));

      const cards = events.map(event => {
        const imageUrl = event.Image?.url || "image.jpeg";
        const brochureUrl = event.Brochure?.url || "#";

        // If the brochure is a PDF → download; else open in new tab
        const isPdf = /\.pdf(\?|$)/i.test(brochureUrl);
        const brochureAttrs = isPdf
          ? 'download'
          : 'target="_blank" rel="noopener noreferrer"';

        const focus = event.Focus ? `<span class="event-focus">${event.Focus}</span>` : "";
        const desc  = event.Description ? `<p class="desc">${event.Description}</p>` : "";

        return `
          <article class="card event-card">
            <div class="event-media">
              <img
                class="event-image"
                src="${imageUrl}"
                alt="Bild zu: ${event.Title}"
                loading="lazy"
                decoding="async"
              />
            </div>

            <div class="event-body">
              <div class="event-topline">
                <span class="badge event-date">${formatDate(event.Date)}</span>
                ${focus}
              </div>

              <h3 class="title event-title">${event.Title}</h3>
              ${desc}

              <div class="event-actions">
                <a href="${brochureUrl}" class="download-link" ${brochureAttrs}>Programm / Broschüre</a>
                <a href="register.html?register_for=event-${event.id}" class="btn btn-primary">Jetzt anmelden</a>
              </div>
            </div>
          </article>
        `;
      });

      grid.innerHTML = cards.join("");
    })
    .catch(err => {
      console.error(`Error fetching events for ${gridElementId}:`, err);
      grid.innerHTML = "<p>Veranstaltungen konnten nicht geladen werden.</p>";
    });
};

loadEvents("home-events-grid");
loadEvents("events-grid");


    // 2. Load Program Page Info
    const nextClassContainer = document.getElementById('next-class-container');
    if (nextClassContainer) {
        fetch(`${strapiUrl}/api/programs`)
            .then(res => res.json())
            .then(responseData => {
                const programInfo = responseData.data[0]; 
                if (programInfo && programInfo.Program_date && programInfo.topic) {
                    nextClassContainer.innerHTML = `
                        <strong>Nächste Deutschstunde:</strong> ${programInfo.topic}<br>
                        <span style="font-size: 1rem; color: var(--text-muted);">${formatDateTime(programInfo.Program_date)}</span>
                    `;
                } else {
                    nextClassContainer.innerHTML = `<p>Derzeit sind keine bevorstehenden Deutschstunden geplant. Bitte schauen Sie bald wieder vorbei.</p>`;
                    nextClassContainer.style.borderLeftColor = 'var(--text-muted)';
                }
            });
    }

    // 3. Load Publications
    const publicationsList = document.getElementById('publications-list');
    if (publicationsList) {
        fetch(`${strapiUrl}/api/publications?populate=*`)
            .then(res => res.json())
            .then(responseData => {
                const publications = responseData.data;
                publicationsList.innerHTML = '';
                if (!publications || publications.length === 0) {
                    publicationsList.innerHTML = '<p>Es wurden noch keine Publikationen hochgeladen.</p>';
                    return;
                }
                publications.forEach(item => {
                    let pdfUrl = item.pdf_file?.url ? item.pdf_file.url : '#';
                    publicationsList.innerHTML += `
                        <div class="publication-item">
                            <div class="publication-info">
                                <h3 class="publication-title">${item.Title}</h3>
                                <p class="publication-meta">By ${item.Author}</p>
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
        fetch(`${strapiUrl}/api/news`)
            .then(res => res.json())
            .then(responseData => {
                const articles = responseData.data;
                newsFeed.innerHTML = '';
                if (!articles || articles.length === 0) {
                    newsFeed.innerHTML = '<p>Es gibt noch keine Projekt-Updates.</p>';
                    return;
                }
                articles.sort((a, b) => new Date(b.publish_date) - new Date(a.publish_date));
                articles.forEach(item => {
                    newsFeed.innerHTML += `
                        <article class="news-item">
                            <h3 class="news-title">${item.Title}</h3>
                            <p class="news-meta">Veröffentlicht am ${formatDate(item.publish_date)}</p>
                            <div class="news-content">
                                <p>${(item.about || '').replace(/\n/g, '</p><p>')}</p>
                            </div>
                        </article>
                    `;
                });
            });
    }

    // 5. Load Demo Videos
    const demoVideosGrid = document.getElementById('demo-videos-grid');
    if (demoVideosGrid) {
        fetch(`${strapiUrl}/api/demos`)
            .then(res => res.json())
            .then(responseData => {
                const videos = responseData.data;
                demoVideosGrid.innerHTML = '';
                if (!videos || videos.length === 0) {
                    demoVideosGrid.innerHTML = '<p>Es wurden noch keine Medien hochgeladen.</p>';
                    return;
                }
                videos.forEach(item => {
                    const embedUrl = getYouTubeEmbedUrl(item.youtube_link);
                    if (embedUrl) {
                        demoVideosGrid.innerHTML += `
                            <div class="video-card card">
                                <h3 class="video-title">${item.Title}</h3>
                                <div class="video-responsive">
                                    <iframe src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                                </div>
                            </div>
                        `;
                    }
                });
            });
    }

    // --- Dynamic Registration Form Logic ---
    const registrationContainer = document.getElementById('registration-selection');
    if (registrationContainer) {
       const registrationTitle = document.getElementById('registration-title');
        const selectionDiv = document.getElementById('registration-selection');
        const eventForm = document.getElementById('event-registration-form');
        const courseForm = document.getElementById('course-registration-form');
        const confirmationMessage = document.getElementById('confirmation-message');
        const eventSelector = document.getElementById('event-selector');
        const registerMoreBtn = document.getElementById('register-more-btn');
        let allEventsData = [];

        const showCorrectForm = (choiceValue) => {
            selectionDiv.style.display = 'none';
            let choiceText = 'Deutschkurs';
            if (choiceValue.startsWith('event-')) {
                const eventId = parseInt(choiceValue.replace('event-', ''), 10);
                const selectedEvent = allEventsData.find(e => e.id === eventId);
                if (selectedEvent) { choiceText = "Symposium: " + selectedEvent.Title; }
            }
            if (choiceValue === 'german-course') {
                courseForm.querySelector('.registration-choice-display').innerHTML = `Sie melden sich an für <strong>${choiceText}</strong>`;
                courseForm.querySelector('input[name="registrationChoice"]').value = choiceText;
                courseForm.style.display = 'block';
                eventForm.style.display = 'none';
            } else if (choiceValue.startsWith('event-')) {
                eventForm.querySelector('.registration-choice-display').innerHTML = `Sie melden sich an für <strong>${choiceText}</strong>`;
                eventForm.querySelector('input[name="registrationChoice"]').value = choiceText;
                eventForm.style.display = 'block';
                courseForm.style.display = 'none';
            }
        };

        fetch(`${strapiUrl}/api/events?populate=*`)
            .then(res => res.json())
            .then(data => {
                allEventsData = data.data;
                allEventsData.forEach(event => {
                    const option = document.createElement('option');
                    option.value = `event-${event.id}`;
                    option.textContent = "Symposium: " + event.Title;
                    eventSelector.appendChild(option);
                });
                const urlParams = new URLSearchParams(window.location.search);
                const registerFor = urlParams.get('register_for');
                if (registerFor) {
                    eventSelector.value = registerFor;
                    showCorrectForm(registerFor);
                }
            });

        eventSelector.addEventListener('change', () => showCorrectForm(eventSelector.value));
        const showSelectionScreen = () => {
            registrationTitle.style.display = 'block';
            eventForm.style.display = 'none';
            courseForm.style.display = 'none';
            confirmationMessage.style.display = 'none';
            selectionDiv.style.display = 'block';
            eventSelector.value = "";
        };
        document.querySelectorAll('.change-selection-btn').forEach(button => button.addEventListener('click', showSelectionScreen));
        registerMoreBtn.addEventListener('click', showSelectionScreen);

        const handleFormSubmit = (formElement) => {
            const formData = new FormData(formElement);
            const data = Object.fromEntries(formData.entries());
            if (!data.fullName || !data.email || !data.consent) {
                alert('Please fill all required fields marked with *.');
                return;
            }

            // This is the correct relative path for your Netlify server function.
            // It does not need to be changed for MongoDB.
            const serverUrl = '/.netlify/functions/api/registrations';
            
            fetch(serverUrl, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify(data),
            }).then(response => {
                if (!response.ok) {
                    throw new Error(`Server error: ${response.statusText}`);
                }
                return response.json();
            }).then(newSubmission => {
                console.log('Success! Data sent to function:', newSubmission);
                formElement.style.display = 'none';
                registrationTitle.style.display = 'none';
                confirmationMessage.style.display = 'block';
            }).catch(error => {
                console.error('Error submitting form:', error);
                alert('There was an error submitting your form. Please check the console for details.');
            });
            formElement.reset();
        };

        eventForm.addEventListener('submit', (e) => { e.preventDefault(); handleFormSubmit(eventForm); });
        courseForm.addEventListener('submit', (e) => { e.preventDefault(); handleFormSubmit(courseForm); });
    }
});

