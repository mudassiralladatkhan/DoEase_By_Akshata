export class ProfileScreen {
  constructor(user, onUserUpdate) {
    this.user = user;
    this.onUserUpdate = onUserUpdate;
    this.isEditing = false;
    this.element = document.createElement('div');
    this.element.className = 'profile-section-wrapper';
  }

  render() {
    this.element.innerHTML = `
      <div class="content-header">
        <h2>User Profile</h2>
      </div>
    `;
    if (this.isEditing) {
      this.element.appendChild(this.renderEditForm());
    } else {
      this.element.appendChild(this.renderDisplay());
    }
    return this.element;
  }

  renderDisplay() {
    const displaySection = document.createElement('div');
    displaySection.className = 'profile-section';
    
    displaySection.innerHTML = `
        <h3>${this.user.username}</h3>
        <p style="color: var(--text-secondary); margin-top: -0.5rem; margin-bottom: 1rem;">${this.user.email}</p>
        <div class="form-group" style="text-align: left;">
            <label class="form-label">Username</label>
            <input class="form-input" value="${this.user.username}" disabled />
        </div>
        <div class="form-group" style="text-align: left;">
            <label class="form-label">Mobile</label>
            <input class="form-input" value="${this.user.mobile || 'Not provided'}" disabled />
        </div>
        <div class="profile-actions">
            <button class="btn btn-primary" id="editProfileBtn">Edit Profile</button>
        </div>
    `;

    displaySection.querySelector('#editProfileBtn').addEventListener('click', () => {
      this.isEditing = true;
      this.render();
    });

    return displaySection;
  }

  renderEditForm() {
    const formSection = document.createElement('div');
    formSection.className = 'profile-section';

    formSection.innerHTML = `
      <form id="editProfileForm">
        <div class="form-group">
          <label class="form-label" for="editUsername">Username</label>
          <input 
            type="text" 
            id="editUsername" 
            class="form-input" 
            value="${this.user.username}" 
            required
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="editMobile">Mobile Number</label>
          <input 
            type="tel" 
            id="editMobile" 
            class="form-input" 
            value="${this.user.mobile || ''}"
            pattern="[0-9]{10,}"
            title="Please enter a valid mobile number (at least 10 digits)."
            required
          />
        </div>
        <div class="profile-actions">
          <button type="button" class="btn btn-secondary" id="cancelEditBtn">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    `;

    const form = formSection.querySelector('#editProfileForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Saving...';

      const updatedUserData = {
        username: form.querySelector('#editUsername').value,
        mobile: form.querySelector('#editMobile').value,
      };

      await this.onUserUpdate(updatedUserData);
      this.isEditing = false;
    });

    formSection.querySelector('#cancelEditBtn').addEventListener('click', () => {
      this.isEditing = false;
      this.render();
    });

    return formSection;
  }
}
