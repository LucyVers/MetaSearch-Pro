// Contact form handling
document.addEventListener('DOMContentLoaded', function() {
  const contactForm = document.getElementById('contactForm');
  
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form data
      const formData = new FormData(contactForm);
      const name = formData.get('name');
      const email = formData.get('email');
      const company = formData.get('company');
      const service = formData.get('service');
      const message = formData.get('message');
      
      // Show confirmation
      showConfirmation(name, email, service);
      
      // Reset form
      contactForm.reset();
    });
  }
});

function showConfirmation(name, email, service) {
  // Create confirmation message
  const confirmation = document.createElement('div');
  confirmation.className = 'confirmation-message';
  confirmation.innerHTML = `
    <h3>Tack för din förfrågan!</h3>
    <p>Hej ${name},</p>
    <p>Jag har mottagit din förfrågan om ${service || 'mina tjänster'}.</p>
    <p>Jag återkommer till dig på ${email} så snart som möjligt.</p>
    <button onclick="this.parentElement.remove()" class="close-btn">Stäng</button>
  `;
  
  // Add to page
  document.body.appendChild(confirmation);
  
  // Ta bort efter 10 sekunder
  setTimeout(() => {
    if (confirmation.parentElement) {
      confirmation.remove();
    }
  }, 10000);
}
